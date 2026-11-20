import { z } from "zod";

const serverEnvSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_VERSION: z.string().trim().min(1).default("0.1.0"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv !== undefined) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    APP_ENV: process.env.APP_ENV,
    APP_VERSION: process.env.APP_VERSION,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${formatted}`);
  }

  cachedServerEnv = Object.freeze(parsed.data);
  return cachedServerEnv;
}

export function resetServerEnvCacheForTests(): void {
  cachedServerEnv = undefined;
}
