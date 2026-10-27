import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { getStoreAssetFolder, getStoreSlug } from "../../utils/cloudinaryHelper";

export const createUser = async (req: Request | any, res: Response) => {
  try {
    let storeId = req.user?.storeId;
    if (req.user?.role === "SUPER_ADMIN") {
      storeId = req.body?.storeId || req.query?.storeId;
    }
    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required to create a team member.");
    }

    const { password, ...rest } = req.body;
    
    if (!rest.name || !rest.name.trim()) {
      return responseHandler.badRequest(res, "Name is required.");
    }

    if (!rest.mobile || !rest.mobile.trim()) {
      return responseHandler.badRequest(res, "Mobile number is required.");
    }

    const trimmedMobile = rest.mobile.trim();

    // Check if mobile is already used by an existing user
    const existingUser = await prisma.user.findFirst({
      where: { mobile: trimmedMobile }
    });
    if (existingUser) {
      return responseHandler.badRequest(res, "A member with this mobile number already exists.");
    }

    if (!password || password.trim().length < 4) {
      return responseHandler.badRequest(res, "Password must be at least 4 characters.");
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const userData: any = {
      name: rest.name.trim(),
      mobile: trimmedMobile,
      password: hashedPassword,
      storeId,
      status: rest.status || "ACTIVE",
      username: rest.username ? rest.username.trim() : null,
      email: rest.email ? rest.email.trim() : null,
      contact_no_2: rest.contact_no_2 ? rest.contact_no_2.trim() : null,
      address: rest.address ? rest.address.trim() : null,
      state: rest.state ? rest.state.trim() : null,
      city: rest.city ? rest.city.trim() : null,
      remarks: rest.remarks ? rest.remarks.trim() : null,
    };

    if (rest.roleId && rest.roleId.trim()) {
      const assignedRole = await prisma.role.findUnique({
        where: { id: rest.roleId.trim() }
      });
      if (assignedRole && (assignedRole.name === 'STORE_ADMIN' || assignedRole.name === 'SUPER_ADMIN')) {
        return responseHandler.badRequest(res, "Store Admin role cannot be assigned to team members.");
      }
      userData.roleId = rest.roleId.trim();
    }

    if (rest.profile_pic) {
      if (rest.profile_pic.startsWith("data:image")) {
        try {
          const store = await prisma.store.findUnique({ where: { id: storeId } });
          const folderPath = getStoreAssetFolder(store?.name || 'store', 'profiles');
          const cleanName = getStoreSlug(rest.name || 'user');
          const uploadRes = await cloudinary.uploader.upload(rest.profile_pic, {
            folder: folderPath,
            asset_folder: folderPath,
            public_id: `${cleanName}_${Date.now()}`,
            format: "webp",
            transformation: [{ quality: "auto:good", fetch_format: "webp" }],
            overwrite: true,
            invalidate: true,
          });
          userData.profile_pic = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error("Failed to upload avatar to Cloudinary:", uploadErr);
        }
      } else {
        userData.profile_pic = rest.profile_pic;
      }
    }

    const data = await prisma.user.create({ 
      data: userData,
      include: {
        role: true
      }
    });
    
    const { password: _, ...sanitized } = data;
    return responseHandler.created(res, "Team Member created successfully", sanitized);
  } catch (error: any) {
    console.error("Create User Error:", error);
    if (error?.code === "P2002") {
      return responseHandler.badRequest(res, "A member with this mobile number already exists.");
    }
    return responseHandler.internalServerError(res, error.message || error);
  }
};

