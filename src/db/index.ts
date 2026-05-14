import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Schema = typeof schema;

// Lazy singleton — only connects when a query is first run (never at build time)
let _db: NeonHttpDatabase<Schema> | null = null;

function getDb(): NeonHttpDatabase<Schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db: NeonHttpDatabase<Schema> = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});

export type DB = NeonHttpDatabase<Schema>;
