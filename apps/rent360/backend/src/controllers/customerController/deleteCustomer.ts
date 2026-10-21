import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const where: any = { id: req.params.id };
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      where.storeId = user.storeId;
    }
    await (prisma as any).customer.deleteMany({ where });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
