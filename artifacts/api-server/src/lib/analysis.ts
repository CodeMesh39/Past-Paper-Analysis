import OpenAI from "openai";
import { db } from "./db";
import { analysesTable, papersTable, syllabiTable, topicsTable, practiceQuestionsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface AITopic {
  name: string;
  frequency: number;
  frequencyScore: number;
  recencyScore: number;
  marksWeightage: number;
  importanceScore: number;
  questionTypes: string[];
  yearsAppeared: number[];
  difficultyLevel: "easy" | "medium" | "hard";
  inSyllabus: boolean;
  practiceQuestions: Array<{
    questionText: string;
    questionType: "theory" | "numerical" | "definition" | "long_answer" | "mcq";
    difficulty: "easy" | "medium" | "hard";
    marksAllotted: number;
  }>;
}

export async function runAnalysis(analysisId: number, paperIds: number[], syllabusId: number | null) {
  try {
    await db.update(analysesTable).set({ status: "processing" }).where(eq(analysesTable.id, analysisId));

    const papers = await db.select().from(papersTable).where(inArray(papersTable.id, paperIds));
    let syllabusTopics: string[] = [];
    if (syllabusId) {
      const [syl] = await db.select().from(syllabiTable).where(eq(syllabiTable.id, syllabusId));
      if (syl) syllabusTopics = syl.topics;
    }

    const subject = papers[0]?.subject ?? "Unknown";
    const paperSummaries = papers.map((p) => {
      const text = p.extractedText ?? "(no extracted text — image file)";
      return `Year ${p.year} — ${p.fileName}:\n${text.slice(0, 2000)}`;
    }).join("\n\n---\n\n");

    const syllabusContext = syllabusTopics.length
      ? `\nSyllabus topics: ${syllabusTopics.slice(0, 40).join(", ")}`
      : "";

    const prompt = `You are an expert exam analyst. Analyze these past exam papers for the subject "${subject}" and extract the most important topics.${syllabusContext}

Papers:
${paperSummaries}

Return a JSON object with a "topics" array. Each topic must have:
- name (string): concise topic name
- frequency (number): how many times it appeared across papers (1-${papers.length})
- frequencyScore (number 0-10): normalized frequency score
- recencyScore (number 0-10): higher if appeared in more recent years
- marksWeightage (number 0-10): estimated marks importance
- importanceScore (number 0-10): overall priority for studying
- questionTypes (string[]): types like ["theory", "numerical", "definition", "long_answer", "mcq"]
- yearsAppeared (number[]): list of years this topic appeared
- difficultyLevel ("easy"|"medium"|"hard")
- inSyllabus (boolean): whether this matches the provided syllabus
- practiceQuestions (array of 1-3 questions): each with questionText, questionType, difficulty, marksAllotted (number)

Extract 10-20 topics. Respond with ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as { topics: AITopic[] };
    const aiTopics: AITopic[] = parsed.topics ?? [];

    let totalQuestions = 0;
    for (const t of aiTopics) {
      const [inserted] = await db.insert(topicsTable).values({
        analysisId,
        name: t.name,
        subject,
        frequency: t.frequency,
        frequencyScore: t.frequencyScore,
        recencyScore: t.recencyScore,
        marksWeightage: t.marksWeightage,
        importanceScore: t.importanceScore,
        questionTypes: t.questionTypes,
        yearsAppeared: t.yearsAppeared,
        difficultyLevel: t.difficultyLevel,
        inSyllabus: t.inSyllabus,
      }).returning();

      for (const q of t.practiceQuestions ?? []) {
        await db.insert(practiceQuestionsTable).values({
          topic: t.name,
          subject,
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          marksAllotted: q.marksAllotted,
          sourceYear: t.yearsAppeared[0] ?? null,
          paperId: paperIds[0] ?? null,
        });
        totalQuestions++;
      }
    }

    const inSyllabus = aiTopics.filter((t) => t.inSyllabus).length;
    const syllabusCoverage = aiTopics.length > 0
      ? (inSyllabus / aiTopics.length) * 100
      : null;

    await db.update(papersTable)
      .set({ status: "processed" })
      .where(inArray(papersTable.id, paperIds));

    await db.update(analysesTable).set({
      status: "completed",
      topicCount: aiTopics.length,
      questionCount: totalQuestions,
      syllabusCoverage,
      completedAt: new Date(),
    }).where(eq(analysesTable.id, analysisId));

    logger.info({ analysisId, topicCount: aiTopics.length }, "Analysis completed");
  } catch (err) {
    logger.error({ analysisId, err }, "Analysis failed");
    await db.update(analysesTable).set({ status: "failed" }).where(eq(analysesTable.id, analysisId));
  }
}
