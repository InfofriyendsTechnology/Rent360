import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";
import { uploadProductImages } from "../../utils/cloudinaryHelper";
import { checkStoreCollectionLimit } from "../../utils/planLimitsHelper";

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let {
      storeId,
      categoryId,
      name,
      outfit_name,
      product_code,
      outfit_code,
      base_rent_price,
      base_security_deposit,
      images,
      image_urls,
      items, // Optional array of physical items: [{ size, color, sku_code, condition_notes }]
    } = req.body;

    // 1. Determine Store ID
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      if (user?.role === "SUPER_ADMIN") {
        return responseHandler.badRequest(res, "Please select a store to assign this design.");
      }
      const firstStore = await prisma.store.findFirst();
      if (!firstStore) {
        return responseHandler.badRequest(res, "No store available to attach product");
      }
      storeId = firstStore.id;
    }

    // Fetch store for naming in Cloudinary folder
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      return responseHandler.notFound(res, "Store not found");
    }

    // 2. Validate Category
    if (!categoryId) {
      return responseHandler.badRequest(res, "categoryId is required");
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return responseHandler.notFound(res, "Category not found");
    }

    // 3. Validate Basic Fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return responseHandler.badRequest(res, "Product name is required");
    }
    name = name.trim();

    const rentPrice = Number(base_rent_price) || 0;
    const securityDeposit = Number(base_security_deposit) || 0;

    // 4. Auto-generate product_code if not provided
    if (!product_code || typeof product_code !== "string" || !product_code.trim()) {
      const prefix = (category.category_code || "PRD").slice(0, 4).toUpperCase();
      const count = await prisma.product.count({
        where: { storeId, categoryId },
      });
      product_code = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    } else {
      product_code = product_code.trim().toUpperCase();
    }

    // Check duplicate product_code in same store
    const duplicateCode = await prisma.product.findFirst({
      where: {
        storeId,
        product_code,
      },
    });
    if (duplicateCode) {
      return responseHandler.conflict(
        res,
        `Product code '${product_code}' already exists in this store. Please use a unique product code.`
      );
    }

    // 5. Check Subscription Plan Capacity if items are included
    const itemsList = Array.isArray(items) ? items : [];
    if (itemsList.length > 0) {
      const limitCheck = await checkStoreCollectionLimit(storeId);
      if (!limitCheck.allowed || limitCheck.currentItems + itemsList.length > limitCheck.maxItems) {
        return responseHandler.badRequest(
          res,
          limitCheck.message ||
            `Collection limit reached on your ${limitCheck.planName} plan (Max: ${limitCheck.maxItems} items). Please upgrade your subscription plan.`
        );
      }
    }

    // 6. Handle Image Uploads (Single or Multiple)
    const rawImages = images || image_urls || req.body.image;
    let finalImageUrls: string[] = [];

    if (rawImages) {
      finalImageUrls = await uploadProductImages(store.name, product_code, rawImages);
    }

    // 7. Create Product and nested ProductItems inside Transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          categoryId,
          product_code,
          name,
          base_rent_price: rentPrice,
          base_security_deposit: securityDeposit,
          image_urls: finalImageUrls,
        },
      });

      // If initial physical items were supplied, create them
      const createdItems = [];
      for (let i = 0; i < itemsList.length; i++) {
        const it = itemsList[i];
        const sizeStr = it.size ? String(it.size).trim() : "STD";
        const colorStr = it.color ? String(it.color).trim() : null;
        
        let sku = it.sku_code ? String(it.sku_code).trim().toUpperCase() : null;
        if (!sku) {
          sku = `${product_code}-${sizeStr.replace(/[^A-Z0-9]+/gi, "")}-${i + 1}`;
        }

        // Ensure unique SKU
        const existingSku = await tx.productItem.findUnique({
          where: { sku_code: sku },
        });
        if (existingSku) {
          sku = `${sku}-${Date.now().toString().slice(-4)}`;
        }

        const itemRecord = await tx.productItem.create({
          data: {
            storeId,
            productId: product.id,
            sku_code: sku,
            size: sizeStr,
            color: colorStr,
            status: it.status || "AVAILABLE",
            condition_notes: it.condition_notes ? String(it.condition_notes).trim() : null,
          },
        });
        createdItems.push(itemRecord);
      }

      return {
        ...product,
        productItems: createdItems,
        category,
      };
    });

    return responseHandler.created(res, "Outfit created successfully", result);
  } catch (error) {
    console.error("Error creating product:", error);
    return responseHandler.internalServerError(res, error);
  }
};
