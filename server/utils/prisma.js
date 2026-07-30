const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client Singleton
 *
 * Creates a single PrismaClient instance and reuses it across the app.
 * Prevents multiple instances during hot-reload in development.
 */

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
