import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createPaymentMode = async (req: AuthRequest, res: Response) => {
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

    const { name, is_active } = req.body;

    const data = await prisma.paymentMode.create({
      data: {
        name: name.trim(),
        is_active: is_active !== undefined ? is_active : true,
        storeId,
      },
    });
    return responseHandler.created(res, "Payment mode created successfully", data);
  } catch (error) {
    console.error("Error creating payment mode:", error);
    return responseHandler.internalServerError(res, error);
  }
};

