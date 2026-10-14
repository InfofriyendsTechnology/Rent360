import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getCategoryById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const category = await (prisma as any).category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            _count: {
              select: {
                productItems: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return responseHandler.notFound(res, "Category not found");
    }

    return responseHandler.success(res, "Category fetched successfully", category);
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return responseHandler.internalServerError(res, error);
  }
};
