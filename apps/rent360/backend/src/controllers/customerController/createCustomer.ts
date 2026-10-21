import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createCustomer = async (req: Request | any, res: Response) => {
  try {
    const user = req.user;
    let storeId = user?.storeId;
    if (user?.role === "SUPER_ADMIN") {
      storeId = req.body?.storeId || req.query?.storeId;
    }
    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required to create a customer.");
    }
    const data = await (prisma as any).customer.create({ data: { ...req.body, storeId } });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
