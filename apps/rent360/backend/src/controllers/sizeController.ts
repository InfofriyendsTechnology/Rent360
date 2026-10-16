import { Response } from "express";
import prisma from "../utils/prisma";
import responseHandler from "../utils/responseHandler";
import { AuthRequest } from "../middleware/auth";

const DEFAULT_SIZES = [
  { name: "34", code: "34", sort_order: 1 },
  { name: "36", code: "36", sort_order: 2 },
  { name: "38", code: "38", sort_order: 3 },
  { name: "40", code: "40", sort_order: 4 },
  { name: "42", code: "42", sort_order: 5 },
  { name: "44", code: "44", sort_order: 6 },
  { name: "46", code: "46", sort_order: 7 },
  { name: "Free Size", code: "FS", sort_order: 8 },
];

export const getAllSizes = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { search } = req.query;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId && user?.storeId) {
      storeId = user.storeId;
    }

    if (storeId) {
      // Auto-seed defaults if store has no sizes
      const count = await prisma.storeSize.count({ where: { storeId } });
      if (count === 0) {
        await prisma.storeSize.createMany({
          data: DEFAULT_SIZES.map((s) => ({
            storeId,
            name: s.name,
            code: s.code,
            sort_order: s.sort_order,
          })),
        });
      }
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { code: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const sizes = await prisma.storeSize.findMany({
      where: whereClause,
      orderBy: [{ sort_order: "asc" }, { createdAt: "asc" }],
    });

    return responseHandler.success(res, "Sizes fetched successfully", sizes);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const createSize = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { name, code, sort_order } = req.body;
    let storeId = req.body.storeId || user?.storeId;

    if (user?.role !== "SUPER_ADMIN") {
      storeId = user?.storeId;
    }

    if (!name || !name.trim()) {
      return responseHandler.badRequest(res, "Size name is required");
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required");
    }

    const size = await prisma.storeSize.create({
      data: {
        storeId,
        name: name.trim(),
        code: (code || name).trim().toUpperCase(),
        sort_order: typeof sort_order === "number" ? sort_order : 0,
      },
    });

    return responseHandler.created(res, "Size created successfully", size);
  } catch (error) {
    console.error("Error creating size:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const getSizeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const size = await prisma.storeSize.findUnique({
      where: { id },
    });

    if (!size) {
      return responseHandler.notFound(res, "Size not found");
    }

    return responseHandler.success(res, "Size fetched successfully", size);
  } catch (error) {
    console.error("Error fetching size:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const updateSize = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, sort_order } = req.body;

    const existing = await prisma.storeSize.findUnique({ where: { id } });
    if (!existing) {
      return responseHandler.notFound(res, "Size not found");
    }

    const updated = await prisma.storeSize.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(sort_order !== undefined ? { sort_order: Number(sort_order) } : {}),
      },
    });

    return responseHandler.success(res, "Size updated successfully", updated);
  } catch (error) {
    console.error("Error updating size:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const deleteSize = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.storeSize.findUnique({ where: { id } });
    if (!existing) {
      return responseHandler.notFound(res, "Size not found");
    }

    await prisma.storeSize.delete({ where: { id } });

    return responseHandler.success(res, "Size deleted successfully", null);
  } catch (error) {
    console.error("Error deleting size:", error);
    return responseHandler.internalServerError(res, error);
  }
};
