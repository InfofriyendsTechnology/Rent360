import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      transaction_type,
      amount,
      paymentModeId,
      categoryId,
      bankAccountId,
      reference_no,
      remarks,
      createdAt,
    } = req.body;

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Transaction not found");
    }

    const updateData: any = {};

    if (transaction_type) {
      if (!["CREDIT", "DEBIT"].includes(transaction_type.toUpperCase())) {
        return responseHandler.badRequest(res, "Transaction type must be CREDIT or DEBIT");
      }
      updateData.transaction_type = transaction_type.toUpperCase();
    }

    if (amount !== undefined) {
      const numAmt = Number(amount);
      if (isNaN(numAmt) || numAmt <= 0) {
        return responseHandler.badRequest(res, "Amount must be greater than zero");
      }
      updateData.amount = numAmt;
    }

    if (paymentModeId) {
      updateData.paymentModeId = paymentModeId;
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId && typeof categoryId === "string" && categoryId.trim() !== "" ? categoryId : null;
    }

    if (bankAccountId !== undefined) {
      updateData.bankAccountId = bankAccountId && typeof bankAccountId === "string" && bankAccountId.trim() !== "" ? bankAccountId : null;
    }

    if (reference_no !== undefined) {
      updateData.reference_no = reference_no?.trim() || null;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks?.trim() || null;
    }

    if (createdAt) {
      updateData.createdAt = new Date(createdAt);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
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

    return responseHandler.success(res, "Transaction updated successfully", updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return responseHandler.internalServerError(res, error);
  }
};

