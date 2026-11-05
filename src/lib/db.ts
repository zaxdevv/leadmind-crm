import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
function connectionUrl() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;
  const [path, query] = url.split("?", 2);
  const parameters = new URLSearchParams(query);
  parameters.set("connection_limit", "1");
  return `${path}?${parameters}`;
}
export const db =
  globalDb.prisma ?? new PrismaClient({ datasourceUrl: connectionUrl() });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
