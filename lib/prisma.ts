import "dotenv/config"
import { Pool, type PoolConfig } from "pg"
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
    } catch (err) {
      console.warn("[getPostgresUrl] Failed to decode prisma+postgres api_key:", err)
      return process.env.DIRECT_URL || raw
    }
  }
  return raw
}

const connectionString = getPostgresUrl(rawUrl)
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1")

const poolConfig: PoolConfig = {
  connectionString,
  max: process.env.NODE_ENV === "production" ? 5 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ...(isLocal
    ? {}
    : {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: Pool
}

const pool = globalForPrisma.pgPool || new Pool(poolConfig)

// Handle unexpected errors on idle connections to prevent crashing the serverless process
pool.on("error", (err) => {
  console.error("[pg.Pool] Unexpected error on idle database client:", err)
})

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

// Retain in global scope across hot reloads and warm serverless containers
globalForPrisma.prisma = prisma
globalForPrisma.pgPool = pool

