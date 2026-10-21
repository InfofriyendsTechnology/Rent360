import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const quickLookupProduct = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const code = req.query.code as string;
    let storeId = req.query.storeId as string;

    if (!code || typeof code !== "string" || !code.trim()) {
      return responseHandler.badRequest(res, "Product code is required");
    }

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const trimmedCode = code.trim();

    const whereClause: any = {
      OR: [
        { product_code: { equals: trimmedCode, mode: "insensitive" } },
        { productItems: { some: { sku_code: { equals: trimmedCode, mode: "insensitive" } } } },
        { name: { contains: trimmedCode, mode: "insensitive" } },
      ],
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    const product = await prisma.product.findFirst({
      where: whereClause,
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        productItems: {
          include: {
            bookingItems: {
              include: {
                booking: {
                  include: {
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
        },
      },
    });

    if (!product) {
      return responseHandler.notFound(res, "No product found with code: " + trimmedCode);
    }

    // Extract unique sizes and colors
    const sizes = Array.from(new Set(product.productItems.map((i) => i.size).filter(Boolean)));
    const colors = Array.from(new Set(product.productItems.map((i) => i.color).filter(Boolean)));

    // Flatten bookings from all product items
    const bookingsMap = new Map();
    product.productItems.forEach((item) => {
      item.bookingItems.forEach((bi) => {
        if (!bookingsMap.has(bi.id)) {
          bookingsMap.set(bi.id, {
            id: bi.id,
            bill_no: bi.booking.booking_no,
            status: bi.item_status || bi.booking.status,
            delivery: bi.booking.pickup_date,
            return_date: bi.booking.return_date,
            customer_name: bi.booking.customer?.full_name || "Walk-in Customer",
            customer_mobile: bi.booking.customer?.mobile || "N/A",
            size: item.size || "STD",
            color: item.color || "Standard",
            sku_code: item.sku_code,
            qty: 1,
            rent_price: bi.rent_price,
          });
        }
      });
    });

    const bookings = Array.from(bookingsMap.values()).sort(
      (a: any, b: any) => new Date(b.delivery).getTime() - new Date(a.delivery).getTime()
    );

    const result = {
      id: product.id,
      name: product.name,
      product_code: product.product_code,
      category_name: product.category?.name || "Uncategorized",
      category_code: product.category?.category_code || "CAT",
      qty: product.productItems.length,
      base_rent_price: product.base_rent_price,
      base_security_deposit: product.base_security_deposit,
      sizes: sizes.length > 0 ? sizes.join(", ") : "Standard",
      colors: colors.length > 0 ? colors.join(", ") : "Standard",
      remarks: product.category?.description || (product.productItems.find((i) => i.condition_notes)?.condition_notes) || "N/A",
      image_url: Array.isArray(product.image_urls) && product.image_urls.length > 0 ? product.image_urls[0] : null,
      image_urls: product.image_urls || [],
      store_name: product.store?.name || "Virasat Studio",
      bookings,
    };

    return responseHandler.success(res, "Product lookup successful", result);
  } catch (error) {
    console.error("Error in quickLookupProduct:", error);
    return responseHandler.internalServerError(res, error);
  }
};
