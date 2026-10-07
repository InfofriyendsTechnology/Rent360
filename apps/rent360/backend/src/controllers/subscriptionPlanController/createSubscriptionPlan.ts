import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { name, price_per_month, price_per_year, max_bookings, max_staff, features, is_active } = req.body;
    let parsedFeatures = features;
    if (typeof features === "string") {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = features.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (!Array.isArray(features)) {
      parsedFeatures = [];
    }

    const data = await (prisma as any).subscriptionPlan.create({
      data: {
        name: String(name).trim(),
        price_per_month: Number(price_per_month) || 0,
        price_per_year: Number(price_per_year) || 0,
        max_bookings: parseInt(max_bookings, 10) || 0,
        max_staff: parseInt(max_staff, 10) || 0,
        features: parsedFeatures,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });
    return responseHandler.created(res, "Created successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
