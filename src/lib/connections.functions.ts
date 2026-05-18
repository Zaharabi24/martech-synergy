import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLATFORMS = [
  "website","google_analytics","google_search_console","facebook","instagram",
  "tiktok","linkedin","youtube","google_business","twitter",
] as const;
type Platform = typeof PLATFORMS[number];

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

export const getBrandDna = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getActiveCompanyId(supabase, userId);

    const [companyRes, identityRes, sourcesRes] = await Promise.all([
      supabase.from("companies").select("id,name,industry,employee_size,website_url").eq("id", companyId).maybeSingle(),
      supabase.from("brand_identity").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("connected_sources").select("*").eq("company_id", companyId),
    ]);

    // Backfill any missing platform rows so UI is consistent
    const existing = new Set((sourcesRes.data ?? []).map((s: any) => s.platform as string));
    const missing = PLATFORMS.filter((p) => !existing.has(p));
    if (missing.length) {
      await supabase.from("connected_sources").insert(
        missing.map((p) => ({ company_id: companyId, platform: p, status: "not_connected" })),
      );
      const { data: refreshed } = await supabase.from("connected_sources").select("*").eq("company_id", companyId);
      return {
        companyId,
        company: companyRes.data,
        identity: identityRes.data,
        sources: refreshed ?? [],
      };
    }

    return {
      companyId,
      company: companyRes.data,
      identity: identityRes.data,
      sources: sourcesRes.data ?? [],
    };
  });

const IdentityInput = z.object({
  brandName: z.string().trim().min(1).max(120),
  industry: z.string().trim().min(1).max(80),
  employeeSize: z.string().trim().min(1).max(40),
  businessLocation: z.string().trim().max(120).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(255).optional().or(z.literal("")),
  brandGoal: z.string().trim().max(500).optional().or(z.literal("")),
  targetAudience: z.string().trim().max(500).optional().or(z.literal("")),
});

export const saveBrandIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdentityInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getActiveCompanyId(supabase, userId);

    const { error: companyErr } = await supabase
      .from("companies")
      .update({
        name: data.brandName,
        industry: data.industry,
        employee_size: data.employeeSize,
        website_url: data.websiteUrl || null,
      })
      .eq("id", companyId);
    if (companyErr) throw new Error(companyErr.message);

    const { error: upsertErr } = await supabase
      .from("brand_identity")
      .upsert({
        company_id: companyId,
        business_location: data.businessLocation || null,
        brand_goal: data.brandGoal || null,
        target_audience: data.targetAudience || null,
      }, { onConflict: "company_id" });
    if (upsertErr) throw new Error(upsertErr.message);

    return { ok: true, companyId };
  });

const ConnectWebsiteInput = z.object({
  websiteUrl: z.string().trim().url().max(255),
});

export const connectWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ConnectWebsiteInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getActiveCompanyId(supabase, userId);

    await supabase.from("companies").update({ website_url: data.websiteUrl }).eq("id", companyId);

    const { error } = await supabase
      .from("connected_sources")
      .upsert({
        company_id: companyId,
        platform: "website",
        status: "connected",
        external_account_label: data.websiteUrl,
        last_synced_at: new Date().toISOString(),
        last_error: null,
      }, { onConflict: "company_id,platform" });
    if (error) throw new Error(error.message);

    await supabase.from("sync_logs").insert({
      company_id: companyId,
      platform: "website",
      status: "ok",
      message: "Website URL registered. Crawl runs when website analysis is triggered.",
      finished_at: new Date().toISOString(),
      duration_ms: 0,
    });

    return { ok: true };
  });

const DisconnectInput = z.object({ platform: z.enum(PLATFORMS) });

export const disconnectSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DisconnectInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await getActiveCompanyId(supabase, userId);
    const { error } = await supabase
      .from("connected_sources")
      .update({ status: "not_connected", last_synced_at: null, last_error: null, external_account_label: null })
      .eq("company_id", companyId)
      .eq("platform", data.platform);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
