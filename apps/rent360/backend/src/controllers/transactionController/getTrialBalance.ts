import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getTrialBalance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;
    const { startDate, endDate, financialYear, search } = req.query;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst();
      storeId = defaultStore?.id || "";
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "storeId is required");
    }

    // 1. Date Bounds Resolution
    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (startDate && typeof startDate === "string" && startDate.trim() !== "") {
      startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
    }

    if (endDate && typeof endDate === "string" && endDate.trim() !== "") {
      endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
    } else if (financialYear && typeof financialYear === "string") {
      const parts = financialYear.split("-");
      if (parts.length === 2) {
        startDateTime = new Date(`${parts[0]}-04-01T00:00:00.000Z`);
        endDateTime = new Date(`${parts[1]}-03-31T23:59:59.999Z`);
      }
    }

    // 2. Fetch Masters
    // A. Payment Modes
    const paymentModes = await prisma.paymentMode.findMany({
      where: { storeId },
    });
    const cashModeIds = new Set(
      paymentModes
        .filter((m) => (m.name || "").toLowerCase().includes("cash"))
        .map((m) => m.id)
    );

    // B. Bank Accounts
    const storeBankAccounts = await prisma.storeBankAccount.findMany({
      where: {
        storeId,
        NOT: {
          account_name: { in: ["Cash Drawer", "cash drawer", "Cash", "cash"] },
        },
      },
      orderBy: { account_name: "asc" },
    });

    // C. All Categories for this store (exact same as Account Ledger)
    const categories = await prisma.transactionCategory.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        account_group: true,
        category_type: true,
        opening_balance: true,
        opening_date: true,
      },
    });

    const allLedgerAccounts: any[] = [...categories];

    for (const ba of storeBankAccounts) {
      if (!allLedgerAccounts.some((a) => a.name.toLowerCase() === ba.account_name.toLowerCase())) {
        allLedgerAccounts.push({
          id: `bank_${ba.id}`,
          storeBankAccountId: ba.id,
          name: `${ba.account_name}${ba.account_number ? ` (${ba.account_number})` : ""}`,
          account_group: "Bank Accounts",
          category_type: "BOTH",
          opening_balance: 0,
          opening_date: null,
          isBankAccount: true,
        });
      }
    }

    // 3. Construct Accounts Map matching Account Ledger
    const accountsMap: Record<string, any> = {};

    let cashAccId = "";
    let defaultBankAccId = "";

    allLedgerAccounts.forEach((acc) => {
      const nameUpper = (acc.name || "").toUpperCase();
      const grp = (acc.account_group || "").toLowerCase();
      const catType = (acc.category_type || "").toUpperCase();

      const isCash =
        grp.includes("cash") ||
        nameUpper === "CASH ACC" ||
        nameUpper.includes("CASH DRAWER");

      const isBank =
        grp.includes("bank") ||
        nameUpper === "BANK ACC" ||
        Boolean(acc.isBankAccount);

      if (isCash && !cashAccId) {
        cashAccId = acc.id;
      }
      if (isBank && !defaultBankAccId && !acc.isBankAccount) {
        defaultBankAccId = acc.id;
      }

      let groupType = "EXPENSES";
      let naturalBalance: "Dr" | "Cr" = "Dr";
      let accountGroup = acc.account_group || "Expenses";

      if (isCash) {
        groupType = "ASSETS";
        naturalBalance = "Dr";
        accountGroup = "Cash Accounts";
      } else if (isBank) {
        groupType = "ASSETS";
        naturalBalance = "Dr";
        accountGroup = "Bank Accounts";
      } else if (
        nameUpper.includes("SECURITY") ||
        grp.includes("deposit") ||
        grp.includes("security")
      ) {
        groupType = "LIABILITIES";
        accountGroup = acc.account_group || "Income";
        naturalBalance = "Cr";
      } else if (
        catType === "INCOME" ||
        grp.includes("income") ||
        grp.includes("sale") ||
        grp.includes("rent") ||
        grp.includes("parties") ||
        nameUpper.includes("INCOME") ||
        nameUpper.includes("RENT") ||
        nameUpper.includes("SALE")
      ) {
        groupType = "INCOME";
        accountGroup = acc.account_group || "Income";
        naturalBalance = "Cr";
      } else {
        groupType = "EXPENSES";
        accountGroup = acc.account_group || "Expenses";
        naturalBalance = "Dr";
      }

      accountsMap[acc.id] = {
        id: acc.id,
        name: acc.name, // EXACT MATCH TO ACCOUNT LEDGER NAME
        accountGroup,
        groupType,
        naturalBalance,
        baseOpening: Number(acc.opening_balance || 0),
        priorDr: 0,
        priorCr: 0,
        periodDr: 0,
        periodCr: 0,
        isCash,
        isBank,
        storeBankAccountId: acc.storeBankAccountId,
      };
    });

    // 4. Fetch All Transactions for the Store up to endDateTime (or all time)
    const txWhere: any = { storeId };
    if (endDateTime) {
      txWhere.createdAt = { lte: endDateTime };
    }

    const transactions = await prisma.transaction.findMany({
      where: txWhere,
      select: {
        id: true,
        transaction_type: true,
        amount: true,
        createdAt: true,
        paymentModeId: true,
        bankAccountId: true,
        categoryId: true,
        bookingId: true,
        retailSaleId: true,
        purchaseId: true,
        paymentMode: { select: { id: true, name: true } },
        bankAccount: { select: { id: true, account_name: true } },
        transactionCategory: { select: { id: true, name: true, account_group: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // 5. Process Transactions
    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (amt <= 0) return;

      const txDate = new Date(tx.createdAt);
      const isPrior = startDateTime ? txDate < startDateTime : false;

      // --- SIDE 1: Asset Account (CASH ACC or BANK ACC) ---
      const isCash =
        (tx.paymentModeId && cashModeIds.has(tx.paymentModeId)) ||
        (tx.paymentMode?.name || "").toLowerCase().includes("cash") ||
        (tx.bankAccount?.account_name || "").toLowerCase().includes("drawer");

      let assetAccountKey = cashAccId;
      if (!isCash) {
        if (tx.bankAccountId && accountsMap[`bank_${tx.bankAccountId}`]) {
          assetAccountKey = `bank_${tx.bankAccountId}`;
        } else if (tx.bankAccountId && accountsMap[tx.bankAccountId]) {
          assetAccountKey = tx.bankAccountId;
        } else {
          assetAccountKey = defaultBankAccId || cashAccId;
        }
      }

      if (assetAccountKey && accountsMap[assetAccountKey]) {
        if (tx.transaction_type === "CREDIT") {
          if (isPrior) accountsMap[assetAccountKey].priorDr += amt;
          else accountsMap[assetAccountKey].periodDr += amt;
        } else {
          if (isPrior) accountsMap[assetAccountKey].priorCr += amt;
          else accountsMap[assetAccountKey].periodCr += amt;
        }
      }

      // --- SIDE 2: Nominal Account (Category) ---
      let nominalKey = tx.categoryId && accountsMap[tx.categoryId] ? tx.categoryId : "";
      if (!nominalKey) {
        if (tx.bookingId) {
          const match = allLedgerAccounts.find((a) => (a.name || "").toUpperCase() === "CUSTOMER RENT" || (a.name || "").toUpperCase() === "RENT ACC");
          if (match) nominalKey = match.id;
        } else if (tx.retailSaleId) {
          const match = allLedgerAccounts.find((a) => (a.name || "").toUpperCase() === "CUSTOMER SALE" || (a.name || "").toUpperCase() === "SALE ACC");
          if (match) nominalKey = match.id;
        } else if (tx.purchaseId) {
          const match = allLedgerAccounts.find((a) => (a.name || "").toUpperCase() === "PURCHASE ACC");
          if (match) nominalKey = match.id;
        }
        if (!nominalKey) {
          if (tx.transaction_type === "CREDIT") {
            const match = allLedgerAccounts.find((a) => (a.name || "").toUpperCase() === "GENERAL INCOME");
            if (match) nominalKey = match.id;
          } else {
            const match = allLedgerAccounts.find((a) => (a.name || "").toUpperCase() === "GENERAL EXPENSE");
            if (match) nominalKey = match.id;
          }
        }
      }

      if (nominalKey && accountsMap[nominalKey]) {
        if (tx.transaction_type === "CREDIT") {
          if (isPrior) accountsMap[nominalKey].priorCr += amt;
          else accountsMap[nominalKey].periodCr += amt;
        } else {
          if (isPrior) accountsMap[nominalKey].priorDr += amt;
          else accountsMap[nominalKey].periodDr += amt;
        }
      }
    });

    // 6. Compute Final Balances for Each Account
    const flatAccounts: any[] = [];
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    Object.values(accountsMap).forEach((acc) => {
      const hasActivity =
        acc.baseOpening !== 0 ||
        acc.priorDr !== 0 ||
        acc.priorCr !== 0 ||
        acc.periodDr !== 0 ||
        acc.periodCr !== 0;

      // Skip unused fallback accounts
      if (
        !hasActivity &&
        (acc.id === "fallback_income" ||
          acc.id === "fallback_expense" ||
          acc.id === "general_bank")
      ) {
        return;
      }

      // 6.1 Opening Balance
      let openingDebit = 0;
      let openingCredit = 0;

      if (acc.naturalBalance === "Dr") {
        const netOpening = acc.baseOpening + acc.priorDr - acc.priorCr;
        if (netOpening >= 0) {
          openingDebit = netOpening;
        } else {
          openingCredit = Math.abs(netOpening);
        }
      } else {
        const netOpening = acc.baseOpening + acc.priorCr - acc.priorDr;
        if (netOpening >= 0) {
          openingCredit = netOpening;
        } else {
          openingDebit = Math.abs(netOpening);
        }
      }

      // 6.2 Closing Balance calculation
      const totalDr = openingDebit + acc.periodDr;
      const totalCr = openingCredit + acc.periodCr;
      const netDiff = totalDr - totalCr;

      let closingDebit = 0;
      let closingCredit = 0;

      if (netDiff > 0) {
        closingDebit = Number(netDiff.toFixed(2));
      } else if (netDiff < 0) {
        closingCredit = Number(Math.abs(netDiff).toFixed(2));
      }

      grandTotalDebit += closingDebit;
      grandTotalCredit += closingCredit;

      // Net Opening
      const opDiff = openingDebit - openingCredit;
      const openingBalance = Number(Math.abs(opDiff).toFixed(2));
      const openingType = opDiff >= 0 ? "Dr" : "Cr";

      // Net Closing
      const clDiff = closingDebit - closingCredit;
      const closingBalance = Number(Math.abs(clDiff).toFixed(2));
      const closingType = clDiff >= 0 ? "Dr" : "Cr";

      const currDr = Number(acc.periodDr.toFixed(2));
      const currCr = Number(acc.periodCr.toFixed(2));

      flatAccounts.push({
        id: acc.id,
        name: acc.name,
        accountGroup: acc.accountGroup,
        groupType: acc.groupType,
        naturalBalance: acc.naturalBalance,
        openingDebit: Number(openingDebit.toFixed(2)),
        openingCredit: Number(openingCredit.toFixed(2)),
        openingBalance,
        openingType,
        periodDebit: currDr,
        periodCredit: currCr,
        currDr,
        currCr,
        closingDebit,
        closingCredit,
        closingBalance,
        closingType,
      });
    });

    // Sort accounts by Group Type (Assets -> Liabilities -> Incomes -> Expenses) then Name
    const groupSortOrder: Record<string, number> = {
      ASSETS: 1,
      LIABILITIES: 2,
      INCOME: 3,
      EXPENSES: 4,
    };

    flatAccounts.sort((a, b) => {
      const orderA = groupSortOrder[a.groupType] || 5;
      const orderB = groupSortOrder[b.groupType] || 5;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    // Filter by search query if provided
    let filteredAccounts = flatAccounts;
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filteredAccounts = flatAccounts.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.accountGroup.toLowerCase().includes(q)
      );
    }

    // Grouping for hierarchical view
    const groupMap: Record<string, any> = {};
    flatAccounts.forEach((acc) => {
      const gName = acc.accountGroup;
      if (!groupMap[gName]) {
        groupMap[gName] = {
          groupName: gName,
          groupType: acc.groupType,
          totalDebit: 0,
          totalCredit: 0,
          accounts: [],
        };
      }
      groupMap[gName].totalDebit += acc.closingDebit;
      groupMap[gName].totalCredit += acc.closingCredit;
      groupMap[gName].accounts.push(acc);
    });

    const groups = Object.values(groupMap).map((g: any) => ({
      ...g,
      totalDebit: Number(g.totalDebit.toFixed(2)),
      totalCredit: Number(g.totalCredit.toFixed(2)),
    }));

    const totalCurrDr = Number(flatAccounts.reduce((sum, a) => sum + (a.currDr || 0), 0).toFixed(2));
    const totalCurrCr = Number(flatAccounts.reduce((sum, a) => sum + (a.currCr || 0), 0).toFixed(2));
    const totalOpDr = flatAccounts.reduce((sum, a) => sum + (a.openingDebit || 0), 0);
    const totalOpCr = flatAccounts.reduce((sum, a) => sum + (a.openingCredit || 0), 0);
    const netOpDiff = totalOpDr - totalOpCr;
    const totalOpeningBalance = Number(Math.abs(netOpDiff).toFixed(2));
    const openingType = netOpDiff >= 0 ? "Dr" : "Cr";

    const netClDiff = grandTotalDebit - grandTotalCredit;
    const totalClosingBalance = Number(Math.abs(netClDiff).toFixed(2));
    const closingType = netClDiff >= 0 ? "Dr" : "Cr";

    const difference = Number(Math.abs(grandTotalDebit - grandTotalCredit).toFixed(2));
    const isBalanced = difference < 0.01;

    return responseHandler.success(res, "Trial Balance generated successfully", {
      period: {
        startDate: startDate || (startDateTime ? startDateTime.toISOString().split("T")[0] : null),
        endDate: endDate || (endDateTime ? endDateTime.toISOString().split("T")[0] : null),
        label: startDateTime && endDateTime
          ? `${startDateTime.toLocaleDateString("en-IN")} to ${endDateTime.toLocaleDateString("en-IN")}`
          : "All Time Cumulative",
      },
      summary: {
        totalDebit: Number(grandTotalDebit.toFixed(2)),
        totalCredit: Number(grandTotalCredit.toFixed(2)),
        currDr: totalCurrDr,
        currCr: totalCurrCr,
        openingBalance: totalOpeningBalance,
        openingType,
        closingBalance: totalClosingBalance,
        closingType,
        difference,
        isBalanced,
        totalAccounts: flatAccounts.length,
      },
      groups,
      accounts: filteredAccounts,
    });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return responseHandler.internalServerError(res, error);
  }
};
