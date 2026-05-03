import { Router, type IRouter } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { db } from "../lib/db";
import { papersTable } from "@workspace/db";
import {
  ListPapersQueryParams,
  GetPaperParams,
  DeletePaperParams,
} from "@workspace/api-zod";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get("/papers", async (req, res) => {
  try {
    const query = ListPapersQueryParams.parse(req.query);
    const conditions = [];
    if (query.subject) conditions.push(eq(papersTable.subject, query.subject));
    if (query.year) conditions.push(eq(papersTable.year, query.year));
    const papers = conditions.length
      ? await db.select().from(papersTable).where(and(...conditions))
      : await db.select().from(papersTable);
    res.json(papers);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list papers" });
  }
});

const uploadPaperBodySchema = z.object({
  subject: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
});

router.post("/papers", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File is required" });
      return;
    }
    const body = uploadPaperBodySchema.parse({
      subject: req.body.subject,
      year: req.body.year,
    });
    const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
    let extractedText: string | null = null;
    if (fileType === "pdf") {
      try {
        const parsed = await pdfParse(req.file.buffer);
        extractedText = parsed.text;
      } catch {
        extractedText = null;
      }
    }
    const [paper] = await db.insert(papersTable).values({
      subject: body.subject,
      year: body.year,
      fileName: req.file.originalname,
      fileType,
      extractedText,
      status: "uploaded",
    }).returning();
    res.status(201).json(paper);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to upload paper" });
  }
});

router.get("/papers/:id", async (req, res) => {
  try {
    const params = GetPaperParams.parse({ id: Number(req.params.id) });
    const [paper] = await db.select().from(papersTable).where(eq(papersTable.id, params.id));
    if (!paper) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.json(paper);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get paper" });
  }
});

router.delete("/papers/:id", async (req, res) => {
  try {
    const params = DeletePaperParams.parse({ id: Number(req.params.id) });
    const [paper] = await db.delete(papersTable).where(eq(papersTable.id, params.id)).returning();
    if (!paper) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete paper" });
  }
});

export default router;
