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
import { cleanupIfEmpty } from "../utils/cloudinaryHelper";

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
    
    let folderList = folders.folders || [];

    // Under 'rent360/stores', filter out obsolete legacy folders like direct 'logos'
    if (path === 'rent360/stores') {
      folderList = folderList.filter((f: any) => f.name !== 'logos');
    }

    // Filter out and auto-delete any empty folders so no empty folders are ever shown
    const validFolders = [];
    for (const f of folderList) {
      try {
        const sub = await cloudinary.api.sub_folders(f.path).catch(() => ({ folders: [] }));
        const files = await cloudinary.api.resources({ type: 'upload', prefix: `${f.path}/`, max_results: 1 }).catch(() => ({ resources: [] }));
        
        if ((sub.folders && sub.folders.length > 0) || (files.resources && files.resources.length > 0)) {
          validFolders.push(f);
        } else {
          // If empty, clean it up from Cloudinary
          console.log("Auto-cleaning empty folder:", f.path);
          await cloudinary.api.delete_folder(f.path).catch(() => {});
        }
      } catch (err) {
        validFolders.push(f);
      }
    }

    validFolders.sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    return responseHandler.success(res, "Folders fetched", validFolders);
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
      const remainingPath = file.public_id.replace(prefix, '');
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

    // Also remove from DB if any store is using this as their logo
    const storesWithLogo = await prisma.store.findMany({
      where: { logo_url: { contains: public_id } }
    });

    for (const store of storesWithLogo) {
      await prisma.store.update({
        where: { id: store.id },
        data: { logo_url: null }
      });
    }

    // Auto-clean folder if it has become empty after deleting this file
    const folderPath = public_id.substring(0, public_id.lastIndexOf("/"));
    if (folderPath) {
      await cleanupIfEmpty(folderPath);
    }

    return responseHandler.success(res, "File deleted successfully", { public_id });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const deleteBucketFolder = async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    if (!path) {
      return responseHandler.badRequest(res, "Folder path is required");
    }

    if (path === "rent360" || path === "rent360/stores") {
      return responseHandler.badRequest(res, "Cannot delete root system folders");
    }

    // Delete any remaining files in folder
    await cloudinary.api.delete_resources_by_prefix(`${path}/`, { invalidate: true }).catch(() => {});

    // Delete any subfolders
    const sub = await cloudinary.api.sub_folders(path).catch(() => ({ folders: [] }));
    for (const sf of sub.folders || []) {
      await cloudinary.api.delete_folder(sf.path).catch(() => {});
    }

    const delRes = await cloudinary.api.delete_folder(path);
    console.log("Deleted bucket folder:", path, delRes);

    return responseHandler.success(res, "Folder deleted successfully", { path });
  } catch (error: any) {
    console.error("Cloudinary Folder Delete Error:", error);
    return responseHandler.internalServerError(res, error.error || error.message || error);
  }
};
