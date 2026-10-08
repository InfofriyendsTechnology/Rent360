const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ where: { profile_pic: { not: null } } });
  console.log("Users with pic:", users.map(u => ({id: u.id, pic: u.profile_pic})));
  
  // Let's just fix it automatically!
  for(const u of users) {
    if (u.profile_pic && u.profile_pic.includes('cloudinary.com')) {
      console.log("Nullifying broken URL for user", u.id);
      await prisma.user.update({
        where: { id: u.id },
        data: { profile_pic: null }
      });
    }
  }
  await prisma.$disconnect();
}
run();
