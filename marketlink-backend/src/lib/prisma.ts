import { PrismaClient } from '@prisma/client';

// Create a single Prisma instance for the whole server.
export const prisma = new PrismaClient();
