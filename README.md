# PastPaper AI — AI-Powered Exam Intelligence

> **Hackathon Project** — Decode your past papers, study smarter.

Upload past exam papers and let GPT-4 extract high-yield topics, map syllabus coverage, generate practice questions, and build a personalized day-by-day study plan.

---

## Features

| Feature | Description |
|---|---|
| **AI Paper Analysis** | GPT-4o-mini extracts topics, detects patterns, identifies question types, marks distribution, and difficulty level |
| **Topic Ranking** | Importance score = frequency × recency × marks weightage |
| **Syllabus Mapping** | Cross-reference extracted topics with your uploaded syllabus — see coverage % and missing topics |
| **Smart Study Planner** | Day-by-day schedule prioritized by importance score, with revision days and progress tracking |
| **Practice Questions** | AI generates 3–5 exam-style questions per topic, with type, difficulty, and mark allocation |
| **Analytics Dashboard** | Topic frequency, yearly trends, difficulty distribution, syllabus heatmap, top topic cards |
| **Export** | Print-to-PDF report and JSON download with full analysis data |
| **Drag & Drop Upload** | PDF and image file uploads with drag-and-drop support |
| **Mobile Responsive** | Bottom navigation for mobile, responsive cards and charts |

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI GPT-4o-mini via Replit AI Integrations
- **Charts**: Recharts
- **Monorepo**: pnpm workspaces

---

## Setup (Local Development)

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database

### 1. Clone and install

```bash
git clone <repo-url>
cd past-paper-analyzer
pnpm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pastpaper
SESSION_SECRET=your-secret-here
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
PORT=8080
```

> **On Replit**: These are configured automatically via Replit Secrets and AI Integrations — no manual setup needed.

### 3. Run database migrations

```bash
pnpm --filter @workspace/db run migrate
```

### 4. Start the development servers

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/past-paper-analyzer run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment (Replit)

1. Fork or import this project into Replit
2. Configure Replit AI Integrations (OpenAI) from the integrations panel
3. Set `SESSION_SECRET` in Replit Secrets
4. Click **Deploy** — Replit handles build, hosting, TLS, and health checks automatically

---

## Usage Guide

### Workflow

1. **Upload Papers** (`/upload`) — Upload one or more past exam papers (PDF or image)
2. **Upload Syllabus** (`/syllabus`) — Upload your syllabus for coverage tracking (optional but recommended)
3. **Run Analysis** (`/analysis`) — Select papers and optionally link a syllabus, then trigger AI analysis
4. **View Results**:
   - **Dashboard** — Charts and KPIs across all your data
   - **High-Yield Topics** — Ranked topic leaderboard with importance scores
   - **Practice Questions** — Exam-style questions grouped by topic
   - **Study Planner** — Create a day-by-day schedule based on topic priority
   - **Export** — Generate a printable PDF report or download JSON data

### Tips for best results

- Upload multiple years of past papers (5+ years recommended) for better trend analysis
- Use PDF files with selectable text for highest quality extraction
- Always link a syllabus to unlock coverage percentage and missing topics
- After analysis, go to the planner and enter your exam date to generate a schedule

---

## API Reference

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET/POST` | `/api/papers` | List / upload papers |
| `DELETE` | `/api/papers/:id` | Delete a paper |
| `GET/POST` | `/api/syllabus` | List / upload syllabi |
| `DELETE` | `/api/syllabus/:id` | Delete a syllabus |
| `GET/POST` | `/api/analysis` | List / trigger analysis |
| `GET` | `/api/analysis/:id` | Get analysis status |
| `GET` | `/api/topics` | List all topics |
| `GET` | `/api/topics/high-yield` | Get high-yield topics |
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

## Hackathon Submission Checklist

- [x] Project runs with `pnpm install` + migrations
- [x] AI analysis pipeline working (OpenAI GPT-4o-mini)
- [x] All core features functional (upload, analyze, dashboard, planner, questions, export)
- [x] Mobile responsive UI
- [x] Database seeded / migrations included
- [x] Environment variables documented
- [x] README with setup, deployment, and demo instructions
- [x] No hardcoded secrets
- [x] Export / PDF report feature
- [x] Error handling and loading states throughout

---

## Project Structure

```
artifacts/
  api-server/          # Express.js backend
    src/
      routes/          # API route handlers
      lib/
        analysis.ts    # OpenAI analysis pipeline
        db.ts          # Database connection
  past-paper-analyzer/ # React frontend
    src/
      pages/           # Route pages
      components/      # Shared UI components
lib/
  api-spec/            # OpenAPI specification
  api-zod/             # Zod validation schemas
  api-client-react/    # Generated React Query hooks
  db/                  # Drizzle schema & migrations
```

---

## License

MIT — built for educational/hackathon purposes.
