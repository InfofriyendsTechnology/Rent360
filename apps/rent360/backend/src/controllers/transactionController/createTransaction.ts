import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.body.storeId;

    if (user?.role !== "SUPER_ADMIN" || !storeId) {
      if (user?.storeId) {
        storeId = user.storeId;
      }
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required");
    }

    const {
      transaction_type,
      amount,
      paymentModeId,
      categoryId,
      bankAccountId,
      bookingId,
      retailSaleId,
      purchaseId,
      reference_no,
      remarks,
      createdAt,
    } = req.body;

    if (!paymentModeId) {
      return responseHandler.badRequest(res, "Payment mode is required");
    }

    if (!transaction_type || !["CREDIT", "DEBIT"].includes(transaction_type.toUpperCase())) {
      return responseHandler.badRequest(res, "Transaction type must be CREDIT or DEBIT");
    }

    if (!amount || Number(amount) <= 0) {
      return responseHandler.badRequest(res, "Amount must be greater than zero");
    }

    const transactionData: any = {
      storeId,
      transaction_type: transaction_type.toUpperCase(),
      amount: Number(amount),
      paymentModeId,
      categoryId: categoryId && typeof categoryId === "string" && categoryId.trim() !== "" ? categoryId : null,
      bankAccountId: bankAccountId && typeof bankAccountId === "string" && bankAccountId.trim() !== "" ? bankAccountId : null,
      bookingId: bookingId && typeof bookingId === "string" && bookingId.trim() !== "" ? bookingId : null,
      retailSaleId: retailSaleId && typeof retailSaleId === "string" && retailSaleId.trim() !== "" ? retailSaleId : null,
      purchaseId: purchaseId && typeof purchaseId === "string" && purchaseId.trim() !== "" ? purchaseId : null,
      reference_no: reference_no?.trim() || null,
      remarks: remarks?.trim() || null,
      performedById: user?.id || null,
    };

    if (createdAt) {
      transactionData.createdAt = new Date(createdAt);
    }

    const created = await prisma.transaction.create({
      data: transactionData,
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
      },
    });

    return responseHandler.created(res, "Transaction recorded successfully", created);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return responseHandler.internalServerError(res, error);
  }
};
