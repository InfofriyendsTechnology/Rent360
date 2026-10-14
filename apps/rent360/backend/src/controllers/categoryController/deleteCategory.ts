import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing: any = await (prisma as any).category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Category not found");
    }

    if (existing._count?.products > 0) {
      return responseHandler.badRequest(
        res,
        `Cannot delete category '${existing.name}'. It contains ${existing._count.products} products. Reassign or delete those products first.`
      );
    }

    await (prisma as any).category.delete({
      where: { id },
    });

    return responseHandler.success(res, `Category '${existing.name}' deleted successfully`);
  } catch (error) {
    console.error("Error deleting category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
