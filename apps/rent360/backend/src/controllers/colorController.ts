import { Response } from "express";
import prisma from "../utils/prisma";
import responseHandler from "../utils/responseHandler";
import { AuthRequest } from "../middleware/auth";

const DEFAULT_COLORS = [
  { name: "Red", hex_code: "#EF4444" },
  { name: "Navy Blue", hex_code: "#1E3A8A" },
  { name: "Royal Blue", hex_code: "#2563EB" },
  { name: "Emerald Green", hex_code: "#059669" },
  { name: "Bottle Green", hex_code: "#14532D" },
  { name: "Maroon", hex_code: "#831843" },
  { name: "Wine", hex_code: "#701A75" },
  { name: "Gold", hex_code: "#D97706" },
  { name: "Yellow", hex_code: "#EAB308" },
  { name: "Peach", hex_code: "#FDBA74" },
  { name: "Pink", hex_code: "#EC4899" },
  { name: "Black", hex_code: "#111827" },
  { name: "White", hex_code: "#FFFFFF" },
  { name: "Silver / Grey", hex_code: "#9CA3AF" },
];

export const getAllColors = async (req: AuthRequest, res: Response) => {
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
      // Auto-seed defaults if store has no colors
      const count = await prisma.storeColor.count({ where: { storeId } });
      if (count === 0) {
        await prisma.storeColor.createMany({
          data: DEFAULT_COLORS.map((c) => ({
            storeId,
            name: c.name,
            hex_code: c.hex_code,
          })),
        });
      }
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.name = { contains: search.trim(), mode: "insensitive" };
    }

    const colors = await prisma.storeColor.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    return responseHandler.success(res, "Colors fetched successfully", colors);
  } catch (error) {
    console.error("Error fetching colors:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const createColor = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { name, hex_code } = req.body;
    let storeId = req.body.storeId || user?.storeId;

    if (user?.role !== "SUPER_ADMIN") {
      storeId = user?.storeId;
    }

    if (!name || !name.trim()) {
      return responseHandler.badRequest(res, "Color name is required");
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required");
    }

    const color = await prisma.storeColor.create({
      data: {
        storeId,
        name: name.trim(),
        hex_code: hex_code?.trim() || null,
      },
    });

    return responseHandler.created(res, "Color created successfully", color);
  } catch (error) {
    console.error("Error creating color:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const getColorById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const color = await prisma.storeColor.findUnique({
      where: { id },
    });

    if (!color) {
      return responseHandler.notFound(res, "Color not found");
    }

    return responseHandler.success(res, "Color fetched successfully", color);
  } catch (error) {
    console.error("Error fetching color:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const updateColor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, hex_code } = req.body;

    const existing = await prisma.storeColor.findUnique({ where: { id } });
    if (!existing) {
      return responseHandler.notFound(res, "Color not found");
    }

    const updated = await prisma.storeColor.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(hex_code !== undefined ? { hex_code: hex_code?.trim() || null } : {}),
      },
    });

    return responseHandler.success(res, "Color updated successfully", updated);
  } catch (error) {
    console.error("Error updating color:", error);
    return responseHandler.internalServerError(res, error);
  }
};

export const deleteColor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.storeColor.findUnique({ where: { id } });
    if (!existing) {
      return responseHandler.notFound(res, "Color not found");
    }

    await prisma.storeColor.delete({ where: { id } });

    return responseHandler.success(res, "Color deleted successfully", null);
  } catch (error) {
    console.error("Error deleting color:", error);
    return responseHandler.internalServerError(res, error);
  }
};
