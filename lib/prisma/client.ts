import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { env } from "../env";

const createPrismaClient = () => {
  const adapter = new PrismaLibSQL({
    url: env.TURSO_DATABASE_URL || "",
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client;
};

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper to retry queries on connection errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 100
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isConnectionError =
      error?.message?.includes("Engine is not yet connected") ||
      error?.message?.includes("Response from the Engine was empty") ||
      error?.code === "GenericFailure";

    if (isConnectionError && retries > 0) {
      console.warn(
        `Database connection error, retrying... (${retries} attempts left)`
      );

      // Try to reconnect
      try {
        await prisma.$disconnect();
        await new Promise((resolve) => setTimeout(resolve, delay));
        await prisma.$connect();
      } catch (reconnectError) {
        // Ignore reconnect errors, just wait and retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return withRetry(fn, retries - 1, delay * 2);
    }

    throw error;
  }
}
