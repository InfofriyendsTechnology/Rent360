import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const updateSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = String(req.body.name).trim();
    if (req.body.price_per_month !== undefined) updateData.price_per_month = Number(req.body.price_per_month);
    if (req.body.price_per_year !== undefined) updateData.price_per_year = Number(req.body.price_per_year);
    if (req.body.max_bookings !== undefined) updateData.max_bookings = parseInt(req.body.max_bookings, 10);
    if (req.body.max_staff !== undefined) updateData.max_staff = parseInt(req.body.max_staff, 10);
    if (req.body.features !== undefined) {
      if (typeof req.body.features === "string") {
        try {
          updateData.features = JSON.parse(req.body.features);
        } catch {
          updateData.features = req.body.features.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.features)) {
        updateData.features = req.body.features;
      }
    }
    if (req.body.is_active !== undefined) updateData.is_active = Boolean(req.body.is_active);

    const data = await (prisma as any).subscriptionPlan.update({
      where: { id: req.params.id },
      data: updateData,
    });
    return responseHandler.success(res, "Updated successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
