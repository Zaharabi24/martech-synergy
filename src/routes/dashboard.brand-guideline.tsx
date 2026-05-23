import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, Presentation, Globe, PenSquare, Loader2, Check, Download,
  Search, Upload, Wand2, Palette, FileCode2, Layers, Share2, RefreshCw,
  AlertCircle, Cpu, Zap, Brain, Target, Layout, FileCheck2, ChevronRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateBrandGuideline, type Guideline } from "@/lib/brand-guideline.functions";
import { exportGuidelinePDF, exportGuidelinePPT } from "@/lib/brand-guideline-export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/brand-guideline")({
  head: () => ({
    meta: [
      { title: "Brand Guideline Generator — BrandSync AI" },
      { name: "description", content: "Cinematic AI workspace to generate premium brand guidelines exportable to PDF, PPTX and web brandbooks." },
    ],
  }),
  component: BrandGuidelinePage,
});

const INDUSTRIES = ["Technology", "E-commerce / D2C", "Retail", "Fashion & Beauty", "Food & Beverage", "Finance / Fintech", "Healthcare", "Education", "Real Estate", "Travel & Hospitality", "Media & Entertainment", "Manufacturing", "Agency", "Non-profit", "Other"];
const REGIONS = ["Global", "North America", "Europe", "United Kingdom", "MENA", "Asia Pacific", "LATAM", "Africa", "Oceania"];

const SUGGESTED_COMPANIES = [
  { name: "Linear", slogan: "The tool built for modern software development.", industry: "Technology", region: "Global", description: "Issue tracking & project management for elite product teams.", verified: true, color: "#5E6AD2" },
  { name: "Notion", slogan: "Write, plan, share. With AI at your side.", industry: "Technology", region: "Global", description: "All-in-one workspace combining notes, docs, wikis, and projects.", verified: true, color: "#000000" },
  { name: "Stripe", slogan: "Financial infrastructure for the internet.", industry: "Finance / Fintech", region: "Global", description: "Payments and financial infrastructure for online businesses.", verified: true, color: "#635BFF" },
  { name: "Figma", slogan: "Nothing great is made alone.", industry: "Technology", region: "Global", description: "Collaborative interface design platform for product teams.", verified: true, color: "#F24E1E" },
  { name: "Vercel", slogan: "Develop. Preview. Ship.", industry: "Technology", region: "Global", description: "Frontend cloud for building and deploying modern web apps.", verified: true, color: "#000000" },
  { name: "Airbnb", slogan: "Belong anywhere.", industry: "Travel & Hospitality", region: "Global", description: "Marketplace for unique stays and experiences around the world.", verified: true, color: "#FF5A5F" },
];

const PALETTE_PRESETS = [
  { name: "Midnight Indigo", colors: ["#0a0a1a", "#4f46e5", "#a78bfa", "#22d3ee"] },
  { name: "Neon Mint", colors: ["#0d1b2a", "#2dd4a8", "#73ffb8", "#f0fdf4"] },
  { name: "Sunset Blaze", colors: ["#ff6b35", "#f7931e", "#e84393", "#6c5ce7"] },
  { name: "Charcoal Ember", colors: ["#1a1a1a", "#e85d3a", "#f5c518", "#ffffff"] },
];

const EXPORT_OPTIONS = [
  { id: "pdf", label: "PDF", desc: "Print-ready brandbook", time: "~30s", icon: FileText, color: "from-rose-500 to-orange-500", badge: "AI-optimized" },
  { id: "pptx", label: "PPTX", desc: "Editable Keynote deck", time: "~45s", icon: Presentation, color: "from-amber-500 to-yellow-500", badge: "Editable" },
  { id: "docx", label: "DOCX", desc: "Word document", time: "~25s", icon: FileCode2, color: "from-sky-500 to-blue-500", badge: "Soon" },
  { id: "web", label: "Web Brandbook", desc: "Interactive site", time: "~60s", icon: Globe, color: "from-emerald-500 to-teal-500", badge: "Live" },
  { id: "portal", label: "Brand Portal", desc: "Team workspace", time: "~50s", icon: Layers, color: "from-indigo-500 to-purple-600", badge: "Collab" },
  { id: "social", label: "Social Kit", desc: "Platform templates", time: "~35s", icon: Share2, color: "from-fuchsia-500 to-pink-500", badge: "12 sizes" },
] as const;

const GEN_STEPS = [
  { label: "Analyzing Brand DNA", icon: Brain },
  { label: "Detecting Audience", icon: Target },
  { label: "Building Strategy", icon: Cpu },
  { label: "Creating Visual Identity", icon: Palette },
  { label: "Generating Slides", icon: Layout },
  { label: "Finalizing Export", icon: FileCheck2 },
];

type Phase = "idle" | "running" | "done";

function BrandGuidelinePage() {
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [form, setForm] = useState({
    brandName: "", slogan: "", industry: "", websiteUrl: "", description: "",
    region: "Global", logoDataUrl: "" as string,
  });
  const [colors, setColors] = useState<string[]>(["#4f46e5", "#a78bfa", "#22d3ee"]);
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const generate = useServerFn(generateBrandGuideline);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: 99999, behavior: "smooth" }); }, [logs.length]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return SUGGESTED_COMPANIES.slice(0, 4);
    const q = search.toLowerCase();
    return SUGGESTED_COMPANIES.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }, [search]);

  const pickCompany = (c: typeof SUGGESTED_COMPANIES[number]) => {
    setForm(f => ({ ...f, brandName: c.name, slogan: c.slogan, industry: c.industry, description: c.description, region: c.region }));
    setSearch(c.name);
    setSearchOpen(false);
    toast.success(`Loaded ${c.name}`);
  };

  const handleLogo = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Image files only"); return; }
    const r = new FileReader();
    r.onload = () => setForm(f => ({ ...f, logoDataUrl: String(r.result) }));
    r.readAsDataURL(file);
  };

  const enhance = (kind: "rewrite" | "expand" | "shorten" | "premium" | "corporate" | "luxury" | "creative" | "enhance") => {
    if (!form.description.trim()) { toast.error("Write a short description first"); return; }
    setEnhancing(true);
    const map: Record<typeof kind, (s: string) => string> = {
      enhance: s => s.replace(/\.\s*/g, ". ").replace(/\b(\w+)/, m => m.charAt(0).toUpperCase() + m.slice(1)) + (s.endsWith(".") ? "" : "."),
      rewrite: s => `We help ${form.industry || "modern teams"} ${s.toLowerCase().replace(/^we\s+/, "")}`,
      expand: s => s + " Built for ambitious teams who refuse to compromise on craft, speed, or scale.",
      shorten: s => s.split(/[.!?]/).filter(Boolean)[0]?.trim() + ".",
      premium: s => `An uncompromising standard. ${s}`,
      corporate: s => `${form.brandName || "Our company"} delivers ${s.toLowerCase()}`,
      luxury: s => `Exquisitely crafted. ${s} Designed for the discerning few.`,
      creative: s => `Bold. Unexpected. Alive. ${s}`,
    };
    setTimeout(() => {
      setForm(f => ({ ...f, description: map[kind](f.description).slice(0, 500) }));
      setEnhancing(false);
      toast.success("AI enhanced");
    }, 700);
  };

  const runGeneration = async () => {
    if (!form.brandName.trim() || !form.industry) {
      toast.error("Brand name and industry are required");
      return;
    }
    setPhase("running");
    setActiveStep(0);
    setConfidence(0);
    setLogs([`[init] BrandSync neural engine online`, `[brand] target = "${form.brandName}"`, `[industry] ${form.industry}`]);
    setError(null);
    setGuideline(null);

    const stepTimer = setInterval(() => {
      setActiveStep(s => Math.min(s + 1, GEN_STEPS.length - 1));
      setConfidence(c => Math.min(c + 15 + Math.random() * 8, 96));
      setLogs(l => [...l, `[ai] ${GEN_STEPS[Math.min(l.length - 2, GEN_STEPS.length - 1)]?.label ?? "processing"}…`]);
    }, 1400);

    try {
      const res = await generate({ data: { brandName: form.brandName, industry: form.industry, websiteUrl: form.websiteUrl, description: form.description, mode } });
      clearInterval(stepTimer);
      if (res.error || !res.guideline) {
        setError(res.error || "Generation failed");
        toast.error(res.error || "Generation failed");
        setPhase("idle");
      } else {
        setActiveStep(GEN_STEPS.length - 1);
        setConfidence(98);
        setLogs(l => [...l, `[done] guideline synthesized · 12 sections · ${res.guideline!.colorPalette.length} colors`]);
        setGuideline(res.guideline);
        setPhase("done");
        toast.success("Brand guideline generated");
      }
    } catch (e) {
      clearInterval(stepTimer);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
      setPhase("idle");
    }
  };

  const doExport = async () => {
    if (!guideline) return;
    if (exportFormat !== "pdf" && exportFormat !== "pptx") {
      toast.info(`${exportFormat.toUpperCase()} export is coming soon — falling back to PDF`);
    }
    setExporting(true);
    try {
      if (exportFormat === "pptx") await exportGuidelinePPT(form.brandName, guideline);
      else await exportGuidelinePDF(form.brandName, guideline);
      toast.success("Download started");
    } catch (e) {
      toast.error("Export failed: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <AmbientBackdrop />

      {/* HEADER */}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> AI Workspace · Brandbook OS
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            Brand Guideline Generator
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
            A cinematic, AI-native studio for crafting investor-grade brandbooks — exportable to PDF, PPTX, and live web portals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill icon={<Cpu className="h-3 w-3" />} label="Neural v3.1" tone="indigo" />
          <Pill icon={<Zap className="h-3 w-3" />} label="Realtime" tone="cyan" />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
        {/* LEFT — INPUT WORKSPACE */}
        <div className="space-y-6">
          {/* Source selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SourceCard
              selected={mode === "existing"}
              onClick={() => setMode("existing")}
              icon={<Globe className="h-5 w-5" />}
              title="From Existing Brand"
              desc="Let AI ingest your live website and extract your brand DNA."
              accent="from-indigo-500 to-cyan-400"
            />
            <SourceCard
              selected={mode === "new"}
              onClick={() => setMode("new")}
              icon={<PenSquare className="h-5 w-5" />}
              title="Build New Brand"
              desc="Generate a complete identity from a blank canvas with AI."
              accent="from-fuchsia-500 to-purple-500"
            />
          </div>

          {/* Form panel */}
          <Glass>
            <PanelHeader title="Brand Input" subtitle="Step 1 · Tell the AI who you are" />

            {/* Smart search */}
            <div className="relative mb-5">
              <Label className="text-xs">Smart search company</Label>
              <div className="mt-1.5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Search a company to auto-fill — e.g. Linear, Stripe, Figma"
                  className="pl-9 h-11 bg-white/[0.03] border-white/10"
                />
                <AnimatePresence>
                  {searchOpen && filteredCompanies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#0a0d16]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                      {filteredCompanies.map(c => (
                        <button
                          key={c.name}
                          onMouseDown={() => pickCompany(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition"
                        >
                          <div className="h-9 w-9 rounded-lg grid place-items-center text-white text-xs font-bold shrink-0" style={{ background: c.color }}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {c.name}
                              {c.verified && <Check className="h-3 w-3 text-cyan-300" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{c.industry} · {c.slogan}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Core fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand Name">
                <Input value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} placeholder="Acme Corporation" className="bg-white/[0.03] border-white/10" />
              </Field>
              <Field label="Slogan">
                <Input value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} placeholder="Move fast. Stay refined." className="bg-white/[0.03] border-white/10" />
              </Field>
              <Field label="Industry">
                <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Region">
                <Select value={form.region} onValueChange={v => setForm({ ...form, region: v })}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Website" hint="Optional">
                <Input value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://www.acmecorp.com" className="bg-white/[0.03] border-white/10" />
              </Field>
              <Field label="Logo">
                <LogoDrop logoUrl={form.logoDataUrl} onFile={handleLogo} onClear={() => setForm({ ...form, logoDataUrl: "" })} />
              </Field>
            </div>

            {/* AI Description editor */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Short description</Label>
                <span className="text-[10px] text-muted-foreground">{form.description.length}/500</span>
              </div>
              <div className="relative rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-400/10 transition">
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value.slice(0, 500) })}
                  placeholder="What does your brand do? Who do you serve? What makes you different?"
                  rows={4}
                  className="border-0 bg-transparent resize-none focus-visible:ring-0"
                />
                {enhancing && (
                  <div className="absolute inset-0 grid place-items-center bg-[#0a0d16]/60 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-indigo-200">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI rewriting…
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {([
                  ["enhance", "Enhance", Wand2],
                  ["rewrite", "Rewrite", RefreshCw],
                  ["expand", "Expand", Layers],
                  ["shorten", "Shorten", FileText],
                  ["premium", "Premium", Sparkles],
                  ["corporate", "Corporate", Cpu],
                  ["luxury", "Luxury", Sparkles],
                  ["creative", "Creative", Brain],
                ] as const).map(([k, label, Icon]) => (
                  <button
                    key={k}
                    disabled={enhancing}
                    onClick={() => enhance(k)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted-foreground hover:text-white hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:shadow-[0_0_20px_-4px] hover:shadow-indigo-500/40 transition disabled:opacity-50"
                  >
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Color preference</Label>
                <span className="text-[10px] text-muted-foreground">{colors.length} selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {colors.map((c, i) => (
                  <div key={i} className="relative group">
                    <input
                      type="color" value={c}
                      onChange={e => setColors(colors.map((x, j) => j === i ? e.target.value : x))}
                      className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 0 24px -4px ${c}` }}
                    />
                    {colors.length > 1 && (
                      <button onClick={() => setColors(colors.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-black/80 border border-white/20 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                {colors.length < 6 && (
                  <button onClick={() => setColors([...colors, "#6366f1"])} className="h-10 w-10 rounded-lg border border-dashed border-white/20 grid place-items-center text-muted-foreground hover:text-white hover:border-white/40 transition">
                    +
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PALETTE_PRESETS.map(p => (
                  <button key={p.name} onClick={() => setColors(p.colors)} className="group text-left rounded-lg border border-white/10 bg-white/[0.03] p-2 hover:border-indigo-400/40 transition">
                    <div className="flex gap-1">
                      {p.colors.map(c => <div key={c} className="h-5 flex-1 rounded" style={{ background: c }} />)}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground group-hover:text-white">{p.name}</span>
                      <Sparkles className="h-2.5 w-2.5 text-indigo-300 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Glass>

          {/* Export format */}
          <Glass>
            <PanelHeader title="Export Format" subtitle="Step 2 · Choose your output surfaces" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EXPORT_OPTIONS.map(o => {
                const Icon = o.icon;
                const selected = exportFormat === o.id;
                return (
                  <motion.button
                    key={o.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setExportFormat(o.id)}
                    className={cn(
                      "relative text-left rounded-xl border p-3 overflow-hidden transition-all",
                      selected
                        ? "border-transparent bg-white/[0.06] shadow-[0_0_30px_-8px] shadow-indigo-500/40 scale-[1.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    {selected && <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none", o.color)} />}
                    {selected && <div className={cn("absolute inset-0 rounded-xl pointer-events-none", "ring-1 ring-inset ring-indigo-400/40")} />}
                    <div className={cn("h-8 w-8 rounded-lg grid place-items-center bg-gradient-to-br", o.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{o.label}</span>
                      <span className="text-[9px] uppercase tracking-wider rounded-full bg-white/10 px-1.5 py-0.5 text-muted-foreground">{o.badge}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</div>
                    <div className="text-[10px] text-cyan-300/80 mt-1">⏱ {o.time}</div>
                  </motion.button>
                );
              })}
            </div>
          </Glass>

          {/* CTA */}
          <div className="relative">
            <button
              onClick={runGeneration}
              disabled={phase === "running"}
              className="group relative w-full h-16 rounded-2xl overflow-hidden disabled:opacity-80"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-[gradientShift_4s_linear_infinite]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent_60%)] opacity-60" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-400 blur-xl opacity-50 group-hover:opacity-80 transition" />
              <div className="relative flex items-center justify-center gap-3 text-white font-semibold tracking-wide h-full">
                {phase === "running" ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Generating brandbook…</>
                ) : (
                  <><Sparkles className="h-5 w-5" /> Generate Brand Guideline <ChevronRight className="h-5 w-5" /></>
                )}
              </div>
            </button>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — LIVE AI GENERATION STUDIO */}
        <div className="space-y-6 xl:sticky xl:top-6 self-start">
          <Glass className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Live AI Studio</div>
                <h3 className="text-base font-semibold mt-0.5">Neural Generation</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", phase === "running" ? "bg-cyan-400 animate-pulse" : phase === "done" ? "bg-emerald-400" : "bg-white/20")} />
                <span className="text-[11px] text-muted-foreground capitalize">{phase}</span>
              </div>
            </div>

            {/* Confidence ring */}
            <div className="flex items-center gap-5">
              <ConfidenceRing value={confidence} active={phase === "running"} />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Confidence</div>
                <div className="text-2xl font-semibold tabular-nums">{Math.round(confidence)}%</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {phase === "idle" && "Awaiting input — ready to synthesize."}
                  {phase === "running" && "Running multi-step reasoning pipeline."}
                  {phase === "done" && "Synthesis complete — ready to export."}
                </div>
              </div>
            </div>

            {/* Pipeline steps */}
            <div className="mt-5 space-y-1.5">
              {GEN_STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = phase === "done" || (phase === "running" && i < activeStep);
                const active = phase === "running" && i === activeStep;
                return (
                  <div key={s.label} className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all",
                    active ? "border-cyan-400/40 bg-cyan-500/5" : done ? "border-emerald-400/20 bg-emerald-500/[0.04]" : "border-white/5 bg-white/[0.02]"
                  )}>
                    <div className={cn(
                      "h-7 w-7 rounded-md grid place-items-center shrink-0",
                      done ? "bg-emerald-500/20 text-emerald-300" : active ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-muted-foreground"
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <span className={cn("text-sm flex-1", active ? "text-white" : done ? "text-foreground/80" : "text-muted-foreground")}>{s.label}</span>
                    {active && <span className="text-[10px] text-cyan-300">running</span>}
                  </div>
                );
              })}
            </div>

            {/* Streaming logs */}
            <div ref={logRef} className="mt-4 h-32 rounded-lg border border-white/10 bg-black/40 p-3 text-[10.5px] font-mono text-emerald-300/80 overflow-y-auto leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-muted-foreground italic">// awaiting neural stream…</div>
              ) : logs.map((l, i) => (
                <div key={i} className="animate-[fadeIn_0.3s_ease-out]">{l}</div>
              ))}
            </div>
          </Glass>

          {/* Brandbook preview */}
          <Glass>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300">Interactive Brandbook</div>
                <h3 className="text-base font-semibold mt-0.5">{guideline ? form.brandName : "Live Preview"}</h3>
              </div>
              {guideline && (
                <Button size="sm" onClick={doExport} disabled={exporting} className="bg-white text-slate-900 hover:bg-white/90 h-8">
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="h-3.5 w-3.5 mr-1.5" /> {exportFormat.toUpperCase()}</>}
                </Button>
              )}
            </div>

            <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 text-slate-900 p-4 min-h-[420px] shadow-inner">
              {guideline ? (
                <Brandbook brandName={form.brandName} slogan={form.slogan} logoUrl={form.logoDataUrl} g={guideline} />
              ) : (
                <PreviewSkeleton brandName={form.brandName} colors={colors} logoUrl={form.logoDataUrl} />
              )}
            </div>

            {guideline && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Sections", v: "12" },
                  { l: "Colors", v: String(guideline.colorPalette.length) },
                  { l: "Pillars", v: String(guideline.messagingPillars.length) },
                ].map(s => (
                  <div key={s.l} className="rounded-lg border border-white/10 bg-white/[0.03] py-2">
                    <div className="text-base font-semibold">{s.v}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </Glass>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ============== Sub-components ============== */

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
    </div>
  );
}

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6",
      "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent before:pointer-events-none",
      className
    )}>
      <div className="relative">{children}</div>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300">{subtitle}</div>
      <h3 className="text-base font-semibold mt-0.5">{title}</h3>
    </div>
  );
}

function Pill({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "indigo" | "cyan" }) {
  const c = tone === "indigo" ? "border-indigo-400/30 text-indigo-200 bg-indigo-500/10" : "border-cyan-400/30 text-cyan-200 bg-cyan-500/10";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider", c)}>{icon}{label}</span>;
}

function SourceCard({ selected, onClick, icon, title, desc, accent }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; accent: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl border p-5 overflow-hidden transition-all",
        selected ? "border-transparent bg-white/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition", accent)} />
      {selected && (
        <>
          <div className={cn("absolute -inset-px rounded-2xl bg-gradient-to-br p-px opacity-70", accent)}>
            <div className="h-full w-full rounded-2xl bg-[#0a0d16]" />
          </div>
          <motion.div layoutId="src-glow" className={cn("absolute -bottom-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full blur-2xl opacity-50 bg-gradient-to-br", accent)} />
        </>
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={cn("h-10 w-10 rounded-xl grid place-items-center text-white bg-gradient-to-br shadow-lg", accent)}>{icon}</div>
          <div className={cn("h-5 w-5 rounded-full border-2 transition", selected ? "border-cyan-300 bg-cyan-400" : "border-white/20")}>
            {selected && <Check className="h-3 w-3 text-[#0a0d16] m-0.5" />}
          </div>
        </div>
        <div className="mt-3 font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        {selected && (
          <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> AI ready
          </div>
        )}
      </div>
    </motion.button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs flex items-center gap-1.5">
        {label}
        {hint && <span className="text-muted-foreground font-normal">· {hint}</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function LogoDrop({ logoUrl, onFile, onClear }: { logoUrl: string; onFile: (f: File) => void; onClear: () => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border border-dashed h-[42px] px-3 cursor-pointer transition",
        drag ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_-4px] shadow-cyan-500/40" : "border-white/15 bg-white/[0.03] hover:border-white/30"
      )}
    >
      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {logoUrl ? (
        <>
          <img src={logoUrl} alt="logo" className="h-7 w-7 rounded object-contain bg-white" />
          <span className="text-xs flex-1 truncate">Logo uploaded</span>
          <button onClick={e => { e.preventDefault(); onClear(); }} className="text-muted-foreground hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Drop logo or click to upload</span>
        </>
      )}
    </label>
  );
}

function ConfidenceRing({ value, active }: { value: number; active: boolean }) {
  const r = 28, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="36" cy="36" r={r}
          stroke="url(#ringGrad)" strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className={cn("h-2.5 w-2.5 rounded-full bg-cyan-400", active && "animate-ping")} />
        <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400" />
      </div>
    </div>
  );
}

function PreviewSkeleton({ brandName, colors, logoUrl }: { brandName: string; colors: string[]; logoUrl: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain bg-white border border-slate-200" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold text-sm">
            {(brandName || "B").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="font-bold tracking-tight">{brandName || "Your brand"}</div>
        <div className="ml-auto text-[9px] uppercase tracking-widest text-slate-400">Draft</div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Selected palette</div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {colors.map(c => <div key={c} className="aspect-square rounded-md" style={{ background: c }} />)}
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="mt-8 text-center text-[11px] text-slate-400">
        Fill in your brand and hit <span className="font-semibold text-slate-600">Generate</span> to materialize the full brandbook.
      </div>
    </div>
  );
}

function Brandbook({ brandName, slogan, logoUrl, g }: { brandName: string; slogan: string; logoUrl: string; g: Guideline }) {
  return (
    <div>
      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain bg-white border border-slate-200" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold text-sm">
              {brandName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold tracking-tight text-sm">{brandName}</div>
            <div className="text-[10px] text-slate-500 italic">{slogan || g.tagline}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Brandbook</div>
          <div className="text-[10px] text-slate-400">v1.0 · {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Color system</div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {g.colorPalette.slice(0, 5).map(c => (
            <div key={c.hex}>
              <div className="aspect-square rounded-md shadow-sm" style={{ background: c.hex }} />
              <div className="text-[8px] text-center text-slate-500 mt-1">{c.hex}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Typography</div>
          <div className="mt-2">
            <div className="text-3xl font-bold leading-none" style={{ fontFamily: g.typography.headingFont }}>Aa</div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">{g.typography.headingFont}</div>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Body</div>
          <div className="mt-2">
            <div className="text-3xl leading-none" style={{ fontFamily: g.typography.bodyFont }}>Aa</div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">{g.typography.bodyFont}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Brand voice</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {g.brandPersonality.map(t => (
            <span key={t} className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-medium">{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Messaging pillars</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {g.messagingPillars.slice(0, 4).map(p => (
            <div key={p.title} className="rounded border border-slate-200 p-2">
              <div className="text-[10px] font-bold text-slate-700">{p.title}</div>
              <div className="text-[9px] text-slate-500 line-clamp-3">{p.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
