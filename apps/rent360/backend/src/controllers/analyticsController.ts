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
        reminder_date: { lte: new Date() },
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

export const getSuperAdminStats = async (req: any, res: Response) => {
  try {
    // Exclude master super admin store
    const storeWhere = {
      roles: {
        none: {
          name: 'SUPER_ADMIN'
        }
      }
    };

    // 1. Total Stores Listed & Active
    const totalStores = await prisma.store.count({ where: storeWhere });
    const activeStores = await prisma.store.count({
      where: {
        ...storeWhere,
        subscription_status: 'ACTIVE'
      }
    });

    // 2. Real Subscriptions from database
    const subscriptions = await prisma.storeSubscription.findMany({
      include: { plan: true, store: true },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate real revenue from all stored subscriptions
    const totalRevenue = subscriptions.reduce((acc, sub) => acc + (sub.last_paid_amount || 0), 0);
    
    // Calculate Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR)
    let mrr = 0;
    subscriptions.forEach(sub => {
      if (sub.status === 'ACTIVE' && sub.plan) {
        // If yearly amount (> 3000), monthly equiv is yearly / 12
        if (sub.last_paid_amount >= 3000) {
          mrr += Math.round(sub.last_paid_amount / 12);
        } else {
          mrr += (sub.last_paid_amount || sub.plan.price_per_month || 0);
        }
      }
    });
    const arr = mrr * 12;

    // Plans breakdown based on active store subscriptions
    const starterStores = subscriptions.filter(s => 
      s.status === 'ACTIVE' && s.plan?.name?.toUpperCase().includes('STARTER')
    ).length;

    const growthStores = subscriptions.filter(s => 
      s.status === 'ACTIVE' && s.plan?.name?.toUpperCase().includes('GROWTH')
    ).length;

    const proStores = subscriptions.filter(s => 
      s.status === 'ACTIVE' && s.plan?.name?.toUpperCase().includes('PRO')
    ).length;

    // 3. Real Stores List with their current Subscription details
    const storesWithRevenue = await prisma.store.findMany({
      where: storeWhere,
      select: {
        id: true,
        name: true,
        owner_name: true,
        city: true,
        mobile: true,
        subscription_status: true,
        createdAt: true,
        bookings: {
          select: {
            total_rent: true,
            status: true
          }
        },
        subscriptions: {
          include: { plan: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const realStoresList = storesWithRevenue.map((store, idx) => {
      const totalBookingsVolume = store.bookings.reduce((sum, b) => sum + (b.total_rent || 0), 0);
      const estProfit = Math.round(totalBookingsVolume * 0.75);
      const activeSub = store.subscriptions[0];
      const planName = activeSub?.plan?.name || (store.subscription_status === 'ACTIVE' ? 'Active Plan' : 'No Active Plan');
      const planPrice = activeSub?.last_paid_amount 
        ? `₹${activeSub.last_paid_amount.toLocaleString('en-IN')}` 
        : (activeSub?.plan?.price_per_year ? `₹${activeSub.plan.price_per_year.toLocaleString('en-IN')}/yr` : '₹0');

      let tierKey = 'STARTER';
      if (planName.toUpperCase().includes('GROWTH')) tierKey = 'GROWTH';
      if (planName.toUpperCase().includes('PRO')) tierKey = 'PRO';

      return {
        id: store.id,
        rank: idx + 1,
        name: store.name,
        buyer: store.owner_name,
        city: store.city || 'Gujarat',
        mobile: store.mobile,
        plan: planName,
        planPrice: planPrice,
        rentalVolume: `₹${totalBookingsVolume.toLocaleString('en-IN')}`,
        storeProfit: `₹${estProfit.toLocaleString('en-IN')}`,
        margin: '75%',
        tierKey,
        status: store.subscription_status || 'ACTIVE',
        subscriptionId: activeSub?.id || null,
        planId: activeSub?.planId || null,
        startDate: activeSub?.start_date || null,
        endDate: activeSub?.end_date || null
      };
    });

    // 4. Generate Real Monthly Inflow Chart based on Actual Subscriptions & Store Registrations
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyRevenueChart = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const mName = monthNames[mIdx];
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      // Sum real subscription revenue created in this month
      const monthSubs = subscriptions.filter(s => {
        const subDate = new Date(s.createdAt);
        return subDate >= d && subDate < nextMonth;
      });
      const monthRev = monthSubs.reduce((sum, s) => sum + (s.last_paid_amount || 0), 0);

      // Stores created in or up to this month
      const storesUpToMonth = storesWithRevenue.filter(s => new Date(s.createdAt) < nextMonth).length;

      monthlyRevenueChart.push({
        month: mName,
        revenue: monthRev,
        sales: monthRev,
        profit: Math.round(monthRev * 0.75),
        newStores: monthSubs.length,
        activeStores: storesUpToMonth
      });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true }
    });

    return responseHandler.success(res, "Super Admin stats fetched", {
      totalStores,
      activeStores,
      totalRevenue,
      mrr,
      arr,
      starterStores,
      growthStores,
      proStores,
      realStoresList,
      topProfitStores: realStoresList.slice(0, 5),
      monthlyRevenueChart,
      plans
    });
  } catch (error: any) {
    console.error("Super Admin Stats Error:", error);
    return responseHandler.internalServerError(res, error.message || error);
  }
};
