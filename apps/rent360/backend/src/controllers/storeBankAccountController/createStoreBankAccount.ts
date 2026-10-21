import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createStoreBankAccount = async (req: AuthRequest, res: Response) => {
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

    const { account_name, account_number, ifsc_code } = req.body;

    const data = await prisma.storeBankAccount.create({
      data: {
        account_name: account_name.trim(),
        account_number: account_number.trim(),
        ifsc_code: ifsc_code ? ifsc_code.trim() : null,
        storeId,
      },
    });
    return responseHandler.created(res, "Bank account created successfully", data);
  } catch (error) {
    console.error("Error creating bank account:", error);
    return responseHandler.internalServerError(res, error);
  }
};

