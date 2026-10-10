import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).customer.findMany({ where: { storeId: (req as any).user.storeId } });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
