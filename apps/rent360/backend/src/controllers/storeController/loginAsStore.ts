import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const loginAsStore = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.id as string;
    
    // Find the admin user for this store (the first user created)
    let user: any = await prisma.user.findFirst({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
      include: { role: true, store: true },
    });


    if (!user) {
      return responseHandler.notFound(res, "Admin user not found for this store");
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
        store: {
          id: user.store.id,
          name: user.store.name,
        },
      },
    });
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
