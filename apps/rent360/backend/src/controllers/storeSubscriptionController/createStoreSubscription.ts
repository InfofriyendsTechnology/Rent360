import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const createStoreSubscription = async (req: Request, res: Response) => {
  try {
    const { storeId, planId, billing_cycle, start_date, end_date, status, last_paid_amount } = req.body;

    if (!storeId || !planId) {
      return responseHandler.badRequest(res, "storeId and planId are required");
    }

    // Verify store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return responseHandler.notFound(res, "Store not found");
    }

    // Verify plan exists
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return responseHandler.notFound(res, "Subscription plan not found");
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    let endDate = end_date ? new Date(end_date) : null;
    
    if (!endDate) {
      endDate = new Date(startDate);
      if (billing_cycle === 'YEARLY' || (!billing_cycle && plan.price_per_year && !plan.price_per_month)) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    }

    const amount = typeof last_paid_amount === 'number' 
      ? Number(last_paid_amount) 
      : (billing_cycle === 'YEARLY' ? plan.price_per_year : plan.price_per_month);

    const subStatus = status || 'ACTIVE';

    // Expire any existing active subscriptions for this store
    await prisma.storeSubscription.updateMany({
      where: { storeId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' }
    });

    const data = await prisma.storeSubscription.create({
      data: {
        storeId,
        planId,
        start_date: startDate,
        end_date: endDate,
        status: subStatus,
        last_paid_amount: amount,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            owner_name: true,
            mobile: true,
            city: true,
            subscription_status: true,
          }
        },
        plan: true,
      }
    });

    // Update store plan_id and subscription_status
    await prisma.store.update({
      where: { id: storeId },
      data: {
        plan_id: planId,
        subscription_status: subStatus,
      }
    });

    return responseHandler.created(res, "Subscription assigned successfully", data);
  } catch (error) {
    console.error("Error creating store subscription:", error);
    return responseHandler.internalServerError(res, error);
  }
};
