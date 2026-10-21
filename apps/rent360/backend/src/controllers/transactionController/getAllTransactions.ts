import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { 
      type, 
      categoryId, 
      paymentModeId, 
      bankAccountId, 
      startDate, 
      endDate, 
      search 
    } = req.query;

    let storeId = req.query.storeId as string;
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (type && typeof type === "string" && type.toUpperCase() !== "ALL") {
      whereClause.transaction_type = type.toUpperCase();
    }

    if (categoryId && typeof categoryId === "string" && categoryId !== "ALL") {
      whereClause.categoryId = categoryId;
    }

    if (paymentModeId && typeof paymentModeId === "string" && paymentModeId !== "ALL") {
      whereClause.paymentModeId = paymentModeId;
    }

    if (bankAccountId && typeof bankAccountId === "string" && bankAccountId !== "ALL") {
      whereClause.bankAccountId = bankAccountId;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && typeof startDate === "string") {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.createdAt.gte = start;
      }
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Search query in reference_no or remarks
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { reference_no: { contains: q, mode: "insensitive" } },
        { remarks: { contains: q, mode: "insensitive" } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        paymentMode: true,
        transactionCategory: true,
        bankAccount: true,
        performedBy: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        booking: {
          select: {
            id: true,
            booking_no: true,
            customer: {
              select: {
                id: true,
                full_name: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate aggregated metrics
    let totalCredit = 0;
    let totalDebit = 0;
    let cashCredit = 0;
    let cashDebit = 0;
    let bankCredit = 0;
    let bankDebit = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === "CREDIT";
      const modeName = tx.paymentMode?.name?.toLowerCase() || "";
      const isCash = modeName.includes("cash");

      if (isCredit) {
        totalCredit += amount;
        if (isCash) cashCredit += amount;
        else bankCredit += amount;
      } else {
        totalDebit += amount;
        if (isCash) cashDebit += amount;
        else bankDebit += amount;
      }
    }

    const summary = {
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit,
      cashBalance: cashCredit - cashDebit,
      cashInDrawer: cashCredit - cashDebit,
      bankBalance: bankCredit - bankDebit,
      cashCredit,
      cashDebit,
      bankCredit,
      bankDebit,
      count: transactions.length,
    };

    return responseHandler.success(res, "Transactions fetched successfully", {
      transactions,
      summary,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return responseHandler.internalServerError(res, error);
  }
};
