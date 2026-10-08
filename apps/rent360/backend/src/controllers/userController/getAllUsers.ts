import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllUsers = async (req: Request | any, res: Response) => {
  try {
    const storeId = req.user?.storeId;
    const data = await prisma.user.findMany({
      where: { storeId },
      include: { role: true },
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
