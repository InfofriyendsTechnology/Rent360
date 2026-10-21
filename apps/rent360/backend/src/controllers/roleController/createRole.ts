import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createRole = async (req: Request | any, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.body?.storeId || (user?.role !== "SUPER_ADMIN" ? user?.storeId : undefined);
    if (!storeId && user?.role === "SUPER_ADMIN") {
      return responseHandler.badRequest(res, "Store ID is required to create a role");
    }
    const data = await prisma.role.create({ 
      data: { ...req.body, storeId } 
    });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
