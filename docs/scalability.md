# Scalability Note — Visitor Registration System

## Current Architecture (Hackathon PoC)

Single Angular 21 SPA → Supabase (PostgreSQL + GoTrue Auth + RLS).
All business logic in Angular service calls via `@supabase/supabase-js`.
Appropriate for: 1–500 users, single office deployment.

---

## Path to 10,000 Users

### Bottlenecks at this scale

1. **Admin list query** — `SELECT * FROM visit_requests` without pagination becomes slow and expensive.
2. **No realtime** — Admin must manually refresh to see new requests.
3. **Connection saturation** — Default Supabase direct connections are limited; high concurrency risks timeout.
4. **Auth rate limits** — Supabase free tier limits magic link sends per hour.

### Changes required

| Area | Change | Why |
|---|---|---|
| **Pagination** | Add `.range(0, 49)` to all list queries; cursor-based pagination on admin list | Prevents full table scan on every page load |
| **Indexes** | Add composite index on `(status, visit_date DESC)` | Already included in schema; confirm via EXPLAIN ANALYZE |
| **Realtime** | Subscribe to Supabase Realtime on `visit_requests` for admin dashboard | Eliminates polling; sub-100ms update latency |
| **Connection pooling** | Enable PgBouncer (Supabase Pro) | Prevents connection saturation under concurrent load |
| **Role caching** | Cache `profiles.role` in `AuthService` (signal — already done) | Avoids DB round-trip on every route change |
| **Auth tier** | Upgrade to Supabase Pro | Higher magic link rate limits; dedicated resources |

### Data model evolution
- Add `office_location` TEXT column if multi-office visits are tracked
- Add `host_employee_id UUID` FK for visitor-to-host assignment
- No schema-breaking changes required at this scale

---

## Path to 100,000 Users

### Bottlenecks at this scale

1. **Single PostgreSQL instance** — Supabase vertical scaling has a ceiling; write throughput is bounded.
2. **No background processing** — Email notifications on approval/rejection block the request cycle.
3. **No observability** — Silent failures become production incidents without structured logging.
4. **Multi-tenancy absent** — One deployment serves one office; scaling to 50 offices requires tenant isolation.
5. **Search** — Searching across visitor names/purposes requires `LIKE '%term%'` which is a full sequential scan.

### Changes required

| Area | Change | Why |
|---|---|---|
| **Read replicas** | Route admin list queries to Supabase read replica | Offloads reporting queries from primary write path |
| **Background jobs** | Supabase Edge Functions + pg_net or Inngest for async email notifications | Decouples write path from notification delivery |
| **Multi-tenancy** | Add `organization_id UUID` to `profiles` and `visit_requests`; extend RLS with org check | Each company gets data isolation without separate deployments |
| **CDN** | Serve Angular static files via Cloudflare or Vercel CDN | Reduces TTFB; no origin hit for static assets |
| **Structured logging** | Replace `console.error` with structured log shipping (Axiom, Datadog, Loki) | Every admin action logged: `{ event, user_id, request_id, status, timestamp }` |
| **Error tracking** | Integrate Sentry in Angular | Uncaught errors captured with user context; alert on spike |
| **Rate limiting** | Supabase Edge Function middleware: max 10 requests/user/day | Prevents abuse |
| **Full-text search** | Add `pg_trgm` extension + GIN index on `visitor_name, purpose` columns | Enables fast ILIKE and similarity search for admin |
| **Monitoring** | Supabase Dashboard + external uptime monitor; alert on: P95 query > 500ms, auth failure rate > 5% | SRE baseline |

### Architecture at 100k (conceptual)

```
CDN (Cloudflare)
    │ static assets
    ▼
Angular SPA (browser)
    │ HTTPS API calls
    ▼
Supabase
  ├── GoTrue Auth
  ├── PostgreSQL primary (writes)
  ├── PostgreSQL read replica (admin list queries)
  ├── Realtime (WebSocket subscriptions)
  └── Edge Functions
        ├── Notification dispatcher (email/SMS)
        └── Rate limiter middleware
              │
              ▼
        Notification Service
        (Resend / SendGrid / Twilio)
```

### Supabase scaling limitations
- Supabase is managed PostgreSQL — hard ceiling on write throughput (~5–10k TPS on large instances)
- Realtime concurrent connections capped per tier
- At extreme write volume, consider: Neon (serverless PostgreSQL), PlanetScale, or self-hosted PG + PgBouncer

---

## Observability Stub (Production-Ready Pattern)

One structured log line on every admin action (already included in AdminRequestService):

```typescript
console.log(JSON.stringify({
  event: 'visit_request_status_changed',
  request_id: id,
  new_status: status,
  admin_id: this.auth.profile()?.id,
  timestamp: new Date().toISOString(),
}));
```

This single log line enables: incident reconstruction, admin audit trail,
anomaly detection (e.g., spike in rejections = policy change?), and RCA.
Replace `console.log` with a log shipping client (Axiom SDK, Pino, etc.) when moving to production.
