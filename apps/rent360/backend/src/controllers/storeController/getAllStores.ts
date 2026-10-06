import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllStores = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).store.findMany({
      where: {
        roles: {
          none: {
            name: 'SUPER_ADMIN'
          }
        }
      }
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
