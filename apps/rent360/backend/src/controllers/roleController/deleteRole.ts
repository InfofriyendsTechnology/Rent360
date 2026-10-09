import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id;
    const storeId = (req as any).user?.storeId;

    const existing = await prisma.role.findFirst({ where: { id: roleId, storeId } });
    if (!existing) {
      return responseHandler.notFound(res, "Role not found");
    }

    await prisma.role.delete({ where: { id: roleId } });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
