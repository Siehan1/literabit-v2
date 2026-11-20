import { relations } from "drizzle-orm";
import {
  attemptAnswers,
  categories,
  materials,
  materialSections,
  questions,
  quizAttempts,
  readingProgress,
  students,
  users,
  xpTransactions,
} from "./tables";

export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
  }),
  readingProgress: many(readingProgress),
  quizAttempts: many(quizAttempts),
  xpTransactions: many(xpTransactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  category: one(categories, {
    fields: [materials.categoryId],
    references: [categories.id],
  }),
  sections: many(materialSections),
  questions: many(questions),
  readingProgress: many(readingProgress),
  quizAttempts: many(quizAttempts),
  xpTransactions: many(xpTransactions),
}));

export const materialSectionsRelations = relations(materialSections, ({ one }) => ({
  material: one(materials, {
    fields: [materialSections.materialId],
    references: [materials.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  material: one(materials, {
    fields: [questions.materialId],
    references: [materials.id],
  }),
  attemptAnswers: many(attemptAnswers),
}));

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  student: one(students, {
    fields: [readingProgress.studentId],
    references: [students.id],
  }),
  material: one(materials, {
    fields: [readingProgress.materialId],
    references: [materials.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  student: one(students, {
    fields: [quizAttempts.studentId],
    references: [students.id],
  }),
  material: one(materials, {
    fields: [quizAttempts.materialId],
    references: [materials.id],
  }),
  answers: many(attemptAnswers),
  xpTransactions: many(xpTransactions),
}));

export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [attemptAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [attemptAnswers.questionId],
    references: [questions.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  student: one(students, {
    fields: [xpTransactions.studentId],
    references: [students.id],
  }),
  material: one(materials, {
    fields: [xpTransactions.materialId],
    references: [materials.id],
  }),
  attempt: one(quizAttempts, {
    fields: [xpTransactions.attemptId],
    references: [quizAttempts.id],
  }),
}));
