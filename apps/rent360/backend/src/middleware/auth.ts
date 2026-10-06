import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import responseHandler from "../utils/responseHandler";
import { MESSAGES } from "../utils/messages";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    storeId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return responseHandler.unauthorized(res, MESSAGES.AUTH.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "Rent360SuperSecretKey2026",
    ) as any;

    req.user = {
      id: decoded.id,
      storeId: decoded.storeId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return responseHandler.unauthorized(res, MESSAGES.AUTH.UNAUTHORIZED);
  }
};
