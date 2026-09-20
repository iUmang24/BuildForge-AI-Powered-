# BuildForge — AI-Powered Virtual Internship Platform

A full-stack platform that bridges the gap between academic learning and real-world industry exposure, letting students complete structured, project-based virtual internships with end-to-end workflow management — from application to task submission, evaluation, and certification.

**Live:** [buildforge.net.in](https://buildforge.net.in)

---

## Overview

BuildForge lets students apply for a structured internship program, work through weekly project tasks, submit their work for review, and earn a verifiable completion certificate. Admins get a full back-office panel to manage colleges, projects, pricing, submissions, and support — all backed by role-based access control.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Next.js |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (access/refresh), role-based access control (RBAC) |


## Key Features

- **Structured internship workflow** — student onboarding, weekly task allocation, submission tracking, and mentor evaluation with feedback loops
- **Role-specific dashboards** — separate student and admin experiences, each with real-time progress tracking and analytics
- **Secure authentication** — JWT-based sessions with RBAC protecting admin-only routes and operations
- **Task evaluation module** — mentors/admins review submissions, leave feedback, and approve or request resubmission
- **Certificate generation & verification** — auto-generated completion certificates with a public verification link
- **Payments & pricing** — coupon system, tiered pricing plans, and Razorpay integration for training/certificate fees
- **Support system** — in-app ticketing between students and admins

## Architecture

```
frontend/   → Next.js (TypeScript) app — student & admin UIs, calls the backend over REST
backend/    → Express REST API — auth, business logic, MySQL access via mysql2
database/   → MySQL schema (dump excluded from repo — see SETUP.md)
```

The frontend and backend are decoupled and communicate entirely over a REST API (`API_BASE_URL` in `lib/config.ts`), so either can be deployed and scaled independently.

## Getting Started

Full local setup instructions (MySQL setup, environment variables, running both servers) are in [`SETUP.md`](./SETUP.md).

Quick start once prerequisites are installed:

```bash
# Backend
cd backend
npm install
node src/server.js

# Frontend
cd frontend/buildforge_fe
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.

## Project Structure

```
BuildForge/
├── backend/
│   ├── src/
│   │   ├── config/       # DB & environment config
│   │   ├── controllers/  # Route handlers / business logic
│   │   ├── middlewares/  # Auth, admin auth, access control
│   │   ├── routes/
│   │   ├── services/     # Email, Razorpay, GitHub verification
│   │   └── utils/        # JWT, cookies, logging
│   └── database/         # Schema & dump (gitignored)
├── frontend/
│   └── buildforge_fe/
│       ├── app/           # Next.js App Router pages
│       ├── components/
│       └── lib/           # API config, shared utilities
└── SETUP.md
```

## Notes

- Payment and email integrations require live API credentials and are not enabled by default in local development.
- This repository is a combined monorepo of previously separate frontend and backend codebases, merged with full commit history preserved.

## License

This project is proprietary software developed for BuildForge / Shriva Technologies. Not licensed for redistribution.
