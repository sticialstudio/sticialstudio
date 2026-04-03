const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devUser = await prisma.user.upsert({
    where: { id: 'dev-user-id' },
    update: {},
    create: {
      id: 'dev-user-id',
      email: 'stemaide-dev@example.com',
      password: 'dev-password-bypass', // Not used but required by schema
      name: 'Developer'
    },
  });
  console.log('Developer user ensures:', devUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
