# LearnIQ REST API Structure

Base URL: `http://localhost:4000/api`

## Authentication

All protected routes require header: `Authorization: Bearer <token>`

### POST /auth/register
```json
{ "email": "user@example.com", "password": "secret", "name": "Alex", "role": "STUDENT" }
```

### POST /auth/login
```json
{ "email": "student@learniq.com", "password": "password123" }
```

### GET /auth/me
Returns current user profile.

### PATCH /auth/profile
```json
{ "name": "Alex", "goals": { "exam": "JEE", "dailyHours": 3 }, "locale": "en" }
```

## Quizzes

### GET /quizzes?subjectId=&topicId=&difficulty=
List published quizzes.

### GET /quizzes/:id
Quiz with questions (no correct answers in list view).

### POST /quizzes/generate
```json
{
  "topic": "Organic Chemistry",
  "count": 5,
  "difficulty": "MEDIUM",
  "types": ["MCQ", "TRUE_FALSE", "FILL_BLANK"],
  "timeLimitSec": 600
}
```

### POST /quizzes/:id/submit
```json
{
  "answers": [{ "questionId": "...", "userAnswer": "2x" }],
  "timeSpentSec": 420
}
```

## Planner

### GET /planner/events?from=&to=&view=WEEKLY

### POST /planner/events
### PATCH /planner/events/:id
### DELETE /planner/events/:id

### POST /planner/generate-timetable
```json
{ "examDate": "2026-06-01", "hoursPerDay": 3, "priorities": ["Math", "Physics"] }
```

### POST /planner/pomodoro
```json
{ "durationMin": 25, "subjectId": "...", "topic": "Calculus" }
```

## Analytics

### GET /analytics/dashboard
Full dashboard payload: trends, strengths, leaderboard, exam readiness.

### GET /analytics/recommendations
Adaptive daily study plan.

### GET /analytics/achievements

## Subjects

### GET /subjects
### GET /subjects/my (auth)
### POST /subjects/enroll (auth)

## Notes

### GET /notes
### POST /notes — auto AI summary
### POST /notes/:id/flashcards
### GET /notes/flashcards/due

## Admin (TEACHER | ADMIN)

### GET /admin/stats
### GET /admin/users
### POST /admin/quizzes

## Notifications

### GET /notifications
### PATCH /notifications/:id/read
