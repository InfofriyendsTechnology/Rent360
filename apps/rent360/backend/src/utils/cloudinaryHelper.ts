import { v2 as cloudinary } from "cloudinary";

// Ensure cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getStoreSlug = (storeName: string): string => {
  if (!storeName) return "store";
  return (
    storeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "store"
  );
};

export const getStoreRootFolder = (storeName: string): string => {
  const slug = getStoreSlug(storeName);
  return `rent360/stores/${slug}`;
};

export const getStoreAssetFolder = (
  storeName: string,
  category: "logos" | "products" | "profiles" | "documents" = "logos"
): string => {
  const slug = getStoreSlug(storeName);
  return `rent360/stores/${slug}/${category}`;
};

export const ensureStoreFolders = async (storeName: string): Promise<void> => {
  // Folders are automatically created by Cloudinary upon asset upload.
  // Pre-creating empty folders is disabled to prevent orphan empty folders.
};

export const cleanupIfEmpty = async (folderPath: string): Promise<void> => {
  if (!folderPath || folderPath === "rent360" || folderPath === "rent360/stores") {
    return;
  }
  try {
    const sub = await cloudinary.api.sub_folders(folderPath).catch(() => ({ folders: [] }));
    const files = await cloudinary.api.resources({ type: "upload", prefix: `${folderPath}/`, max_results: 2 }).catch(() => ({ resources: [] }));
    
    if ((!sub.folders || sub.folders.length === 0) && (!files.resources || files.resources.length === 0)) {
      await cloudinary.api.delete_folder(folderPath);
      console.log("Automatically deleted empty folder:", folderPath);
      // Recursively check parent folder
      const parent = folderPath.substring(0, folderPath.lastIndexOf("/"));
      if (parent) {
        await cleanupIfEmpty(parent);
      }
    }
  } catch (err) {
    // Ignore if deletion failed or folder not empty
  }
};

export const extractPublicIdFromUrl = (imageUrl: string): string | null => {
  if (!imageUrl) return null;
  try {
    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.findIndex((p) => p === "upload");
    if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
      let startIndex = -1;
      for (let i = uploadIndex + 1; i < urlParts.length; i++) {
        if (urlParts[i] === "rent360") {
          startIndex = i;
          break;
        }
      }
      if (startIndex === -1) {
        startIndex = uploadIndex + 1;
        if (urlParts[startIndex] && /^v\d+$/.test(urlParts[startIndex])) {
          startIndex++;
        }
      }
      if (startIndex < urlParts.length) {
        const publicIdWithExt = urlParts.slice(startIndex).join("/");
        return (
          publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")) || publicIdWithExt
        );
      }
    }
  } catch (err) {
    console.error("Error extracting public ID:", err);
  }
  return null;
};

export const deleteCloudinaryAsset = async (
  imageUrlOrPublicId: string
): Promise<void> => {
  if (!imageUrlOrPublicId) return;
  let publicId = imageUrlOrPublicId;
  if (
    imageUrlOrPublicId.startsWith("http://") ||
    imageUrlOrPublicId.startsWith("https://")
  ) {
    const extracted = extractPublicIdFromUrl(imageUrlOrPublicId);
    if (extracted) {
      publicId = extracted;
    }
  }

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    console.log("Deleted asset from Cloudinary:", publicId);
    const folder = publicId.substring(0, publicId.lastIndexOf("/"));
    if (folder) {
      await cleanupIfEmpty(folder);
    }
  } catch (err) {
    console.error("Failed to delete asset from Cloudinary:", publicId, err);
  }
};

export const deleteStoreCloudinaryFolders = async (
  storeName: string
): Promise<void> => {
  const base = getStoreRootFolder(storeName);
  try {
    await cloudinary.api.delete_resources_by_prefix(base, { invalidate: true });
    const categories = ["logos", "products", "profiles"];
    for (const cat of categories) {
      try {
        await cloudinary.api.delete_folder(`${base}/${cat}`);
      } catch (e) {}
    }
    try {
      await cloudinary.api.delete_folder(base);
    } catch (e) {}
    console.log("Cleaned up store Cloudinary folders for:", base);
  } catch (err) {
    console.error("Error deleting store Cloudinary folders:", base, err);
  }
};

export const uploadProductImages = async (
  storeName: string,
  productCode: string,
  images: string | string[]
): Promise<string[]> => {
  if (!images) return [];
  const imageList = Array.isArray(images) ? images : [images];
  const uploadedUrls: string[] = [];
  const productFolder = getStoreAssetFolder(storeName, "products");

  for (let i = 0; i < imageList.length; i++) {
    const img = imageList[i];
    if (!img) continue;

    // If it's already an http/https URL, preserve it
    if (img.startsWith("http://") || img.startsWith("https://")) {
      uploadedUrls.push(img);
      continue;
    }

    // If it's a base64 data URL, upload to Cloudinary
    if (img.startsWith("data:image")) {
      try {
        const publicId = `${productCode.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}_${i + 1}`;
        const uploadRes = await cloudinary.uploader.upload(img, {
          folder: productFolder,
          asset_folder: productFolder,
          public_id: publicId,
          overwrite: true,
          invalidate: true,
        });
        uploadedUrls.push(uploadRes.secure_url);
      } catch (err) {
        console.error(`Failed to upload product image ${i + 1}:`, err);
      }
    }
  }

  return uploadedUrls;
};

