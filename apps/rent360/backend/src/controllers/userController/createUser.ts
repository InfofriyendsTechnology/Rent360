import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request | any, res: Response) => {
  try {
    const storeId = req.user?.storeId;
    const { password, ...rest } = req.body;
    
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      return responseHandler.badRequest(res, "Password is required");
    }

    if (!rest.roleId) {
      delete rest.roleId;
    }

    const data = await prisma.user.create({ 
      data: { 
        ...rest, 
        password: hashedPassword,
        storeId 
      } 
    });
    
    const { password: _, ...sanitized } = data;
    return responseHandler.created(res, "Created successfully", sanitized);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
