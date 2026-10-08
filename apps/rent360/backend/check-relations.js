const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ include: { role: true, store: true } });
  for (const u of users) {
    console.log(`ID: ${u.id}, Role: ${u.role?.name}, Store: ${u.store?.name}, Name: ${u.name}`);
  }
  await prisma.$disconnect();
}
run();
