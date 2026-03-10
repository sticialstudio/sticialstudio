import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// (Useful when used within Next.js or hot-reloading environments)
declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export * from '@prisma/client';
