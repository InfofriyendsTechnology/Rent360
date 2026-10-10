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

export const createStore = async (req: Request, res: Response) => {
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
      plan_id,
      admin_password,
      password
    } = req.body;

    // 1. Check if mobile already in use
    const existingUser = await prisma.user.findUnique({
      where: { mobile }
    });
    if (existingUser) {
      return responseHandler.badRequest(res, `A user with mobile ${mobile} already exists.`);
    }

    const existingStore = await prisma.store.findUnique({
      where: { mobile }
    });
    if (existingStore) {
      return responseHandler.badRequest(res, `A store with mobile ${mobile} already exists.`);
    }

    // 2. Determine or generate password
    const plainPassword = (password || admin_password)?.trim() || `${name.trim().replace(/\s+/g, '')}@123`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Verify or pick default plan
    let targetPlan = null;
    if (plan_id) {
      targetPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: plan_id }
      });
    }
    if (!targetPlan) {
      // Find first active plan or Pro plan
      targetPlan = await prisma.subscriptionPlan.findFirst({
        where: { is_active: true }
      });
    }

    // 4. Atomic Transaction: Store + Store Admin Role + Store Admin User + Subscription
    const result = await prisma.$transaction(async (tx) => {
      // Create Store
      
      let finalLogoUrl = logo_url;
      if (logo_url && logo_url.startsWith("data:image")) {
        const cleanName = (name || "store").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const uploadResponse = await cloudinary.uploader.upload(logo_url, {
          folder: `rent360/stores/logos`,
          public_id: `${cleanName}_logo`,
          overwrite: true
        });
        finalLogoUrl = uploadResponse.secure_url;
      }

      const store = await tx.store.create({
        data: {
          name,
          owner_name,
          mobile,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          gst_number: gst_number || null,
          logo_url: finalLogoUrl || null,
          plan_id: targetPlan?.id || null,
          subscription_status: 'ACTIVE'
        }
      });

      // Create STORE_ADMIN Role
      const role = await tx.role.create({
        data: {
          storeId: store.id,
          name: 'STORE_ADMIN',
          permissions: ['ALL']
        }
      });

      // Create Store Admin User
      const user = await tx.user.create({
        data: {
          storeId: store.id,
          roleId: role.id,
          name: owner_name,
          mobile,
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });

      // Record password text for Super Admin in AuditLog
      await tx.auditLog.create({
        data: {
          storeId: store.id,
          userId: user.id,
          action_type: 'PASSWORD_SET',
          table_name: 'users',
          record_id: user.id,
          new_data: { password_plain: plainPassword }
        }
      });

      // Create StoreSubscription if plan exists
      let subscription = null;
      if (targetPlan) {
        const startDate = new Date();
        const endDate = new Date();
        // 1 year for annual, 14 days for trial
        if (targetPlan.name.toLowerCase().includes('trial') || targetPlan.price_per_year === 0) {
          endDate.setDate(endDate.getDate() + 14);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        subscription = await tx.storeSubscription.create({
          data: {
            storeId: store.id,
            planId: targetPlan.id,
            start_date: startDate,
            end_date: endDate,
            status: 'ACTIVE',
            last_paid_amount: targetPlan.price_per_year || 0
          }
        });
      }

      return {
        store,
        adminCredentials: {
          storeId: store.id,
          storeName: store.name,
          ownerName: store.owner_name,
          loginMobile: store.mobile,
          password: plainPassword,
          role: 'STORE_ADMIN'
        },
        subscription: subscription ? { ...subscription, plan: targetPlan } : null
      };
    });

    return responseHandler.created(res, "Store and Admin Account created successfully", result);
  } catch (error: any) {
    console.error("Create Store Error:", error);
    return responseHandler.internalServerError(res, error.message || error);
  }
};


