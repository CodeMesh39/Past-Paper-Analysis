import { pgTable, serial, text, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface StudyDay {
  day: number;
  date: string;
  topics: string[];
  isRevision: boolean;
  isCompleted: boolean;
  hours: number;
}

export const studyPlansTable = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  examDate: text("exam_date").notNull(),
  hoursPerDay: real("hours_per_day").notNull(),
  totalDays: integer("total_days").notNull(),
  analysisId: integer("analysis_id").notNull(),
  days: json("days").notNull().$type<StudyDay[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlansTable).omit({ id: true, createdAt: true });
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlansTable.$inferSelect;
