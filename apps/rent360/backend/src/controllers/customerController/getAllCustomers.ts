import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllCustomers = async (req: Request | any, res: Response) => {
  try {
    const user = req.user;
    let storeId = (req.query.storeId as string) || user?.storeId;
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const where: any = {};
    if (storeId) {
      where.storeId = storeId;
    }

    const data = await (prisma as any).customer.findMany({ 
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
