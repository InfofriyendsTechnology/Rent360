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

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (store && store.logo_url) {
      try {
        const urlParts = store.logo_url.split('/');
        const uploadIndex = urlParts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const oldPublicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
            console.log("Deleted old store logo from Cloudinary on store delete:", oldPublicId);
          }
        }
      } catch (delErr) {
        console.error("Failed to delete old store logo on store delete:", delErr);
      }
    }

    await (prisma as any).store.delete({ where: { id: req.params.id } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
