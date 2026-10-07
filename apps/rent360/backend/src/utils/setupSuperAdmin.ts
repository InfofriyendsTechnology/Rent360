import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const setupSuperAdmin = async () => {
  const mobile = process.env.SUPER_ADMIN_MOBILE;
  const passwordText = process.env.SUPER_ADMIN_PASSWORD;

  if (!mobile || !passwordText) {
    console.log('⚠️ SUPER_ADMIN_MOBILE or SUPER_ADMIN_PASSWORD not found in .env, skipping Super Admin auto-setup.');
    return;
  }

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: { name: 'SUPER_ADMIN' } }
    });

    // Seed default subscription plans if not existing
    const planCount = await prisma.subscriptionPlan.count();
    if (planCount === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'STARTER',
            price_per_month: 799,
            price_per_year: 7999,
            max_bookings: 0,
            max_staff: 2,
            features: [
              'Up to 100 Inventory',
              '2 Salesman Accounts',
              'Multi device login',
              'All Features Included',
              'Support & Training',
            ],
            is_active: true,
          },
          {
            name: 'GROWTH',
            price_per_month: 999,
            price_per_year: 9999,
            max_bookings: 0,
            max_staff: 10,
            features: [
              'Unlimited Inventory',
              '10 Salesman Accounts',
              'Multi device login',
              'All Features Included',
              'Support & Training',
            ],
            is_active: true,
          },
          {
            name: 'PRO',
            price_per_month: 1499,
            price_per_year: 14999,
            max_bookings: 0,
            max_staff: 0,
            features: [
              'Unlimited Inventory',
              'Unlimited Salesman',
              'Multi device login',
              'Priority Support & Training',
              'All Features Included',
            ],
            is_active: true,
          },
        ],
      });
      console.log('✅ Default Subscription Plans seeded (STARTER, GROWTH, PRO)');
    }

    if (existingAdmin) {
      // If mobile or password has changed in .env, we update the existing super admin
      if (existingAdmin.mobile !== mobile) {
        const hashedPassword = await bcrypt.hash(passwordText, 10);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { mobile, password: hashedPassword }
        });
        console.log(`✅ Super Admin credentials updated from .env (Mobile: ${mobile})`);
      } else {
        console.log(`✅ Super Admin already exists (Mobile: ${mobile})`);
      }
      return;
    }

    console.log('⏳ Creating new Super Admin from .env...');
    const hashedPassword = await bcrypt.hash(passwordText, 10);

    const store = await prisma.store.create({
      data: {
        name: 'Rent360',
        owner_name: 'System Admin',
        mobile,
        subscription_status: 'ACTIVE'
      }
    });

    const role = await prisma.role.create({
      data: {
        storeId: store.id,
        name: 'SUPER_ADMIN',
        permissions: ['ALL']
      }
    });

    await prisma.user.create({
      data: {
        storeId: store.id,
        roleId: role.id,
        name: 'System Admin',
        mobile,
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    console.log(`🚀 Super Admin created successfully (Mobile: ${mobile})!`);
  } catch (error) {
    console.error('❌ Error setting up Super Admin:', error);
  }
};
