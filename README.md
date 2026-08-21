# AbleSpace - Task Management System

Full-stack task management app built with Next.js + NestJS + Prisma + PostgreSQL.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: NestJS + TypeScript + Passport JWT
- **Database**: PostgreSQL via Prisma v7 + pg adapter

## Features

- Guest Login (no account needed)
- Google Login UI (OAuth ready)
- JWT authentication with protected routes
- Responsive sidebar + header
- Light / Dark mode toggle
- 6 color themes: Amber, Blue, Pink, Rose, Emerald, Black
- Theme persisted in localStorage
- Prisma models: User, Workspace, Project, Task, Subtask, Label, Team, Comment

## Setup

### 1. PostgreSQL

Make sure PostgreSQL is running locally. Create the database:

```sql
CREATE DATABASE ablespace;
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init
npm run start:dev
```

Backend runs on **http://localhost:4000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

## Environment Variables

### backend/.env
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ablespace?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/guest | Guest login |
| GET | /api/auth/me | Current user |
| GET | /api/workspaces | List workspaces |
| POST | /api/workspaces | Create workspace |
| GET | /api/projects?workspaceId= | List projects |
| POST | /api/projects | Create project |
| GET | /api/tasks?projectId= | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Pages

- `/login` — Auth page (login, register, guest, Google UI)
- `/dashboard` — Overview with stats and recent tasks
- `/dashboard/projects` — Project cards with progress
- `/dashboard/tasks` — Task list with status filters
- `/dashboard/team` — Team members
- `/dashboard/settings` — Theme & profile settings
