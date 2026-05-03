import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { analysesTable } from "@workspace/db";
import {
  ListAnalysesQueryParams,
  TriggerAnalysisBody,
  GetAnalysisParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { runAnalysis } from "../lib/analysis";

const router: IRouter = Router();

router.get("/analysis", async (req, res) => {
  try {
    const query = ListAnalysesQueryParams.parse(req.query);
    const analyses = query.subject
      ? await db.select().from(analysesTable).where(eq(analysesTable.subject, query.subject))
      : await db.select().from(analysesTable);
    res.json(analyses);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list analyses" });
  }
});

router.post("/analysis", async (req, res) => {
  try {
    const body = TriggerAnalysisBody.parse(req.body);
    const [analysis] = await db.insert(analysesTable).values({
      subject: body.subject,
      status: "pending",
      paperIds: body.paperIds,
      syllabusId: body.syllabusId ?? null,
    }).returning();
    res.status(202).json(analysis);
    runAnalysis(analysis.id, body.paperIds, body.syllabusId ?? null).catch((err) => {
      console.error("Analysis failed", err);
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to trigger analysis" });
  }
});

router.get("/analysis/:id", async (req, res) => {
  try {
    const params = GetAnalysisParams.parse({ id: Number(req.params.id) });
    const [analysis] = await db.select().from(analysesTable).where(eq(analysesTable.id, params.id));
    if (!analysis) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }
    res.json(analysis);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get analysis" });
  }
});

export default router;
