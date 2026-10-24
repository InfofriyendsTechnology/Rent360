import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, category_code, description, category_type, skip_check_availability, washable, washing_price } = req.body;

    const existing = await (prisma as any).category.findUnique({
      where: { id },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Category not found");
    }

    const updateData: any = {};
    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (category_code && typeof category_code === "string" && category_code.trim()) {
      const formattedCode = category_code.trim().toUpperCase();
      const duplicateCode = await (prisma as any).category.findFirst({
        where: {
          storeId: existing.storeId,
          category_code: formattedCode,
          NOT: { id },
        },
      });
      if (duplicateCode) {
        return responseHandler.conflict(res, `Category code '${formattedCode}' already in use`);
      }
      updateData.category_code = formattedCode;
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    if (category_type && (category_type === "OUTFIT" || category_type === "ACCESSORY")) {
      updateData.category_type = category_type;
    }
    if (skip_check_availability !== undefined) {
      updateData.skip_check_availability = Boolean(skip_check_availability);
    }
    if (washable !== undefined) {
      updateData.washable = Boolean(washable);
    }
    if (washing_price !== undefined) {
      updateData.washing_price = Number(washing_price || 0);
    }

    const updated = await (prisma as any).category.update({
      where: { id },
      data: updateData,
    });

    return responseHandler.success(res, "Category updated successfully", updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
