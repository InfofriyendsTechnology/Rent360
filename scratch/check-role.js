const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`ID: ${u.id}, Role: ${u.role}, Name: ${u.name}`);
  }
  await prisma.$disconnect();
}
run();
