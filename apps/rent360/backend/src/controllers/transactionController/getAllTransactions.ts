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
    let depositInflow = 0;
    let depositOutflow = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === "CREDIT";
      const modeName = tx.paymentMode?.name?.toLowerCase() || "";
      const isCash = modeName.includes("cash");
      const catName = (tx.transactionCategory?.name || "").toLowerCase();
      const isDeposit = catName.includes("security") || catName.includes("deposit");

      if (isCredit) {
        totalCredit += amount;
        if (isCash) cashCredit += amount;
        else bankCredit += amount;
        if (isDeposit) depositInflow += amount;
      } else {
        totalDebit += amount;
        if (isCash) cashDebit += amount;
        else bankDebit += amount;
        if (isDeposit) depositOutflow += amount;
      }
    }

    // Opening Balance calculation for prior periods
    let openingCredit = 0;
    let openingDebit = 0;
    let openingCashCredit = 0;
    let openingCashDebit = 0;
    let openingBankCredit = 0;
    let openingBankDebit = 0;

    if (startDate && typeof startDate === "string") {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const priorWhere: any = { createdAt: { lt: start } };
      if (storeId) priorWhere.storeId = storeId;
      if (type && typeof type === "string" && type.toUpperCase() !== "ALL") {
        priorWhere.transaction_type = type.toUpperCase();
      }
      if (categoryId && typeof categoryId === "string" && categoryId !== "ALL") {
        priorWhere.categoryId = categoryId;
      }
      if (paymentModeId && typeof paymentModeId === "string" && paymentModeId !== "ALL") {
        priorWhere.paymentModeId = paymentModeId;
      }
      if (bankAccountId && typeof bankAccountId === "string" && bankAccountId !== "ALL") {
        priorWhere.bankAccountId = bankAccountId;
      }

      const priorTxs = await prisma.transaction.findMany({
        where: priorWhere,
        include: { paymentMode: true },
      });

      for (const p of priorTxs) {
        const amt = Number(p.amount) || 0;
        const isCred = p.transaction_type === "CREDIT";
        const isCsh = (p.paymentMode?.name || "").toLowerCase().includes("cash");
        if (isCred) {
          openingCredit += amt;
          if (isCsh) openingCashCredit += amt;
          else openingBankCredit += amt;
        } else {
          openingDebit += amt;
          if (isCsh) openingCashDebit += amt;
          else openingBankDebit += amt;
        }
      }
    }

    const openingBalance = openingCredit - openingDebit;
    const openingCash = openingCashCredit - openingCashDebit;
    const openingBank = openingBankCredit - openingBankDebit;

    const closingBalance = openingBalance + (totalCredit - totalDebit);
    const closingCash = openingCash + (cashCredit - cashDebit);
    const closingBank = openingBank + (bankCredit - bankDebit);

    // All-time Active Security Deposit Held
    let allTimeDepositHeld = 0;
    try {
      const depositWhere: any = {
        transactionCategory: {
          OR: [
            { name: { contains: "security", mode: "insensitive" } },
            { name: { contains: "deposit", mode: "insensitive" } },
          ],
        },
      };
      if (storeId) depositWhere.storeId = storeId;

      const allDepositTxs = await prisma.transaction.findMany({
        where: depositWhere,
        select: { amount: true, transaction_type: true },
      });

      let allCred = 0;
      let allDeb = 0;
      for (const d of allDepositTxs) {
        if (d.transaction_type === "CREDIT") allCred += Number(d.amount) || 0;
        else allDeb += Number(d.amount) || 0;
      }
      allTimeDepositHeld = Math.max(0, allCred - allDeb);
    } catch (e) {
      // fallback
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
      openingBalance,
      openingCash,
      openingBank,
      closingBalance,
      closingCash,
      closingBank,
      depositInflow,
      depositOutflow,
      allTimeDepositHeld,
      count: transactions.length,
    };

    const mappedTransactions = transactions.map((t) => ({
      ...t,
      category: t.transactionCategory,
    }));

    return responseHandler.success(res, "Transactions fetched successfully", {
      transactions: mappedTransactions,
      summary,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return responseHandler.internalServerError(res, error);
  }
};
