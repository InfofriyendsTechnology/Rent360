const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  const password = await bcrypt.hash('Rent360#25926', 10);
  
  const store = await prisma.store.create({
    data: {
      name: 'Rent360 Super Store 2',
      owner_name: 'Main Admin',
      mobile: '8553535342',
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
  
  const user = await prisma.user.create({
    data: {
      storeId: store.id,
      roleId: role.id,
      name: 'Main Admin',
      mobile: '8553535342',
      password,
      status: 'ACTIVE'
    }
  });
  
  console.log('Created New Admin User ID:', user.id);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
