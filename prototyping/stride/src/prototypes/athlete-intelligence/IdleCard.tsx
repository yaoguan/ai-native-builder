import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { usePostHog } from "@/lib/posthog-stub";
import { Button } from "@/components/ui/button";
import { change, getIdleCard, IDLE_OPTIONS, type IdleDays } from "./idle";

/* Idle-state training intelligence card: shown when an athlete has not recorded
   an activity for 14+ days. Success measure: share of idle users who record again
   within 14 days of seeing it (events below feed that measure). */

export function IdleComeback() {
  const posthog = usePostHog();
  const [idleDays, setIdleDays] = useState<IdleDays>(21);
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const data = useMemo(() => getIdleCard(idleDays), [idleDays]);

  useEffect(() => {
    posthog.capture("idle_card_viewed", { idle_days: idleDays });
  }, [idleDays, posthog]);

  if (!data || dismissed) {
    return dismissed ? (
      <button
        onClick={() => setDismissed(false)}
        className="mb-8 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Show the comeback card again
      </button>
    ) : null;
  }

  const { recent, prior, restart, lastActivity } = data;
  const stats = [
    {
      label: "Activities",
      value: recent.activities,
      delta: change(recent.activities, prior.activities),
    },
    {
      label: "Distance",
      value: `${recent.km.toFixed(0)} km`,
      delta: change(recent.km, prior.km),
    },
    {
      label: "Active days",
      value: recent.activeDays,
      delta: change(recent.activeDays, prior.activeDays),
    },
  ];

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface-2 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Welcome back</h2>
          <span className="text-sm text-muted-foreground">
            · Your last activity was {data.idleDays} days ago ({lastActivity.title})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Preview idle
          </span>
          <div className="flex gap-1 rounded-md bg-surface p-1">
            {IDLE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setIdleDays(d)}
                className={`rounded px-2.5 py-1 text-xs ${
                  idleDays === d
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Your last 30 days of training, versus the 30 before
      </p>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </div>
            <div className="stat-num mt-1 text-2xl font-bold leading-none">{s.value}</div>
            <div className="mt-2 text-xs text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-lg bg-secondary px-5 py-4 text-secondary-foreground">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
            Your comeback session
          </div>
          <div className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
            {restart.minutes} min {restart.sport.toLowerCase()}
            <span className="text-sm font-normal opacity-70">· {restart.intensity}</span>
          </div>
          <p className="mt-0.5 text-sm opacity-80">{restart.reason}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            asChild
            onClick={() =>
              posthog.capture("idle_card_cta_clicked", {
                idle_days: idleDays,
                sport: restart.sport,
                minutes: restart.minutes,
              })
            }
          >
            <Link to="/record">Start now</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              posthog.capture("idle_card_dismissed", { idle_days: idleDays });
              setDismissed(true);
            }}
            className="bg-transparent text-secondary-foreground hover:bg-white/10"
          >
            Not today
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary"
        >
          Why this?
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="mt-2 border-t border-border pt-3">
            <p className="text-xs leading-5 text-muted-foreground">{data.why}</p>
            <ul className="mt-2 space-y-1">
              {data.evidence.map((a) => (
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
            <div className="mt-3 flex items-center gap-1">
              <span className="mr-1 text-xs text-muted-foreground">Helpful?</span>
              {(["up", "down"] as const).map((v) => {
                const Icon = v === "up" ? ThumbsUp : ThumbsDown;
                return (
                  <button
                    key={v}
                    onClick={() => {
                      const next = vote === v ? null : v;
                      setVote(next);
                      if (next) posthog.capture("idle_card_feedback", { vote: next });
                    }}
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
    </section>
  );
}
