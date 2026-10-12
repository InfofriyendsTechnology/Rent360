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

    
    const existingStore = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!existingStore) {
      return responseHandler.notFound(res, "Store not found");
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
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
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

    // If password is provided in edit form, update store admin password & log
    const newPassword = password || admin_password;
    if (newPassword && newPassword.trim().length >= 6) {
      const plainPassword = newPassword.trim();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      let adminUser = await prisma.user.findFirst({
        where: { storeId: req.params.id },
        orderBy: { createdAt: 'asc' }
      });

      if (adminUser) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: hashedPassword }
        });
      } else {
        let role = await prisma.role.findFirst({
          where: { storeId: req.params.id, name: 'STORE_ADMIN' }
        });
        if (!role) {
          role = await prisma.role.create({
            data: {
              storeId: req.params.id,
              name: 'STORE_ADMIN',
              permissions: ['ALL']
            }
          });
        }
        adminUser = await prisma.user.create({
          data: {
            storeId: req.params.id,
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
          storeId: req.params.id,
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


