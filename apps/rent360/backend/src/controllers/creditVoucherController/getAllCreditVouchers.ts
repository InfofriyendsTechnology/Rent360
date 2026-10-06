import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllCreditVouchers = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).creditVoucher.findMany();
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
