import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Transaction not found");
    }

    // Tenant check
    if (user?.role !== "SUPER_ADMIN" && user?.storeId && existing.storeId !== user.storeId) {
      return responseHandler.unauthorized(res, "You do not have permission to delete this transaction");
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return responseHandler.success(res, "Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return responseHandler.internalServerError(res, error);
  }
};
