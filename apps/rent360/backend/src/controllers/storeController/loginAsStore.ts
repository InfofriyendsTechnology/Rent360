import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const loginAsStore = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.id as string;
    
    // Find the store first
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return responseHandler.notFound(res, "Store not found");
    }

    // Find the store admin user for this store
    let user: any = await prisma.user.findFirst({
      where: { storeId, role: { name: 'STORE_ADMIN' } },
      orderBy: { createdAt: 'asc' },
      include: { role: true, store: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { storeId },
        orderBy: { createdAt: 'asc' },
        include: { role: true, store: true },
      });
    }

    if (!user) {
      // Auto-provision STORE_ADMIN role and user if missing
      let storeAdminRole = await prisma.role.findFirst({
        where: { storeId, name: 'STORE_ADMIN' }
      });
      if (!storeAdminRole) {
        storeAdminRole = await prisma.role.create({
          data: {
            storeId,
            name: 'STORE_ADMIN',
            permissions: ['ALL']
          }
        });
      }

      const defaultPassword = `${store.name.replace(/\s+/g, '')}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      user = await prisma.user.create({
        data: {
          storeId: store.id,
          roleId: storeAdminRole.id,
          name: store.owner_name || store.name,
          username: store.username || null,
          mobile: store.mobile,
          password: hashedPassword,
          status: 'ACTIVE'
        },
        include: { role: true, store: true }
      });
    }

    // If user has no role, ensure STORE_ADMIN role exists and assign it
    if (!user.roleId || !user.role) {
      let storeAdminRole = await prisma.role.findFirst({
        where: { storeId, name: 'STORE_ADMIN' }
      });
      if (!storeAdminRole) {
        storeAdminRole = await prisma.role.create({
          data: {
            storeId,
            name: 'STORE_ADMIN',
            permissions: ['ALL']
          }
        });
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: { roleId: storeAdminRole.id },
        include: { role: true, store: true }
      });
    }

    // Check Status
    if (user.status !== "ACTIVE" || user.store.subscription_status !== "ACTIVE") {
      return responseHandler.forbidden(res, "Store or User account is inactive");
    }


    // Generate Token (just like normal login)
    const token = jwt.sign(
      { id: user.id, storeId: user.storeId, role: user.role?.name },
      process.env.JWT_SECRET || "Rent360SuperSecretKey2026",
      { expiresIn: "7d" }
    );

    return responseHandler.success(res, "Logged in as store successfully", {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role?.name,
        permissions: (user.role?.permissions as unknown as string[]) || [],
        profile_pic: user.profile_pic || user.store.logo_url || null,
        store: {
          id: user.store.id,
          name: user.store.name,
          username: user.store.username,
          logo_url: user.store.logo_url || null,
          subscription_status: user.store.subscription_status,
        },
      },
    });
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
