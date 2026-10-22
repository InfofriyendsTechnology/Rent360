import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllAccessorys = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const where: any = {};
    if (storeId) {
      where.storeId = storeId;
    }

    const { type, search } = req.query;
    if (type && typeof type === "string" && type !== "ALL") {
      where.item_type = { equals: type.trim(), mode: "insensitive" };
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      where.item_name = { contains: search.trim(), mode: "insensitive" };
    }

    const data = await prisma.accessory.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return responseHandler.success(res, "Fetched accessories successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
