import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const storeId = (req as any).user?.storeId;

    const existing = await prisma.user.findFirst({ where: { id: userId, storeId } });
    if (!existing) {
      return responseHandler.notFound(res, "User not found");
    }

    await prisma.user.delete({ where: { id: userId } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
