import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Ré-exporte les types Prisma (ex: Prisma, Model enums…)
export * from '@prisma/client';
