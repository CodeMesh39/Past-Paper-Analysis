import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { practiceQuestionsTable } from "@workspace/db";
import { ListPracticeQuestionsQueryParams } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/questions", async (req, res) => {
  try {
    const query = ListPracticeQuestionsQueryParams.parse(req.query);
    const conditions = [];
    if (query.topic) conditions.push(eq(practiceQuestionsTable.topic, query.topic));
    if (query.subject) conditions.push(eq(practiceQuestionsTable.subject, query.subject));
    const questions = conditions.length
      ? await db.select().from(practiceQuestionsTable).where(and(...conditions))
      : await db.select().from(practiceQuestionsTable);
    res.json(questions);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list practice questions" });
  }
});

export default router;
