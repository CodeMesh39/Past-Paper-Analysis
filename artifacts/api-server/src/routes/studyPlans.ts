import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { studyPlansTable, topicsTable } from "@workspace/db";
import {
  CreateStudyPlanBody,
  GetStudyPlanParams,
  UpdateStudyPlanParams,
  UpdateStudyPlanBody,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import type { StudyDay } from "@workspace/db";

const router: IRouter = Router();

router.get("/studyplan", async (req, res) => {
  try {
    const plans = await db.select().from(studyPlansTable).orderBy(desc(studyPlansTable.createdAt));
    res.json(plans);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list study plans" });
  }
});

router.post("/studyplan", async (req, res) => {
  try {
    const body = CreateStudyPlanBody.parse(req.body);
    const topics = await db.select().from(topicsTable)
      .where(and(eq(topicsTable.analysisId, body.analysisId), eq(topicsTable.subject, body.subject)))
      .orderBy(desc(topicsTable.importanceScore));

    const examDate = new Date(body.examDate);
    const today = new Date();
    const totalDays = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const topicNames = topics.map((t) => t.name);
    const regularDays = Math.max(1, totalDays - 2);
    const topicsPerDay = Math.ceil(topicNames.length / regularDays);
    const days: StudyDay[] = [];
    let topicIndex = 0;
    for (let d = 0; d < totalDays; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const isRevision = d >= totalDays - 2;
      const dayTopics = isRevision
        ? topicNames.slice(0, Math.ceil(topicNames.length / 2))
        : topicNames.slice(topicIndex, topicIndex + topicsPerDay);
      if (!isRevision) topicIndex += topicsPerDay;
      days.push({
        day: d + 1,
        date: date.toISOString().split("T")[0],
        topics: dayTopics,
        isRevision,
        isCompleted: false,
        hours: body.hoursPerDay,
      });
    }
    const examDateStr = body.examDate instanceof Date
      ? body.examDate.toISOString().split("T")[0]
      : String(body.examDate);
    const [plan] = await db.insert(studyPlansTable).values({
      subject: body.subject,
      examDate: examDateStr,
      hoursPerDay: body.hoursPerDay,
      totalDays,
      analysisId: body.analysisId,
      days,
    }).returning();
    res.status(201).json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create study plan" });
  }
});

router.get("/studyplan/:id", async (req, res) => {
  try {
    const params = GetStudyPlanParams.parse({ id: Number(req.params.id) });
    const [plan] = await db.select().from(studyPlansTable).where(eq(studyPlansTable.id, params.id));
    if (!plan) {
      res.status(404).json({ error: "Study plan not found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get study plan" });
  }
});

router.patch("/studyplan/:id", async (req, res) => {
  try {
    const params = UpdateStudyPlanParams.parse({ id: Number(req.params.id) });
    const body = UpdateStudyPlanBody.parse(req.body);
    const [plan] = await db.select().from(studyPlansTable).where(eq(studyPlansTable.id, params.id));
    if (!plan) {
      res.status(404).json({ error: "Study plan not found" });
      return;
    }
    const days = plan.days as StudyDay[];
    days[body.dayIndex] = { ...days[body.dayIndex], isCompleted: body.isCompleted };
    const [updated] = await db.update(studyPlansTable).set({ days }).where(eq(studyPlansTable.id, params.id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update study plan" });
  }
});

export default router;
