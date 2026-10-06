import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deletePaymentMode = async (req: Request, res: Response) => {
  try {
    await (prisma as any).paymentMode.delete({ where: { id: req.params.id } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
