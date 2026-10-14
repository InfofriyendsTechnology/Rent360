import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";
import { uploadProductImages } from "../../utils/cloudinaryHelper";

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      categoryId,
      product_code,
      base_rent_price,
      base_security_deposit,
      images,
      image_urls,
    } = req.body;

    const existing: any = await (prisma as any).product.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Product not found");
    }

    const updateData: any = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (categoryId && typeof categoryId === "string") {
      const cat = await (prisma as any).category.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return responseHandler.badRequest(res, "Selected category does not exist");
      }
      updateData.categoryId = categoryId;
    }

    if (base_rent_price !== undefined) {
      updateData.base_rent_price = Number(base_rent_price) || 0;
    }

    if (base_security_deposit !== undefined) {
      updateData.base_security_deposit = Number(base_security_deposit) || 0;
    }

    if (product_code && typeof product_code === "string" && product_code.trim()) {
      const formattedCode = product_code.trim().toUpperCase();
      const duplicateCode = await (prisma as any).product.findFirst({
        where: {
          storeId: existing.storeId,
          product_code: formattedCode,
          NOT: { id },
        },
      });
      if (duplicateCode) {
        return responseHandler.conflict(
          res,
          `Product code '${formattedCode}' already in use by another product`
        );
      }
      updateData.product_code = formattedCode;
    }

    // Handle Image Updates if supplied
    const rawImages = images || image_urls || req.body.image;
    if (rawImages) {
      const currentCode = updateData.product_code || existing.product_code;
      const storeName = existing.store?.name || "store";
      const uploadedUrls = await uploadProductImages(
        storeName,
        currentCode,
        rawImages
      );
      updateData.image_urls = uploadedUrls;
    }

    const updated = await (prisma as any).product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        productItems: true,
      },
    });

    return responseHandler.success(res, "Product updated successfully", updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return responseHandler.internalServerError(res, error);
  }
};
