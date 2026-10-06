import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateRetailSale = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).retailSale.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
