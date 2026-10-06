import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).subscriptionPlan.findMany();
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
