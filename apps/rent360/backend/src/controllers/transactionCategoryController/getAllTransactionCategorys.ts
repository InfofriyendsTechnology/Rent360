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
    const { category_type, search } = req.query;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    // Auto-sanitize existing CASH ACC and BANK ACC records to ASSET category_type
    await prisma.transactionCategory.updateMany({
      where: {
        name: { in: ["CASH ACC", "BANK ACC"] },
        category_type: "BOTH",
      },
      data: {
        category_type: "ASSET",
      },
    }).catch(() => {});

    if (category_type && typeof category_type === "string") {
      const typeUpper = category_type.toUpperCase();
      if (typeUpper === "BOTH") {
        whereClause.category_type = "BOTH";
      } else {
        whereClause.OR = [
          { category_type: typeUpper },
          { category_type: "BOTH" },
        ];
      }
      // Strictly exclude Cash & Bank asset accounts from Income and Expense category queries
      if (typeUpper === "INCOME" || typeUpper === "EXPENSE") {
        whereClause.NOT = [
          { account_group: { in: ["Cash Accounts", "Bank Accounts", "Cash Drawer"] } },
          { name: { in: ["CASH ACC", "BANK ACC"] } },
        ];
      }
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.name = { contains: search.trim(), mode: "insensitive" };
    }

    let categories = await prisma.transactionCategory.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    // Auto-seed defaults if empty for this store
    if (categories.length === 0 && storeId && !category_type && !search) {
      const defaultCategories = [
        { name: "WASHING ACC", account_group: "Washing", category_type: "EXPENSE", opening_balance: 0 },
        { name: "CREDIT NOTE ACC", account_group: "Credit Note", category_type: "EXPENSE", opening_balance: 0 },
        { name: "CASH ACC", account_group: "Cash Accounts", category_type: "ASSET", opening_balance: 0 },
        { name: "BANK ACC", account_group: "Bank Accounts", category_type: "ASSET", opening_balance: 0 },
        { name: "GENERAL EXPENSE", account_group: "Expenses", category_type: "EXPENSE", opening_balance: 0 },
        { name: "BOOKING CHARGE INCOME", account_group: "Income", category_type: "INCOME", opening_balance: 0 },
        { name: "SECURITY INCOME", account_group: "Income", category_type: "INCOME", opening_balance: 0 },
        { name: "GENERAL INCOME", account_group: "Income", category_type: "INCOME", opening_balance: 0 },
        { name: "PURCHASE ACC", account_group: "Purchase", category_type: "EXPENSE", opening_balance: 0 },
        { name: "RENT ACC", account_group: "Rent", category_type: "BOTH", opening_balance: 0 },
        { name: "SALE ACC", account_group: "Sales", category_type: "INCOME", opening_balance: 0 },
        { name: "CUSTOMER SALE", account_group: "Parties", category_type: "INCOME", opening_balance: 0 },
        { name: "CUSTOMER RENT", account_group: "Parties", category_type: "INCOME", opening_balance: 0 },
      ];

      await prisma.transactionCategory.createMany({
        data: defaultCategories.map((c) => ({
          name: c.name,
          account_group: c.account_group || "Expenses",
          category_type: c.category_type,
          opening_balance: c.opening_balance,
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
