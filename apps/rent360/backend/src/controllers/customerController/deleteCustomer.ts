import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    await (prisma as any).customer.deleteMany({ where: { id: req.params.id, storeId: (req as any).user.storeId } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
