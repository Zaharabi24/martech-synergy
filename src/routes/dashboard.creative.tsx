import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Image as ImageIcon, Wand2, Shirt, Box, Camera,
  FileText, MessageSquare, Hash, Tag, Youtube, Film,
  ChevronRight, Copy, Download, Send, RefreshCw, Loader2,
  Upload, Plus, X, Palette, History, BookOpen, Share2, Star,
} from "lucide-react";
import { PageHeader, GlassCard, Pill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  enhanceCreativePrompt,
  generateCaption,
  generateCreativeImage,
} from "@/lib/creative.functions";

export const Route = createFileRoute("/dashboard/creative")({
  component: CreativeEngine,
  head: () => ({ meta: [{ title: "Creative Engine — BrandSync AI" }] }),
});

// ---------- Feature catalogue ----------
type FeatureKey =
  | "image-lab" | "poster" | "try-on" | "holography" | "product-photo"
  | "blog" | "caption" | "hashtags" | "product-desc"
  | "thumbnail" | "script";

type Feature = { key: FeatureKey; label: string; icon: typeof ImageIcon; badge?: string };
type Section = { id: string; label: string; items: Feature[] };

const SECTIONS: Section[] = [
  { id: "visual", label: "Visual Studio", items: [
    { key: "image-lab", label: "Image Lab", icon: ImageIcon, badge: "Live" },
    { key: "poster", label: "Intelligent Poster Studio", icon: Wand2 },
    { key: "try-on", label: "Virtual Try-On", icon: Shirt },
    { key: "holography", label: "Product Holography", icon: Box },
    { key: "product-photo", label: "AI Product Photography", icon: Camera },
  ]},
  { id: "copy", label: "Content & Copywriting", items: [
    { key: "blog", label: "Blog Pilot", icon: FileText },
    { key: "caption", label: "Caption Craft", icon: MessageSquare, badge: "Live" },
    { key: "hashtags", label: "Hashtag & Keywords Wizard", icon: Hash },
    { key: "product-desc", label: "Product Description Optimizer", icon: Tag },
  ]},
  { id: "youtube", label: "YouTube Marketing", items: [
    { key: "thumbnail", label: "Thumbnail Generator", icon: Youtube },
    { key: "script", label: "Smart Script Writer", icon: Film },
  ]},
];

const PLATFORMS = ["Facebook", "Instagram", "LinkedIn", "YouTube", "X (Twitter)", "TikTok", "Pinterest", "Snapchat", "Threads", "Behance", "Google Ads"];
const ASPECT_RATIOS = ["Auto", "1:1", "4:5", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "5:4", "21:9"];
const TONES = ["Premium", "Corporate", "Luxury", "Creative", "Playful", "Bold"];
const COLOR_PALETTES = [
  ["#0a0a1a", "#4f46e5", "#a78bfa", "#f5f3ee"],
  ["#1a1a1a", "#e85d3a", "#f0d78c", "#fafbfc"],
  ["#064e3b", "#0d7a5f", "#c9a84c", "#f5f0e0"],
  ["#0c2340", "#2d8a9e", "#5cbdb9", "#e8f0f8"],
  ["#5c2018", "#9b4423", "#d4842a", "#e8b84a"],
  ["#1a3c2a", "#5a8a5c", "#a0c49d", "#f5f0e8"],
];

// ===================== Page =====================
function CreativeEngine() {
  const [active, setActive] = useState<FeatureKey>("image-lab");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ visual: true, copy: true, youtube: true });

  const activeFeature = useMemo(
    () => SECTIONS.flatMap(s => s.items).find(f => f.key === active)!,
    [active]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Creative Engine"
        title="AI Creative Studio"
        subtitle="Multi-platform content production — visual, copy, and YouTube assets, all on-brand."
        actions={
          <div className="flex items-center gap-2">
            <Pill tone="emerald">Brand DNA Active</Pill>
            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-2">
              <span>87 / 100 generations today</span>
              <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[87%] bg-gradient-to-r from-indigo-500 to-purple-500" />
              </div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Secondary sidebar */}
        <GlassCard className="p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
          {SECTIONS.map((sec) => (
            <div key={sec.id} className="mb-3">
              <button
                onClick={() => setOpenSections(o => ({ ...o, [sec.id]: !o[sec.id] }))}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                {sec.label}
                <ChevronRight className={cn("h-3 w-3 transition-transform", openSections[sec.id] && "rotate-90")} />
              </button>
              <AnimatePresence initial={false}>
                {openSections[sec.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {sec.items.map((it) => {
                      const Icon = it.icon;
                      const isActive = active === it.key;
                      return (
                        <button
                          key={it.key}
                          onClick={() => setActive(it.key)}
                          className={cn(
                            "group relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all my-0.5",
                            isActive
                              ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-400/30"
                              : "text-muted-foreground hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-indigo-300")} />
                          <span className="truncate flex-1 text-left text-[13px]">{it.label}</span>
                          {it.badge && (
                            <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white font-semibold">
                              {it.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="mt-4 border-t border-white/5 pt-3 space-y-1">
            <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-white hover:bg-white/5">
              <History className="h-4 w-4" /> Recent Generations
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground hover:text-white hover:bg-white/5">
              <BookOpen className="h-4 w-4" /> Prompt Library
            </button>
          </div>
        </GlassCard>

        {/* Workspace */}
        <div className="min-w-0">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <activeFeature.icon className="h-5 w-5 text-indigo-300" />
              <h2 className="text-lg font-semibold">{activeFeature.label}</h2>
              {activeFeature.badge && <Pill tone="indigo">{activeFeature.badge}</Pill>}
            </div>

            <FeaturePanel feature={active} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ===================== Shared building blocks =====================
function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <label className="text-[12px] font-medium text-foreground/80">{children}</label>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function PromptInput({
  value, onChange, placeholder, tone, onToneChange,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  tone?: string; onToneChange?: (t: string) => void;
}) {
  const enhance = useServerFn(enhanceCreativePrompt);
  const [loading, setLoading] = useState<string | null>(null);

  const runAction = async (action: "enhance" | "rewrite" | "expand" | "shorten") => {
    if (!value.trim()) { toast.error("Write something first"); return; }
    setLoading(action);
    try {
      const res = await enhance({ data: { prompt: value, action, tone } });
      onChange(res.prompt);
      toast.success(`Prompt ${action}d`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[110px] bg-white/5 border-white/10 resize-none"
      />
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{value.length} chars</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["enhance", "rewrite", "expand", "shorten"] as const).map((a) => (
          <Button
            key={a} size="sm" variant="outline"
            className="h-7 px-2.5 text-[11px] border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => runAction(a)} disabled={loading !== null}
          >
            {loading === a ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </Button>
        ))}
      </div>
      {onToneChange && (
        <div className="mt-3">
          <FieldLabel>Tone</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t} onClick={() => onToneChange(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition",
                  tone === t
                    ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AspectRatioPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ASPECT_RATIOS.map((r) => (
        <button
          key={r} onClick={() => onChange(r)}
          className={cn(
            "rounded-md border px-2 py-1.5 text-[11px] transition",
            value === r
              ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
              : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >{r}</button>
      ))}
    </div>
  );
}

function PlatformSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Pick a platform" /></SelectTrigger>
      <SelectContent>
        {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function CritiqueCard({ critique }: {
  critique: { hookStrength: number; brandVoiceMatch: number; predictedCtr: number; readabilityScore: number; tip: string };
}) {
  const cells = [
    { label: "Hook", value: `${critique.hookStrength}/10` },
    { label: "Brand Voice", value: `${critique.brandVoiceMatch}%` },
    { label: "Pred. CTR", value: `${critique.predictedCtr}%` },
    { label: "Readability", value: `${critique.readabilityScore}` },
  ];
  return (
    <div className="mt-4 rounded-lg border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
        <span className="text-[11px] uppercase tracking-widest text-indigo-200">AI Critique</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {cells.map(c => (
          <div key={c.label} className="rounded-md bg-white/5 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground"><span className="text-indigo-300">Tip:</span> {critique.tip}</div>
    </div>
  );
}

function OutputActions({ onCopy, onRegen, canRegen }: { onCopy?: () => void; onRegen?: () => void; canRegen?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {onCopy && <Button size="sm" variant="outline" className="h-7 px-2 border-white/10 bg-white/5" onClick={onCopy}><Copy className="h-3 w-3 mr-1" />Copy</Button>}
      <Button size="sm" variant="outline" className="h-7 px-2 border-white/10 bg-white/5"><Download className="h-3 w-3 mr-1" />Download</Button>
      <Button size="sm" variant="outline" className="h-7 px-2 border-white/10 bg-white/5"><Share2 className="h-3 w-3 mr-1" />Share</Button>
      <Button size="sm" variant="outline" className="h-7 px-2 border-white/10 bg-white/5"><Send className="h-3 w-3 mr-1" />Send to Campaigns</Button>
      <Button size="sm" variant="outline" className="h-7 px-2 border-white/10 bg-white/5"><Star className="h-3 w-3 mr-1" />Favorite</Button>
      {canRegen && (
        <Button size="sm" className="h-7 px-2 bg-gradient-to-r from-indigo-500 to-purple-600" onClick={onRegen}>
          <RefreshCw className="h-3 w-3 mr-1" />Regenerate
        </Button>
      )}
    </div>
  );
}

function EmptyOutput({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid place-items-center text-center py-16 px-4 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 grid place-items-center mb-3">
        <Sparkles className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground max-w-sm mt-1">{hint}</div>
    </div>
  );
}

function ImageSkeleton({ ratio = "1:1" }: { ratio?: string }) {
  const pad = ratio === "16:9" ? "56.25%" : ratio === "9:16" ? "177%" : ratio === "4:5" ? "125%" : "100%";
  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-white/5" style={{ paddingBottom: pad }}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent animate-pulse" />
      <div className="absolute inset-0 grid place-items-center">
        <Loader2 className="h-6 w-6 text-indigo-300 animate-spin" />
      </div>
    </div>
  );
}

// ===================== Feature router =====================
function FeaturePanel({ feature }: { feature: FeatureKey }) {
  switch (feature) {
    case "image-lab": return <ImageLab />;
    case "caption": return <CaptionCraft />;
    case "poster": return <PosterStudio />;
    case "try-on": return <ComingSoonFeature label="Virtual Try-On" />;
    case "holography": return <ComingSoonFeature label="Product Holography" />;
    case "product-photo": return <ComingSoonFeature label="AI Product Photography" />;
    case "blog": return <BlogPilotShell />;
    case "hashtags": return <ComingSoonFeature label="Hashtag & Keywords Wizard" />;
    case "product-desc": return <ComingSoonFeature label="Product Description Optimizer" />;
    case "thumbnail": return <ThumbnailShell />;
    case "script": return <ScriptShell />;
  }
}

// ===================== IMAGE LAB (live) =====================
function ImageLab() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Premium");
  const [platform, setPlatform] = useState("Instagram");
  const [ratio, setRatio] = useState("1:1");
  const [style, setStyle] = useState("Cinematic");

  const gen = useServerFn(generateCreativeImage);
  const mutation = useMutation({
    mutationFn: () => gen({ data: { prompt, tone, platform, aspectRatio: ratio, style } }),
    onError: (e: any) => toast.error(e.message ?? "Generation failed"),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <div>
            <FieldLabel hint="Be specific, vivid, brand-aligned">Prompt</FieldLabel>
            <PromptInput value={prompt} onChange={setPrompt} tone={tone} onToneChange={setTone}
              placeholder="A floating glass perfume bottle on obsidian podium, neon mist, hyper-detailed product photography…" />
          </div>
          <div>
            <FieldLabel>Platform</FieldLabel>
            <PlatformSelect value={platform} onChange={setPlatform} />
          </div>
          <div>
            <FieldLabel>Aspect Ratio</FieldLabel>
            <AspectRatioPicker value={ratio} onChange={setRatio} />
          </div>
          <div>
            <FieldLabel>Enhancement Style</FieldLabel>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Cinematic", "Editorial", "Minimal", "Vibrant", "Moody", "Studio", "Hyperreal"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={mutation.isPending || !prompt.trim()}
            onClick={() => mutation.mutate()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Image</>}
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        {mutation.isPending && <ImageSkeleton ratio={ratio} />}
        {!mutation.isPending && !mutation.data && (
          <EmptyOutput title="Your image will appear here" hint="Describe the visual you want, pick a ratio, and hit Generate. Powered by Nano Banana." />
        )}
        {mutation.data && (
          <div className="space-y-3">
            <img src={mutation.data.imageUrl} alt="Generated" className="w-full rounded-lg border border-white/10" />
            <OutputActions canRegen onRegen={() => mutation.mutate()} />
            <CritiqueCard critique={mutation.data.critique} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ===================== CAPTION CRAFT (live) =====================
function CaptionCraft() {
  const [desc, setDesc] = useState("");
  const [tone, setTone] = useState("Promotional");
  const [audience, setAudience] = useState("");
  const [age, setAge] = useState("25-35");
  const [gender, setGender] = useState("All");
  const [platform, setPlatform] = useState("Instagram");
  const [language, setLanguage] = useState("English");
  const [tab, setTab] = useState("0");

  const gen = useServerFn(generateCaption);
  const mutation = useMutation({
    mutationFn: () => gen({ data: { description: desc, audienceType: audience, ageRange: age, gender, tone, platform, language } }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
    onSuccess: () => setTab("0"),
  });

  const copyCaption = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <div>
            <FieldLabel>Product / Service Description</FieldLabel>
            <PromptInput value={desc} onChange={setDesc} tone={tone} onToneChange={setTone}
              placeholder="A premium oat-milk latte for remote-working creatives…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Audience Type</FieldLabel>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Founders, designers…" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["15-25", "25-35", "35-45", "45-55", "55-65"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["Male", "Female", "Transgender", "Male & Female", "All"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Platform</FieldLabel>
              <PlatformSelect value={platform} onChange={setPlatform} />
            </div>
            <div className="col-span-2">
              <FieldLabel>Language</FieldLabel>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["English", "Bangla", "Hindi", "Arabic", "Spanish", "French", "German", "Japanese", "Chinese"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={mutation.isPending || !desc.trim()}
            onClick={() => mutation.mutate()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Writing…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Caption</>}
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        {mutation.isPending && (
          <div className="space-y-2">
            <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-white/10 animate-pulse" />
          </div>
        )}
        {!mutation.isPending && !mutation.data && (
          <EmptyOutput title="Three caption variations will appear here" hint="Describe your offer and pick a platform — we'll write hook-driven, story-driven, and benefit-driven captions." />
        )}
        {mutation.data && (
          <div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-white/5">
                {mutation.data.variations.map((_, i) => (
                  <TabsTrigger key={i} value={String(i)}>Variation {i + 1}</TabsTrigger>
                ))}
              </TabsList>
              {mutation.data.variations.map((v, i) => (
                <TabsContent key={i} value={String(i)} className="mt-3 space-y-3">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg border border-white/10 bg-white/5 p-4">{v.caption}</div>
                  {v.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {v.hashtags.map((h, k) => (
                        <span key={k} className="rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2 py-0.5 text-[11px] text-indigo-200">{h}</span>
                      ))}
                    </div>
                  )}
                  <OutputActions onCopy={() => copyCaption(v.caption + "\n\n" + (v.hashtags?.join(" ") ?? ""))} canRegen onRegen={() => mutation.mutate()} />
                </TabsContent>
              ))}
            </Tabs>
            <CritiqueCard critique={mutation.data.critique} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ===================== Poster Studio (shell w/ rich UI) =====================
function PosterStudio() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [desc, setDesc] = useState("");
  const [theme, setTheme] = useState("Modern");
  const [tone, setTone] = useState("Premium");
  const [palette, setPalette] = useState(0);
  const [ratio, setRatio] = useState("4:5");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <DropZone label="Brand Logo" hint="PNG/SVG, max 5MB" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Title</FieldLabel>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10" placeholder="Big Launch" />
            </div>
            <div>
              <FieldLabel>Subtitle</FieldLabel>
              <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="bg-white/5 border-white/10" placeholder="Tagline" />
            </div>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <PromptInput value={desc} onChange={setDesc} tone={tone} onToneChange={setTone} placeholder="What's the poster about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <FieldLabel>Contact / Website</FieldLabel>
              <Input className="bg-white/5 border-white/10" placeholder="brand.com" />
            </div>
          </div>
          <div>
            <FieldLabel>Theme</FieldLabel>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{["Modern", "Minimal", "Corporate", "Festival", "Creative", "Tech", "Educational", "Elegant", "Luxury"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Color Palette</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PALETTES.map((p, i) => (
                <button key={i} onClick={() => setPalette(i)} className={cn(
                  "rounded-lg border p-1.5 transition",
                  palette === i ? "border-indigo-400/50 ring-1 ring-indigo-400/30" : "border-white/10 hover:border-white/20"
                )}>
                  <div className="flex h-6 overflow-hidden rounded">
                    {p.map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Aspect Ratio</FieldLabel>
            <AspectRatioPicker value={ratio} onChange={setRatio} />
          </div>
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary" onClick={() => toast.info("Poster pipeline coming soon")}>
            <Wand2 className="h-4 w-4 mr-2" />Generate Poster
          </Button>
        </div>
      </GlassCard>
      <GlassCard>
        <EmptyOutput title="Poster preview" hint="Configure your poster on the left — preview renders in real time once the pipeline is connected." />
      </GlassCard>
    </div>
  );
}

// ===================== Blog Pilot Shell =====================
function BlogPilotShell() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <div><FieldLabel>Blog Topics</FieldLabel><Input className="bg-white/5 border-white/10" placeholder="Digital Marketing, AI, Startup…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Word Count</FieldLabel>
              <Select defaultValue="standard"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{[
                  ["short", "Short (300-500)"], ["medium", "Medium (600-1000)"], ["standard", "Standard (1000-1500)"],
                  ["long", "Long (1500-2500)"], ["seo", "SEO (2500-4000)"], ["pillar", "Pillar (4000+)"],
                ].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><FieldLabel>Reading Time</FieldLabel>
              <Select defaultValue="5"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["2", "5", "10-15", "20-30", "30-60"].map(v => <SelectItem key={v} value={v}>{v} Min</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><FieldLabel>Headings</FieldLabel>
              <Select defaultValue="6"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["4", "5", "6", "7", "8", "9", "10"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><FieldLabel>Tone</FieldLabel>
              <Select defaultValue="informative"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["Informative", "Professional", "Conversational", "Storytelling", "Persuasive", "SEO-Optimized"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><FieldLabel>SEO Focus Keywords</FieldLabel><Input className="bg-white/5 border-white/10" placeholder="Start typing…" /></div>
          <div><FieldLabel>Language</FieldLabel>
            <Select defaultValue="english"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{["English", "Bangla", "Hindi", "Arabic", "Spanish"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary" onClick={() => toast.info("Blog pipeline coming soon")}>
            <FileText className="h-4 w-4 mr-2" />Generate Blog
          </Button>
        </div>
      </GlassCard>
      <GlassCard><EmptyOutput title="Blog draft" hint="3-phase pipeline: headings → streaming content → review in TipTap editor." /></GlassCard>
    </div>
  );
}

// ===================== Thumbnail / Script Shells =====================
function ThumbnailShell() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <DropZone label="Source Image" hint="JPG/PNG/WEBP" />
          <div><FieldLabel>Headline</FieldLabel><Input className="bg-white/5 border-white/10" placeholder="Click-worthy hook" /></div>
          <div><FieldLabel>Subheading</FieldLabel><Input className="bg-white/5 border-white/10" placeholder="Supporting line" /></div>
          <div><FieldLabel>Style</FieldLabel>
            <Select defaultValue="bold"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{["Professional", "Bold", "Minimal", "Cinematic", "Viral", "Gaming", "Tech", "Luxury"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><FieldLabel>Brand Color</FieldLabel>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#4f46e5" className="h-9 w-12 rounded border border-white/10 bg-transparent" />
              <Input defaultValue="#4f46e5" className="bg-white/5 border-white/10" />
            </div>
          </div>
          <div><FieldLabel>Aspect Ratio</FieldLabel>
            <Select defaultValue="16:9"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{["16:9", "1280×720", "21:9", "4:3", "1:1", "2:1", "3:2", "9:16"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary" onClick={() => toast.info("Thumbnail composer coming soon")}>
            <Youtube className="h-4 w-4 mr-2" />Generate Thumbnail
          </Button>
        </div>
      </GlassCard>
      <GlassCard><EmptyOutput title="Thumbnail preview" hint="Upload an image and we'll composite a high-CTR YouTube thumbnail." /></GlassCard>
    </div>
  );
}

function ScriptShell() {
  const [duration, setDuration] = useState([5]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4">
          <div><FieldLabel>Video Topic</FieldLabel><Textarea className="bg-white/5 border-white/10 min-h-[80px]" placeholder="What's the video about?" /></div>
          <div>
            <FieldLabel hint={`~${duration[0] * 150} words`}>Video Length: {duration[0]} min</FieldLabel>
            <Slider value={duration} onValueChange={setDuration} min={1} max={10} step={1} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Audience</FieldLabel><Input className="bg-white/5 border-white/10" placeholder="Tech founders" /></div>
            <div><FieldLabel>Age</FieldLabel>
              <Select defaultValue="25-35"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["15-25", "25-35", "35-45", "45-55"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><FieldLabel>Tone</FieldLabel>
              <Select defaultValue="informative"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["Informative", "Energetic", "Conversational", "Professional"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><FieldLabel>Language</FieldLabel>
              <Select defaultValue="english"><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{["English", "Bangla", "Hindi", "Spanish"].map(v => <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 glow-primary" onClick={() => toast.info("Script pipeline coming soon")}>
            <Film className="h-4 w-4 mr-2" />Generate Script
          </Button>
        </div>
      </GlassCard>
      <GlassCard><EmptyOutput title="Video script" hint="Structured output: HOOK · INTRO · BODY · CTA · OUTRO." /></GlassCard>
    </div>
  );
}

// ===================== Coming-soon placeholder =====================
function ComingSoonFeature({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
      <GlassCard>
        <div className="space-y-4 opacity-80">
          <DropZone label="Upload" hint="Drag-drop or click to upload" />
          <div><FieldLabel>Description</FieldLabel><Textarea className="bg-white/5 border-white/10 min-h-[100px]" placeholder={`Describe your ${label.toLowerCase()}…`} /></div>
          <div><FieldLabel>Aspect Ratio</FieldLabel><AspectRatioPicker value="1:1" onChange={() => {}} /></div>
          <Button disabled className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-60">
            <Sparkles className="h-4 w-4 mr-2" />Generate
          </Button>
        </div>
      </GlassCard>
      <GlassCard>
        <EmptyOutput title={`${label} — coming soon`} hint="The form and output panel are wired and ready. Generation pipeline ships in the next iteration." />
      </GlassCard>
    </div>
  );
}

// ===================== DropZone =====================
function DropZone({ label, hint }: { label: string; hint?: string }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <label className="block cursor-pointer rounded-lg border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition px-4 py-6 text-center">
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4 text-indigo-300" />
            <span className="truncate">{file.name}</span>
            <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Drop file or click to upload</span>
          </div>
        )}
      </label>
    </div>
  );
}
