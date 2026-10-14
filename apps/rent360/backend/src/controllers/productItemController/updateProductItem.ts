import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const updateProductItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { size, color, sku_code, status, condition_notes } = req.body;

    const existing = await (prisma as any).productItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Product item not found");
    }

    const updateData: any = {};

    if (size !== undefined) {
      updateData.size = size ? String(size).trim() : null;
    }

    if (color !== undefined) {
      updateData.color = color ? String(color).trim() : null;
    }

    if (status !== undefined) {
      updateData.status = String(status).trim().toUpperCase();
    }

    if (condition_notes !== undefined) {
      updateData.condition_notes = condition_notes ? String(condition_notes).trim() : null;
    }

    if (sku_code && typeof sku_code === "string" && sku_code.trim()) {
      const formattedSku = sku_code.trim().toUpperCase();
      const duplicateSku = await (prisma as any).productItem.findFirst({
        where: {
          sku_code: formattedSku,
          NOT: { id },
        },
      });
      if (duplicateSku) {
        return responseHandler.conflict(
          res,
          `SKU code '${formattedSku}' is already assigned to another item`
        );
      }
      updateData.sku_code = formattedSku;
    }

    const updated = await (prisma as any).productItem.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return responseHandler.success(res, "Product item updated successfully", updated);
  } catch (error) {
    console.error("Error updating product item:", error);
    return responseHandler.internalServerError(res, error);
  }
};
