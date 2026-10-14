import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";
import { checkStoreCollectionLimit } from "../../utils/planLimitsHelper";

export const createProductItem = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let {
      productId,
      sku_code,
      size,
      color,
      status,
      condition_notes,
      storeId,
    } = req.body;

    if (!productId) {
      return responseHandler.badRequest(res, "productId is required");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return responseHandler.notFound(res, "Product design not found");
    }

    storeId = product.storeId;

    // Check Plan Collection Limit
    const limitCheck = await checkStoreCollectionLimit(storeId);
    if (!limitCheck.allowed) {
      return responseHandler.badRequest(
        res,
        limitCheck.message ||
          `Collection limit reached on your ${limitCheck.planName} plan (Max: ${limitCheck.maxItems} items). Please upgrade your subscription plan.`
      );
    }

    const sizeStr = size ? String(size).trim() : "STD";
    const colorStr = color ? String(color).trim() : null;

    // Auto-generate sku_code if omitted
    if (!sku_code || typeof sku_code !== "string" || !sku_code.trim()) {
      const existingCount = await prisma.productItem.count({
        where: { productId },
      });
      sku_code = `${product.product_code}-${sizeStr.replace(/[^A-Z0-9]+/gi, "")}-${existingCount + 1}`;
    } else {
      sku_code = sku_code.trim().toUpperCase();
    }

    // Check SKU uniqueness
    const duplicateSku = await prisma.productItem.findUnique({
      where: { sku_code },
    });
    if (duplicateSku) {
      return responseHandler.conflict(
        res,
        `SKU code '${sku_code}' already exists. Please provide a unique SKU or barcode.`
      );
    }

    const productItem = await prisma.productItem.create({
      data: {
        storeId,
        productId,
        sku_code,
        size: sizeStr,
        color: colorStr,
        status: status || "AVAILABLE",
        condition_notes: condition_notes ? String(condition_notes).trim() : null,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return responseHandler.created(res, "Product item created successfully", productItem);
  } catch (error) {
    console.error("Error creating product item:", error);
    return responseHandler.internalServerError(res, error);
  }
};
