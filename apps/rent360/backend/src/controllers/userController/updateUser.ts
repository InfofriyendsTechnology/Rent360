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

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    let updateData = { ...rest };
    
    if (!updateData.roleId) {
      updateData.roleId = null;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const existingUser = await prisma.user.findUnique({ 
      where: { id: req.params.id },
      include: { role: true, store: true }
    });

    if (!existingUser) {
      return responseHandler.notFound(res, "User not found");
    }

    if (existingUser.storeId !== (req as any).user?.storeId) {
      return responseHandler.unauthorized(res, "You can only update users in your own store");
    }

    const currentUserId = (req as any).user?.id;
    const currentUserRole = (req as any).user?.role;
    const dbCurrentUser = await prisma.user.findUnique({ where: { id: currentUserId }, include: { role: true } });
    const userPermissions = dbCurrentUser?.role?.permissions || [];
    const hasManageStaff = userPermissions.includes("ALL") || userPermissions.includes("SETTINGS_MANAGE");

    // If updating someone else, must have manage staff permission
    if (existingUser.id !== currentUserId && !hasManageStaff) {
      return responseHandler.unauthorized(res, "You do not have permission to update other users");
    }

    // A user without manage staff permission can only update their own profile pic/password/name, not their role
    if (!hasManageStaff && updateData.roleId && updateData.roleId !== existingUser.roleId) {
       return responseHandler.unauthorized(res, "You cannot change your own role");
    }

    if (existingUser.role?.name === "SUPER_ADMIN" && updateData.roleId !== existingUser.roleId) {
      return responseHandler.unauthorized(res, "You cannot change the role of the primary store owner");
    }

    // Check if profile_pic is a base64 string
    if (updateData.profile_pic && updateData.profile_pic.startsWith("data:image")) {
      const roleName = existingUser.role?.name || 'USER';
      const storeName = existingUser.store?.name ? existingUser.store.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'default_store';
      const safeName = existingUser.name ? existingUser.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'user';
      
      let folderPath = '';
      if (roleName === 'SUPER_ADMIN') {
        folderPath = `rent360/super_admin/profiles`;
      } else {
        folderPath = `rent360/stores/${storeName}/profiles`;
      }
      
      const fullPublicId = `${folderPath}/${safeName}_profile`;

      try {
        await cloudinary.api.create_folder(folderPath);
      } catch (e) {
        console.log("Folder might already exist or create_folder failed:", e);
      }

      const uploadResponse = await cloudinary.uploader.upload(updateData.profile_pic, {
        public_id: fullPublicId,
        overwrite: true,
        resource_type: "image",
      });
      // Replace base64 with actual Cloudinary URL
      updateData.profile_pic = uploadResponse.secure_url;
    }

    const data = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    const { password: _, ...sanitized } = data;
    return responseHandler.success(res, "Updated successfully", sanitized);
  } catch (error) {
    console.error("Cloudinary/Update Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};

