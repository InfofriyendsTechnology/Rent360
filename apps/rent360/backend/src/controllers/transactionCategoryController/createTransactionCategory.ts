import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createTransactionCategory = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    let storeId = req.body.storeId;

    if (!storeId && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst();
      storeId = defaultStore?.id;
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "storeId is required");
    }

    const name = (req.body.name || "").trim();
    if (!name) {
      return responseHandler.badRequest(res, "Account name is required");
    }

    const { contact_no, account_group, opening_balance, opening_date, address, remark } = req.body;
    let category_type = (req.body.category_type || "").toUpperCase();
    if (!category_type) {
      category_type = (account_group === "Income" || account_group === "INCOME") ? "INCOME" : "EXPENSE";
    }

    const data = await prisma.transactionCategory.create({
      data: {
        name,
        category_type,
        contact_no: contact_no ? contact_no.trim() : null,
        account_group: account_group ? account_group.trim() : "Expenses",
        opening_balance: opening_balance !== undefined && opening_balance !== null ? Number(opening_balance) : 0,
        opening_date: opening_date ? new Date(opening_date) : null,
        address: address ? address.trim() : null,
        remark: remark ? remark.trim() : null,
        storeId,
      },
    });

    return responseHandler.created(res, "Account created successfully", data);
  } catch (error) {
    console.error("Error creating transaction category:", error);
    return responseHandler.internalServerError(res, error);
  }
};
