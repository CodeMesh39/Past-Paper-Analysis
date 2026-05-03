import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const papersTable = pgTable("papers", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  year: integer("year").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull().$type<"pdf" | "image">(),
  extractedText: text("extracted_text"),
  questionCount: integer("question_count"),
  status: text("status").notNull().default("uploaded").$type<"uploaded" | "processing" | "processed" | "failed">(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaperSchema = createInsertSchema(papersTable).omit({ id: true, createdAt: true });
export type InsertPaper = z.infer<typeof insertPaperSchema>;
export type Paper = typeof papersTable.$inferSelect;
