import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    const existingUser = await (prisma as any).user.findUnique({ 
      where: { id: req.params.id },
      include: { role: true, store: true }
    });
    
    if (!existingUser) {
      return responseHandler.notFound(res, "User not found");
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

      // Explicitly create the folder so it appears in the Bucket Explorer (api.sub_folders)
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

    const data = await (prisma as any).user.update({
      where: { id: req.params.id },
      data: updateData,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    console.error("Cloudinary/Update Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};

