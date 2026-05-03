import { Router, type IRouter } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { db } from "../lib/db";
import { syllabiTable } from "@workspace/db";
import { GetSyllabusParams } from "@workspace/api-zod";
import { z } from "zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/syllabus", async (req, res) => {
  try {
    const syllabi = await db.select().from(syllabiTable);
    res.json(syllabi);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list syllabi" });
  }
});

const uploadSyllabusBodySchema = z.object({
  subject: z.string().min(1),
});

router.post("/syllabus", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File is required" });
      return;
    }
    const body = uploadSyllabusBodySchema.parse({
      subject: req.body.subject,
    });
    let topics: string[] = [];
    if (req.file.mimetype === "application/pdf") {
      try {
        const parsed = await pdfParse(req.file.buffer);
        const lines = parsed.text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 3 && l.length < 100);
        topics = [...new Set(lines.slice(0, 60))];
      } catch {
        topics = [];
      }
    }
    const [syllabus] = await db.insert(syllabiTable).values({
      subject: body.subject,
      fileName: req.file.originalname,
      topics,
    }).returning();
    res.status(201).json(syllabus);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to upload syllabus" });
  }
});

router.get("/syllabus/:id", async (req, res) => {
  try {
    const params = GetSyllabusParams.parse({ id: Number(req.params.id) });
    const [syllabus] = await db.select().from(syllabiTable).where(eq(syllabiTable.id, params.id));
    if (!syllabus) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }
    res.json(syllabus);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get syllabus" });
  }
});

router.delete("/syllabus/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [syllabus] = await db.delete(syllabiTable).where(eq(syllabiTable.id, id)).returning();
    if (!syllabus) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete syllabus" });
  }
});

export default router;
