import { pgTable, serial, text, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("pending").$type<"pending" | "processing" | "completed" | "failed">(),
  paperIds: integer("paper_ids").array().notNull().default([]),
  syllabusId: integer("syllabus_id"),
  syllabusCoverage: real("syllabus_coverage"),
  topicCount: integer("topic_count"),
  questionCount: integer("question_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
