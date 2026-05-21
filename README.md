# Visitor Registration System

A lightweight visitor registration application where office visitors submit
visit requests and administrators approve or reject them.

Built with **Angular 21** (standalone components) + **Supabase** (Auth + PostgreSQL + RLS).

---

## Quick Start (< 5 minutes)

### Prerequisites
- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- A free [Supabase](https://supabase.com) account

### 1. Clone and navigate
```bash
git clone https://github.com/<your-org>/visitor-registration.git
cd visitor-registration
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/rls_policies.sql
   supabase/seed.sql        ← run after admin signs up via magic link
   ```

### 3. Configure environment
```bash
cd frontend
# Edit src/environments/environment.ts — replace placeholder values:
#   supabaseUrl: 'YOUR_SUPABASE_URL'
#   supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
# Get these from: Supabase Dashboard → Project Settings → API
```

### 4. Install and run
```bash
npm install
ng serve
```
Open [http://localhost:4200](http://localhost:4200)

---

## Environment Variables

| Variable | Description | Where to find |
|---|---|---|
| `supabaseUrl` | Your Supabase project URL | Project Settings → API → Project URL |
| `supabaseAnonKey` | Your Supabase anon public key | Project Settings → API → Project API keys |

Fill these into `frontend/src/environments/environment.ts`. Never commit real values.
See `.env.example` for reference.

---

## Database Schema

**`profiles`** — One row per user. Auto-created by trigger on first sign-in.
- `id` → UUID (FK: auth.users)
- `email`, `full_name`
- `role` → `'visitor'` (default) or `'admin'` (set via seed.sql)

**`visit_requests`** — One row per visit request.
- `id` → UUID (auto-generated)
- `user_id` → FK to profiles
- `visitor_name`, `email`, `purpose` → required text fields
- `visit_date` → DATE (must be today or future)
- `status` → `'pending'` | `'approved'` | `'rejected'`
- `admin_comment` → optional, set by admin on action
- `created_at`, `updated_at` → auto-managed

**Row Level Security:** All data access is enforced at the database level.
Visitors see only their own rows. Admins see all rows.

---

## Creating an Admin Account

1. Sign in via magic link using `admin@company.com`
2. Run `supabase/seed.sql` in the SQL Editor to elevate the role

To create your own admin from any email:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Running Tests
```bash
cd frontend
ng test --watch=false
```

---

## CI/CD

GitHub Actions runs on every push and pull request:
- ✅ Lint (`ng lint`)
- ✅ Build (`ng build --configuration production`)
- ✅ Test (`ng test --watch=false`)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## Architecture & Design Decisions

See [`docs/ADR.md`](docs/ADR.md) — 5 Architecture Decision Records covering:
- Angular standalone components
- Supabase magic link auth
- Profile-based role management
- Reactive Forms
- No state management library

See [`docs/scalability.md`](docs/scalability.md) for 10k / 100k user evolution.
See [`docs/security-checklist.md`](docs/security-checklist.md) for full security review.

---

## Project Structure

```
visitor-registration/
├── .github/workflows/ci.yml       # CI pipeline
├── docs/                          # ADR, planning, scalability, security
├── frontend/                      # Angular 21 SPA
│   └── src/app/
│       ├── core/                  # services, guards, models
│       ├── shared/                # reusable components
│       └── features/              # auth | visitor | admin (vertical slices)
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   ├── rls_policies.sql
│   ├── rls_verification.sql
│   └── seed.sql
└── README.md
```

---

## Implemented Stories

| Story | Description | Tests |
|-------|-------------|-------|
| VIS-001 | Project scaffold, environments, auth service, guards | ✅ |
| VIS-002 | Magic link login, auth callback, navbar | ✅ |
| VIS-003 | Visit request form (create + edit mode) | ✅ |
| VIS-004 | Visitor dashboard — list own requests, delete pending | ✅ |
| VIS-005 | Edit/delete only for pending requests (form + guard) | ✅ |
| VIS-006 | Admin dashboard — all requests with status filter | ✅ |
| VIS-007 | Approve/Reject modal with optional comment | ✅ |
| VIS-008 | Admin stats cards (total/pending/approved/rejected) | ✅ |
| VIS-009 | RLS verification SQL script | N/A |

**Total tests: 29 passing across 6 test files**
