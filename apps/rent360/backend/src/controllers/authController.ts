import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import responseHandler from "../utils/responseHandler";
import { MESSAGES } from "../utils/messages";

export const registerStore = async (req: Request, res: Response) => {
  try {
    const { storeName, ownerName, mobile, password } = req.body;

    // Check if store/mobile already exists
    const existingStore = await prisma.store.findUnique({ where: { mobile } });
    if (existingStore) {
      return responseHandler.conflict(res, MESSAGES.AUTH.MOBILE_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction to create Store, Default Role, and Admin User together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Store
      const store = await tx.store.create({
        data: {
          name: storeName,
          owner_name: ownerName,
          mobile,
        },
      });

      // 2. Create Admin Role
      const role = await tx.role.create({
        data: {
          storeId: store.id,
          name: "ADMIN",
          permissions: ["ALL"],
        },
      });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          storeId: store.id,
          roleId: role.id,
          name: ownerName,
          mobile,
          password: hashedPassword,
        },
      });

      return { store, user };
    });

    return responseHandler.created(res, MESSAGES.AUTH.REGISTER_SUCCESS, {
      storeId: result.store.id,
      userId: result.user.id,
    });
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;

    // Find User
    const user = await prisma.user.findUnique({
      where: { mobile },
      include: { role: true, store: true },
    });

    if (!user) {
      return responseHandler.unauthorized(
        res,
        MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return responseHandler.unauthorized(
        res,
        MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    // Check Status
    if (
      user.status !== "ACTIVE" ||
      user.store.subscription_status !== "ACTIVE"
    ) {
      return responseHandler.forbidden(res, MESSAGES.AUTH.INACTIVE_ACCOUNT);
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, storeId: user.storeId, role: user.role?.name },
      process.env.JWT_SECRET || "Rent360SuperSecretKey2026",
      { expiresIn: "7d" },
    );

    return responseHandler.success(res, MESSAGES.AUTH.LOGIN_SUCCESS, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role?.name,
        profile_pic: user.profile_pic,
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
