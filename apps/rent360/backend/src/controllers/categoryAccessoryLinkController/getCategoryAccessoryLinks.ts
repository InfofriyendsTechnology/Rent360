import { Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";

export const getCategoryAccessoryLinks = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;

    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }

    const whereCategory: any = {};
    if (storeId) {
      whereCategory.storeId = storeId;
    }

    // Fetch all categories with their linked accessories
    const categories = await prisma.category.findMany({
      where: whereCategory,
      include: {
        accessoryLinks: {
          include: {
            accessory: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryCode: cat.category_code,
      links: cat.accessoryLinks.map((link) => ({
        linkId: link.id,
        accessoryId: link.accessoryId,
        accessoryName: link.accessory.item_name,
        accessoryType: link.accessory.item_type,
        rentPrice: link.accessory.rent_price,
        isSold: link.accessory.is_sold,
      })),
    }));

    return responseHandler.success(res, "Fetched category accessory links successfully", formatted);
  } catch (error) {
    console.error("Error fetching category accessory links:", error);
    return responseHandler.internalServerError(res, error);
  }
};
