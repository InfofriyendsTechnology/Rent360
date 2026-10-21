import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllTransactionCategorys = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;
    const { category_type } = req.query;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }
    if (category_type && typeof category_type === "string") {
      whereClause.category_type = category_type.toUpperCase();
    }

    let categories = await prisma.transactionCategory.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    // Auto-seed defaults if empty for this store
    if (categories.length === 0 && storeId && !category_type) {
      const defaultCategories = [
        // Income
        { name: "Rental Income", category_type: "INCOME" },
        { name: "Security Deposit Received", category_type: "INCOME" },
        { name: "Late Return Fine", category_type: "INCOME" },
        { name: "Damage / Repair Charge", category_type: "INCOME" },
        { name: "Retail Sale", category_type: "INCOME" },
        { name: "Other Income", category_type: "INCOME" },
        // Expense
        { name: "Security Deposit Refund", category_type: "EXPENSE" },
        { name: "Tea & Refreshments", category_type: "EXPENSE" },
        { name: "Shop Rent", category_type: "EXPENSE" },
        { name: "Electricity / Utility", category_type: "EXPENSE" },
        { name: "Laundry & Dry Cleaning", category_type: "EXPENSE" },
        { name: "Tailoring & Alteration", category_type: "EXPENSE" },
        { name: "Staff Salary / Advance", category_type: "EXPENSE" },
        { name: "Repairs & Maintenance", category_type: "EXPENSE" },
        { name: "Packing & Stationary", category_type: "EXPENSE" },
        { name: "General Expense", category_type: "EXPENSE" },
      ];

      await prisma.transactionCategory.createMany({
        data: defaultCategories.map((c) => ({
          name: c.name,
          category_type: c.category_type,
          storeId,
        })),
        skipDuplicates: true,
      });

      categories = await prisma.transactionCategory.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
      });
    }

    return responseHandler.success(res, "Transaction categories fetched successfully", categories);
  } catch (error) {
    console.error("Error fetching transaction categories:", error);
    return responseHandler.internalServerError(res, error);
  }
};
