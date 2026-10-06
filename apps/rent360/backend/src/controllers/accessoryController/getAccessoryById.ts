import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAccessoryById = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).accessory.findUnique({
      where: { id: req.params.id },
    });
    if (!data) return responseHandler.notFound(res);
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
