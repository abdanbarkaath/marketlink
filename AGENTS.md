# AGENTS.md

## Project Identity

MarketLink is a marketplace that connects local businesses with marketing providers.

This is a two-app repo:

- marketlink-frontend → Next.js (App Router)
- marketlink-backend → Fastify + Prisma

Goal: ship a clean MVP fast, avoid overengineering.

---

## Tech Stack

### Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS

### Backend

- Fastify
- Prisma ORM
- PostgreSQL
- bcryptjs (password hashing)
- Cookie-based sessions

---

## Repo Structure

marketlink/
marketlink-backend/
marketlink-frontend/

---

## Package Manager

- Use npm only

---

## Development Philosophy

- Speed > perfection
- Simple > scalable (for MVP)
- Extend existing code, do not rebuild

---

## Strict Working Rules

- Always read existing code before suggesting changes
- Never assume anything exists — verify
- Work step-by-step
- Do not refactor unrelated code

---

## Working Rules

- Always inspect BOTH folders before making changes:

  - marketlink-backend
  - marketlink-frontend

- Never assume where logic lives.

  - Backend = source of truth (data, auth, validation)
  - Frontend = UI + interaction

- For ANY feature:
  - Check backend routes first
  - Then check how frontend consumes them

---

- Always inspect the existing file before proposing or making changes.
- Never assume a route, schema field, env var, helper, or UI path exists. Verify it first.

- Work step by step.
- Change ONE file at a time unless explicitly told otherwise.
- Do not refactor unrelated code.

---

- Do NOT invent:

  - API endpoints
  - database fields
  - frontend props
  - env variables

- Prefer extending existing logic over creating new patterns.

---

- Before coding:

  1. List relevant files (backend + frontend)
  2. Explain what exists
  3. Identify smallest change

- After editing ONE file:
  - Stop
  - Explain what changed

---

- For backend-related features:

  - Validate logic server-side first
  - Then update frontend

- For frontend changes:
  - Do NOT duplicate backend logic
  - Always rely on API

---

- For auth/admin features:
  - Always verify server-side authorization
  - Never rely only on hidden routes or UI protection

---

- For email features:
  - First check if email system already exists
  - If not, introduce it cleanly (single helper file)

---

- When unsure:
  → STOP  
  → Ask for the file  
  → Do NOT guess

## Auth System

- Email + password
- Session-based auth
- bcryptjs hashing

Endpoints:

- POST /auth/login
- GET /auth/me
- POST /auth/logout
- GET /me/summary

---

## Admin Rules

- Must validate: user.role === 'admin'
- Admin UI lives in /dashboard/admin
- Extend existing PATCH /admin/providers/:id

---

## Email System

- Not implemented yet
- Use Resend when adding

Rules:

- Never send permanent passwords
- Always use mustChangePassword = true

---

## Commands

Frontend:
cd marketlink-frontend
npm install
npm run dev

Backend:
cd marketlink-backend
npm install
npm run dev
npx prisma generate
npx prisma migrate dev

---

## Final Principle

Ship fast.
Keep it simple.
