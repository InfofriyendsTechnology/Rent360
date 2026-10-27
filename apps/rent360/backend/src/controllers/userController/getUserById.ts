import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).user.findUnique({
      where: { id: req.params.id },
      include: {
        role: true,
        store: {
          select: { id: true, name: true, owner_name: true, username: true }
        }
      }
    });
    if (!data) return responseHandler.notFound(res);
    const { password: _, ...sanitized } = data;
    return responseHandler.success(res, "Fetched successfully", sanitized);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
