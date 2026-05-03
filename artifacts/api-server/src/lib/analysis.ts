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
  patternNotes: string;
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
    const years = papers.map((p) => p.year).sort();
    const mostRecentYear = Math.max(...years);

    const paperSummaries = papers.map((p) => {
      const text = p.extractedText ?? "(no extracted text — image file)";
      return `=== Year ${p.year} — ${p.fileName} ===\n${text.slice(0, 3000)}`;
    }).join("\n\n");

    const syllabusContext = syllabusTopics.length
      ? `\n\nSyllabus topics (${syllabusTopics.length} total): ${syllabusTopics.slice(0, 60).join(", ")}`
      : "\n\n(No syllabus provided — mark all topics inSyllabus: false)";

    const prompt = `You are an expert exam analyst and educator. Analyze these past exam papers for "${subject}" and extract a comprehensive topic analysis.
${syllabusContext}

Papers (years ${years.join(", ")}, most recent: ${mostRecentYear}):
${paperSummaries}

Return a JSON object with a "topics" array and a "summary" object. Each topic must have:
- name (string): concise, specific topic name (2-5 words)
- frequency (number): how many papers this topic appeared in (1–${papers.length})
- frequencyScore (number 0–10): normalized frequency score
- recencyScore (number 0–10): 10 = appeared in ${mostRecentYear}, decreasing for older years only
- marksWeightage (number 0–10): estimated marks importance based on question marks
- importanceScore (number 0–10): weighted formula: (frequencyScore*0.4 + recencyScore*0.35 + marksWeightage*0.25)
- questionTypes (string[]): subset of ["theory","numerical","definition","long_answer","mcq","case_study","diagram"]
- yearsAppeared (number[]): exact years this topic appeared
- difficultyLevel ("easy"|"medium"|"hard"): based on question complexity
- inSyllabus (boolean): true only if it clearly matches the syllabus topics above
- patternNotes (string): 1 sentence noting if it repeats every year, alternates, etc.
- practiceQuestions: array of 3–5 realistic exam-style questions, each with:
  - questionText (string): complete question as it would appear in an exam
  - questionType ("theory"|"numerical"|"definition"|"long_answer"|"mcq")
  - difficulty ("easy"|"medium"|"hard")
  - marksAllotted (number): realistic exam mark allocation (2, 4, 5, 8, 10, etc.)

The "summary" object must have:
- totalTopicsFound (number)
- dominantQuestionType (string): most common question type
- averageDifficulty ("easy"|"medium"|"hard")
- marksDistribution: {easy: number, medium: number, hard: number} as percentages
- keyPatterns (string[]): 2–3 sentences about recurring exam patterns

Extract 12–20 topics. Prioritize topics that repeat across multiple years. Respond with ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 6000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as { topics: AITopic[]; summary?: Record<string, unknown> };
    const aiTopics: AITopic[] = parsed.topics ?? [];

    let totalQuestions = 0;
    for (const t of aiTopics) {
      await db.insert(topicsTable).values({
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
          sourceYear: t.yearsAppeared[t.yearsAppeared.length - 1] ?? null,
          paperId: paperIds[0] ?? null,
        });
        totalQuestions++;
      }
    }

    const inSyllabusCount = aiTopics.filter((t) => t.inSyllabus).length;
    const syllabusCoverage = aiTopics.length > 0
      ? Math.round((inSyllabusCount / aiTopics.length) * 100)
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

    logger.info({ analysisId, topicCount: aiTopics.length, totalQuestions }, "Analysis completed");
  } catch (err) {
    logger.error({ analysisId, err }, "Analysis failed");
    await db.update(analysesTable).set({ status: "failed" }).where(eq(analysesTable.id, analysisId));
    await db.update(papersTable)
      .set({ status: "uploaded" })
      .where(inArray(papersTable.id, paperIds));
  }
}
