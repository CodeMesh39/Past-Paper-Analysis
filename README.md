# PastPaper AI — AI-Powered Exam Intelligence

Upload past papers and syllabi, let AI extract high-yield topics, map coverage gaps, generate practice questions, and build a personalized study plan.

## Project Description

PastPaper AI is a React + Vite frontend with an Express + PostgreSQL backend that helps students analyze past exam papers, rank important topics, track syllabus coverage, and plan revision.

## Tech Stack

- React + Vite + TypeScript
- Express.js + TypeScript
- PostgreSQL + Drizzle ORM
- OpenAI via Replit AI Integrations

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set environment variables:

```env
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_key
PORT=8080
```

3. Run the app:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/past-paper-analyzer run dev
```

## Demo

- Upload past papers and syllabi
- Run AI analysis to extract topics
- Review the dashboard, topic rankings, planner, questions, and export pages

## Repository Structure

- `artifacts/api-server` — Express API
- `artifacts/past-paper-analyzer` — React frontend
- `lib` — shared libraries
- `scripts` — utility scripts
