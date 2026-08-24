import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Thiếu biến DATABASE_URL trên Railway Variables");
}
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  throw new Error("DATABASE_URL phải là URL PostgreSQL (postgresql:// hoặc postgres://), không dùng file:./dev.db");
}

export const db = new PrismaClient();
