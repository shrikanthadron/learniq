# LearnIQ — AI-Powered Personalized Learning Platform

A full-stack education platform with adaptive AI recommendations, intelligent quizzes, smart study planning, and performance analytics.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black) ![Express](https://img.shields.io/badge/Express-5-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Groq](https://img.shields.io/badge/Groq-AI-orange)

## Features

- **Personalized Learning** — AI adaptive recommendations, dynamic difficulty, multi-subject paths
- **Quiz Engine** — MCQ, T/F, fill-blank, short answer; timer; instant feedback; Groq generation
- **Study Planner** — AI timetable, daily/weekly/monthly views, Pomodoro, drag-and-drop events
- **Analytics** — Accuracy trends, topic radar, study time, exam readiness prediction, leaderboard
- **Gamification** — XP, levels, streaks, achievements, badges
- **Notes** — Upload, AI summarization, flashcard generation
- **Roles** — Student, Teacher, Admin dashboards with JWT auth

## Project Structure

```
learniq/
├── frontend/          # Next.js 15 + Tailwind + Framer Motion + Recharts
│   └── src/
│       ├── app/       # Pages (landing, auth, dashboard, quizzes, planner, analytics, admin)
│       ├── components/
│       ├── context/
│       └── lib/
├── backend/           # Express 5 + Prisma + PostgreSQL
│   ├── prisma/        # Database schema & seed
│   └── src/
│       ├── routes/    # REST API
│       └── services/  # AI (Groq) + recommendations
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://learniq:learniq_secret@localhost:5432/learniq"
JWT_SECRET="your-secret-key"
GROQ_API_KEY="gsk_..."   # Optional — uses fallback questions without it
```

### 3. Start PostgreSQL & seed database

```bash
docker compose up postgres -d
cd backend
npm install
npx prisma db push
npm run db:seed
```

### 4. Run development servers

```bash
# From project root
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api

### Login accounts (after seeding database)

| Role    | Email                 | Password     |
|---------|-----------------------|--------------|
| Student | student@learniq.com   | password123  |
| Teacher | teacher@learniq.com   | password123  |
| Admin   | admin@learniq.com     | password123  |

## REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/quizzes` | List quizzes |
| POST | `/api/quizzes/generate` | AI generate quiz |
| POST | `/api/quizzes/:id/submit` | Submit answers |
| GET | `/api/planner/events` | List planner events |
| POST | `/api/planner/generate-timetable` | AI study schedule |
| POST | `/api/planner/pomodoro` | Log focus session |
| GET | `/api/analytics/dashboard` | Full analytics |
| GET | `/api/analytics/recommendations` | Adaptive recommendations |
| GET | `/api/subjects` | All subjects |
| POST | `/api/notes` | Create note + AI summary |
| GET | `/api/admin/stats` | Admin statistics |

## Deployment

### Docker (full stack)

```bash
docker compose up --build
```

### Manual

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm start
```

## UI Design

- Glassmorphism cards with soft gradients
- Dark/light mode toggle
- Responsive sidebar + mobile bottom nav
- Framer Motion page transitions
- Recharts interactive dashboards

## Optional Enhancements

- Set `GROQ_API_KEY` for live AI quiz generation and summaries
- AI chatbot tutor endpoint (extend `services/ai.ts`)
- PDF export via browser print or `jspdf`
- OAuth (Google) — add Passport.js strategy

## License

MIT
