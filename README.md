# PastPaper AI — AI-Powered Exam Intelligence

> Hackathon submission — decode your past papers, study smarter.

Upload past exam papers and let GPT-4o-mini extract high-yield topics, map syllabus coverage, generate practice questions, and build a personalised day-by-day study plan.

---

## Problem Statement

Students preparing for exams waste hours guessing which topics matter most. Past papers hold the answer — but manually scanning years of papers to find patterns, rank topics, and plan revision is tedious and error-prone. PastPaper AI automates the entire process in seconds.

---

## Features

| Feature | Description |
|---|---|
| **AI Paper Analysis** | GPT-4o-mini extracts topics, detects patterns, identifies question types, marks distribution, and difficulty level |
| **Topic Ranking** | Importance score = frequency × recency × marks weightage |
| **Syllabus Mapping** | Cross-reference extracted topics against your uploaded syllabus — see coverage % and missing topics |
| **Smart Study Planner** | Day-by-day schedule prioritised by importance score, with revision days and progress tracking |
| **Practice Questions** | AI generates 3–5 exam-style questions per topic with type, difficulty, and mark allocation |
| **Analytics Dashboard** | Topic frequency charts, yearly trends, difficulty distribution, syllabus heatmap, top-topic cards |
| **Export** | Print-to-PDF report and JSON download with full analysis data |
| **Drag & Drop Upload** | PDF and image file uploads with drag-and-drop support |
| **Mobile Responsive** | Bottom navigation for mobile, responsive cards and charts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Express.js 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT-4o-mini via Replit AI Integrations |
| Charts | Recharts |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
artifacts/
  api-server/              # Express.js backend
    src/
      routes/              # API route handlers (papers, syllabi, analyses, topics, planner, dashboard)
      lib/
        analysis.ts        # OpenAI analysis pipeline
        db.ts              # Drizzle database connection
        logger.ts          # Pino logger
  past-paper-analyzer/     # React frontend
    src/
      pages/               # Route pages (dashboard, upload, analysis, planner, topics, questions, export)
      components/          # Shared UI components and layout
      hooks/               # Custom React hooks
      lib/                 # Utility functions

lib/
  api-spec/                # OpenAPI specification (source of truth)
  api-zod/                 # Zod validation schemas (generated)
  api-client-react/        # React Query hooks (generated)
  db/                      # Drizzle schema & migrations
```

---

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <repo-folder>
pnpm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pastpaper
SESSION_SECRET=your-secret-here
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
PORT=8080
```

> **On Replit:** These are configured automatically via Replit Secrets and AI Integrations — no manual setup needed.

### 3. Run database migrations

```bash
pnpm --filter @workspace/db run migrate
```

### 4. Start the development servers

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/past-paper-analyzer run dev
```

The app is available at `http://localhost:5173`.

---

## API Reference

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET/POST` | `/api/papers` | List / upload past papers |
| `DELETE` | `/api/papers/:id` | Delete a paper |
| `GET/POST` | `/api/syllabus` | List / upload syllabi |
| `GET` | `/api/syllabus/:id` | Get a syllabus |
| `DELETE` | `/api/syllabus/:id` | Delete a syllabus |
| `GET/POST` | `/api/analysis` | List / trigger AI analysis |
| `GET` | `/api/analysis/:id` | Get analysis status/result |
| `GET` | `/api/topics` | List all extracted topics |
| `GET` | `/api/topics/high-yield` | Get ranked high-yield topics |
| `GET` | `/api/questions` | List practice questions |
| `GET/POST` | `/api/studyplan` | List / create study plans |
| `PATCH` | `/api/studyplan/:id` | Mark a day complete |
| `DELETE` | `/api/studyplan/:id` | Delete a study plan |
| `GET` | `/api/dashboard/summary` | Dashboard KPIs |
| `GET` | `/api/dashboard/topic-frequency` | Topic frequency data |
| `GET` | `/api/dashboard/year-trends` | Yearly trend data |
| `GET` | `/api/dashboard/difficulty-distribution` | Difficulty breakdown |
| `GET` | `/api/dashboard/syllabus-coverage` | Syllabus coverage stats |

---

## Usage Guide

1. **Upload Papers** (`/upload`) — Upload one or more past exam papers (PDF or image)
2. **Upload Syllabus** (`/syllabus`) — Upload your syllabus for coverage tracking (optional but recommended)
3. **Run Analysis** (`/analysis`) — Select papers, optionally link a syllabus, then trigger AI analysis
4. **View Results**:
   - **Dashboard** — Charts and KPIs across all your data
   - **High-Yield Topics** — Ranked topic leaderboard with importance scores
   - **Practice Questions** — Exam-style questions grouped by topic
   - **Study Planner** — Create a day-by-day schedule based on topic priority
   - **Export** — Generate a printable PDF report or download JSON data

### Tips for best results

- Upload multiple years of past papers (5+ recommended) for better trend detection
- Use PDF files with selectable text for highest quality extraction
- Always link a syllabus to unlock coverage percentage and missing topics
- After analysis, go to the planner and set your exam date to auto-generate a schedule

---

## Deployment (Replit)

1. Fork or import this project into Replit
2. Configure Replit AI Integrations (OpenAI) from the integrations panel
3. Set `SESSION_SECRET` in Replit Secrets
4. Click **Deploy** — Replit handles build, hosting, TLS, and health checks automatically

---

## Demo

## Demo Video

Watch the full project demo here: [Demo Video](https://drive.google.com/file/d/1iNVfMmjaypDQfRtr-n6AdqDp_JwBB7TX/view?usp=sharing)

> **Live deployment:** _[Add your deployed app URL here]_

### Screenshots

| Dashboard | Topic Rankings | Study Planner |
|---|---|---|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

---

## Hackathon Submission Checklist

- [x] App runs end-to-end (`pnpm install` + migrations + dev servers)
- [x] AI analysis pipeline working (OpenAI GPT-4o-mini)
- [x] All core features functional (upload, analyse, dashboard, planner, questions, export)
- [x] Mobile-responsive UI
- [x] Database schema and migrations included
- [x] Environment variables documented in `.env.example`
- [x] Comprehensive README
- [x] No hardcoded secrets
- [x] Export / PDF report feature
- [x] Error handling and loading states throughout
- [ ] Demo video link
- [ ] Live deployment URL

---

## License

MIT — built for educational / hackathon purposes.
