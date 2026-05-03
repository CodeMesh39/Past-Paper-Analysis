import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const practiceQuestionsTable = pgTable("practice_questions", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().$type<"theory" | "numerical" | "definition" | "long_answer" | "mcq">(),
  difficulty: text("difficulty").notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  marksAllotted: integer("marks_allotted"),
  sourceYear: integer("source_year"),
  paperId: integer("paper_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPracticeQuestionSchema = createInsertSchema(practiceQuestionsTable).omit({ id: true, createdAt: true });
export type InsertPracticeQuestion = z.infer<typeof insertPracticeQuestionSchema>;
export type PracticeQuestion = typeof practiceQuestionsTable.$inferSelect;
