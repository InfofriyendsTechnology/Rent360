import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllTransactionCategorys = async (
  req: Request,
  res: Response,
) => {
  try {
    const { storeId, search } = req.query;
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (search && typeof search === "string" && search.trim() !== "") {
      where.name = { contains: search.trim(), mode: "insensitive" };
    }

    const data = await (prisma as any).transactionCategory.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
