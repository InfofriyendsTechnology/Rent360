import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllStores = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).store.findMany({
      where: {
        roles: {
          none: {
            name: 'SUPER_ADMIN'
          }
        }
      },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        users: {
          select: {
            id: true,
            password: true
          },
          take: 1
        },
        auditLogs: {
          where: { action_type: 'PASSWORD_SET' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = data.map((store: any) => {
      const hasUserPassword = Boolean(store.users && store.users.length > 0 && store.users[0]?.password);
      // Strictly real password from database AuditLog
      const auditPlain = store.auditLogs?.[0]?.new_data?.password_plain;
      const adminPassword = auditPlain || '';
      const hasPassword = Boolean(auditPlain || hasUserPassword);

      return {
        ...store,
        hasPassword,
        adminPassword
      };
    });

    return responseHandler.success(res, "Fetched successfully", formattedData);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
