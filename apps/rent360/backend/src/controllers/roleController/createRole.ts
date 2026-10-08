import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createRole = async (req: Request | any, res: Response) => {
  try {
    const storeId = req.user?.storeId;
    const data = await prisma.role.create({ 
      data: { ...req.body, storeId } 
    });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
