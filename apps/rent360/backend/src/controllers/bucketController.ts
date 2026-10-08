import { Request, Response } from "express";
import responseHandler from "../utils/responseHandler";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../utils/prisma";

// Ensure cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getBucketStats = async (req: Request, res: Response) => {
  try {
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'rent360/',
      max_results: 500,
    });
    
    // Sum exact bytes of all files in rent360 prefix
    const exactBytes = resources.resources.reduce((total: number, file: any) => total + file.bytes, 0);

    // Cloudinary Free Tier Limit is 25 GB (25 Credits)
    const TOTAL_LIMIT_BYTES = 25 * 1024 * 1024 * 1024; // 25 GB in bytes
    const freeBytes = TOTAL_LIMIT_BYTES - exactBytes;

    return responseHandler.success(res, "Bucket stats fetched", {
      usage: exactBytes,
      total: TOTAL_LIMIT_BYTES,
      free: Math.max(0, freeBytes)
    });
  } catch (error) {
    console.error("Cloudinary Stats Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const getBucketFolders = async (req: Request, res: Response) => {
  try {
    const { path } = req.query;
    let folders;
    
    if (!path || path === '' || path === '/') {
      folders = await cloudinary.api.root_folders();
    } else {
      folders = await cloudinary.api.sub_folders(path as string);
    }
    
    return responseHandler.success(res, "Folders fetched", folders.folders || []);
  } catch (error: any) {
    console.error("Cloudinary Folders Error:", error);
    if (error?.http_code === 404) {
      return responseHandler.success(res, "Folders fetched", []); // No subfolders
    }
    return responseHandler.internalServerError(res, error);
  }
};

export const getBucketFiles = async (req: Request, res: Response) => {
  try {
    const { path } = req.query;
    
    if (!path) {
      return responseHandler.badRequest(res, "Path is required");
    }

    const prefix = `${path}/`;
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: prefix,
      max_results: 500,
    });
    
    // Cloudinary returns ALL files matching the prefix, including those in deep subfolders.
    // We need to filter them so only files strictly in THIS folder are returned.
    const strictFiles = (resources.resources || []).filter((file: any) => {
      // file.public_id looks like "rent360/users/profiles/super_admin_profile"
      // If we remove the prefix "rent360/", we get "users/profiles/super_admin_profile"
      const remainingPath = file.public_id.replace(prefix, '');
      // If there are no slashes in the remaining path, it means it's a direct child!
      return !remainingPath.includes('/');
    });
    
    return responseHandler.success(res, "Files fetched", strictFiles);
  } catch (error) {
    console.error("Cloudinary Files Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const deleteBucketFile = async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return responseHandler.badRequest(res, "public_id is required");
    }

    await cloudinary.uploader.destroy(public_id, { invalidate: true });
    
    // Also remove from DB if any user is using this as their profile picture
    const usersWithPic = await (prisma as any).user.findMany({
      where: { profile_pic: { contains: public_id } }
    });
    
    for (const user of usersWithPic) {
      await (prisma as any).user.update({
        where: { id: user.id },
        data: { profile_pic: null }
      });
    }

    return responseHandler.success(res, "File deleted successfully", { public_id });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};
