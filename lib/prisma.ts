import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || "postgresql://postgres:postgres@localhost:5432/postgres"

function getPostgresUrl(raw: string): string {
  if (raw.startsWith("prisma+postgres://")) {
    try {
      const url = new URL(raw)
      const apiKey = url.searchParams.get("api_key")
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"))
        if (decoded.databaseUrl) {
          return decoded.databaseUrl
        }
      }
    } catch {
      // fallback to default prisma dev postgres port
      return "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
    }
  }
  return raw
}

const connectionString = getPostgresUrl(rawUrl)
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
