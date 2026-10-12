import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const DEFAULT_STORE_ROLES = [
  {
    name: 'Store Manager',
    permissions: ['DASHBOARD_VIEW', 'INVENTORY_MANAGE', 'CUSTOMERS_MANAGE', 'BILLING_CREATE', 'REPORTS_VIEW', 'SETTINGS_MANAGE']
  },
  {
    name: 'Sales Executive',
    permissions: ['DASHBOARD_VIEW', 'INVENTORY_MANAGE', 'CUSTOMERS_MANAGE', 'BILLING_CREATE']
  },
  {
    name: 'Tailor / Staff',
    permissions: ['INVENTORY_MANAGE']
  }
];

export const getAllRoles = async (req: Request | any, res: Response) => {
  try {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return responseHandler.success(res, "Fetched successfully", []);
    }

    let roles = await prisma.role.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' }
    });

    // Auto-seed default staff roles if store has only STORE_ADMIN or no roles
    const nonAdminRoles = roles.filter(r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN');
    if (nonAdminRoles.length === 0) {
      for (const def of DEFAULT_STORE_ROLES) {
        const exists = roles.some(r => r.name.toLowerCase() === def.name.toLowerCase());
        if (!exists) {
          const newRole = await prisma.role.create({
            data: {
              storeId,
              name: def.name,
              permissions: def.permissions
            }
          });
          roles.push(newRole);
        }
      }
    }

    return responseHandler.success(res, "Fetched successfully", roles);
  } catch (error: any) {
    console.error("Get All Roles Error:", error);
    return responseHandler.internalServerError(res, error.message || error);
  }
};

