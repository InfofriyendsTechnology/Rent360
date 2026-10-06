import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createItemServiceLog = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).itemServiceLog.create({
      data: req.body,
    });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
