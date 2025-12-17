/* personal-assistant-thing/src/lib/db/index.ts */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres client
const client = postgres(connectionString, {
  max: 1, // Limit connection pool for serverless environments
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Close database connection (useful for cleanup)
export async function closeDatabase() {
  await client.end();
}
