import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Plus, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ACTIVITIES, fmtDuration, weeklyStats, type Sport } from "@/lib/mock-data";
import { AppShell } from "@/components/AppShell";
import { SportBadge } from "@/components/SportBadge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getHeadline,
  getInsights,
  getRecommendation,
  rowTag,
  type Insight,
  type Recommendation,
  type Tone,
} from "./intel";

const SPORT_COLORS: Record<Sport, string> = {
  Run: "var(--primary)",
  Ride: "var(--accent)",
  Swim: "oklch(0.6 0.18 230)",
  Hike: "oklch(0.55 0.15 145)",
  Walk: "oklch(0.7 0.05 80)",
};

const TONE_DOT: Record<Tone, string> = {
  good: "bg-pr",
  watch: "bg-primary",
  neutral: "bg-muted-foreground/50",
};

type VariantId = "briefing" | "side-panel" | "row-tags";

export default function AthleteIntelligencePrototype() {
  const [variant, setVariant] = useState<VariantId>("briefing");
  const insights = useMemo(() => getInsights(), []);
  const recommendation = useMemo(() => getRecommendation(), []);
  const headline = useMemo(() => getHeadline(), []);

  return (
    <>
      <TrainingShell
        briefing={
          variant === "briefing" ? (
            <Briefing insights={insights} recommendation={recommendation} headline={headline} />
          ) : undefined
        }
        headerAction={
          variant === "side-panel" ? (
            <InsightsSheet insights={insights} recommendation={recommendation} />
          ) : undefined
        }
        rowTags={variant === "row-tags"}
      />
      <VariantSwitcher current={variant} onChange={setVariant} />
    </>
  );
}

/* ===== The training log, as it exists at /training ===== */

function TrainingShell({
  briefing,
  headerAction,
  rowTags,
}: {
  briefing?: React.ReactNode;
  headerAction?: React.ReactNode;
  rowTags: boolean;
}) {
  const my = useMemo(() => ACTIVITIES.filter((a) => a.athleteId === "me"), []);
  const weeks = weeklyStats("me");
  const [sport, setSport] = useState<"All" | Sport>("All");

  const sportBreakdown = useMemo(() => {
    const map = new Map<Sport, number>();
    my.forEach((a) => map.set(a.sport, (map.get(a.sport) ?? 0) + a.distanceKm));
    return Array.from(map.entries()).map(([s, km]) => ({
      name: s,
      value: Math.round(km * 10) / 10,
    }));
  }, [my]);

  const filtered = sport === "All" ? my : my.filter((a) => a.sport === sport);
  const totals = filtered.reduce(
    (acc, a) => ({
      km: acc.km + a.distanceKm,
      time: acc.time + a.movingSeconds,
      elev: acc.elev + a.elevationM,
      count: acc.count + 1,
    }),
    { km: 0, time: 0, elev: 0, count: 0 },
  );

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <AppShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Every effort, logged.</p>
          <h1 className="mt-1 text-3xl font-display font-bold tracking-tight">Training log</h1>
        </div>
        {headerAction}
      </div>

      {briefing}

      <div className="mb-8 grid grid-cols-4 gap-4">
        <Card label="Activities" value={totals.count} />
        <Card label="Distance" value={`${totals.km.toFixed(1)} km`} />
        <Card label="Time" value={fmtDuration(totals.time)} />
        <Card label="Elevation" value={`${totals.elev.toLocaleString()} m`} />
      </div>

      <div className="mb-10 grid grid-cols-3 gap-6">
        <section className="col-span-2 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Weekly volume (km)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="km" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Sport breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {sportBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={SPORT_COLORS[entry.name as Sport]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">All activities</h2>
        <div className="flex gap-1 rounded-md bg-surface-2 p-1">
          {(["All", "Run", "Ride", "Swim", "Hike", "Walk"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`rounded px-3 py-1.5 text-xs ${
                sport === s
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Activity</th>
              <th className="px-4 py-3 text-left font-medium">Sport</th>
              {rowTags && <th className="px-4 py-3 text-left font-medium">Insight</th>}
              <th className="px-4 py-3 text-right font-medium">Distance</th>
              <th className="px-4 py-3 text-right font-medium">Time</th>
              <th className="px-4 py-3 text-right font-medium">Elev</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const tag = rowTags ? rowTag(a) : undefined;
              return (
                <tr key={a.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/activity/${a.id}`} className="font-medium hover:text-primary">
                      {a.title}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <SportBadge sport={a.sport} />
                  </td>
                  {rowTags && (
                    <td className="px-4 py-3">
                      {tag && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
                              <Sparkles className="h-3 w-3" />
                              {tag.label}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-64 p-3 text-sm">
                            <div className="font-display font-semibold">{tag.label}</div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {tag.reason}
                            </p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-mono">{a.distanceKm.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtDuration(a.movingSeconds)}</td>
                  <td className="px-4 py-3 text-right font-mono">{a.elevationM} m</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={rowTags ? 7 : 6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No activities for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="stat-num mt-1 text-2xl">{value}</div>
    </div>
  );
}

/* ===== Shared insight pieces ===== */

function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[insight.tone]}`} />
        {insight.title}
      </div>
      <div className="stat-num mt-2 text-2xl font-bold leading-none">{insight.metric}</div>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{insight.summary}</p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary"
      >
        Why this?
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 border-t border-border pt-3">
          <p className="text-xs leading-5 text-muted-foreground">{insight.why}</p>
          {insight.evidence.length > 0 && (
            <ul className="mt-2 space-y-1">
              {insight.evidence.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link
                    to="/activity/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between gap-2 text-xs hover:text-primary"
                  >
                    <span className="truncate">{a.title}</span>
                    <span className="num shrink-0 text-muted-foreground">
                      {a.distanceKm.toFixed(1)} km
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">Helpful?</span>
            {(["up", "down"] as const).map((v) => {
              const Icon = v === "up" ? ThumbsUp : ThumbsDown;
              return (
                <button
                  key={v}
                  onClick={() => setVote(vote === v ? null : v)}
                  aria-label={v === "up" ? "Helpful" : "Not helpful"}
                  className={`rounded p-1.5 transition-colors ${
                    vote === v
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NextSession({ rec, compact }: { rec: Recommendation; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <div
      className={`flex items-center gap-4 rounded-lg bg-secondary text-secondary-foreground ${
        compact ? "flex-col items-stretch p-4" : "px-5 py-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
          Suggested next session
        </div>
        <div className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
          {rec.minutes} min {rec.sport.toLowerCase()}
          <span className="text-sm font-normal opacity-70">· {rec.intensity}</span>
        </div>
        <p className="mt-0.5 text-sm opacity-80">{rec.reason}</p>
      </div>
      <Button
        size="sm"
        variant={added ? "outline" : "default"}
        onClick={() => setAdded((a) => !a)}
        className={added ? "bg-transparent text-secondary-foreground hover:bg-white/10" : ""}
      >
        {added ? <Check /> : <Plus />}
        {added ? "Added to plan" : "Add to plan"}
      </Button>
    </div>
  );
}

/* ===== Variant A: briefing above the stats ===== */

function Briefing({
  insights,
  recommendation,
  headline,
}: {
  insights: Insight[];
  recommendation: Recommendation;
  headline: string;
}) {
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface-2 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold">Athlete intelligence</h2>
        <span className="text-sm text-muted-foreground">· {headline}</span>
      </div>
      <div className="grid grid-cols-3 items-start gap-4">
        {insights.slice(0, 3).map((i) => (
          <InsightCard key={i.id} insight={i} />
        ))}
      </div>
      <div className="mt-4">
        <NextSession rec={recommendation} />
      </div>
    </section>
  );
}

/* ===== Variant B: side panel from the header ===== */

function InsightsSheet({
  insights,
  recommendation,
}: {
  insights: Insight[];
  recommendation: Recommendation;
}) {
  const watch = insights.filter((i) => i.tone === "watch").length;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="text-primary" />
          Insights
          {watch > 0 && (
            <span className="num rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
              {watch}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="font-display">Athlete intelligence</SheetTitle>
          <SheetDescription>What your last few weeks of training are telling you.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          <NextSession rec={recommendation} compact />
          {insights.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ===== Switcher ===== */

function VariantSwitcher({
  current,
  onChange,
}: {
  current: VariantId;
  onChange: (v: VariantId) => void;
}) {
  const options: { id: VariantId; label: string }[] = [
    { id: "briefing", label: "Briefing" },
    { id: "side-panel", label: "Side panel" },
    { id: "row-tags", label: "Row tags" },
  ];
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              current === opt.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
