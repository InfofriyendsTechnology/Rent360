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
