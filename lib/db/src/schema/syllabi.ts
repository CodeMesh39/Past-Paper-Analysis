import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syllabiTable = pgTable("syllabi", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  fileName: text("file_name").notNull(),
  topics: text("topics").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSyllabusSchema = createInsertSchema(syllabiTable).omit({ id: true, createdAt: true });
export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;
export type Syllabus = typeof syllabiTable.$inferSelect;
