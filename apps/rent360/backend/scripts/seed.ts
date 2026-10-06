import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // 1. Create a Store
  const store = await prisma.store.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      name: 'Rent360 Super Store',
      owner_name: 'Super Admin',
      mobile: '9999999999',
      subscription_status: 'ACTIVE',
    }
  });

  // 2. Create SUPER_ADMIN Role
  const role = await prisma.role.create({
    data: {
      storeId: store.id,
      name: 'SUPER_ADMIN',
      permissions: ['ALL']
    }
  });

  // 3. Create Super Admin User
  await prisma.user.upsert({
    where: { mobile: '9999999999' },
    update: {},
    create: {
      storeId: store.id,
      roleId: role.id,
      name: 'Super Admin',
      mobile: '9999999999',
      password: password,
      status: 'ACTIVE'
    }
  });

  console.log('Seed completed successfully!');
  console.log('--------------------------------');
  console.log('Role: SUPER ADMIN');
  console.log('Mobile ID: 9999999999');
  console.log('Password: admin123');
  console.log('--------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
