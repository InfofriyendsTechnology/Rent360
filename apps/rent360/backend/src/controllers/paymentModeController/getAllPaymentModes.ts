import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getAllPaymentModes = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereClause: any = {};
    if (storeId) {
      whereClause.storeId = storeId;
    }

    let modes = await prisma.paymentMode.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    // Auto-seed defaults if empty for this store
    if (modes.length === 0 && storeId) {
      const defaultModes = ["Cash", "UPI / QR Code", "Bank Transfer", "Card"];
      await prisma.paymentMode.createMany({
        data: defaultModes.map((name) => ({
          name,
          storeId,
          is_active: true,
        })),
        skipDuplicates: true,
      });

      modes = await prisma.paymentMode.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
      });
    }

    return responseHandler.success(res, "Payment modes fetched successfully", modes);
  } catch (error) {
    console.error("Error fetching payment modes:", error);
    return responseHandler.internalServerError(res, error);
  }
};
