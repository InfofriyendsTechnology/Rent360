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

    const rawName = req.body.account_name || req.body.name;
    if (!rawName || !rawName.trim()) {
      return responseHandler.badRequest(res, "Account name is required");
    }

    const account_name = rawName.trim();
    const account_number = req.body.account_number ? req.body.account_number.trim() : null;
    const ifsc_code = req.body.ifsc_code ? req.body.ifsc_code.trim() : null;

    const data = await prisma.storeBankAccount.create({
      data: {
        account_name,
        account_number,
        ifsc_code,
        storeId,
      },
    });
    return responseHandler.created(res, "Security / Bank account created successfully", data);
  } catch (error) {
    console.error("Error creating bank account:", error);
    return responseHandler.internalServerError(res, error);
  }
};
