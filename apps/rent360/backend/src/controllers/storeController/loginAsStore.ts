import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const loginAsStore = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.id;
    
    // Find the admin user for this store (the first user created)
    const user = await prisma.user.findFirst({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
      include: { role: true, store: true },
    });

    if (!user) {
      return responseHandler.notFound(res, "Admin user not found for this store");
    }

    // Check Status
    if (user.status !== "ACTIVE" || user.store.subscription_status !== "ACTIVE") {
      return responseHandler.forbidden(res, "Store or User account is inactive");
    }

    // Generate Token (just like normal login)
    const token = jwt.sign(
      { id: user.id, storeId: user.storeId, role: user.role?.name },
      process.env.JWT_SECRET || "Rent360SuperSecretKey2026",
      { expiresIn: "7d" }
    );

    return responseHandler.success(res, "Logged in as store successfully", {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role?.name,
        permissions: (user.role?.permissions as unknown as string[]) || [],
        store: {
          id: user.store.id,
          name: user.store.name,
        },
      },
    });
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
