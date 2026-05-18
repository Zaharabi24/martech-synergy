import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  MessageCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Target,
  CalendarIcon,
  Download,
  Plus,
  Search,
  Link2,
  Info,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Bookmark,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Send,
  Smile,
  Paperclip,
  Wand2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  FileSpreadsheet,
  FileBarChart,
  Zap,
  Settings2,
  Languages,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/dashboard/reputation")({
  component: Reputation,
  head: () => ({ meta: [{ title: "Brand & Reputation — BrandSync AI" }] }),
});

/* ---------- channel meta ---------- */
const CHANNEL_META = {
  Facebook: { icon: Facebook, color: "#3b82f6" },
  Instagram: { icon: Instagram, color: "#ec4899" },
  YouTube: { icon: Youtube, color: "#ef4444" },
  LinkedIn: { icon: Linkedin, color: "#0ea5e9" },
  Twitter: { icon: Twitter, color: "#a78bfa" },
} as const;
type ChannelName = keyof typeof CHANNEL_META;
const CHANNEL_LIST = Object.keys(CHANNEL_META) as ChannelName[];

/* ---------- mock data ---------- */
const channelMatrix: {
  name: ChannelName;
  totalMentions: number;
  mentionVolume: number;
  engagementRate: number;
  audienceGrowth: number;
  interactionRate: number;
}[] = [
  {
    name: "Facebook",
    totalMentions: 842,
    mentionVolume: 1240,
    engagementRate: 6.4,
    audienceGrowth: 4.2,
    interactionRate: 3.1,
  },
  {
    name: "Instagram",
    totalMentions: 614,
    mentionVolume: 980,
    engagementRate: 8.7,
    audienceGrowth: 7.5,
    interactionRate: 5.6,
  },
  {
    name: "YouTube",
    totalMentions: 232,
    mentionVolume: 410,
    engagementRate: 5.2,
    audienceGrowth: 2.8,
    interactionRate: 2.4,
  },
  {
    name: "LinkedIn",
    totalMentions: 318,
    mentionVolume: 520,
    engagementRate: 4.1,
    audienceGrowth: 3.6,
    interactionRate: 2.0,
  },
  {
    name: "Twitter",
    totalMentions: 542,
    mentionVolume: 870,
    engagementRate: 3.8,
    audienceGrowth: 1.9,
    interactionRate: 4.2,
  },
];

const SOURCE_DIST = [
  { name: "Facebook", value: 752, pct: 35 },
  { name: "Instagram", value: 601, pct: 28 },
  { name: "Twitter", value: 430, pct: 20 },
  { name: "LinkedIn", value: 215, pct: 10 },
  { name: "YouTube", value: 150, pct: 7 },
];

const REPUTATION_TREND = [
  { day: "May 10", score: 58, volume: 1100, risk: 0 },
  { day: "May 11", score: 62, volume: 1380, risk: 1 },
  { day: "May 12", score: 60, volume: 1240, risk: 0 },
  { day: "May 13", score: 63, volume: 1480, risk: 1 },
  { day: "May 14", score: 67, volume: 1620, risk: 0 },
  { day: "May 15", score: 65, volume: 1540, risk: 0 },
  { day: "May 16", score: 70, volume: 1820, risk: 0 },
];

const VELOCITY = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  current: Math.round(800 + Math.sin(i / 3) * 350 + Math.random() * 220),
  previous: Math.round(700 + Math.sin(i / 4) * 280 + Math.random() * 180),
}));

const HEATMAP_BUCKETS = ["Morning", "Afternoon", "Evening", "Night"] as const;
type Bucket = (typeof HEATMAP_BUCKETS)[number];
type RiskLevel = "Low" | "Medium" | "High" | "Critical";
const RISK_COLOR: Record<RiskLevel, string> = {
  Low: "bg-emerald-500/25 text-emerald-200 border-emerald-400/30",
  Medium: "bg-amber-500/25 text-amber-200 border-amber-400/30",
  High: "bg-orange-500/25 text-orange-200 border-orange-400/30",
  Critical: "bg-rose-500/30 text-rose-100 border-rose-400/40",
};
const HEATMAP: Record<ChannelName, Record<Bucket, RiskLevel>> = {
  Facebook: { Morning: "Low", Afternoon: "Medium", Evening: "High", Night: "Critical" },
  Instagram: { Morning: "Low", Afternoon: "Medium", Evening: "High", Night: "Critical" },
  Twitter: { Morning: "Medium", Afternoon: "High", Evening: "High", Night: "Critical" },
  LinkedIn: { Morning: "Low", Afternoon: "Medium", Evening: "High", Night: "High" },
  YouTube: { Morning: "Low", Afternoon: "Low", Evening: "Medium", Night: "High" },
};

// sparkline helpers
const spark = (seed: number, n = 24) =>
  Array.from({ length: n }, (_, i) => ({
    i,
    v: Math.round(40 + Math.sin(i / 2 + seed) * 18 + Math.cos(i / 3 + seed) * 12 + (seed % 7)),
  }));

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
  {
    id: "m1",
    user: "Crisis Watch",
    initials: "CW",
    channel: "Facebook",
    text: "Negative thread gaining traction — 240+ angry comments in the last hour.",
    score: 18,
    tone: "neg",
    risk: "high",
    updatedMinAgo: 10,
  },
  {
    id: "m2",
    user: "@upsetcustomer",
    initials: "UC",
    channel: "Twitter",
    text: "Support never replied to my refund request. Disappointed. #brandfail",
    score: 22,
    tone: "neg",
    risk: "high",
    updatedMinAgo: 20,
  },
  {
    id: "m3",
    user: "@boycottnews",
    initials: "BN",
    channel: "Instagram",
    text: "Reel calling out the brand passed 50k views, mostly negative sentiment.",
    score: 26,
    tone: "neg",
    risk: "high",
    updatedMinAgo: 35,
  },
  {
    id: "m4",
    user: "@trendlens",
    initials: "TL",
    channel: "Twitter",
    text: "Honestly @brandsync is the cleanest MarTech UI I've used in years.",
    score: 82,
    tone: "good",
    risk: "impact",
    updatedMinAgo: 42,
  },
  {
    id: "m5",
    user: "TechCrunch",
    initials: "TC",
    channel: "LinkedIn",
    text: "Verified outlet shared a feature story — strong reach across the network.",
    score: 78,
    tone: "good",
    risk: "impact",
    updatedMinAgo: 55,
  },
  {
    id: "m6",
    user: "Creator Hub",
    initials: "CH",
    channel: "YouTube",
    text: "Review video crossed 120k views with mostly positive comments.",
    score: 74,
    tone: "good",
    risk: "impact",
    updatedMinAgo: 68,
  },
  {
    id: "m7",
    user: "@growthnerd",
    initials: "GN",
    channel: "Twitter",
    text: "Hashtag #BrandSyncWorks just jumped 4× in the last hour — keep watching.",
    score: 64,
    tone: "warn",
    risk: "rising",
    updatedMinAgo: 18,
  },
  {
    id: "m8",
    user: "@adopslead",
    initials: "AD",
    channel: "LinkedIn",
    text: "Cut paid spend by 38% in 6 weeks switching to BrandSync auto-pilot.",
    score: 71,
    tone: "warn",
    risk: "rising",
    updatedMinAgo: 30,
  },
  {
    id: "m9",
    user: "@cmoworld",
    initials: "CM",
    channel: "Instagram",
    text: "BrandSync's predictive simulation literally saved a $40k campaign.",
    score: 86,
    tone: "good",
    risk: "normal",
    updatedMinAgo: 44,
  },
  {
    id: "m10",
    user: "@happyuser",
    initials: "HU",
    channel: "Facebook",
    text: "Onboarding was smooth. Loving the new dashboard.",
    score: 70,
    tone: "good",
    risk: "normal",
    updatedMinAgo: 60,
  },
];

/* ---------- atoms ---------- */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Sparkline({ seed, color }: { seed: number; color: string }) {
  const data = useMemo(() => spark(seed), [seed]);
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`sp-${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp-${seed})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPI({
  label,
  value,
  delta,
  deltaTone,
  icon,
  iconBg,
  iconColor,
  accent,
  sparkColor,
  seed,
  onClick,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accent?: boolean;
  sparkColor: string;
  seed: number;
  onClick?: () => void;
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_8px_30px_-12px_rgba(167,139,250,0.35)]",
        accent && "ring-1 ring-rose-400/30",
      )}
    >
      <div onClick={onClick}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          </div>
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl", iconBg, iconColor)}>{icon}</div>
        </div>
        {delta && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {deltaTone === "down" ? (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span className={cn("font-semibold", deltaTone === "down" ? "text-rose-400" : "text-emerald-400")}>
              {delta}
            </span>
            <span className="text-muted-foreground">vs. previous period</span>
          </div>
        )}
        <Sparkline seed={seed} color={sparkColor} />
      </div>
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
      {channel === "Twitter" ? "Twitter / X" : channel}
    </span>
  );
}

/* ---------- date filter ---------- */
type DateMode = "single" | "range" | "multiple";

function DateFilter({
  mode,
  setMode,
  single,
  setSingle,
  range,
  setRange,
  multi,
  setMulti,
}: {
  mode: DateMode;
  setMode: (m: DateMode) => void;
  single?: Date;
  setSingle: (d?: Date) => void;
  range?: DateRange;
  setRange: (r?: DateRange) => void;
  multi: Date[];
  setMulti: (d: Date[]) => void;
}) {
  const label = useMemo(() => {
    if (mode === "single") return single ? format(single, "MMM d, yyyy") : "Pick a date";
    if (mode === "range")
      return range?.from
        ? range.to
          ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
          : format(range.from, "MMM d, yyyy")
        : "May 10 – May 16, 2026";
    return multi.length ? `${multi.length} date${multi.length > 1 ? "s" : ""} selected` : "Pick dates";
  }, [mode, single, range, multi]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground/90 hover:bg-white/10">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
          <Calendar
            mode="single"
            selected={single}
            onSelect={setSingle}
            initialFocus
            className="pointer-events-auto p-3"
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            initialFocus
            className="pointer-events-auto p-3"
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={multi}
            onSelect={(d) => setMulti(d ?? [])}
            initialFocus
            className="pointer-events-auto p-3"
          />
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
      <div className="grid gap-5 lg:grid-cols-[auto_1fr_1fr] lg:items-end">
        {/* Channel icons */}
        <div>
          <h2 className="text-base font-semibold text-foreground">Add Your Channel</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect your social accounts or add channel links to start monitoring.
          </p>
          <div className="mt-3 flex items-center gap-3">
            {CHANNEL_LIST.map((c) => {
              const Icon = CHANNEL_META[c].icon;
              const on = connected.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className="group flex flex-col items-center gap-1"
                  title={on ? `${c} · connected` : `Connect ${c}`}
                >
                  <span
                    className={cn(
                      "relative grid h-11 w-11 place-items-center rounded-xl border transition-all group-hover:-translate-y-0.5",
                      on
                        ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_18px_-4px_rgba(16,185,129,0.4)]"
                        : "border-border bg-white/5 hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: CHANNEL_META[c].color }} />
                    {on && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c === "Twitter" ? "Twitter / X" : c}</span>
                </button>
              );
            })}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center gap-1" title="More channels">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-border bg-white/5 text-muted-foreground hover:bg-white/10">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">More</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage connections</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CHANNEL_LIST.map((c) => {
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
                        <span className="text-sm font-medium text-foreground">
                          {c === "Twitter" ? "Twitter / X" : c}
                        </span>
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
        </div>

        {/* Manual link */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Enter Channel Link Manually</label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste your channel link here…"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                if (!link.trim()) return;
                toast.success("Channel link added");
                setLink("");
              }}
              className="bg-violet-500 text-white hover:bg-violet-500/90"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Search Brand */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Search Your Brand</label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
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
                placeholder="Search any brand, product or keyword…"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                if (!search.trim()) return;
                toast.success(`Searching for "${search}"…`);
                setSearch("");
              }}
              className="bg-violet-500 text-white hover:bg-violet-500/90"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Reputation Health Trend chart ---------- */
function ReputationTrendChart() {
  const [period, setPeriod] = useState("Daily");
  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Reputation Health Trend</h3>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" /> Reputation Score
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" /> Mention Volume
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Risk Spike
            </span>
          </div>
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-white/5 p-0.5">
          {["Daily", "Weekly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === p ? "bg-violet-500/20 text-violet-200" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={REPUTATION_TREND} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 2000]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="score"
              stroke="url(#gScore)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#a78bfa" }}
              activeDot={{ r: 5 }}
              name="Reputation Score"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#38bdf8" }}
              name="Mention Volume"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="risk"
              stroke="#f43f5e"
              strokeWidth={0}
              dot={{ r: 5, fill: "#f43f5e" }}
              name="Risk Spike"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------- Mention Source donut ---------- */
function SourceDistribution() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Mention Source Distribution</h3>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-[170px] w-[170px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SOURCE_DIST}
                dataKey="value"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                stroke="none"
                onClick={(d: { name?: string }) => d?.name && toast(`Filtered by ${d.name}`)}
              >
                {SOURCE_DIST.map((s) => (
                  <Cell key={s.name} fill={CHANNEL_META[s.name as ChannelName].color} cursor="pointer" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold text-foreground">2,148</div>
            <div className="text-[10px] text-muted-foreground">Total Mentions</div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 text-xs">
          {SOURCE_DIST.map((s) => (
            <button
              key={s.name}
              onClick={() => toast(`Filtered by ${s.name}`)}
              className="flex items-center justify-between rounded-md px-2 py-1 text-left transition-colors hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: CHANNEL_META[s.name as ChannelName].color }}
                />
                <span className="text-foreground/90">{s.name === "Twitter" ? "Twitter / X" : s.name}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {s.pct}% <span className="text-foreground/60">({s.value})</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Mention Card with Reply with AI flow ---------- */
function MentionCard({ m, pinned }: { m: Mention; pinned: boolean }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(
    "We're sorry to hear about your experience. This is not what we aim for. Please DM us your order details so we can make this right. 🙏",
  );
  const [autoReply, setAutoReply] = useState(false);
  const [replyAs, setReplyAs] = useState(`${m.channel} Page`);
  const [schedule, setSchedule] = useState<"now" | "best" | "custom">("now");

  const enhance = (style: string) => {
    toast.success(`Enhanced: ${style}`);
    setReply((r) => `[${style}] ${r}`);
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        pinned ? "border-rose-400/30 bg-rose-500/[0.06]" : "border-border hover:bg-white/[0.04]",
      )}
    >
      <div className="flex gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-[11px] font-semibold text-white">
          {m.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-foreground">{m.user}</span>
            <ChannelChip channel={m.channel} />
            <span className="text-[11px] text-muted-foreground">· {m.updatedMinAgo}m ago</span>
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground/75">{m.text}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              m.risk === "high"
                ? "bg-rose-500/20 text-rose-300"
                : m.risk === "impact"
                  ? "bg-amber-500/20 text-amber-300"
                  : m.risk === "rising"
                    ? "bg-violet-500/20 text-violet-200"
                    : "bg-white/10 text-muted-foreground",
            )}
          >
            {m.risk === "high"
              ? "High Risk"
              : m.risk === "impact"
                ? "High Impact"
                : m.risk === "rising"
                  ? "Rising"
                  : "Normal"}
          </span>
          <span className="text-[10px] text-muted-foreground">Score</span>
          <span
            className={cn(
              "text-xl font-semibold tabular-nums leading-none",
              m.tone === "neg" ? "text-rose-400" : m.tone === "warn" ? "text-amber-300" : "text-emerald-400",
            )}
          >
            {m.score}
          </span>
        </div>
      </div>

      {/* Collapsed action */}
      {!open && (
        <div className="mt-3 flex items-center justify-between">
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-1.5 bg-violet-500 text-white hover:bg-violet-500/90"
          >
            <Sparkles className="h-3.5 w-3.5" /> Reply with AI
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground" aria-label="Bookmark">
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:text-foreground">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast("Mention muted")}>Mute</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Escalated to human")}>Escalate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Marked as resolved")}>Mark resolved</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Expanded AI reply panel */}
      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-violet-400/20 bg-violet-500/[0.04] p-3">
          {/* AI recommended */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-violet-300">
              <Sparkles className="h-3 w-3" /> AI Recommended Reply
              <Badge
                variant="secondary"
                className="ml-1 h-4 rounded-md bg-violet-500/20 px-1.5 text-[9px] text-violet-200"
              >
                Suggested
              </Badge>
            </div>
            <p className="rounded-md bg-black/20 p-2 text-xs text-foreground/85">{reply}</p>
          </div>

          {/* Custom editor */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Customize your reply</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{reply.length} / 600</span>
            </div>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              className="resize-none text-xs"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="h-7 gap-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90"
                  >
                    <Wand2 className="h-3 w-3" /> Enhance with AI <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    "More professional",
                    "Friendlier",
                    "Shorter",
                    "More empathetic",
                    "More assertive",
                    "Boost engagement",
                  ].map((s) => (
                    <DropdownMenuItem key={s} onClick={() => enhance(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md border border-border bg-white/5"
                aria-label="Emoji"
              >
                <Smile className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md border border-border bg-white/5"
                aria-label="Attach"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-md border border-border bg-white/5"
                aria-label="Translate"
              >
                <Languages className="h-3.5 w-3.5" />
              </Button>
              {["Empathetic", "Professional", "Short"].map((t) => (
                <button
                  key={t}
                  onClick={() => enhance(t)}
                  className="rounded-md border border-border bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground/85 hover:bg-white/10"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reply-as + Schedule (matches reference 2) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-white/[0.03] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-foreground/90">Reply as</span>
                <Select value={replyAs} onValueChange={setReplyAs}>
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_LIST.map((c) => (
                      <SelectItem key={c} value={`${c} Page`}>
                        {c === "Twitter" ? "Twitter / X" : c} Page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-foreground/90">Auto Reply</span>
                <Switch
                  checked={autoReply}
                  onCheckedChange={(v) => {
                    setAutoReply(v);
                    toast(v ? "Auto-reply active" : "Auto-reply off");
                  }}
                />
              </div>
            </div>
            <div className="rounded-md border border-border bg-white/[0.03] p-2.5">
              <div className="text-[11px] font-medium text-foreground/90">Schedule Auto Reply</div>
              <RadioGroup
                value={schedule}
                onValueChange={(v) => setSchedule(v as typeof schedule)}
                className="mt-1.5 space-y-1"
              >
                {[
                  { k: "now", label: "Reply Immediately" },
                  { k: "best", label: "Best time (Recommended)" },
                  { k: "custom", label: "Custom Time" },
                ].map((o) => (
                  <div key={o.k} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={o.k}
                      id={`${m.id}-${o.k}`}
                      className="h-3.5 w-3.5 border-violet-400/60 text-violet-400"
                    />
                    <Label htmlFor={`${m.id}-${o.k}`} className="text-[11px] font-normal text-foreground/85">
                      {o.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {schedule !== "now" && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Today, 7:30 PM · GMT+05:30
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>AI suggestions may be inaccurate. Please review before sending.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="h-3 w-3" /> Show Less
              </button>
              <Button
                size="sm"
                className="h-7 gap-1 bg-violet-500 text-white hover:bg-violet-500/90"
                onClick={() => {
                  toast.success(schedule === "now" ? "Reply sent" : "Reply scheduled");
                  setOpen(false);
                }}
              >
                <Send className="h-3 w-3" /> Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */
function Reputation() {
  const [feedFilter, setFeedFilter] = useState<"all" | "high" | "impact" | "rising">("all");

  const [mode, setMode] = useState<DateMode>("range");
  const [single, setSingle] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>();
  const [multi, setMulti] = useState<Date[]>([]);

  const highRiskCount = FEED.filter((m) => m.risk === "high").length;
  const impactCount = FEED.filter((m) => m.risk === "impact").length;
  const risingCount = FEED.filter((m) => m.risk === "rising").length;

  const visibleFeed = useMemo(() => {
    if (feedFilter === "all") {
      const highRisk = FEED.filter((m) => m.risk === "high")
        .sort((a, b) => a.updatedMinAgo - b.updatedMinAgo)
        .slice(0, 3);
      const rest = FEED.filter((m) => !highRisk.includes(m)).sort((a, b) => a.updatedMinAgo - b.updatedMinAgo);
      return [...highRisk, ...rest];
    }
    return FEED.filter((m) =>
      feedFilter === "high" ? m.risk === "high" : feedFilter === "impact" ? m.risk === "impact" : m.risk === "rising",
    ).sort((a, b) => a.updatedMinAgo - b.updatedMinAgo);
  }, [feedFilter]);

  const exportAs = (kind: string) => toast.success(`Exporting ${kind}…`);

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] overflow-x-hidden bg-gradient-to-b from-background to-background/60 p-6">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Brand &amp; Reputation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor brand conversations and reputation across all your connected channels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateFilter
            mode={mode}
            setMode={setMode}
            single={single}
            setSingle={setSingle}
            range={range}
            setRange={setRange}
            multi={multi}
            setMulti={setMulti}
          />
          <button
            onClick={() => setMode("range")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground/90 hover:bg-white/10"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Custom Range
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-border bg-white/5 hover:bg-white/10">
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAs("PDF")}>
                <FileText className="mr-2 h-4 w-4" /> PDF Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("CSV")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("AI Summary")}>
                <Sparkles className="mr-2 h-4 w-4" /> AI Summary Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("Reputation Snapshot")}>
                <FileBarChart className="mr-2 h-4 w-4" /> Reputation Snapshot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("Mention Performance Summary")}>
                <FileBarChart className="mr-2 h-4 w-4" /> Mention Performance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AddYourChannel />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPI
          label="Total Mentions"
          value="2,148"
          delta="18%"
          deltaTone="up"
          icon={<MessageCircle className="h-5 w-5" />}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-300"
          sparkColor="#60a5fa"
          seed={1}
          onClick={() => setFeedFilter("all")}
        />
        <KPI
          accent
          label="Needs Attention (High Risk)"
          value="412"
          delta="12%"
          deltaTone="down"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-rose-500/15"
          iconColor="text-rose-300"
          sparkColor="#f43f5e"
          seed={2}
          onClick={() => setFeedFilter("high")}
        />
        <KPI
          label="High Impact Mentions"
          value="321"
          delta="23%"
          deltaTone="up"
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-300"
          sparkColor="#fbbf24"
          seed={3}
          onClick={() => setFeedFilter("impact")}
        />
        <KPI
          label="Rising Mentions"
          value="128"
          delta="29%"
          deltaTone="up"
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-indigo-500/15"
          iconColor="text-indigo-300"
          sparkColor="#a78bfa"
          seed={4}
          onClick={() => setFeedFilter("rising")}
        />
        <KPI
          label="Average AI Score"
          value="63"
          delta="6 pts"
          deltaTone="up"
          icon={<Target className="h-5 w-5" />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-300"
          sparkColor="#34d399"
          seed={5}
        />
      </div>

      {/* Trend + Donut + Feed */}
      <div className="mb-6 grid w-full grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-3">
          <ReputationTrendChart />
        </div>
        <div className="min-w-0 xl:col-span-3">
          <SourceDistribution />
        </div>

        {/* Mention Feed */}
        <Card className="flex min-w-0 flex-col p-5 xl:col-span-6 xl:row-span-2 xl:max-h-[760px] overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Mention Feed</h3>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-[11px] text-muted-foreground">Sort: Latest</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "All Mentions", count: FEED.length, danger: false },
              { key: "high", label: "Needs Attention", count: highRiskCount, danger: true },
              { key: "impact", label: "High Impact", count: impactCount, danger: false },
              { key: "rising", label: "Rising", count: risingCount, danger: false },
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

          {/* AI Auto Reply Agent header bar (reference 2) */}
          <div className="mb-3 flex items-center justify-between rounded-lg border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-500/20 text-violet-300">
                <Zap className="h-3 w-3" />
              </span>
              <span className="font-medium text-foreground/90">AI Auto Reply Agent</span>
              <span className="text-muted-foreground">· Active on 3 channels</span>
            </div>
            <button
              onClick={() => toast("Open auto-reply configuration")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-300 hover:text-violet-200"
            >
              <Settings2 className="h-3 w-3" /> Configure
            </button>
          </div>

          <div className="flex-1 min-h-0 max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {visibleFeed.map((m) => (
              <MentionCard key={m.id} m={m} pinned={feedFilter === "all" && m.risk === "high"} />
            ))}
          </div>

          <button
            onClick={() => toast("Loading more mentions…")}
            className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            View All Mentions →
          </button>
        </Card>

        {/* Channel Matrix — row 2, col 1 */}
        <Card className="min-w-0 p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Channel Performance Matrix</h3>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Channel</th>
                  <th className="pb-3 text-right font-medium">Total Mentions</th>
                  <th className="pb-3 text-right font-medium">Mention Volume</th>
                  <th className="pb-3 text-right font-medium">Engagement Rate</th>
                  <th className="pb-3 text-right font-medium">Audience Growth</th>
                  <th className="pb-3 text-right font-medium">Interaction Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {channelMatrix.map((c) => {
                  const meta = CHANNEL_META[c.name];
                  const Icon = meta.icon;
                  return (
                    <tr key={c.name} className="text-foreground/90 transition-colors hover:bg-white/[0.03]">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                            style={{ background: `${meta.color}22`, color: meta.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium">{c.name === "Twitter" ? "Twitter / X" : c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">{c.totalMentions.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{c.mentionVolume.toLocaleString()}</td>
                      <td className="py-3 text-right tabular-nums">{c.engagementRate}%</td>
                      <td className="py-3 text-right tabular-nums text-emerald-400">↗ {c.audienceGrowth}%</td>
                      <td className="py-3 text-right tabular-nums">{c.interactionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Heatmap */}
        <Card className="min-w-0 p-4 xl:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Reputation Risk Heatmap</h3>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr className="text-[10px] text-muted-foreground">
                  <th className="text-left font-medium">Time / Channel</th>
                  {HEATMAP_BUCKETS.map((b) => (
                    <th key={b} className="text-center font-medium">
                      <div>{b}</div>
                      <div className="text-[9px] text-muted-foreground/70">
                        {b === "Morning"
                          ? "6AM–12PM"
                          : b === "Afternoon"
                            ? "12PM–6PM"
                            : b === "Evening"
                              ? "6PM–12AM"
                              : "12AM–6AM"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHANNEL_LIST.map((c) => (
                  <tr key={c}>
                    <td className="py-1.5 text-foreground/85">{c === "Twitter" ? "Twitter / X" : c}</td>
                    {HEATMAP_BUCKETS.map((b) => {
                      const lvl = HEATMAP[c][b];
                      return (
                        <td key={b}>
                          <div
                            className={cn(
                              "grid place-items-center rounded-md border px-2 py-1.5 text-[10px] font-medium",
                              RISK_COLOR[lvl],
                            )}
                          >
                            {lvl}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            {(["Low", "Medium", "High", "Critical"] as RiskLevel[]).map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm border", RISK_COLOR[l])} /> {l}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Velocity */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Mention Velocity</h3>
              <span className="text-xs text-muted-foreground">(Volume Over Time)</span>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" /> This Period
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-muted-foreground" /> Previous Period
              </span>
            </div>
          </div>
          <Select defaultValue="Hourly">
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hourly">Hourly</SelectItem>
              <SelectItem value="Daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={VELOCITY} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="velCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="transparent"
                name="Previous Period"
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#velCur)"
                name="This Period"
              />
              <Legend wrapperStyle={{ display: "none" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Auto-reply is active for 3 rules
          </span>
          <span>All times in your selected timezone (GMT+05:30)</span>
        </div>
      </Card>
    </div>
  );
}
