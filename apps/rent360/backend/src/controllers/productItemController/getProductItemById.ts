import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getProductItemById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const item = await (prisma as any).productItem.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        bookingItems: {
          include: {
            booking: {
              select: {
                id: true,
                booking_no: true,
                pickup_date: true,
                return_date: true,
                status: true,
                customer: {
                  select: {
                    full_name: true,
                    mobile: true,
                  },
                },
              },
            },
          },
        },
        serviceLogs: {
          include: {
            serviceType: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!item) {
      return responseHandler.notFound(res, "Product item not found");
    }

    return responseHandler.success(res, "Product item fetched successfully", item);
  } catch (error) {
    console.error("Error fetching product item by ID:", error);
    return responseHandler.internalServerError(res, error);
  }
};
