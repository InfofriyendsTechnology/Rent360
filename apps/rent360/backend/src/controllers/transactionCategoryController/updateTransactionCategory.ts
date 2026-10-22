import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateTransactionCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const rawId = req.params.id as string;
    const body = { ...req.body };
    delete body.storeId;

    if (body.opening_date) {
      body.opening_date = new Date(body.opening_date);
    }
    if (body.opening_balance !== undefined && body.opening_balance !== null) {
      body.opening_balance = Number(body.opening_balance);
    }

    const data = await (prisma as any).transactionCategory.update({
      where: { id: rawId },
      data: body,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
