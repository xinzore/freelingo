# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Replit Auth (OpenID Connect + PKCE)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── dil-ogrenme/        # Duolingo-like language learning app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Replit Auth browser hook (useAuth)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Main App: İngilizce Öğren (dil-ogrenme)

A Duolingo-like English learning app for Turkish speakers. Mobile-first, responsive design.

### Features
- 8 lessons with words and quiz questions (Selamlaşmalar, Renkler, Sayılar, Hayvanlar, Yiyecekler, Aile, Günler/Aylar, Meslekler)
- Interactive lesson flow: word cards (flip to see Turkish) → quiz questions
- Multiple question types: multiple choice, fill-blank, translate-to-english, translate-to-turkish
- Gamification: XP, streak (fire), hearts (lives), level, confetti on correct answers
- **Replit Auth** user accounts - progress persists per user in database
- **Sound pronunciation** - Web Speech API reads English words aloud
- **Word notebook** - save vocabulary words from lessons (requires login)
- **Achievements/badges** - 12 different badges unlocked by completing lessons, streaks, XP
- **Leaderboard** - top XP users ranking
- **Daily goal** - set and track daily XP target (10/20/30/50)
- **Dark mode** toggle
- Bottom navigation: Dersler, Ligler, Rozetler, Defter, Profil

### Authentication Methods
- **Replit Auth** — OAuth via Replit (OpenID Connect/PKCE)
- **E-posta/Şifre** — Custom email+password with Resend verification emails
  - Register: POST /api/auth/register (sends verification email via Resend)
  - Login: POST /api/auth/login-email (checks verified status)
  - Verify: GET /api/auth/verify-email?token=... (redirects to /?verified=success)
  - Forgot: POST /api/auth/forgot-password (sends reset email)
  - Reset: POST /api/auth/reset-password (with token + new password)
- Both methods use the same session mechanism (cookie-based, stored in `sessions` DB table)
- `email_auth` table stores password hash, verification token, reset token

### API Endpoints
- GET /api/lessons - list all lessons
- GET /api/lessons/:id - lesson detail with words + questions
- GET /api/progress - user XP, streak, level, hearts, daily goal
- POST /api/progress/complete-lesson - complete a lesson, earn XP
- POST /api/progress/set-daily-goal - set daily XP goal
- POST /api/progress/reset - reset all progress
- GET /api/achievements - all badges with unlock status
- GET /api/notebook - user word notebook
- POST /api/notebook - add word to notebook
- DELETE /api/notebook/:id - remove word from notebook
- GET /api/leaderboard - top 20 users by XP
- GET /api/auth/user - current auth state
- GET /api/login - Replit OIDC login flow
- GET /api/logout - logout

### Database Tables
- `users` - Replit Auth user records
- `sessions` - Auth sessions
- `user_progress` - XP, streak, completed lessons, daily goals
- `user_achievements` - unlocked badges per user
- `word_notebook` - saved vocabulary words per user

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Web app: `pnpm --filter @workspace/dil-ogrenme run dev`
- DB schema push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
