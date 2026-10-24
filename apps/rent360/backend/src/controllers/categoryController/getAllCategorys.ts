import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllCategorys = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { search, type } = req.query;
    let storeId = req.query.storeId as string;

    // Non-super admins are strictly locked to their store
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (type && typeof type === "string") {
      const upperType = type.trim().toUpperCase();
      if (upperType === "OUTFIT" || upperType === "ACCESSORY") {
        whereClause.category_type = upperType;
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { category_code: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return responseHandler.success(res, "Categories fetched successfully", categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return responseHandler.internalServerError(res, error);
  }
};
