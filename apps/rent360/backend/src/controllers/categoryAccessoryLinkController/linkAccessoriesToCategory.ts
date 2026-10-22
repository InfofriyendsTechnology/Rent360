import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const linkAccessoriesToCategory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { categoryId, accessoryIds } = req.body;
    let storeId = req.body.storeId;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    if (!categoryId) {
      return responseHandler.badRequest(res, "categoryId is required");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return responseHandler.notFound(res, "Category not found");
    }

    const effectiveStoreId = storeId || category.storeId;

    const idsToLink: string[] = Array.isArray(accessoryIds) ? accessoryIds : [];

    // Transaction: delete old links for this category and insert new ones
    await prisma.$transaction(async (tx) => {
      await tx.categoryAccessoryLink.deleteMany({
        where: { categoryId },
      });

      if (idsToLink.length > 0) {
        await tx.categoryAccessoryLink.createMany({
          data: idsToLink.map((accId) => ({
            storeId: effectiveStoreId,
            categoryId,
            accessoryId: accId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return responseHandler.success(res, "Accessories linked to category successfully");
  } catch (error) {
    console.error("Error linking accessories to category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
