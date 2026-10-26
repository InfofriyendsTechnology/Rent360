import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAccountLedger = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = (req.query.storeId as string) || user?.storeId;
    const { accountId, startDate, endDate, search } = req.query;

    if (!storeId && user?.role === "SUPER_ADMIN") {
      const firstStore = await prisma.store.findFirst({ select: { id: true } });
      storeId = firstStore?.id || "";
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "storeId is required");
    }

    // 1. Fetch all categories for this store
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

    // Also fetch non-drawer Store Bank Accounts if created
    const storeBankAccounts = await prisma.storeBankAccount.findMany({
      where: {
        storeId,
        NOT: {
          account_name: { in: ["Cash Drawer", "cash drawer", "Cash", "cash"] },
        },
      },
      orderBy: { account_name: "asc" },
    });

    const accounts: any[] = [...categories];

    for (const ba of storeBankAccounts) {
      if (!accounts.some((a) => a.name.toLowerCase() === ba.account_name.toLowerCase())) {
        accounts.push({
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

    if (accounts.length === 0) {
      return responseHandler.success(res, "No accounts found for store", {
        accounts: [],
        selectedAccount: null,
        period: { from: "Beginning", to: "Today" },
        openingBalance: 0,
        openingBalanceType: "Cr",
        closingBalance: 0,
        closingBalanceType: "Cr",
        drTotal: 0,
        crTotal: 0,
        drEntries: [],
        crEntries: [],
      });
    }

    // 2. Determine selected account
    let selectedAccount = null;
    if (accountId && typeof accountId === "string" && accountId !== "ALL" && accountId.trim() !== "") {
      selectedAccount = accounts.find((a) => a.id === accountId) || null;
    }

    // If no account is selected, return accounts list with empty ledger
    if (!selectedAccount) {
      return responseHandler.success(res, "Account ledger loaded successfully", {
        accounts,
        selectedAccount: null,
        period: {
          from: "Beginning",
          to: "Today",
        },
        openingBalance: 0,
        openingBalanceType: "Cr",
        closingBalance: 0,
        closingBalanceType: "Cr",
        drTotal: 0,
        crTotal: 0,
        drEntries: [],
        crEntries: [],
      });
    }

    // 3. Classify account type
    const accNameUpper = (selectedAccount.name || "").toUpperCase();
    const grp = (selectedAccount.account_group || "").toLowerCase();

    const isCashAccount =
      grp.includes("cash") ||
      accNameUpper === "CASH ACC" ||
      accNameUpper.includes("CASH DRAWER");

    const isBankAccount =
      grp.includes("bank") ||
      accNameUpper === "BANK ACC" ||
      Boolean(selectedAccount.isBankAccount);

    // Fetch payment modes to differentiate Cash vs Bank transactions
    const paymentModes = await prisma.paymentMode.findMany({ where: { storeId } });
    const cashModeIds = paymentModes
      .filter((m) => m.name.toLowerCase().includes("cash"))
      .map((m) => m.id);
    const bankModeIds = paymentModes
      .filter((m) => !m.name.toLowerCase().includes("cash"))
      .map((m) => m.id);

    // 4. Construct Account Where Condition
    let whereAccountCondition: any;

    if (isCashAccount) {
      whereAccountCondition = {
        OR: [
          { categoryId: selectedAccount.id },
          { paymentModeId: { in: cashModeIds } },
          {
            AND: [
              { paymentModeId: { notIn: bankModeIds } },
              { bankAccount: { account_name: { contains: "drawer", mode: "insensitive" } } },
            ],
          },
        ],
      };
    } else if (isBankAccount) {
      if (selectedAccount.storeBankAccountId) {
        whereAccountCondition = {
          OR: [
            { bankAccountId: selectedAccount.storeBankAccountId },
            { categoryId: selectedAccount.id },
          ],
        };
      } else {
        whereAccountCondition = {
          OR: [
            { categoryId: selectedAccount.id },
            { paymentModeId: { in: bankModeIds } },
          ],
        };
      }
    } else {
      // Nominal / Category account (e.g. RENT ACC, GENERAL EXPENSE, etc.)
      whereAccountCondition = {
        categoryId: selectedAccount.id,
      };
    }

    // 5. Date bounds
    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (startDate && typeof startDate === "string") {
      startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
    }
    if (endDate && typeof endDate === "string") {
      endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
    }

    // 6. Calculate Opening Balance prior to startDateTime
    const baseOpeningBalance = Number(selectedAccount.opening_balance || 0);
    const isAssetAccount = isCashAccount || isBankAccount;
    const isNaturalDebit =
      isAssetAccount ||
      grp.includes("expense") ||
      grp.includes("washing") ||
      grp.includes("purchase");

    let priorDr = 0;
    let priorCr = 0;

    if (startDateTime) {
      const priorTxs = await prisma.transaction.findMany({
        where: {
          storeId,
          ...whereAccountCondition,
          createdAt: { lt: startDateTime },
        },
        select: {
          transaction_type: true,
          amount: true,
        },
      });

      for (const t of priorTxs) {
        if (isCashAccount || isBankAccount) {
          // Real/Asset Account: Inflows (CREDIT tx) is Dr, Outflows (DEBIT tx) is Cr
          if (t.transaction_type === "CREDIT") priorDr += t.amount;
          else if (t.transaction_type === "DEBIT") priorCr += t.amount;
        } else {
          // Nominal Account: Expense is Dr, Income is Cr
          if (t.transaction_type === "DEBIT") priorDr += t.amount;
          else if (t.transaction_type === "CREDIT") priorCr += t.amount;
        }
      }
    }

    let netOpening = 0;
    let openingBalanceType: "Cr" | "Dr" = "Cr";

    if (isNaturalDebit) {
      netOpening = baseOpeningBalance + priorDr - priorCr;
      openingBalanceType = netOpening >= 0 ? "Dr" : "Cr";
    } else {
      netOpening = baseOpeningBalance + priorCr - priorDr;
      openingBalanceType = netOpening >= 0 ? "Cr" : "Dr";
    }
    const openingBalance = Math.abs(netOpening);

    // 7. Fetch in-period transactions
    const wherePeriod: any = {
      storeId,
      ...whereAccountCondition,
    };

    if (startDateTime || endDateTime) {
      wherePeriod.createdAt = {};
      if (startDateTime) wherePeriod.createdAt.gte = startDateTime;
      if (endDateTime) wherePeriod.createdAt.lte = endDateTime;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      wherePeriod.AND = [
        ...(wherePeriod.AND || []),
        {
          OR: [
            { reference_no: { contains: q, mode: "insensitive" } },
            { remarks: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: wherePeriod,
      include: {
        paymentMode: true,
        bankAccount: true,
        transactionCategory: true,
        performedBy: {
          select: { id: true, name: true },
        },
        booking: {
          select: {
            id: true,
            booking_no: true,
            customer: {
              select: { id: true, full_name: true, mobile: true },
            },
          },
        },
        retailSale: {
          select: {
            id: true,
            bill_no: true,
            customer: {
              select: { id: true, full_name: true, mobile: true },
            },
          },
        },
        purchaseInvoice: {
          select: {
            id: true,
            invoice_no: true,
            vendor: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 8. Split into Dr and Cr entries
    const drEntries: any[] = [];
    const crEntries: any[] = [];

    const formatDateStr = (d: Date) => {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    for (const tx of transactions) {
      const dateFormatted = formatDateStr(new Date(tx.createdAt));
      const refNo =
        tx.reference_no ||
        tx.booking?.booking_no ||
        tx.retailSale?.bill_no ||
        tx.purchaseInvoice?.invoice_no ||
        "-";

      let accName = "";
      let details = tx.remarks || "";
      let isDebitEntry = false;

      if (isCashAccount) {
        // CASH ACCOUNT LEDGER
        // CREDIT tx = Cash Inflow -> Dr side
        // DEBIT tx = Cash Outflow -> Cr side
        if (tx.transaction_type === "CREDIT") {
          isDebitEntry = true;
          if (tx.transactionCategory?.name && tx.transactionCategory.name !== selectedAccount.name) {
            accName = tx.transactionCategory.name;
          } else if (tx.booking?.customer?.full_name) {
            accName = tx.booking.customer.full_name;
          } else if (tx.retailSale?.customer?.full_name) {
            accName = tx.retailSale.customer.full_name;
          } else {
            accName = "GENERAL INCOME";
          }
          if (!details) details = "Cash Receipt / Income";
        } else {
          isDebitEntry = false;
          if (tx.transactionCategory?.name && tx.transactionCategory.name !== selectedAccount.name) {
            accName = tx.transactionCategory.name;
          } else if (tx.purchaseInvoice?.vendor?.name) {
            accName = tx.purchaseInvoice.vendor.name;
          } else {
            accName = "GENERAL EXPENSE";
          }
          if (!details) details = "Cash Payment / Expense";
        }
      } else if (isBankAccount) {
        // BANK ACCOUNT LEDGER
        // CREDIT tx = Bank Inflow -> Dr side
        // DEBIT tx = Bank Outflow -> Cr side
        if (tx.transaction_type === "CREDIT") {
          isDebitEntry = true;
          if (tx.transactionCategory?.name && tx.transactionCategory.name !== selectedAccount.name) {
            accName = tx.transactionCategory.name;
          } else if (tx.booking?.customer?.full_name) {
            accName = tx.booking.customer.full_name;
          } else if (tx.retailSale?.customer?.full_name) {
            accName = tx.retailSale.customer.full_name;
          } else {
            accName = "GENERAL INCOME";
          }
          if (!details) {
            details = tx.paymentMode?.name ? `${tx.paymentMode.name} Receipt` : "Bank Receipt";
          }
        } else {
          isDebitEntry = false;
          if (tx.transactionCategory?.name && tx.transactionCategory.name !== selectedAccount.name) {
            accName = tx.transactionCategory.name;
          } else if (tx.purchaseInvoice?.vendor?.name) {
            accName = tx.purchaseInvoice.vendor.name;
          } else {
            accName = "GENERAL EXPENSE";
          }
          if (!details) {
            details = tx.paymentMode?.name ? `${tx.paymentMode.name} Payment` : "Bank Payment";
          }
        }
      } else {
        // NOMINAL / CATEGORY LEDGER (e.g. RENT ACC, GENERAL EXPENSE, etc.)
        // DEBIT tx = Expense / Debit -> Dr side
        // CREDIT tx = Income / Credit -> Cr side
        isDebitEntry = tx.transaction_type === "DEBIT";

        // Determine Counter Account Name (Acc. Name column)
        accName = "CASH ACC";
        if (tx.booking?.customer?.full_name) {
          accName = tx.booking.customer.full_name;
        } else if (tx.retailSale?.customer?.full_name) {
          accName = tx.retailSale.customer.full_name;
        } else if (tx.purchaseInvoice?.vendor?.name) {
          accName = tx.purchaseInvoice.vendor.name;
        } else {
          const pModeName = (tx.paymentMode?.name || "").toLowerCase();
          const bName = tx.bankAccount?.account_name || "";
          const isDrawer = bName.toLowerCase().includes("drawer") || bName.toLowerCase().includes("cash");

          if (pModeName) {
            if (pModeName.includes("cash")) {
              accName = "CASH ACC";
            } else {
              if (bName && !isDrawer) {
                accName = bName;
              } else {
                accName = "BANK ACC";
              }
            }
          } else if (bName) {
            if (isDrawer) {
              accName = "CASH ACC";
            } else {
              accName = bName;
            }
          } else {
            accName = tx.transaction_type === "CREDIT" ? "CASH ACC" : "BANK ACC";
          }
        }

        if (!details) {
          if (tx.booking?.booking_no) {
            details = `${tx.booking.booking_no} - BOOKING`;
          } else if (tx.retailSale?.bill_no) {
            details = `${tx.retailSale.bill_no} - SALE`;
          } else if (tx.purchaseInvoice?.invoice_no) {
            details = `${tx.purchaseInvoice.invoice_no} - PURCHASE`;
          } else {
            details = tx.transaction_type === "CREDIT" ? "COLLECTION / INCOME" : "PAYMENT / EXPENSE";
          }
        }
      }

      const item = {
        id: tx.id,
        date: dateFormatted,
        rawDate: tx.createdAt,
        refNo,
        accName,
        details,
        amount: tx.amount,
        paymentMode: tx.paymentMode?.name,
        bankAccount: tx.bankAccount?.account_name,
      };

      if (isDebitEntry) {
        drEntries.push(item);
      } else {
        crEntries.push(item);
      }
    }

    // 9. Calculate Totals & Closing Balance
    const drTotal = drEntries.reduce((sum, e) => sum + e.amount, 0);
    const crTotal = crEntries.reduce((sum, e) => sum + e.amount, 0);

    let closingBalance = 0;
    let closingBalanceType: "Cr" | "Dr" = "Cr";

    if (isNaturalDebit) {
      // Natural Debit account (Asset like Cash/Bank, or Expense): Dr increases, Cr decreases
      const signedOp = openingBalanceType === "Dr" ? openingBalance : -openingBalance;
      const netClose = signedOp + drTotal - crTotal;
      closingBalanceType = netClose >= 0 ? "Dr" : "Cr";
      closingBalance = Math.abs(netClose);
    } else {
      // Natural Credit account (Income, Rent, Sales): Cr increases, Dr decreases
      const signedOp = openingBalanceType === "Cr" ? openingBalance : -openingBalance;
      const netClose = signedOp + crTotal - drTotal;
      closingBalanceType = netClose >= 0 ? "Cr" : "Dr";
      closingBalance = Math.abs(netClose);
    }

    return responseHandler.success(res, "Account ledger loaded successfully", {
      accounts,
      selectedAccount,
      period: {
        from: startDateTime ? formatDateStr(startDateTime) : "Beginning",
        to: endDateTime ? formatDateStr(endDateTime) : formatDateStr(new Date()),
      },
      openingBalance,
      openingBalanceType,
      closingBalance,
      closingBalanceType,
      drTotal,
      crTotal,
      drEntries,
      crEntries,
    });
  } catch (error) {
    console.error("Error loading account ledger:", error);
    return responseHandler.internalServerError(res, error);
  }
};
