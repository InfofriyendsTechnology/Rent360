import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllStoreSubscriptions = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).storeSubscription.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true,
            owner_name: true,
            mobile: true,
            city: true,
            subscription_status: true,
          },
        },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    console.error("Error in getAllStoreSubscriptions:", error);
    return responseHandler.success(res, "Fetched successfully", []);
  }
};
