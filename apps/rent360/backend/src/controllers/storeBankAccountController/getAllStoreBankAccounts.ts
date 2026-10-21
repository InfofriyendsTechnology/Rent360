import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllStoreBankAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;
    const { search } = req.query;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.OR = [
        { account_name: { contains: search.trim(), mode: "insensitive" } },
        { account_number: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    let accounts = await prisma.storeBankAccount.findMany({
      where: whereClause,
      orderBy: { account_name: "asc" },
    });

    // Auto-seed default Cash Drawer if empty for this store
    if (accounts.length === 0 && storeId && !search) {
      await prisma.storeBankAccount.create({
        data: {
          storeId,
          account_name: "Cash Drawer",
          account_number: "MAIN-DRAWER",
          ifsc_code: "",
        },
      });

      accounts = await prisma.storeBankAccount.findMany({
        where: whereClause,
        orderBy: { account_name: "asc" },
      });
    }

    return responseHandler.success(res, "Store bank accounts fetched successfully", accounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return responseHandler.internalServerError(res, error);
  }
};
