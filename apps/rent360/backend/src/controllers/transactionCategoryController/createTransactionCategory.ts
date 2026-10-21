import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createTransactionCategory = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    let storeId = req.body.storeId;

    if (!storeId && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst();
      storeId = defaultStore?.id;
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "storeId is required");
    }

    const name = (req.body.name || "").trim();
    const category_type = (req.body.category_type || "EXPENSE").toUpperCase();

    if (!name) {
      return responseHandler.badRequest(res, "Category name is required");
    }

    // Check if category already exists for this store
    const existing = await prisma.transactionCategory.findFirst({
      where: {
        storeId,
        name: { equals: name, mode: "insensitive" },
        category_type,
      },
    });

    if (existing) {
      return responseHandler.success(res, "Category already exists", existing);
    }

    const data = await prisma.transactionCategory.create({
      data: {
        name,
        category_type,
        storeId,
      },
    });

    return responseHandler.created(res, "Category created successfully", data);
  } catch (error) {
    console.error("Error creating transaction category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
