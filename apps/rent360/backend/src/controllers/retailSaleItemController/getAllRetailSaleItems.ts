import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllRetailSaleItems = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).retailSaleItem.findMany();
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
