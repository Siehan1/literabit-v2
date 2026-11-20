import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import { getServerEnv } from "../lib/env";
import * as schema from "./schema";

export type LiterabitSchema = typeof schema;

export type DatabaseClient = {
  db: PostgresJsDatabase<LiterabitSchema>;
  sql: Sql;
};

export function createDatabaseClient(databaseUrl: string): DatabaseClient {
  const sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
    prepare: false,
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export async function checkDatabase(client: DatabaseClient): Promise<void> {
  await client.sql`select 1 as healthy`;
}

export async function closeDatabase(client: DatabaseClient): Promise<void> {
  await client.sql.end({ timeout: 5 });
}

const globalForDb = globalThis as unknown as {
  literabitDbClient?: DatabaseClient;
};

export function getDbClient(): DatabaseClient {
  if (globalForDb.literabitDbClient !== undefined) {
    return globalForDb.literabitDbClient;
  }

  const { DATABASE_URL } = getServerEnv();
  const client = createDatabaseClient(DATABASE_URL);
  if (process.env.NODE_ENV !== "production") {
    globalForDb.literabitDbClient = client;
  }
  return client;
}

export function getDb(): PostgresJsDatabase<LiterabitSchema> {
  return getDbClient().db;
}

export * from "./migrations";
export * from "./schema";
