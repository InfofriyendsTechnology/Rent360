import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";
import { deleteCloudinaryAsset } from "../../utils/cloudinaryHelper";

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing: any = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        productItems: {
          include: {
            bookingItems: {
              include: {
                booking: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return responseHandler.notFound(res, "Product not found");
    }

    // Check if any productItem is currently booked
    const productItems: any[] = existing.productItems || [];
    const activeBooking = productItems.some((item: any) =>
      (item.bookingItems || []).some(
        (bi: any) => bi.booking?.status === "UPCOMING" || bi.booking?.status === "PICKED_UP"
      )
    );

    if (activeBooking) {
      return responseHandler.badRequest(
        res,
        `Cannot delete product '${existing.name}'. One or more items are currently in active or upcoming bookings.`
      );
    }

    // Delete associated physical productItems first
    await (prisma as any).productItem.deleteMany({
      where: { productId: id },
    });

    // Delete the product record
    await (prisma as any).product.delete({
      where: { id },
    });

    // Clean up Cloudinary assets if any
    if (Array.isArray(existing.image_urls)) {
      for (const url of existing.image_urls) {
        if (typeof url === "string") {
          deleteCloudinaryAsset(url).catch(() => {});
        }
      }
    }

    return responseHandler.success(res, `Product '${existing.name}' deleted successfully`);
  } catch (error) {
    console.error("Error deleting product:", error);
    return responseHandler.internalServerError(res, error);
  }
};
