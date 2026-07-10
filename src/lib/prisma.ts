import { PrismaClient } from "@prisma/client";

let cachedPrisma: PrismaClient | undefined;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!cachedPrisma) {
      cachedPrisma = new PrismaClient({
        log: ["query", "info", "warn", "error"],
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (cachedPrisma as any)[prop as keyof PrismaClient];
  },
});
