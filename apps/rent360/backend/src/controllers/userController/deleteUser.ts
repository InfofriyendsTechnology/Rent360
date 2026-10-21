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

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const reqUser = (req as any).user;
    const currentUserId = reqUser?.id;
    const storeId = reqUser?.storeId;
    const isSuperAdmin = reqUser?.role === "SUPER_ADMIN";

    if (userId === currentUserId) {
      return responseHandler.badRequest(res, "You cannot delete your own account");
    }

    const whereClause: any = { id: userId };
    if (!isSuperAdmin && storeId) {
      whereClause.storeId = storeId;
    }

    const existing: any = await prisma.user.findFirst({ 
      where: whereClause,
      include: { role: true } 
    });
    
    if (!existing) {
      return responseHandler.notFound(res, "User not found");
    }

    if (existing.role?.name === "SUPER_ADMIN" || existing.role?.name === "STORE_ADMIN") {
      return responseHandler.unauthorized(res, "You cannot delete the store owner");
    }

    if (existing.profile_pic) {
      try {
        const urlParts = (existing.profile_pic as string).split('/');
        const uploadIndex = urlParts.findIndex((p: string) => p === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const oldPublicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
            console.log("Deleted old profile pic from Cloudinary on user delete:", oldPublicId);
          }
        }
      } catch (delErr) {
        console.error("Failed to delete old profile pic on user delete:", delErr);
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return responseHandler.success(res, "User deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
