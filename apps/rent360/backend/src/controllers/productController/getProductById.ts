import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const product = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        category: true,
        productItems: {
          include: {
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
          },
          orderBy: {
            size: "asc",
          },
        },
        _count: {
          select: {
            productItems: true,
          },
        },
      },
    });

    if (!product) {
      return responseHandler.notFound(res, "Product not found");
    }

    return responseHandler.success(res, "Product fetched successfully", product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return responseHandler.internalServerError(res, error);
  }
};
