const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  console.log("Profile pic in DB:", user?.profile_pic);
  await prisma.$disconnect();
}
run();
