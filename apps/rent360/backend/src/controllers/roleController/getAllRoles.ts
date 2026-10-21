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
    const user = req.user;
    let storeId = (req.query.storeId as string) || (user?.role !== "SUPER_ADMIN" ? user?.storeId : undefined);

    const where: any = {
      name: { notIn: ['STORE_ADMIN', 'SUPER_ADMIN'] }
    };
    if (storeId) {
      where.storeId = storeId;
    }

    let roles = await prisma.role.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Auto-seed default staff roles if store has no staff roles and a specific storeId was given
    if (roles.length === 0 && storeId) {
      for (const def of DEFAULT_STORE_ROLES) {
        const newRole = await prisma.role.create({
          data: {
            storeId,
            name: def.name,
            permissions: def.permissions
          },
          include: {
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        roles.push(newRole);
      }
    }

    return responseHandler.success(res, "Fetched successfully", roles);
  } catch (error: any) {
    console.error("Get All Roles Error:", error);
    return responseHandler.internalServerError(res, error.message || error);
  }
};
