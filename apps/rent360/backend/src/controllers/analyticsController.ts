import { Request, Response } from "express";
import prisma from "../utils/prisma";
import responseHandler from "../utils/responseHandler";

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const storeId = req.user.storeId;

    // 1. Total Customers
    const totalCustomers = await prisma.customer.count({ where: { storeId } });

    // 2. Active Bookings (Upcoming + Picked Up)
    const activeBookings = await prisma.booking.count({
      where: {
        storeId,
        status: { in: ["UPCOMING", "PICKED_UP"] },
      },
    });

    // 3. Today's Transactions (Income & Expense)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        storeId,
        createdAt: { gte: today },
      },
    });

    const todaysIncome = transactions
      .filter((t) => t.transaction_type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);

    const todaysExpense = transactions
      .filter((t) => t.transaction_type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Pending Reminders
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        storeId,
        status: "PENDING",
        reminder_date: { lte: new Date() }, // Past or today
      },
      include: {
        customer: { select: { full_name: true, mobile: true } },
      },
    });

    return responseHandler.success(
      res,
      "Dashboard stats fetched successfully",
      {
        totalCustomers,
        activeBookings,
        todaysIncome,
        todaysExpense,
        pendingReminders,
      },
    );
  } catch (error) {
    return responseHandler.internalServerError(res, error);
  }
};
