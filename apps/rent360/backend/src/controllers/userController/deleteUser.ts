import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user?.id;
    const storeId = (req as any).user?.storeId;

    if (userId === currentUserId) {
      return responseHandler.badRequest(res, "You cannot delete your own account");
    }

    const existing = await prisma.user.findFirst({ 
      where: { id: userId, storeId },
      include: { role: true } 
    });
    
    if (!existing) {
      return responseHandler.notFound(res, "User not found");
    }

    if (existing.role?.name === "SUPER_ADMIN") {
      return responseHandler.unauthorized(res, "You cannot delete the primary store owner");
    }

    await prisma.user.delete({ where: { id: userId } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
