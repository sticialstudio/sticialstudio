const { PrismaClient } = require('@prisma/client');

let prismaInstance = global.__edtechPrisma;

if (!prismaInstance) {
  prismaInstance = new PrismaClient();
  global.__edtechPrisma = prismaInstance;
}

module.exports = {
  prisma: prismaInstance,
};
