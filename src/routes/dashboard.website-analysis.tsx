import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, RefreshCw, ExternalLink, Palette, Type, LinkIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyzeWebsite, getLatestWebsiteAnalysis } from "@/lib/website-analysis.functions";

export const Route = createFileRoute("/dashboard/website-analysis")({
  component: WebsiteAnalysisPage,
});

function WebsiteAnalysisPage() {
  const qc = useQueryClient();
  const fetchLatest = useServerFn(getLatestWebsiteAnalysis);
  const { data, isLoading } = useQuery({
    queryKey: ["website-analysis"],
    queryFn: () => fetchLatest(),
    staleTime: 30_000,
  });

  const runAnalysis = useServerFn(analyzeWebsite);
  const mutation = useMutation({
    mutationFn: () => runAnalysis({ data: {} }),
    onSuccess: () => {
      toast.success("Website analyzed");
      qc.invalidateQueries({ queryKey: ["website-analysis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const a = data?.analysis as any;
  const branding = (a?.branding ?? {}) as any;
  const palette: Record<string, string> = branding?.colors ?? {};
  const fonts: Array<{ family?: string }> = branding?.fonts ?? [];
  const links: string[] = Array.isArray(a?.links) ? a.links : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-widest text-indigo-200">
            <Globe className="h-3 w-3" /> Website Intelligence
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">Website Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Real Firecrawl scrape of your homepage — brand colors, typography, copy and outbound links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/brand-dna-setup">
            <Button variant="outline" size="sm">Connections</Button>
          </Link>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {a ? "Re-run analysis" : "Run analysis"}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </div>
      )}

      {!isLoading && !a && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Globe className="h-8 w-8 mx-auto text-indigo-300/70" />
          <h3 className="mt-3 font-medium">No analysis yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Connect your website in Brand DNA, then run the first analysis to extract real brand identity and content signals.
          </p>
        </div>
      )}

      {a && a.status === "failed" && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-300 mt-0.5" />
          <div>
            <div className="font-medium text-rose-200">Last analysis failed</div>
            <div className="text-xs text-rose-200/80 mt-1">{a.error}</div>
          </div>
        </div>
      )}

      {a && a.status === "completed" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Page</div>
              <h2 className="text-lg font-semibold mt-1">{a.title ?? a.url}</h2>
              <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-300 hover:underline inline-flex items-center gap-1 mt-1">
                {a.url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {a.description && (
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Meta description</div>
                <p className="text-sm mt-1 text-foreground/90">{a.description}</p>
              </div>
            )}
            {a.summary && (
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">AI summary</div>
                <p className="text-sm mt-1 text-foreground/90 leading-relaxed">{a.summary}</p>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              Analyzed {a.analyzed_at ? new Date(a.analyzed_at).toLocaleString() : "—"}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-indigo-300" /> Brand colors
              </div>
              {Object.keys(palette).length === 0 ? (
                <div className="mt-3 text-xs text-muted-foreground">No palette detected.</div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(palette).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
                      <div className="h-6 w-6 rounded-md border border-white/10" style={{ background: String(v) }} />
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase text-muted-foreground truncate">{k}</div>
                        <div className="text-[11px] font-mono truncate">{String(v)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Type className="h-4 w-4 text-indigo-300" /> Typography
              </div>
              {fonts.length === 0 ? (
                <div className="mt-3 text-xs text-muted-foreground">No fonts detected.</div>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {fonts.slice(0, 6).map((f, i) => (
                    <li key={i} className="text-sm text-foreground/90">{f.family ?? "—"}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4 text-indigo-300" /> Outbound links
                <span className="ml-auto text-[11px] text-muted-foreground">{links.length}</span>
              </div>
              <ul className="mt-3 space-y-1 max-h-56 overflow-auto pr-1">
                {links.slice(0, 30).map((l) => (
                  <li key={l} className="text-[11px] text-muted-foreground truncate">
                    <a href={l} target="_blank" rel="noreferrer" className="hover:text-indigo-300">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
