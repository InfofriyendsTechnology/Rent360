import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import { getStoreAssetFolder, getStoreSlug } from "../../utils/cloudinaryHelper";

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { password, ...rest } = req.body;
    let updateData = { ...rest };
    
    if (!updateData.roleId) {
      updateData.roleId = null;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const existingUser: any = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { role: true, store: true }
    });

    if (!existingUser) {
      return responseHandler.notFound(res, "User not found");
    }

    if (existingUser.storeId !== (req as any).user?.storeId) {
      return responseHandler.unauthorized(res, "You can only update users in your own store");
    }

    if (updateData.mobile) {
      const trimmedMobile = updateData.mobile.trim();
      updateData.mobile = trimmedMobile;
      const duplicateUser = await prisma.user.findFirst({
        where: {
          mobile: trimmedMobile,
          id: { not: userId }
        }
      });
      if (duplicateUser) {
        return responseHandler.badRequest(res, "A member with this mobile number already exists.");
      }
    }

    const currentUserId = (req as any).user?.id;
    const currentUserRole = (req as any).user?.role;
    const dbCurrentUser = await prisma.user.findUnique({ where: { id: currentUserId }, include: { role: true } });
    const userPermissions = (dbCurrentUser?.role?.permissions as string[]) || [];
    const hasManageStaff = userPermissions.includes("ALL") || userPermissions.includes("SETTINGS_MANAGE");

    // If updating someone else, must have manage staff permission
    if (existingUser.id !== currentUserId && !hasManageStaff) {
      return responseHandler.unauthorized(res, "You do not have permission to update other users");
    }

    // A user without manage staff permission can only update their own profile pic/password/name, not their role
    if (!hasManageStaff && updateData.roleId && updateData.roleId !== existingUser.roleId) {
       return responseHandler.unauthorized(res, "You cannot change your own role");
    }

    if ((existingUser.role?.name === "SUPER_ADMIN" || existingUser.role?.name === "STORE_ADMIN") && updateData.roleId && updateData.roleId !== existingUser.roleId) {
      return responseHandler.unauthorized(res, "You cannot change the role of the store owner");
    }

    if (updateData.roleId && updateData.roleId !== existingUser.roleId) {
      const targetRole = await prisma.role.findUnique({ where: { id: updateData.roleId } });
      if (targetRole && (targetRole.name === 'STORE_ADMIN' || targetRole.name === 'SUPER_ADMIN')) {
        return responseHandler.badRequest(res, "Store Admin role cannot be assigned to team members.");
      }
    }

    // Helper function to delete old image from Cloudinary
    const destroyOldCloudinaryImage = async (imageUrl: string) => {
      try {
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const oldPublicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
            console.log("Deleted old profile pic from Cloudinary:", oldPublicId);
          }
        }
      } catch (delErr) {
        console.error("Failed to delete old profile pic from Cloudinary:", delErr);
      }
    };

    // If user explicitly removes the picture (profile_pic === null)
    if (updateData.profile_pic === null && existingUser.profile_pic) {
      await destroyOldCloudinaryImage(existingUser.profile_pic);
    } 
    // If user uploads a new picture
    else if (updateData.profile_pic && updateData.profile_pic.startsWith("data:image")) {
      const isSuperAdmin = existingUser.role?.name === 'SUPER_ADMIN' || !existingUser.roleId;
      let folderPath = '';
      if (isSuperAdmin) {
        folderPath = `rent360/super_admin/profiles`;
      } else {
        folderPath = getStoreAssetFolder(existingUser.store?.name || 'default_store', 'profiles');
      }
      
      const cleanName = getStoreSlug(existingUser.name || 'user');
      const fullPublicId = `${folderPath}/${cleanName}_profile`;

      try {
        await cloudinary.api.create_folder(folderPath);
      } catch (e) {
        console.log("Folder might already exist or create_folder failed:", e);
      }

      // Delete old image before uploading new one
      if (existingUser.profile_pic) {
        await destroyOldCloudinaryImage(existingUser.profile_pic);
      }

      const uploadResponse = await cloudinary.uploader.upload(updateData.profile_pic, {
        public_id: fullPublicId,
        format: "webp",
        transformation: [{ quality: "auto:good", fetch_format: "webp" }],
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      });
      // Replace base64 with actual Cloudinary URL
      updateData.profile_pic = uploadResponse.secure_url;
    }

    const data = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    const { password: _, ...sanitized } = data;
    return responseHandler.success(res, "Updated successfully", sanitized);
  } catch (error: any) {
    console.error("Cloudinary/Update Error:", error);
    if (error?.code === "P2002") {
      return responseHandler.badRequest(res, "A member with this mobile number already exists.");
    }
    return responseHandler.internalServerError(res, error.message || error);
  }

};

