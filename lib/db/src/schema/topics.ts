import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  frequency: integer("frequency").notNull().default(0),
  frequencyScore: real("frequency_score").notNull().default(0),
  recencyScore: real("recency_score").notNull().default(0),
  marksWeightage: real("marks_weightage").notNull().default(0),
  importanceScore: real("importance_score").notNull().default(0),
  questionTypes: text("question_types").array().notNull().default([]),
  yearsAppeared: integer("years_appeared").array().notNull().default([]),
  difficultyLevel: text("difficulty_level").notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  inSyllabus: boolean("in_syllabus").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTopicSchema = createInsertSchema(topicsTable).omit({ id: true, createdAt: true });
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topicsTable.$inferSelect;
