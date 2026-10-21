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
    const { mobile, username, identifier, password } = req.body;
    const loginId = (identifier || username || mobile || "").trim();

    if (!loginId || !password) {
      return responseHandler.unauthorized(
        res,
        MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    // 1. Find User by mobile, username, or name
    let user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: loginId },
          { username: { equals: loginId, mode: "insensitive" } },
          { name: { equals: loginId, mode: "insensitive" } },
        ],
      },
      include: { role: true, store: true },
    });

    // 2. If not found and identifier is admin alias, check Super Admin
    if (
      !user &&
      (loginId.toLowerCase() === "admin" ||
        loginId.toLowerCase() === "superadmin" ||
        loginId.toLowerCase() === "super admin")
    ) {
      user = await prisma.user.findFirst({
        where: {
          role: { name: "SUPER_ADMIN" },
        },
        include: { role: true, store: true },
      });
    }

    // 3. If still not found, check if it matches a Store username or name
    if (!user) {
      const store = await prisma.store.findFirst({
        where: {
          OR: [
            { username: { equals: loginId, mode: "insensitive" } },
            { name: { equals: loginId, mode: "insensitive" } },
          ],
        },
      });
      if (store) {
        user = await prisma.user.findFirst({
          where: {
            storeId: store.id,
            role: { name: "STORE_ADMIN" },
          },
          include: { role: true, store: true },
        });
      }
    }

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
      user.store?.subscription_status !== "ACTIVE"
    ) {
      return responseHandler.forbidden(res, MESSAGES.AUTH.INACTIVE_ACCOUNT);
    }

    // If user has no role, ensure STORE_ADMIN role exists and assign it
    if (!user.roleId || !user.role) {
      let storeAdminRole = await prisma.role.findFirst({
        where: { storeId: user.storeId, name: "STORE_ADMIN" }
      });
      if (!storeAdminRole) {
        storeAdminRole = await prisma.role.create({
          data: {
            storeId: user.storeId,
            name: "STORE_ADMIN",
            permissions: ["ALL"]
          }
        });
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: { roleId: storeAdminRole.id },
        include: { role: true, store: true }
      });
    }

    const isSuperAdmin = user.role?.name === "SUPER_ADMIN";

    // Generate Token (Super Admin has no store locking)
    const token = jwt.sign(
      { id: user.id, storeId: isSuperAdmin ? null : user.storeId, role: user.role?.name },
      process.env.JWT_SECRET || "Rent360SuperSecretKey2026",
      { expiresIn: "7d" },
    );

    return responseHandler.success(res, MESSAGES.AUTH.LOGIN_SUCCESS, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role?.name,
        permissions: (user.role?.permissions as unknown as string[]) || [],
        profile_pic: user.profile_pic,
        store: isSuperAdmin ? null : {
          id: user.store?.id,
          name: user.store?.name,
        },
      },
    });
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
