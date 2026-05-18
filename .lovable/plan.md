# BrandSync AI — Backend Integration Plan

This is a very large scope (auth, DB schema, AI orchestration, analytics, PDF/PPT, demo mode, caching, RLS, etc.). To ship a credible buyer demo without breaking the existing frontend, I'll execute in **focused phases**. Each phase is independently shippable and demo-safe.

---

## Phase 1 — Foundation (Cloud + Auth + Theme)
1. Enable **Lovable Cloud** (Supabase under the hood) — required for auth, DB, storage, edge logic.
2. Wire the existing **Free Demo Registration** modal to real auth:
   - Email/password signup + login
   - Google OAuth (via Lovable broker)
   - Session persistence, auto-login, toast feedback
   - `emailRedirectTo` set so confirmation works
3. Create `profiles` + `companies` + `onboarding_data` tables with RLS, auto-create profile trigger on signup.
4. Dark/Light theme already exists in `ThemeProvider` — sync preference to `profiles.theme` once user is logged in (currently localStorage only).

## Phase 2 — Database Schema & RLS
Tables (all RLS-enabled, scoped by `company_id` via `user_roles`):
- `profiles`, `companies`, `company_members`, `user_roles` (app_role enum), `onboarding_data`
- `brand_guideline_requests`, `generated_guidelines`, `uploaded_assets`
- `mentions`, `mention_actions`, `activity_logs`
- `traffic_analytics`, `traffic_sources`, `traffic_countries`, `keywords`
- `ai_recommendations`, `demo_seed_flag`
Indexed on `company_id`, `created_at`. `has_role()` security-definer function for role checks.

## Phase 3 — Brand Guideline Generator (AI + PDF)
- New sidebar route `/dashboard/brand-guideline-generator` (full form per spec).
- `createServerFn` `generateGuideline` — uses existing Lovable AI Gateway (`google/gemini-3-flash-preview`), streams structured JSON via existing `GuidelineSchema`.
- PDF export: reuse `src/lib/brand-guideline-export.ts` (already exists) + jsPDF on the client.
- PPT export: **mock workflow** (Gamma API not available without user-provided key) — generate a `.pptx` via `pptxgenjs` client-side using the same structured content. If user later adds a Gamma key, swap implementation behind the same server fn.
- Logo upload → Supabase Storage bucket `brand-assets` with size/type validation.
- Save every generation to `generated_guidelines` for history.

## Phase 4 — Traffic Analyzer + Demo Mode
- Seeded realistic data inserted on first login (demo flag per company).
- Server fns: `getTrafficOverview`, `getTrafficSources`, `getTopCountries`, `getTopKeywords` with date-range filter.
- Client uses TanStack Query with `staleTime` for instant chart rendering.
- Date filter: Month / Last 2M / Last 3M / Custom range.

## Phase 5 — Mention Feed Actions (keep UI unchanged)
Wire existing buttons to server fns:
- `replyWithAI` (streams AI response)
- `markResolved`, `assignTask`, `fixIssue`, `exportReport`
- Optimistic updates via React Query `onMutate`.
- Activity logged to `activity_logs`.

## Phase 6 — AI Intelligence Layer
- `getAIRecommendations(companyId)` — uses gateway with system prompt simulating CMO/strategist roles, cached in `ai_recommendations` table (24h TTL).
- Surfaced on `/dashboard/intelligence`.

## Phase 7 — Polish
- Skeleton loaders on all data routes
- Error boundaries per route
- Rate-limit guard on AI server fns (per-user, in-memory token bucket)
- Final pass: lazy routes, image optimization check, query memoization

---

## Technical Details

**Stack already in place** — TanStack Start v1, Lovable AI Gateway via `@/lib/ai-gateway`, shadcn/ui, Recharts, framer-motion, jspdf, html2canvas. I will **add**: `pptxgenjs` for PPT export. No other deps.

**Auth model** — Supabase Auth via Lovable Cloud. Google OAuth uses the Lovable broker (`lovable.auth.signInWithOAuth("google", ...)`) + `supabase--configure_social_auth({providers:["google"]})`.

**Server boundary** — all sensitive logic in `*.functions.ts` using `createServerFn` + `requireSupabaseAuth`. RLS is the backstop. No Supabase Edge Functions.

**Demo mode** — single boolean on `companies.demo_mode`. On signup, seed ~90 days of realistic analytics + 20 sample mentions + 3 AI recommendations so dashboards never look empty.

**PPT note** — Real Gamma AI integration requires a Gamma API key the user does not have. I'll build the same UX with `pptxgenjs` (client-side .pptx generation) so the button works end-to-end in the demo; swapping in Gamma later is a 1-file change.

---

## What I need from you before starting

1. **Confirm Lovable Cloud enable** — this provisions the backend and adds ~30s to the first save. OK to proceed?
2. **Google OAuth** — enable now, or email/password only for first cut?
3. **Phase order** — proceed Phase 1 → 7 in sequence (recommended), or prioritize a specific phase first (e.g. Brand Guideline Generator for an imminent demo)?

Reply with answers (or just "go" for the default: enable Cloud, enable Google, run phases in order) and I'll start with Phase 1 immediately.