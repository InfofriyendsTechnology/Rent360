import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllProductItems = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { productId, status, size, color, search } = req.query;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }
    if (productId && typeof productId === "string") {
      whereClause.productId = productId;
    }
    if (status && typeof status === "string") {
      whereClause.status = status.toUpperCase();
    }
    if (size && typeof size === "string") {
      whereClause.size = { equals: size.trim(), mode: "insensitive" };
    }
    if (color && typeof color === "string") {
      whereClause.color = { contains: color.trim(), mode: "insensitive" };
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { sku_code: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { product_code: { contains: q, mode: "insensitive" } } },
      ];
    }

    const items = await prisma.productItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        sku_code: "asc",
      },
    });

    return responseHandler.success(res, "Product items fetched successfully", items);
  } catch (error) {
    console.error("Error fetching product items:", error);
    return responseHandler.internalServerError(res, error);
  }
};
