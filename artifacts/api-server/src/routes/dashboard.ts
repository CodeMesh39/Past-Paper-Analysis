import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { papersTable, analysesTable, topicsTable } from "@workspace/db";
import {
  GetDashboardSummaryQueryParams,
  GetTopicFrequencyQueryParams,
  GetYearTrendsQueryParams,
  GetDifficultyDistributionQueryParams,
  GetSyllabusCoverageQueryParams,
} from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const query = GetDashboardSummaryQueryParams.parse(req.query);
    const paperConditions = query.subject ? [eq(papersTable.subject, query.subject)] : [];
    const papers = await db.select().from(papersTable).where(paperConditions.length ? and(...paperConditions) : undefined);
    const analysisConditions = query.subject ? [eq(analysesTable.subject, query.subject)] : [];
    const analyses = await db.select().from(analysesTable).where(analysisConditions.length ? and(...analysisConditions) : undefined);
    const completedAnalyses = analyses.filter((a) => a.status === "completed");
    const topicConditions = query.subject ? [eq(topicsTable.subject, query.subject)] : [];
    const topics = await db.select().from(topicsTable).where(topicConditions.length ? and(...topicConditions) : undefined);
    const totalTopics = topics.length;
    const syllabusCoverage = totalTopics > 0
      ? Math.round((topics.filter((t) => t.inSyllabus).length / totalTopics) * 100)
      : 0;
    const avgImportance = totalTopics > 0
      ? topics.reduce((sum, t) => sum + t.importanceScore, 0) / totalTopics
      : 0;
    res.json({
      totalPapers: papers.length,
      analyzedPapers: papers.filter((p) => p.status === "processed").length,
      totalTopics,
      highYieldTopics: topics.filter((t) => t.importanceScore >= 7).length,
      syllabusCoverage,
      avgImportanceScore: Math.round(avgImportance * 10) / 10,
      totalAnalyses: analyses.length,
      completedAnalyses: completedAnalyses.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

router.get("/dashboard/topic-frequency", async (req, res) => {
  try {
    const query = GetTopicFrequencyQueryParams.parse(req.query);
    const conditions = [];
    if (query.subject) conditions.push(eq(topicsTable.subject, query.subject));
    if (query.analysisId) conditions.push(eq(topicsTable.analysisId, query.analysisId));
    const topics = conditions.length
      ? await db.select().from(topicsTable).where(and(...conditions)).orderBy(desc(topicsTable.frequency)).limit(20)
      : await db.select().from(topicsTable).orderBy(desc(topicsTable.frequency)).limit(20);
    res.json(topics.map((t) => ({ topic: t.name, frequency: t.frequency, importanceScore: t.importanceScore })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get topic frequency" });
  }
});

router.get("/dashboard/year-trends", async (req, res) => {
  try {
    const query = GetYearTrendsQueryParams.parse(req.query);
    const conditions = query.subject ? [eq(papersTable.subject, query.subject)] : [];
    const papers = conditions.length
      ? await db.select().from(papersTable).where(and(...conditions))
      : await db.select().from(papersTable);
    const byYear: Record<number, { year: number; papers: number; questions: number }> = {};
    for (const p of papers) {
      if (!byYear[p.year]) byYear[p.year] = { year: p.year, papers: 0, questions: 0 };
      byYear[p.year].papers += 1;
      byYear[p.year].questions += p.questionCount ?? 0;
    }
    res.json(Object.values(byYear).sort((a, b) => a.year - b.year));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get year trends" });
  }
});

router.get("/dashboard/difficulty-distribution", async (req, res) => {
  try {
    const query = GetDifficultyDistributionQueryParams.parse(req.query);
    const conditions = [];
    if (query.subject) conditions.push(eq(topicsTable.subject, query.subject));
    if (query.analysisId) conditions.push(eq(topicsTable.analysisId, query.analysisId));
    const topics = conditions.length
      ? await db.select().from(topicsTable).where(and(...conditions))
      : await db.select().from(topicsTable);
    const dist: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    for (const t of topics) dist[t.difficultyLevel] = (dist[t.difficultyLevel] ?? 0) + 1;
    res.json([
      { difficulty: "easy", count: dist.easy },
      { difficulty: "medium", count: dist.medium },
      { difficulty: "hard", count: dist.hard },
    ]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get difficulty distribution" });
  }
});

router.get("/dashboard/syllabus-coverage", async (req, res) => {
  try {
    const query = GetSyllabusCoverageQueryParams.parse(req.query);
    const conditions = query.subject ? [eq(topicsTable.subject, query.subject)] : [];
    const topics = conditions.length
      ? await db.select().from(topicsTable).where(and(...conditions))
      : await db.select().from(topicsTable);
    const total = topics.length;
    const covered = topics.filter((t) => t.inSyllabus).length;
    const uncovered = total - covered;
    res.json({
      total,
      covered,
      uncovered,
      percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get syllabus coverage" });
  }
});

export default router;
