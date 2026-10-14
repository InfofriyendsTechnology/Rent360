import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const deleteProductItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing: any = await (prisma as any).productItem.findUnique({
      where: { id },
      include: {
        bookingItems: {
          include: {
            booking: {
              select: { status: true, booking_no: true },
            },
          },
        },
      },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Product item not found");
    }

    const bookingItems: any[] = existing.bookingItems || [];
    const activeBooking = bookingItems.find(
      (bi: any) => bi.booking?.status === "UPCOMING" || bi.booking?.status === "PICKED_UP"
    );

    if (activeBooking) {
      return responseHandler.badRequest(
        res,
        `Cannot delete item '${existing.sku_code}'. It is linked to active booking #${activeBooking.booking?.booking_no}.`
      );
    }

    await (prisma as any).productItem.delete({
      where: { id },
    });

    return responseHandler.success(res, `Product item '${existing.sku_code}' deleted successfully`);
  } catch (error) {
    console.error("Error deleting product item:", error);
    return responseHandler.internalServerError(res, error);
  }
};
