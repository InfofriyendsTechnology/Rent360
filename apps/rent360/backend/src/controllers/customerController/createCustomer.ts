import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).customer.create({ data: { ...req.body, storeId: (req as any).user.storeId } });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
