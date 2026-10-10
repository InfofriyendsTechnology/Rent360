import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import responseHandler from "../utils/responseHandler";
import prisma from "../utils/prisma";

export const authorize = (requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return responseHandler.unauthorized(res, "User not authenticated");
      }

      // Fetch user's current permissions from DB to ensure they are up to date
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { role: true }
      });

      if (!dbUser || !dbUser.role) {
        return responseHandler.unauthorized(res, "User role not found");
      }

      const userPermissions = dbUser.role.permissions || [];

      // If user has 'ALL' permission, they can do anything
      if (userPermissions.includes("ALL")) {
        return next();
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        return responseHandler.unauthorized(res, "You do not have permission to perform this action");
      }

      next();
    } catch (error) {
      return responseHandler.internalServerError(res, error);
    }
  };
};
