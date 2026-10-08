import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllRoles = async (req: Request | any, res: Response) => {
  try {
    const storeId = req.user?.storeId;
    const data = await prisma.role.findMany({
      where: { storeId }
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
