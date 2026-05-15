import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  MessageCircle, AlertTriangle, Star, TrendingUp, Target,
  CalendarIcon, Download, Plus, Search, Link2, Info,
  Facebook, Instagram, Youtube, Linkedin, Twitter, Bookmark, MoreVertical,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/dashboard/reputation")({
  component: Reputation,
  head: () => ({ meta: [{ title: "Brand Reputation Radar — BrandSync AI" }] }),
});

/* ---------- channel meta ---------- */
const CHANNEL_META = {
  Facebook:  { icon: Facebook,  color: "#3b82f6" },
  Instagram: { icon: Instagram, color: "#ec4899" },
  YouTube:   { icon: Youtube,   color: "#ef4444" },
  LinkedIn:  { icon: Linkedin,  color: "#0ea5e9" },
  Twitter:   { icon: Twitter,   color: "#60a5fa" },
} as const;
type ChannelName = keyof typeof CHANNEL_META;

/* ---------- mock data ---------- */
const channelMatrix: {
  name: ChannelName;
  totalMentions: number;
  mentionVolume: number;
  engagementRate: number;
  audienceGrowth: number;
  interactionRate: number;
}[] = [
  { name: "Facebook",  totalMentions: 842, mentionVolume: 1240, engagementRate: 6.4, audienceGrowth: 4.2, interactionRate: 3.1 },
  { name: "Instagram", totalMentions: 614, mentionVolume:  980, engagementRate: 8.7, audienceGrowth: 7.5, interactionRate: 5.6 },
  { name: "YouTube",   totalMentions: 232, mentionVolume:  410, engagementRate: 5.2, audienceGrowth: 2.8, interactionRate: 2.4 },
  { name: "LinkedIn",  totalMentions: 318, mentionVolume:  520, engagementRate: 4.1, audienceGrowth: 3.6, interactionRate: 2.0 },
  { name: "Twitter",   totalMentions: 542, mentionVolume:  870, engagementRate: 3.8, audienceGrowth: 1.9, interactionRate: 4.2 },
];

type Risk = "high" | "impact" | "rising" | "normal";
type Mention = {
  id: string;
  user: string;
  initials: string;
  channel: ChannelName;
  text: string;
  score: number;
  tone: "neg" | "warn" | "ok" | "good";
  risk: Risk;
  updatedMinAgo: number;
};

const FEED: Mention[] = [
  { id: "m1", user: "@upsetcustomer", initials: "UC", channel: "Twitter",   text: "Support never replied to my refund request. Disappointed. #brandfail",        score: 22, tone: "neg",  risk: "high",    updatedMinAgo: 12 },
  { id: "m2", user: "Crisis Watch",   initials: "CW", channel: "Facebook",  text: "Negative thread gaining traction — 240+ angry comments in the last hour.",     score: 18, tone: "neg",  risk: "high",    updatedMinAgo: 7  },
  { id: "m3", user: "@boycottnews",   initials: "BN", channel: "Instagram", text: "Reel calling out the brand passed 50k views, mostly negative sentiment.",      score: 26, tone: "neg",  risk: "high",    updatedMinAgo: 22 },
  { id: "m4", user: "@trendlens",     initials: "TL", channel: "Twitter",   text: "Honestly @brandsync is the cleanest MarTech UI I've used in years. ✨",        score: 82, tone: "good", risk: "impact",  updatedMinAgo: 2  },
  { id: "m5", user: "TechCrunch",     initials: "TC", channel: "LinkedIn",  text: "Verified outlet shared a feature story — strong reach across the network.",   score: 78, tone: "good", risk: "impact",  updatedMinAgo: 35 },
  { id: "m6", user: "Creator Hub",    initials: "CH", channel: "YouTube",   text: "Review video crossed 120k views with mostly positive comments.",               score: 74, tone: "good", risk: "impact",  updatedMinAgo: 48 },
  { id: "m7", user: "@growthnerd",    initials: "GN", channel: "Twitter",   text: "Hashtag #BrandSyncWorks just jumped 4× in the last hour — keep watching.",     score: 64, tone: "warn", risk: "rising",  updatedMinAgo: 5  },
  { id: "m8", user: "@adopslead",     initials: "AD", channel: "LinkedIn",  text: "Cut paid spend by 38% in 6 weeks switching to BrandSync auto-pilot.",          score: 71, tone: "warn", risk: "rising",  updatedMinAgo: 18 },
  { id: "m9", user: "@cmoworld",      initials: "CM", channel: "Instagram", text: "BrandSync's predictive simulation literally saved a $40k campaign.",            score: 86, tone: "good", risk: "normal",  updatedMinAgo: 44 },
  { id: "m10", user: "@happyuser",    initials: "HU", channel: "Facebook",  text: "Onboarding was smooth. Loving the new dashboard.",                              score: 70, tone: "good", risk: "normal",  updatedMinAgo: 55 },
];

/* ---------- atoms ---------- */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.25)]", className)}>
      {children}
    </div>
  );
}

function KPI({ label, value, delta, deltaTone, icon, iconBg, iconColor, accent }: {
  label: string; value: string; delta?: string; deltaTone?: "up" | "down";
  icon: React.ReactNode; iconBg: string; iconColor: string; accent?: boolean;
}) {
  return (
    <Card className={cn("p-5", accent && "ring-1 ring-rose-400/30")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", iconBg, iconColor)}>{icon}</div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {deltaTone === "down"
            ? <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
            : <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />}
          <span className={cn("font-semibold", deltaTone === "down" ? "text-rose-400" : "text-emerald-400")}>{delta}</span>
          <span className="text-muted-foreground">vs. previous period</span>
        </div>
      )}
    </Card>
  );
}

function ChannelChip({ channel }: { channel: ChannelName }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${meta.color}1f`, color: meta.color }}
    >
      <Icon className="h-3 w-3" />
      {channel}
    </span>
  );
}

/* ---------- date filter ---------- */
type DateMode = "single" | "range" | "multiple";

function DateFilter({
  mode, setMode, single, setSingle, range, setRange, multi, setMulti,
}: {
  mode: DateMode; setMode: (m: DateMode) => void;
  single?: Date; setSingle: (d?: Date) => void;
  range?: DateRange; setRange: (r?: DateRange) => void;
  multi: Date[]; setMulti: (d: Date[]) => void;
}) {
  const label = useMemo(() => {
    if (mode === "single") return single ? format(single, "MMM d, yyyy") : "Pick a date";
    if (mode === "range")
      return range?.from
        ? range.to
          ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
          : format(range.from, "MMM d, yyyy")
        : "Pick a range";
    return multi.length ? `${multi.length} date${multi.length > 1 ? "s" : ""} selected` : "Pick dates";
  }, [mode, single, range, multi]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground/90 hover:bg-white/10">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex gap-1 border-b border-border p-2">
          {(["single", "range", "multiple"] as DateMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize",
                mode === m ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:bg-white/5",
              )}
            >
              {m === "single" ? "Specific date" : m === "range" ? "Date range" : "Multiple dates"}
            </button>
          ))}
        </div>
        {mode === "single" && (
          <Calendar mode="single" selected={single} onSelect={setSingle} initialFocus className="pointer-events-auto p-3" />
        )}
        {mode === "range" && (
          <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className="pointer-events-auto p-3" />
        )}
        {mode === "multiple" && (
          <Calendar mode="multiple" selected={multi} onSelect={(d) => setMulti(d ?? [])} initialFocus className="pointer-events-auto p-3" />
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Add Your Channel ---------- */
function AddYourChannel() {
  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [connected, setConnected] = useState<ChannelName[]>(["Facebook", "Instagram"]);

  const toggle = (c: ChannelName) => {
    if (connected.includes(c)) {
      setConnected(connected.filter((x) => x !== c));
      toast(`${c} disconnected`);
    } else {
      setConnected([...connected, c]);
      toast.success(`${c} connected`);
    }
  };

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Add Your Channel</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect accounts, paste a channel link, or search a brand to monitor it across one workspace.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect a social account</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(CHANNEL_META) as ChannelName[]).map((c) => {
                const Icon = CHANNEL_META[c].icon;
                const on = connected.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggle(c)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-colors",
                      on ? "bg-emerald-500/10 border-emerald-400/30" : "hover:bg-white/5",
                    )}
                  >
                    <Icon className="h-6 w-6" style={{ color: CHANNEL_META[c].color }} />
                    <span className="text-sm font-medium text-foreground">{c}</span>
                    <span className={cn("text-[10px]", on ? "text-emerald-400" : "text-muted-foreground")}>
                      {on ? "Connected" : "Connect"}
                    </span>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                toast.success(`Searching for "${search}"…`);
                setSearch("");
              }
            }}
            placeholder="Search your brand (e.g. Nike, Tesla)…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste channel link (facebook.com/yourbrand)…"
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (!link.trim()) return;
              toast.success("Channel link added");
              setLink("");
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Connected</span>
        {connected.length === 0 && <span className="text-xs text-muted-foreground">No accounts yet.</span>}
        {connected.map((c) => <ChannelChip key={c} channel={c} />)}
      </div>
    </Card>
  );
}

/* ---------- page ---------- */
function Reputation() {
  const [feedFilter, setFeedFilter] = useState<"all" | "high" | "impact" | "rising">("all");

  // date filter state (UI only — would drive data fetch in production)
  const [mode, setMode] = useState<DateMode>("single");
  const [single, setSingle] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>();
  const [multi, setMulti] = useState<Date[]>([]);

  const highRiskCount = FEED.filter((m) => m.risk === "high").length;
  const impactCount   = FEED.filter((m) => m.risk === "impact").length;
  const risingCount   = FEED.filter((m) => m.risk === "rising").length;

  const visibleFeed = useMemo(() => {
    if (feedFilter === "all") {
      const highRisk = FEED.filter((m) => m.risk === "high")
        .sort((a, b) => a.updatedMinAgo - b.updatedMinAgo)
        .slice(0, 3);
      const rest = FEED
        .filter((m) => !highRisk.includes(m))
        .sort((a, b) => a.updatedMinAgo - b.updatedMinAgo);
      return [...highRisk, ...rest];
    }
    return FEED
      .filter((m) => (feedFilter === "high" ? m.risk === "high" : feedFilter === "impact" ? m.risk === "impact" : m.risk === "rising"))
      .sort((a, b) => a.updatedMinAgo - b.updatedMinAgo);
  }, [feedFilter]);

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] p-6">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Brand Reputation Radar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mentions, AI scoring and actionable insights across every connected channel.</p>
        </div>
        <DateFilter
          mode={mode} setMode={setMode}
          single={single} setSingle={setSingle}
          range={range} setRange={setRange}
          multi={multi} setMulti={setMulti}
        />
      </div>

      {/* Add Your Channel — primary element */}
      <AddYourChannel />

      {/* KPI row — Needs Attention right after Total Mentions */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPI label="Total Mentions" value="2,148" delta="18%" deltaTone="up"
          icon={<MessageCircle className="h-5 w-5" />} iconBg="bg-violet-500/15" iconColor="text-violet-300" />
        <KPI accent label="Needs Attention (High Risk)" value="412" delta="12%" deltaTone="down"
          icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-rose-500/15" iconColor="text-rose-300" />
        <KPI label="High Impact Mentions" value="321" delta="23%" deltaTone="up"
          icon={<Star className="h-5 w-5" />} iconBg="bg-amber-500/15" iconColor="text-amber-300" />
        <KPI label="Rising Mentions" value="128" delta="29%" deltaTone="up"
          icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-indigo-500/15" iconColor="text-indigo-300" />
        <KPI label="Average AI Score" value="63" delta="6 pts" deltaTone="up"
          icon={<Target className="h-5 w-5" />} iconBg="bg-emerald-500/15" iconColor="text-emerald-300" />
      </div>

      {/* Channel Matrix + Mention Feed */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Channel Performance Matrix</h3>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Live · selected period</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Channel</th>
                  <th className="pb-3 text-right font-medium">Total Mentions</th>
                  <th className="pb-3 text-right font-medium">Mention Volume</th>
                  <th className="pb-3 text-right font-medium">Engagement</th>
                  <th className="pb-3 text-right font-medium">Audience Growth</th>
                  <th className="pb-3 text-right font-medium">Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {channelMatrix.map((c) => {
                  const meta = CHANNEL_META[c.name];
                  const Icon = meta.icon;
                  return (
                    <tr key={c.name} className="text-foreground/90">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                            style={{ background: `${meta.color}22`, color: meta.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">{c.totalMentions.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{c.mentionVolume.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{c.engagementRate}%</td>
                      <td className="py-3 text-right tabular-nums text-emerald-400">+{c.audienceGrowth}%</td>
                      <td className="py-3 text-right tabular-nums">{c.interactionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mention Feed */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Mention Feed</h3>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {[
              { key: "all",    label: "All Mentions",          count: FEED.length,    danger: false },
              { key: "high",   label: "Needs Attention",       count: highRiskCount,  danger: true  },
              { key: "impact", label: "High Impact",           count: impactCount,    danger: false },
              { key: "rising", label: "Rising Mentions",       count: risingCount,    danger: false },
            ].map((t) => {
              const active = feedFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setFeedFilter(t.key as typeof feedFilter)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? t.danger
                        ? "border-rose-400/30 bg-rose-500/15 text-rose-300"
                        : "border-violet-400/30 bg-violet-500/15 text-violet-200"
                      : "border-border bg-white/5 text-muted-foreground hover:bg-white/10",
                  )}
                >
                  {t.label}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-4 min-w-4 rounded-full px-1 text-[10px]",
                      t.danger ? "bg-rose-500/25 text-rose-200" : "bg-white/10 text-foreground/80",
                    )}
                  >
                    {t.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {visibleFeed.map((m) => {
              const pinned = feedFilter === "all" && m.risk === "high";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-3 rounded-xl border p-3 transition-colors",
                    pinned
                      ? "border-rose-400/30 bg-rose-500/[0.06]"
                      : "border-border hover:bg-white/[0.04]",
                  )}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-[11px] font-semibold text-white">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-semibold text-foreground">{m.user}</span>
                      <ChannelChip channel={m.channel} />
                      <span className="text-[11px] text-muted-foreground">· {m.updatedMinAgo}m ago</span>
                      {pinned && (
                        <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                          High Risk
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-snug text-foreground/75">{m.text}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">Score</span>
                    <span
                      className={cn(
                        "text-xl font-semibold tabular-nums",
                        m.tone === "neg"  ? "text-rose-400" :
                        m.tone === "warn" ? "text-amber-300" :
                        m.tone === "ok"   ? "text-amber-300" : "text-emerald-400",
                      )}
                    >
                      {m.score}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="hover:text-foreground"><Bookmark className="h-3.5 w-3.5" /></button>
                      <button className="hover:text-foreground"><MoreVertical className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Export Report */}
      <div className="mt-6 flex justify-start">
        <Button
          onClick={() => toast.success("Report exported · check your downloads")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-white/10"
          variant="outline"
        >
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>
    </div>
  );
}
