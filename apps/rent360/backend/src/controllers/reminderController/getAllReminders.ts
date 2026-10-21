import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import responseHandler from "../../utils/responseHandler";

export const getAllReminders = async (req: Request, res: Response) => {
  try {
    const { storeId, search } = req.query;
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (search && typeof search === "string" && search.trim() !== "") {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const data = await (prisma as any).reminder.findMany({
      where,
      orderBy: { reminder_date: "asc" },
    });
    return responseHandler.success(res, "Fetched successfully", data);
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
