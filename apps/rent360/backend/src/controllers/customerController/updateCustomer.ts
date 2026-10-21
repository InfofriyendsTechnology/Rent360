import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const where: any = { id: req.params.id };
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      where.storeId = user.storeId;
    }
    const data = await (prisma as any).customer.updateMany({
      where,
      data: req.body,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
