import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllStoreBankAccounts = async (req: Request, res: Response) => {
  try {
    const { storeId, search } = req.query;
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (search && typeof search === "string" && search.trim() !== "") {
      where.OR = [
        { account_name: { contains: search.trim(), mode: "insensitive" } },
        { account_number: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const data = await (prisma as any).storeBankAccount.findMany({
      where,
      orderBy: { account_name: "asc" },
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
