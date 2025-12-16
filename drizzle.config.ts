import type { Config } from "drizzle-kit";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Ensure data directory exists
const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/database.db",
  },
} satisfies Config;
