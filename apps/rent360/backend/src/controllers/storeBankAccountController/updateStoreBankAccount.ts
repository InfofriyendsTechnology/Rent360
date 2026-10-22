import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateStoreBankAccount = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id as string;
    const body = { ...req.body };
    if (body.name && !body.account_name) {
      body.account_name = body.name.trim();
    }
    delete body.name;
    delete body.storeId;

    const data = await (prisma as any).storeBankAccount.update({
      where: { id: rawId },
      data: body,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
