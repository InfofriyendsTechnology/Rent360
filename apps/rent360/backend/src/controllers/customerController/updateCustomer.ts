import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).customer.updateMany({
      where: { id: req.params.id, storeId: (req as any).user.storeId },
      data: req.body,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
