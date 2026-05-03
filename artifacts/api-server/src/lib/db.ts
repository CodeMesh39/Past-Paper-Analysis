import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@workspace/db";
import { logger } from "./logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err: Error) => {
  logger.error(err, "Database pool error");
});

export const db = drizzle(pool, { schema });
