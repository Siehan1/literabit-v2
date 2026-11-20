import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  difficultyLevelEnum,
  materialStatusEnum,
  readingStatusEnum,
  roleEnum,
  skillCategoryEnum,
} from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    parentPinHash: text("parent_pin_hash"),
    role: roleEnum("role").default("PARENT").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_uidx").on(table.email)],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    birthYear: integer("birth_year").notNull(),
    avatar: text("avatar").notNull(),
    recommendedLevel: difficultyLevelEnum("recommended_level").default("LEVEL_1").notNull(),
    totalXp: integer("total_xp").default(0).notNull(),
    level: integer("level").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("students_parent_id_idx").on(table.parentId)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_slug_uidx").on(table.slug)],
);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
    learningObjective: text("learning_objective").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    coverImageUrl: text("cover_image_url"),
    status: materialStatusEnum("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("materials_slug_uidx").on(table.slug),
    index("materials_status_level_category_idx").on(
      table.status,
      table.difficultyLevel,
      table.categoryId,
    ),
  ],
);

export const materialSections = pgTable(
  "material_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    sectionIndex: integer("section_index").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
  },
  (table) => [
    uniqueIndex("material_sections_material_idx_uidx").on(table.materialId, table.sectionIndex),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    questionOrder: integer("question_order").default(0).notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctOptionIndex: integer("correct_option_index").notNull(),
    explanation: text("explanation").notNull(),
    skillCategory: skillCategoryEnum("skill_category").notNull(),
  },
  (table) => [index("questions_material_order_idx").on(table.materialId, table.questionOrder)],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    status: readingStatusEnum("status").default("IN_PROGRESS").notNull(),
    lastSectionIndex: integer("last_section_index").default(0).notNull(),
    firstScore: integer("first_score"),
    bestScore: integer("best_score"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reading_progress_student_material_uidx").on(table.studentId, table.materialId),
  ],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    correctCount: integer("correct_count").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    xpAwarded: integer("xp_awarded").default(0).notNull(),
    isFirstAttempt: boolean("is_first_attempt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("quiz_attempts_student_created_idx").on(table.studentId, table.createdAt),
    index("quiz_attempts_student_material_idx").on(table.studentId, table.materialId),
  ],
);

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    skillCategory: skillCategoryEnum("skill_category").notNull(),
    selectedOptionIndex: integer("selected_option_index").notNull(),
    isCorrect: boolean("is_correct").notNull(),
  },
  (table) => [
    uniqueIndex("attempt_answers_attempt_question_uidx").on(table.attemptId, table.questionId),
  ],
);

export const xpTransactions = pgTable(
  "xp_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("xp_transactions_student_material_uidx").on(table.studentId, table.materialId),
  ],
);
