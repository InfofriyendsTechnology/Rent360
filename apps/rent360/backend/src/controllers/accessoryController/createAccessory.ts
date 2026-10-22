import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const createAccessory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.body.storeId;
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    if (!storeId) {
      return responseHandler.badRequest(res, "storeId is required");
    }

    const itemName = req.body.item_name || req.body.name;
    if (!itemName) {
      return responseHandler.badRequest(res, "item_name is required");
    }

    const data = await prisma.accessory.create({
      data: {
        storeId,
        item_name: itemName.trim(),
        item_type: (req.body.item_type || req.body.type || "JEWELLERY").toUpperCase(),
        total_stock: Number(req.body.total_stock || 0),
        alert_limit: Number(req.body.alert_limit || 0),
      },
    });
    return responseHandler.created(res, "Accessory created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
