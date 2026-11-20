import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { closeDatabase, createDatabaseClient } from "./index";
import { runMigrations } from "./migrations";

const databaseUrl = Bun.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl.length === 0) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));
const journalFile = fileURLToPath(new URL("./migrations/meta/_journal.json", import.meta.url));

if (!existsSync(journalFile)) {
  console.info(
    "No Drizzle migrations found yet in src/db/migrations; run `bun run db:generate` first.",
  );
  process.exit(0);
}

const client = createDatabaseClient(databaseUrl);
try {
  await runMigrations(client, migrationsFolder);
  console.info("Database migrations completed");
} finally {
  await closeDatabase(client);
}
