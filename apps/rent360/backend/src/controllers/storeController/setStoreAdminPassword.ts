import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import bcrypt from "bcryptjs";

export const setStoreAdminPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      return responseHandler.badRequest(res, "Password must be at least 6 characters.");
    }

    const store = await prisma.store.findUnique({
      where: { id }
    });

    if (!store) {
      return responseHandler.notFound(res, "Store not found.");
    }

    const plainPassword = password.trim();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Find the admin user belonging to this store
    let adminUser = await prisma.user.findFirst({
      where: { storeId: id },
      orderBy: { createdAt: 'asc' }
    });

    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword }
      });
    } else {
      // If store exists but admin user was not yet created, create STORE_ADMIN role & user
      let role = await prisma.role.findFirst({
        where: { storeId: id, name: 'STORE_ADMIN' }
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            storeId: id,
            name: 'STORE_ADMIN',
            permissions: ['ALL']
          }
        });
      }

      adminUser = await prisma.user.create({
        data: {
          storeId: id,
          roleId: role.id,
          name: store.owner_name || store.name,
          mobile: store.mobile,
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
    }

    // Record password text for Super Admin reference in AuditLog
    await prisma.auditLog.create({
      data: {
        storeId: id,
        userId: adminUser.id,
        action_type: 'PASSWORD_SET',
        table_name: 'users',
        record_id: adminUser.id,
        new_data: { password_plain: plainPassword }
      }
    });

    return responseHandler.success(res, "Password updated successfully for store admin.", {
      storeId: id,
      adminPassword: plainPassword
    });
  } catch (error) {
    console.error("Error setting store password:", error);
    return responseHandler.internalServerError(res, error);
  }
};
