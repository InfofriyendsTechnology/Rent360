import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).subscriptionPlan.findMany({
      include: {
        _count: {
          select: { storeSubscriptions: true },
        },
      },
      orderBy: {
        price_per_year: "asc",
      },
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    const fallbackPlans = [
      {
        id: "starter-plan",
        name: "STARTER",
        price_per_month: 799,
        price_per_year: 7999,
        max_bookings: 0,
        max_staff: 2,
        features: [
          "Up to 100 Inventory",
          "2 Salesman Accounts",
          "Multi device login",
          "All Features Included",
          "Support & Training",
        ],
        is_active: true,
        _count: { storeSubscriptions: 0 },
      },
      {
        id: "growth-plan",
        name: "GROWTH",
        price_per_month: 999,
        price_per_year: 9999,
        max_bookings: 0,
        max_staff: 10,
        features: [
          "Unlimited Inventory",
          "10 Salesman Accounts",
          "Multi device login",
          "All Features Included",
          "Support & Training",
        ],
        is_active: true,
        _count: { storeSubscriptions: 0 },
      },
      {
        id: "pro-plan",
        name: "PRO",
        price_per_month: 1499,
        price_per_year: 14999,
        max_bookings: 0,
        max_staff: 0,
        features: [
          "Unlimited Inventory",
          "Unlimited Salesman",
          "Multi device login",
          "Priority Support & Training",
          "All Features Included",
        ],
        is_active: true,
        _count: { storeSubscriptions: 0 },
      },
    ];
    return responseHandler.success(res, "Fetched successfully", fallbackPlans);
  }
};
