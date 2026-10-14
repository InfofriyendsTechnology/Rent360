import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import { getStoreSlug, getStoreAssetFolder, ensureStoreFolders, deleteCloudinaryAsset } from "../../utils/cloudinaryHelper";

export const updateStore = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      username,
      owner_name, 
      mobile, 
      email, 
      address, 
      city, 
      state, 
      pincode, 
      gst_number, 
      logo_url,
      subscription_status,
      password,
      admin_password
    } = req.body;

    const storeId = req.params.id as string;
    const existingStore = await prisma.store.findUnique({ where: { id: storeId } });
    if (!existingStore) {
      return responseHandler.notFound(res, "Store not found");
    }

    let finalUsername: string | null | undefined = undefined;
    if (username !== undefined) {
      if (username && username.trim()) {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const conflictStore = await prisma.store.findFirst({
          where: {
            username: { equals: cleanUsername, mode: "insensitive" },
            id: { not: storeId }
          }
        });
        if (conflictStore) {
          return responseHandler.badRequest(res, `Username '${cleanUsername}' is already taken.`);
        }
        const conflictUser = await prisma.user.findFirst({
          where: {
            username: { equals: cleanUsername, mode: "insensitive" },
            storeId: { not: storeId }
          }
        });
        if (conflictUser) {
          return responseHandler.badRequest(res, `Username '${cleanUsername}' is already taken.`);
        }
        finalUsername = cleanUsername;
      } else {
        finalUsername = null;
      }
    }

    const storeName = name || existingStore.name;
    const storeSlug = getStoreSlug(storeName);
    await ensureStoreFolders(storeName);

    let finalLogoUrl = logo_url;
    if (logo_url && logo_url.startsWith("data:image")) {
      if (existingStore.logo_url) {
        await deleteCloudinaryAsset(existingStore.logo_url);
      }
      const logoFolder = getStoreAssetFolder(storeName, "logos");
      const uploadResponse = await cloudinary.uploader.upload(logo_url, {
        folder: logoFolder,
        asset_folder: logoFolder,
        public_id: `${storeSlug}_logo`,
        format: "webp",
        transformation: [{ quality: "auto:good", fetch_format: "webp" }],
        overwrite: true,
        invalidate: true
      });
      finalLogoUrl = uploadResponse.secure_url;
    } else if (logo_url === null || logo_url === "" || logo_url === "null") {
      if (existingStore.logo_url) {
        await deleteCloudinaryAsset(existingStore.logo_url);
      }
      finalLogoUrl = null;
    }

    const data = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(name !== undefined && { name }),
        ...(finalUsername !== undefined && { username: finalUsername }),
        ...(owner_name !== undefined && { owner_name }),
        ...(mobile !== undefined && { mobile }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(gst_number !== undefined && { gst_number }),
        ...(logo_url !== undefined && { logo_url: finalLogoUrl }),
        ...(subscription_status !== undefined && { subscription_status }),
      },
    });

    // Also sync admin user username if username was updated
    if (finalUsername !== undefined) {
      const adminUser = await prisma.user.findFirst({
        where: {
          storeId,
          role: { name: 'STORE_ADMIN' }
        }
      });
      if (adminUser) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { username: finalUsername }
        });
      }
    }

    // If password is provided in edit form, update store admin password & log
    const newPassword = password || admin_password;
    if (newPassword && newPassword.trim().length >= 6) {
      const plainPassword = newPassword.trim();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      let adminUser = await prisma.user.findFirst({
        where: { storeId },
        orderBy: { createdAt: 'asc' }
      });

      if (adminUser) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: hashedPassword }
        });
      } else {
        let role = await prisma.role.findFirst({
          where: { storeId, name: 'STORE_ADMIN' }
        });
        if (!role) {
          role = await prisma.role.create({
            data: {
              storeId,
              name: 'STORE_ADMIN',
              permissions: ['ALL']
            }
          });
        }
        adminUser = await prisma.user.create({
          data: {
            storeId,
            roleId: role.id,
            name: owner_name || data.owner_name || data.name,
            mobile: mobile || data.mobile,
            password: hashedPassword,
            status: 'ACTIVE'
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          storeId,
          userId: adminUser.id,
          action_type: 'PASSWORD_SET',
          table_name: 'users',
          record_id: adminUser.id,
          new_data: { password_plain: plainPassword }
        }
      });
    }

    return responseHandler.success(res, "Store updated successfully", data);
  } catch (error) {
    console.error("Error updating store:", error);
    return responseHandler.internalServerError(res, error);
  }
};


