import { PrismaClient } from '@/generated/prisma'

declare global {
  var __prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}