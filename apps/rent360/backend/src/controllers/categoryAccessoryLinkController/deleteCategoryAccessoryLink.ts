import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const deleteCategoryAccessoryLink = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.categoryAccessoryLink.delete({
      where: { id },
    });
    return responseHandler.success(res, "Accessory link removed successfully");
  } catch (error) {
    console.error("Error deleting category accessory link:", error);
    return responseHandler.internalServerError(res, error);
  }
};
