import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { categories, closeDatabase, createDatabaseClient, users } from "./index";

const DEFAULT_CATEGORIES = [
  {
    name: "Cerita Rakyat",
    slug: "cerita-rakyat",
    description:
      "Kisah Nusantara dan fabel dengan pesan moral untuk melatih pemahaman alur dan tokoh.",
  },
  {
    name: "Sains & Alam",
    slug: "sains-dan-alam",
    description: "Bacaan informatif tentang hewan, tumbuhan, cuaca, dan fenomena alam sekitar.",
  },
  {
    name: "Kehidupan Sehari-hari",
    slug: "kehidupan-sehari-hari",
    description: "Cerita pendek tentang keluarga, sekolah, persahabatan, dan kebiasaan baik.",
  },
] as const;

export async function runSeed(): Promise<void> {
  const databaseUrl = Bun.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("DATABASE_URL is required to run database seed");
  }

  const appEnv = Bun.env.APP_ENV ?? "development";
  if (appEnv === "production") {
    throw new Error("Refusing to run development seed when APP_ENV=production");
  }

  const adminEmail = (Bun.env.SEED_ADMIN_EMAIL ?? "admin@literabit.local").trim().toLowerCase();
  const adminPassword = Bun.env.SEED_ADMIN_PASSWORD ?? "AdminLiterabit123!";
  const client = createDatabaseClient(databaseUrl);

  try {
    const existingAdmin = await client.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await hash(adminPassword, 10);
      await client.db.insert(users).values({
        fullName: "Admin Literabit",
        email: adminEmail,
        passwordHash,
        parentPinHash: null,
        role: "ADMIN",
      });
      console.info(`[seed] Created default ADMIN account (${adminEmail})`);
    } else {
      console.info(`[seed] ADMIN account already exists (${adminEmail})`);
    }

    for (const category of DEFAULT_CATEGORIES) {
      await client.db
        .insert(categories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: true,
        })
        .onConflictDoNothing({ target: categories.slug });
    }

    console.info("[seed] Default categories ensured");
  } finally {
    await closeDatabase(client);
  }
}

if (import.meta.main) {
  await runSeed();
}
