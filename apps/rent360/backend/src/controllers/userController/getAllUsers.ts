import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllUsers = async (req: Request | any, res: Response) => {
  try {
    const user = req.user;
    let storeId = (req.query.storeId as string) || user?.storeId;
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const where: any = {
      role: {
        name: { notIn: ['STORE_ADMIN', 'SUPER_ADMIN'] }
      }
    };
    if (storeId) {
      where.storeId = storeId;
    }

    const data = await prisma.user.findMany({
      where,
      include: {
        role: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Remove passwords before sending to frontend
    const sanitizedData = data.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return responseHandler.success(res, "Fetched successfully", sanitizedData);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
