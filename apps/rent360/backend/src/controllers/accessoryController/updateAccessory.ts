import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const updateAccessory = async (req: AuthRequest, res: Response) => {
  try {
    const updateData: any = {};
    if (req.body.item_name || req.body.name) {
      updateData.item_name = (req.body.item_name || req.body.name).trim();
    }
    if (req.body.categoryId !== undefined) {
      updateData.categoryId = req.body.categoryId || null;
    }
    if (req.body.item_type || req.body.type) {
      updateData.item_type = (req.body.item_type || req.body.type).toUpperCase();
    }
    if (req.body.image_url !== undefined) {
      updateData.image_url = req.body.image_url || null;
    }
    if (req.body.rent_price !== undefined) {
      updateData.rent_price = Number(req.body.rent_price);
    }
    if (req.body.is_sold !== undefined) {
      updateData.is_sold = Boolean(req.body.is_sold);
    }
    if (req.body.total_stock !== undefined) {
      updateData.total_stock = Number(req.body.total_stock);
    }
    if (req.body.qty !== undefined) {
      updateData.total_stock = Number(req.body.qty);
    }
    if (req.body.alert_limit !== undefined) {
      updateData.alert_limit = Number(req.body.alert_limit);
    }

    const data = await prisma.accessory.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        category: true,
      },
    });
    return responseHandler.success(res, "Accessory updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
