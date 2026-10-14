import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let { name, category_code, description, storeId } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return responseHandler.badRequest(res, "Category name is required");
    }

    name = name.trim();

    // Assign storeId
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    } else if (!storeId && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      // If still no storeId (e.g. super admin creating without storeId), fallback to first active store
      const firstStore = await prisma.store.findFirst();
      if (!firstStore) {
        return responseHandler.badRequest(res, "No store available to attach category");
      }
      storeId = firstStore.id;
    }

    // Auto-generate category_code if not supplied
    if (!category_code || typeof category_code !== "string" || !category_code.trim()) {
      category_code = name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "CAT";
    } else {
      category_code = category_code.trim().toUpperCase();
    }

    // Check duplicate in same store
    const existing = await prisma.category.findFirst({
      where: {
        storeId,
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { category_code: { equals: category_code, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return responseHandler.conflict(
        res,
        `Category '${name}' or code '${category_code}' already exists in this store`
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        storeId,
        name,
        category_code,
        description: description ? description.trim() : null,
      },
    });

    return responseHandler.created(res, "Category created successfully", newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
