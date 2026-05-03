import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { topicsTable } from "@workspace/db";
import {
  ListTopicsQueryParams,
  GetHighYieldTopicsQueryParams,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/topics", async (req, res) => {
  try {
    const query = ListTopicsQueryParams.parse(req.query);
    const conditions = [];
    if (query.subject) conditions.push(eq(topicsTable.subject, query.subject));
    if (query.analysisId) conditions.push(eq(topicsTable.analysisId, query.analysisId));
    const topics = conditions.length
      ? await db.select().from(topicsTable).where(and(...conditions))
      : await db.select().from(topicsTable);
    res.json(topics);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list topics" });
  }
});

router.get("/topics/high-yield", async (req, res) => {
  try {
    const query = GetHighYieldTopicsQueryParams.parse(req.query);
    const limit = query.limit ?? 10;
    const conditions = [];
    if (query.subject) conditions.push(eq(topicsTable.subject, query.subject));
    const topics = conditions.length
      ? await db.select().from(topicsTable).where(and(...conditions)).orderBy(desc(topicsTable.importanceScore)).limit(limit)
      : await db.select().from(topicsTable).orderBy(desc(topicsTable.importanceScore)).limit(limit);
    res.json(topics);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get high-yield topics" });
  }
});

export default router;
