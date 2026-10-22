import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { categoryId, search, minRent, maxRent, status } = req.query;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }
    if (categoryId && typeof categoryId === "string") {
      whereClause.categoryId = categoryId;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { product_code: { contains: q, mode: "insensitive" } },
      ];
    }

    if (minRent || maxRent) {
      whereClause.base_rent_price = {};
      if (minRent) whereClause.base_rent_price.gte = Number(minRent);
      if (maxRent) whereClause.base_rent_price.lte = Number(maxRent);
    }

    if (status && typeof status === "string") {
      whereClause.productItems = {
        some: {
          status: status.toUpperCase(),
        },
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        productItems: {
          orderBy: {
            size: "asc",
          },
        },
        _count: {
          select: {
            productItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return responseHandler.success(res, "Outfits fetched successfully", products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return responseHandler.internalServerError(res, error);
  }
};
