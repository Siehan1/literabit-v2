import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["PARENT", "ADMIN"]);

export const difficultyLevelEnum = pgEnum("difficulty_level", ["LEVEL_1", "LEVEL_2", "LEVEL_3"]);

export const materialStatusEnum = pgEnum("material_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const skillCategoryEnum = pgEnum("skill_category", [
  "LITERAL",
  "INFERENTIAL",
  "VOCABULARY",
  "MAIN_IDEA",
]);

export const readingStatusEnum = pgEnum("reading_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);
