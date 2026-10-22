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
      return responseHandler.badRequest(res, "Accessory name is required");
    }

    const data = await prisma.accessory.create({
      data: {
        storeId,
        item_name: itemName.trim(),
        categoryId: req.body.categoryId || null,
        item_type: (req.body.item_type || req.body.type || "GENERAL").toUpperCase(),
        image_url: req.body.image_url || null,
        rent_price: Number(req.body.rent_price || 0),
        is_sold: Boolean(req.body.is_sold),
        total_stock: Number(req.body.total_stock !== undefined ? req.body.total_stock : (req.body.qty || 1)),
        alert_limit: Number(req.body.alert_limit || 1),
      },
      include: {
        category: true,
      },
    });
    return responseHandler.created(res, "Accessory created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
