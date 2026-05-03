# Past Paper Analyzer

## Overview

AI-powered exam prep tool for students. Upload past papers (PDF/image) and a syllabus, trigger AI analysis via OpenAI, and get ranked high-yield topics, analytics charts, a smart study planner, and practice questions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `artifacts/past-paper-analyzer`, path `/`)
- **Backend**: Express 5 (artifact: `artifacts/api-server`, path `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Build**: esbuild

## Architecture

```
lib/
  api-spec/          # OpenAPI spec + orval codegen config
  api-client-react/  # Generated React Query hooks (from openapi.yaml)
  api-zod/           # Generated Zod validators (from openapi.yaml)
  db/                # Drizzle schema + migration config
    src/schema/
      papers.ts, syllabi.ts, analyses.ts, topics.ts, studyPlans.ts, practiceQuestions.ts

artifacts/
  api-server/        # Express API (port $PORT, serves /api/*)
    src/
      routes/        # papers, syllabi, analyses, topics, studyPlans, questions, dashboard
      lib/
        db.ts        # Drizzle + pg pool
        analysis.ts  # OpenAI analysis engine
  past-paper-analyzer/ # React+Vite frontend (port $PORT, serves /)
```

## API Routes (all prefixed with /api)

- `GET/POST /papers`, `GET/DELETE /papers/:id`
- `GET/POST /syllabus`, `GET /syllabus/:id`
- `GET/POST /analysis`, `GET /analysis/:id`
- `GET /topics`, `GET /topics/high-yield`
- `GET/POST /studyplan`, `GET /studyplan/:id`, `PATCH /studyplan/:id`
- `GET /questions`
- `GET /dashboard/summary|topic-frequency|year-trends|difficulty-distribution|syllabus-coverage`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- Orval `zod` output uses `mode: "single"` with `target: "generated/api.ts"` — no separate types folder
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (not types)
- Analysis runs asynchronously after POST /analysis returns 202
- File uploads use `multer` with memory storage; PDFs are parsed with `pdf-parse`
