import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const deleteSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const existing = await (prisma as any).subscriptionPlan.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { storeSubscriptions: true },
        },
      },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Subscription plan not found");
    }

    if (existing._count?.storeSubscriptions > 0) {
      return responseHandler.badRequest(
        res,
        `Cannot delete this plan: ${existing._count.storeSubscriptions} stores have active subscriptions linked to it. You can deactivate the plan instead.`
      );
    }

    await (prisma as any).subscriptionPlan.delete({
      where: { id: req.params.id },
    });
    return responseHandler.success(res, "Deleted successfully");
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
