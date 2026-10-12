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

import { deleteStoreCloudinaryFolders } from "../../utils/cloudinaryHelper";

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (store) {
      await deleteStoreCloudinaryFolders(store.name);
    }

    await (prisma as any).store.delete({ where: { id: req.params.id } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
