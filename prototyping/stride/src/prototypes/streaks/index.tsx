import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Flame, Check, Trophy, TrendingUp, Users, X } from "lucide-react";
import { ACTIVITIES, ATHLETES, CHALLENGES, ME, fmtDuration, getAthlete } from "@/lib/mock-data";
import { toggleAthleteFollow } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { ActivityCard } from "@/components/ActivityCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  currentWeekDays,
  fmtWeek,
  nextMilestone,
  recentWeekDays,
  recentWeeks,
  streakStats,
  type Week,
} from "./streaks";

const FILTERS = ["Following", "Clubs", "You"] as const;
type Filter = (typeof FILTERS)[number];

type VariantId = "aside-card" | "header-pill" | "inline-week";

export default function StreaksPrototype() {
  const [variant, setVariant] = useState<VariantId>("aside-card");
  const [filter, setFilter] = useState<Filter>("Following");
  const [weekDismissed, setWeekDismissed] = useState(false);
  const stats = streakStats();

  const visible = useMemo(() => {
    if (filter === "You") return ACTIVITIES.filter((activity) => activity.athleteId === "me");
    if (filter === "Clubs")
      return ACTIVITIES.filter((activity) => activity.athleteId !== "me").slice(0, 8);
    return ACTIVITIES.filter(
      (activity) =>
        activity.athleteId === "me" || Boolean(getAthlete(activity.athleteId).isFollowing),
    ).slice(0, 20);
  }, [filter]);

  const myActs = ACTIVITIES.filter((activity) => activity.athleteId === "me").slice(0, 5);
  const myWeekKm = myActs.reduce((sum, activity) => sum + activity.distanceKm, 0);
  const myWeekTime = myActs.reduce((sum, activity) => sum + activity.movingSeconds, 0);
  const myWeekElev = myActs.reduce((sum, activity) => sum + activity.elevationM, 0);

  const suggested = ATHLETES.filter((athlete) => athlete.id !== "me").slice(0, 4);
  const myChallenges = CHALLENGES.filter((challenge) => challenge.joined);

  return (
    <AppShell>
      <div className="grid grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back, {ME.name.split(" ")[0]}</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="whitespace-nowrap text-3xl font-display font-bold tracking-tight">
                  Your feed
                </h1>
                {variant === "header-pill" && <StreakPill stats={stats} />}
              </div>
            </div>
            <div className="flex gap-1 rounded-md bg-surface-2 p-1">
              {FILTERS.map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setFilter(filterName)}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    filter === filterName
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filterName}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {variant === "inline-week" && !weekDismissed && (
              <WeekStrip stats={stats} onDismiss={() => setWeekDismissed(true)} />
            )}
            {visible.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          {variant === "aside-card" && <StreakCard stats={stats} />}

          <section className="rounded-xl bg-secondary p-5 text-secondary-foreground">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] opacity-70">
              <TrendingUp className="h-3.5 w-3.5" /> Your week
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <div className="stat-num text-2xl text-primary">{myWeekKm.toFixed(0)}</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">km</div>
              </div>
              <div>
                <div className="stat-num text-2xl">{fmtDuration(myWeekTime).split(":")[0]}h</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">time</div>
              </div>
              <div>
                <div className="stat-num text-2xl">{myWeekElev.toLocaleString()}</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">m elev</div>
              </div>
            </div>
            <Link
              to="/training"
              className="mt-4 inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100"
            >
              See training log <ChevronRight className="h-3 w-3" />
            </Link>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <Trophy className="h-4 w-4 text-primary" /> Your challenges
              </h3>
              <Link
                to="/challenges"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <ul className="space-y-3">
              {myChallenges.map((challenge) => {
                const pct = Math.min(100, (challenge.myProgressKm / challenge.goalKm) * 100);
                return (
                  <li key={challenge.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">
                        {challenge.badge} {challenge.name}
                      </span>
                      <span className="num text-xs text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <Users className="h-4 w-4 text-primary" /> Suggested athletes
              </h3>
            </div>
            <ul className="space-y-3">
              {suggested.map((athlete) => (
                <li key={athlete.id} className="flex items-center gap-3">
                  <Link to="/athlete/$id" params={{ id: athlete.id }} className="shrink-0">
                    <img
                      src={athlete.avatar}
                      alt={athlete.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/athlete/$id"
                      params={{ id: athlete.id }}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {athlete.name}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">
                      {athlete.city} · {athlete.followers} followers
                    </div>
                  </div>
                  <FollowButton id={athlete.id} />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      <VariantSwitcher current={variant} onChange={setVariant} />
    </AppShell>
  );
}

type Stats = ReturnType<typeof streakStats>;

/* ===== Variant A: aside card with 8-week history ===== */

function StreakCard({ stats }: { stats: Stats }) {
  const weeks = useMemo(() => recentWeeks(8), []);
  const [selected, setSelected] = useState<Week>(weeks[weeks.length - 1]);
  const target = nextMilestone(stats.current);
  const maxKm = Math.max(...weeks.map((w) => w.km), 1);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Flame className="h-4 w-4 text-primary" /> Weekly streak
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Best {stats.best}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="stat-num text-5xl font-bold leading-none text-primary">
          {stats.current}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">
          {stats.current === 1 ? "week" : "weeks"} in a row
        </span>
      </div>

      <div className="mt-4 flex h-14 items-end gap-1.5">
        {weeks.map((week) => {
          const isSelected = week.start === selected.start;
          return (
            <button
              key={week.start}
              onClick={() => setSelected(week)}
              aria-label={`Week of ${fmtWeek(week.start)}`}
              className="group flex h-full flex-1 items-end"
            >
              <span
                className={`block w-full rounded-sm transition-colors ${
                  week.active ? "bg-primary" : "bg-muted"
                } ${isSelected ? "ring-2 ring-foreground ring-offset-1 ring-offset-surface" : "group-hover:opacity-80"}`}
                style={{ height: week.active ? `${30 + (week.km / maxKm) * 70}%` : "12%" }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border pt-3 text-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Week of {fmtWeek(selected.start)}
        </div>
        {selected.active ? (
          <div className="mt-1">
            <span className="num font-medium">{selected.activities.length}</span>{" "}
            <span className="text-muted-foreground">
              {selected.activities.length === 1 ? "activity" : "activities"} ·{" "}
            </span>
            <span className="num font-medium">{selected.km.toFixed(0)}</span>{" "}
            <span className="text-muted-foreground">km</span>
          </div>
        ) : (
          <div className="mt-1 text-muted-foreground">No activity — streak was broken.</div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Next badge</span>
          <span className="num">
            {stats.current} / {target} weeks
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(100, (stats.current / target) * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

/* ===== Variant B: header pill + popover calendar ===== */

function StreakPill({ stats }: { stats: Stats }) {
  const days = useMemo(() => recentWeekDays(4), []);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          aria-label={`${stats.current} week streak`}
        >
          <Flame className="h-4 w-4 fill-primary" />
          <span className="num">{stats.current}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">wk</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-base font-semibold">{stats.current}-week streak</div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Best {stats.best}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.doneThisWeek
            ? "This week is locked in. Keep going to extend it."
            : `Log an activity in the next ${stats.daysLeft + 1} days to keep it alive.`}
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center font-mono text-[10px] uppercase text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day.start}
              title={new Date(day.start).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
              className={`aspect-square rounded-sm ${
                day.active
                  ? "bg-primary"
                  : day.future
                    ? "border border-dashed border-border"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
        <Button asChild size="sm" className="mt-4 w-full">
          <Link to="/record">Record an activity</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/* ===== Variant C: inline week strip at the top of the feed ===== */

function WeekStrip({ stats, onDismiss }: { stats: Stats; onDismiss: () => void }) {
  const days = useMemo(() => currentWeekDays(), []);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <section className="relative border border-border bg-surface px-5 py-4">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-orange text-primary-foreground">
          <Flame className="h-6 w-6 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold leading-tight">
            {stats.current}-week streak
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.doneThisWeek
              ? "This week is done. Another activity keeps momentum up."
              : "Log one more activity this week to extend it."}
          </div>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link to="/record">Record</Link>
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day, i) => (
          <div key={day.start} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-9 w-full items-center justify-center rounded-md ${
                day.active
                  ? "bg-primary text-primary-foreground"
                  : day.future
                    ? "border border-dashed border-border"
                    : "bg-muted"
              }`}
            >
              {day.active && <Check className="h-4 w-4" />}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== Helpers copied from the feed route ===== */

function FollowButton({ id }: { id: string }) {
  const [following, setFollowing] = useState(Boolean(getAthlete(id).isFollowing));
  return (
    <button
      onClick={async () => {
        const result = await toggleAthleteFollow(id);
        setFollowing(result.following);
      }}
      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
        following
          ? "border-secondary bg-secondary text-secondary-foreground"
          : "border-border hover:bg-muted"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
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
    { id: "aside-card", label: "Aside card" },
    { id: "header-pill", label: "Header pill" },
    { id: "inline-week", label: "Inline week" },
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
