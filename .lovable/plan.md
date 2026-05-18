# BrandSync AI — End-to-End Build Plan

Goal: transform the existing frontend into a real, integration-driven SaaS. No timeline pressure → I'll deliver in 7 phases, each independently demoable. Mock data on un-connected sections stays in place and gets replaced as each real integration lands (your choice).

---

## Phase 1 — Brand DNA Onboarding + Connections Foundation

**New route:** `/dashboard/brand-dna-setup` (2-step wizard)
- Step 1 — Brand Identity: brand name, industry, employee size, location, website URL, brand goal, target audience → writes to `companies` + new `brand_identity` table.
- Step 2 — Connect Platforms: 10 platform cards with proper statuses (Not Connected / Connecting / Connected / Syncing / Permission Expired / API Error), last-synced timestamp, Sync Now, Disconnect.
- Gate: full dashboard locked until Website + 1 other platform connected. Locked sections show "Connection Required" CTAs that deep-link to the wizard.

**DB tables (migration):**
`brand_identity`, `connected_sources` (platform, status, scopes, last_synced_at, error), `sync_logs`, `api_errors`. RLS scoped via `company_members`.

**Sidebar:** add "Brand DNA" + "Brand Guideline Generator" entries. Topbar shows a "Connect platforms" pill when < 2 sources connected.

---

## Phase 2 — Website Analysis (Firecrawl, zero OAuth)

- Link Firecrawl connector via `standard_connectors--connect`.
- Server fn `analyzeWebsite(companyId)` → Firecrawl `scrape` with `formats: ['markdown','metadata','links','branding','summary']` + a follow-up structured extract for SEO basics, headings, brand messaging consistency.
- Writes to `website_analysis` table; surfaces on a new "Website" card on the Intelligence dashboard.
- "Sync now" button on the Website card.

---

## Phase 3 — Google Search Console (Lovable connector, zero OAuth setup)

- Link `google_search_console` connector. The site-verification flow is handled via the gateway (META tag injected into `__root.tsx` head dynamically per company).
- Server fns: `verifyAndAddSite`, `getTopKeywords`, `getSearchPerformance` (impressions / clicks / CTR / position).
- Replaces the SEO section mock data once the connection exists.

---

## Phase 4 — Google Analytics 4 (user-OAuth, per-user tokens)

This is the first integration that requires per-end-user OAuth (not a workspace connector). You'll need to register a Google Cloud OAuth app once; I'll wire the full flow.

- New tables: `oauth_tokens` (encrypted refresh tokens), `traffic_metrics`.
- Routes: `/api/public/oauth/ga4/callback` (verifies state, exchanges code, stores tokens encrypted with pgcrypto + service-role key).
- Server fns: `listGA4Properties`, `selectGA4Property(propertyId)`, `getTrafficOverview/Sources/Countries` calling the GA4 Data API with auto-refresh.
- Replaces the Traffic Analyzer mock with real metrics + date filters (Monthly / Last 2m / Last 3m / Custom).

**You provide:** `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`. I'll request them via the secrets tool when this phase starts.

---

## Phase 5 — Brand Health Score + AI Recommendation Engine

- `brand_health_scores` table with components (website 20 / social 20 / engagement 20 / traffic 15 / SEO 10 / sentiment 10 / consistency 5). Only weights for which we have data are normalized; otherwise the card shows "Connect more platforms to improve accuracy" with progress to next threshold.
- Server fn `generateRecommendations(companyId)` using Lovable AI (`google/gemini-3-flash-preview`, structured output via `Output.object`) consuming whatever real data exists — never invents metrics.
- Cached 24h in `ai_recommendations` with manual "Regenerate" button.

---

## Phase 6 — Brand Guideline Generator (PDF + PPT)

- New sidebar route `/dashboard/brand-guideline-generator` (the existing `brand-guideline.functions.ts` already exists — extending it).
- Auto-prefills from Brand DNA + Website analysis. AI generates structured guideline JSON.
- PDF export: reuse existing `src/lib/brand-guideline-export.ts` + jsPDF.
- PPT export: `pptxgenjs` client-side — generates a real downloadable `.pptx` with brand colors, typography preview, palette swatches, voice do/don'ts, messaging pillars. No external API needed.

---

## Phase 7 — Deferred social platforms + sync engine + polish

Implemented behind feature flags so each can be turned on as you complete the developer-app registration:
- Facebook Page + Instagram Business (Meta Graph API — requires Meta App + Business Verification, 1-3 weeks on Meta's side)
- LinkedIn Company, YouTube Data API, TikTok Business, Google Business Profile, X/Twitter

Plus the cross-cutting infrastructure:
- **Sentiment analysis** — Lovable AI over reviews/comments/mentions; structured output to `sentiment_reports`.
- **Sync engine** — `pg_cron` calling `/api/public/cron/sync-all` hourly; per-source retry with exponential backoff; sync logs surfaced in Settings.
- **Performance** — TanStack Query staleTime per resource, route-level lazy loading for chart bundles, skeleton loaders everywhere, optimistic updates for Mention Feed actions.
- **Responsive sweep** — verified breakpoints (desktop 4-col / laptop 3 / tablet 2 / mobile 1), no overflow, horizontal scroll on data tables, collapsing sidebar on `< md`.
- **Security pass** — `has_role()` security-definer function, encrypted token storage, server-only API calls, input validation with Zod on every server fn, rate limiting on AI endpoints (in-memory per-user token bucket).

---

## Technical Details

**Stack confirmation:** TanStack Start v1 + `createServerFn` for all backend (no Supabase Edge Functions). Lovable Cloud (Supabase) + RLS. Lovable AI Gateway for all LLM calls. TanStack Query for caching. Firecrawl + Google Search Console via Lovable connectors. GA4 + social platforms via per-user OAuth with tokens encrypted at rest.

**Folder structure:**
```text
src/
  lib/
    integrations/
      firecrawl.functions.ts
      gsc.functions.ts
      ga4.functions.ts
      meta.functions.ts        (phase 7)
      ...
    brand-health.functions.ts
    recommendations.functions.ts
    brand-guideline.functions.ts (exists, extended)
    brand-guideline-export.ts    (PDF, exists)
    brand-guideline-pptx.ts      (PPT, new)
  routes/
    dashboard.brand-dna-setup.tsx
    dashboard.brand-guideline-generator.tsx
    api/public/oauth/ga4/callback.ts
    api/public/cron/sync-all.ts
  components/app/
    ConnectionCard.tsx
    ConnectionRequired.tsx
```

**Secrets I'll request as phases land:**
- Phase 2: Firecrawl connector (one click, no key)
- Phase 3: Google Search Console connector (one click)
- Phase 4: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- Phase 7: per-platform credentials as you register each app

---

## Starting now: Phase 1 (Brand DNA + Connections Foundation)

Reply **"go phase 1"** and I'll ship it. Or pick a different starting phase (e.g. **"start with phase 6"** if you want the Brand Guideline Generator live first for the demo).