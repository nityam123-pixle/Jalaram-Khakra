import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawUrl = process.env["DATABASE_URL"] || process.env["DIRECT_URL"] || "postgresql://postgres:postgres@localhost:5432/postgres";

function getPostgresUrl(raw: string): string {
  if (raw.startsWith("prisma+postgres://")) {
    try {
      const url = new URL(raw);
      const apiKey = url.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
        if (decoded.databaseUrl) {
          return decoded.databaseUrl;
        }
      }
    } catch {
      return process.env["DIRECT_URL"] || raw;
    }
  }
  return raw;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || getPostgresUrl(rawUrl),
  },
});
