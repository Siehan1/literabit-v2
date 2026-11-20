import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import {
  categories,
  checkDatabase,
  closeDatabase,
  createDatabaseClient,
  materials,
  quizAttempts,
  students,
  users,
  xpTransactions,
} from "../../src/db";
import type { DatabaseClient } from "../../src/db";
import { assertDisposableTestDatabase } from "../helpers/disposable-database";

const shouldRunIntegration = Bun.env.RUN_INTEGRATION_TESTS === "1";
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration("database foundation integration", () => {
  let client: DatabaseClient;

  beforeAll(() => {
    const databaseUrl = Bun.env.TEST_DATABASE_URL ?? Bun.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl.length === 0) {
      throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for integration tests");
    }
    assertDisposableTestDatabase(databaseUrl);
    client = createDatabaseClient(databaseUrl);
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  test("connects to disposable PostgreSQL database with migrated schema", async () => {
    await checkDatabase(client);

    const rows = await client.sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const tableNames = new Set(rows.map((row) => row.table_name));

    for (const expectedTable of [
      "users",
      "students",
      "categories",
      "materials",
      "material_sections",
      "questions",
      "reading_progress",
      "quiz_attempts",
      "attempt_answers",
      "xp_transactions",
    ]) {
      expect(tableNames.has(expectedTable)).toBe(true);
    }
  });

  test("enforces uniqueIndex on xp_transactions(student_id, material_id)", async () => {
    const suffix = crypto.randomUUID();
    const [parent] = await client.db
      .insert(users)
      .values({
        fullName: "Test Parent",
        email: `parent-${suffix}@literabit.test`,
        passwordHash: "hashed-password",
        parentPinHash: "hashed-pin",
        role: "PARENT",
      })
      .returning({ id: users.id });

    if (parent === undefined) {
      throw new Error("Failed to insert test parent");
    }

    try {
      const [student] = await client.db
        .insert(students)
        .values({
          parentId: parent.id,
          displayName: "Anak Uji",
          birthYear: 2017,
          avatar: "owl",
          recommendedLevel: "LEVEL_1",
        })
        .returning({ id: students.id });

      const [category] = await client.db
        .insert(categories)
        .values({
          name: `Kategori ${suffix}`,
          slug: `kategori-${suffix}`,
          isActive: true,
        })
        .returning({ id: categories.id });

      if (student === undefined || category === undefined) {
        throw new Error("Failed to insert student or category");
      }

      const [material] = await client.db
        .insert(materials)
        .values({
          categoryId: category.id,
          title: "Materi Uji",
          slug: `materi-${suffix}`,
          difficultyLevel: "LEVEL_1",
          learningObjective: "Memahami teks uji",
          estimatedMinutes: 5,
          status: "PUBLISHED",
        })
        .returning({ id: materials.id });

      if (material === undefined) {
        throw new Error("Failed to insert material");
      }

      const [attempt1] = await client.db
        .insert(quizAttempts)
        .values({
          studentId: student.id,
          materialId: material.id,
          score: 80,
          correctCount: 4,
          totalQuestions: 5,
          xpAwarded: 60,
          isFirstAttempt: true,
        })
        .returning({ id: quizAttempts.id });

      const [attempt2] = await client.db
        .insert(quizAttempts)
        .values({
          studentId: student.id,
          materialId: material.id,
          score: 100,
          correctCount: 5,
          totalQuestions: 5,
          xpAwarded: 0,
          isFirstAttempt: false,
        })
        .returning({ id: quizAttempts.id });

      if (attempt1 === undefined || attempt2 === undefined) {
        throw new Error("Failed to insert quiz attempts");
      }

      const firstInsert = await client.db
        .insert(xpTransactions)
        .values({
          studentId: student.id,
          materialId: material.id,
          attemptId: attempt1.id,
          amount: 60,
        })
        .onConflictDoNothing({ target: [xpTransactions.studentId, xpTransactions.materialId] })
        .returning({ id: xpTransactions.id });

      const retakeInsert = await client.db
        .insert(xpTransactions)
        .values({
          studentId: student.id,
          materialId: material.id,
          attemptId: attempt2.id,
          amount: 70,
        })
        .onConflictDoNothing({ target: [xpTransactions.studentId, xpTransactions.materialId] })
        .returning({ id: xpTransactions.id });

      expect(firstInsert.length).toBe(1);
      expect(retakeInsert.length).toBe(0);

      await client.db.delete(materials).where(eq(materials.id, material.id));
      await client.db.delete(categories).where(eq(categories.id, category.id));
    } finally {
      await client.db.delete(users).where(eq(users.id, parent.id));
    }
  });
});
