import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getActiveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No company found for user");
  return data.company_id as string;
}

function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export const getLatestWebsiteAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getActiveCompanyId(supabase, userId);
    const { data, error } = await supabase
      .from("website_analysis")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { analysis: data ?? null };
  });

const AnalyzeInput = z.object({
  websiteUrl: z.string().trim().min(1).max(255).optional(),
});

export const analyzeWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AnalyzeInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");

    const companyId = await getActiveCompanyId(supabase, userId);

    let url = data.websiteUrl ? normalizeUrl(data.websiteUrl) : "";
    if (!url) {
      const { data: company } = await supabase
        .from("companies")
        .select("website_url")
        .eq("id", companyId)
        .maybeSingle();
      url = normalizeUrl(company?.website_url ?? "");
    }
    if (!url) throw new Error("No website URL configured. Set it in Brand DNA first.");

    const started = Date.now();
    let inserted: any = null;
    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const firecrawl = new Firecrawl({ apiKey });
      const result: any = await firecrawl.scrape(url, {
        formats: ["markdown", "links", "summary", "branding"],
        onlyMainContent: true,
      });

      const doc = result?.data ?? result ?? {};
      const metadata = doc.metadata ?? {};
      const payload = {
        company_id: companyId,
        url,
        status: "completed",
        title: metadata.title ?? null,
        description: metadata.description ?? null,
        summary: doc.summary ?? null,
        markdown: typeof doc.markdown === "string" ? doc.markdown.slice(0, 200000) : null,
        links: Array.isArray(doc.links) ? doc.links.slice(0, 500) : [],
        branding: doc.branding ?? {},
        metadata,
        screenshot_url: typeof doc.screenshot === "string" && doc.screenshot.startsWith("http") ? doc.screenshot : null,
        error: null,
        analyzed_at: new Date().toISOString(),
      };

      const { data: row, error: insErr } = await supabase
        .from("website_analysis")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (insErr) throw new Error(insErr.message);
      inserted = row;

      await supabase
        .from("connected_sources")
        .upsert({
          company_id: companyId,
          platform: "website",
          status: "connected",
          external_account_label: url,
          last_synced_at: new Date().toISOString(),
          last_error: null,
        }, { onConflict: "company_id,platform" });

      await supabase.from("sync_logs").insert({
        company_id: companyId,
        platform: "website",
        status: "ok",
        message: `Firecrawl scrape complete (${(doc.markdown ?? "").length} chars)`,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
      });

      return { ok: true, analysis: inserted };
    } catch (e: any) {
      const message = e?.message ?? "Website analysis failed";
      await supabase.from("website_analysis").insert({
        company_id: companyId,
        url,
        status: "failed",
        error: message,
      });
      await supabase.from("sync_logs").insert({
        company_id: companyId,
        platform: "website",
        status: "error",
        message,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
      });
      await supabase.from("api_errors").insert({
        company_id: companyId,
        platform: "website",
        endpoint: "firecrawl.scrape",
        error_message: message,
      });
      throw new Error(message);
    }
  });
