import { ACTIVITIES, type Activity, type Sport } from "@/lib/mock-data";

// Rule-based "athlete intelligence": every insight is derived from the athlete's own
// seeded activities and carries the activities it was based on as evidence.
// "Today" is anchored to the latest seeded activity so the output is stable.

const DAY = 86400000;

const mine = ACTIVITIES.filter((a) => a.athleteId === "me").sort(
  (a, b) => Date.parse(a.date) - Date.parse(b.date),
);

const TODAY = Math.max(...mine.map((a) => Date.parse(a.date)));

const within = (a: Activity, fromDaysAgo: number, toDaysAgo: number) => {
  const age = (TODAY - Date.parse(a.date)) / DAY;
  return age >= toDaysAgo && age < fromDaysAgo;
};

const hours = (list: Activity[]) => list.reduce((s, a) => s + a.movingSeconds, 0) / 3600;
const speed = (a: Activity) => a.distanceKm / (a.movingSeconds / 3600);
const activeDays = (list: Activity[]) => new Set(list.map((a) => a.date.slice(0, 10))).size;

export type Tone = "good" | "watch" | "neutral";

export type Insight = {
  id: string;
  title: string;
  metric: string;
  tone: Tone;
  summary: string;
  why: string;
  evidence: Activity[];
};

export type Recommendation = {
  sport: Sport;
  minutes: number;
  intensity: string;
  reason: string;
};

function loadInsight(): Insight {
  const recent = mine.filter((a) => within(a, 7, 0));
  const baseline = mine.filter((a) => within(a, 35, 7));
  const h7 = hours(recent);
  const avg = hours(baseline) / 4;
  const ratio = avg > 0 ? h7 / avg : 1;
  const tone: Tone = ratio > 1.5 ? "watch" : "good";
  return {
    id: "load",
    title: ratio > 1.5 ? "Load is spiking" : ratio < 0.6 ? "Lighter week" : "Load on track",
    metric: `${Math.round(ratio * 100)}% of usual`,
    tone: ratio < 0.6 ? "neutral" : tone,
    summary:
      ratio > 1.5
        ? "You trained much more than your recent norm. Bank some easy days."
        : ratio < 0.6
          ? "You did less than your recent norm. Fine if it was planned."
          : "This week is in line with your last month.",
    why: `${h7.toFixed(1)}h of moving time in the last 7 days vs ${avg.toFixed(1)}h per week over the 4 weeks before.`,
    evidence: recent,
  };
}

function consistencyInsight(): Insight {
  const recent = mine.filter((a) => within(a, 14, 0));
  const before = mine.filter((a) => within(a, 28, 14));
  const now = activeDays(recent);
  const prev = activeDays(before);
  return {
    id: "consistency",
    title: now >= prev ? "Consistency holding" : "Fewer active days",
    metric: `${now} active days`,
    tone: now >= prev ? "good" : "watch",
    summary:
      now >= prev
        ? "You are showing up at least as often as the fortnight before."
        : "You have trained on fewer days than the fortnight before.",
    why: `${now} active days in the last 14 days vs ${prev} in the 14 days before that.`,
    evidence: recent,
  };
}

function trendInsight(): Insight | undefined {
  const counts = new Map<Sport, Activity[]>();
  for (const a of mine) {
    if (a.sport === "Swim" || !within(a, 42, 0)) continue;
    counts.set(a.sport, [...(counts.get(a.sport) ?? []), a]);
  }
  const [sport, list] = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!sport || !list || list.length < 3) return undefined;

  const half = Math.floor(list.length / 2);
  const early = list.slice(0, half);
  const late = list.slice(list.length - half);
  const avg = (l: Activity[]) => l.reduce((s, a) => s + speed(a), 0) / l.length;
  const pct = (avg(late) / avg(early) - 1) * 100;
  const up = pct >= 0;
  return {
    id: "trend",
    title: `${sport} speed ${up ? "improving" : "slipping"}`,
    metric: `${up ? "+" : ""}${pct.toFixed(1)}%`,
    tone: up ? "good" : "watch",
    summary: up
      ? `Your recent ${sport.toLowerCase()}s are faster than your earlier ones.`
      : `Your recent ${sport.toLowerCase()}s are slower than your earlier ones.`,
    why: `Average speed over your latest ${half} ${sport.toLowerCase()}s (${avg(late).toFixed(1)} km/h) vs your earliest ${half} (${avg(early).toFixed(1)} km/h) in the last 6 weeks.`,
    evidence: [...early, ...late],
  };
}

function mixShares() {
  const total = hours(mine) || 1;
  const bySport = new Map<Sport, number>();
  for (const a of mine) bySport.set(a.sport, (bySport.get(a.sport) ?? 0) + a.movingSeconds / 3600);
  return [...bySport.entries()]
    .map(([sport, h]) => ({ sport, share: h / total }))
    .sort((a, b) => b.share - a.share);
}

function mixInsight(): Insight {
  const [top] = mixShares();
  const heavy = top.share > 0.6;
  return {
    id: "mix",
    title: heavy ? `Heavy on ${top.sport}` : "Balanced sport mix",
    metric: `${Math.round(top.share * 100)}% ${top.sport}`,
    tone: heavy ? "watch" : "neutral",
    summary: heavy
      ? "Most of your time goes to one sport. Cross-training spreads the load."
      : "Your time is spread across sports.",
    why: `${top.sport} makes up ${Math.round(top.share * 100)}% of your logged moving time.`,
    evidence: mine.filter((a) => a.sport === top.sport).slice(-5),
  };
}

function hardSession() {
  const avg = mine.reduce((s, a) => s + a.movingSeconds, 0) / mine.length;
  return [...mine].reverse().find((a) => a.movingSeconds > avg * 1.5);
}

function recoveryInsight(): Insight {
  const hard = hardSession();
  const days = hard ? Math.floor((TODAY - Date.parse(hard.date)) / DAY) : 99;
  return {
    id: "recovery",
    title: days < 2 ? "Still recovering" : "Ready for quality",
    metric: hard ? `${days}d since hard day` : "No hard days",
    tone: days < 2 ? "watch" : "good",
    summary:
      days < 2
        ? "Your last hard session was very recent. Keep today easy."
        : "You have had enough time since your last hard session.",
    why: hard
      ? `Your last session over 1.5x your average length was ${hard.title} (${days} days ago).`
      : "No session in your log was much longer than your average.",
    evidence: hard ? [hard] : [],
  };
}

export function getInsights(): Insight[] {
  return [loadInsight(), recoveryInsight(), consistencyInsight(), trendInsight(), mixInsight()]
    .filter((i): i is Insight => Boolean(i))
    .sort((a, b) => Number(b.tone === "watch") - Number(a.tone === "watch"));
}

export function getRecommendation(): Recommendation {
  const load = loadInsight();
  const recovery = recoveryInsight();
  const shares = mixShares();
  if (load.tone === "watch" || recovery.tone === "watch") {
    return {
      sport: "Walk",
      minutes: 30,
      intensity: "Easy, conversational",
      reason: "Load is high or your last hard day was recent, so keep the next one gentle.",
    };
  }
  const under =
    (["Run", "Ride", "Swim"] as Sport[]).find((s) => !shares.some((x) => x.sport === s)) ??
    shares[shares.length - 1].sport;
  return {
    sport: under,
    minutes: 45,
    intensity: "Steady",
    reason: `${under} is your least-used sport lately, and you are recovered enough for a real session.`,
  };
}

export function getHeadline(): string {
  const watch = getInsights().filter((i) => i.tone === "watch").length;
  return watch === 0
    ? "Everything looks steady. Keep building."
    : `${watch} thing${watch > 1 ? "s" : ""} worth watching this week.`;
}

export type RowTag = { label: string; reason: string };

/** Per-activity callout: where this effort ranks among the athlete's own history in its sport. */
export function rowTag(a: Activity): RowTag | undefined {
  const same = mine.filter((x) => x.sport === a.sport);
  if (same.length < 2) return undefined;
  const best = (pick: (x: Activity) => number) =>
    same.reduce((m, x) => (pick(x) > pick(m) ? x : m), same[0]);

  if (a.sport !== "Swim" && best(speed).id === a.id)
    return {
      label: `Fastest ${a.sport.toLowerCase()}`,
      reason: `${speed(a).toFixed(1)} km/h is your highest average speed across ${same.length} ${a.sport.toLowerCase()}s.`,
    };
  if (best((x) => x.distanceKm).id === a.id)
    return {
      label: `Longest ${a.sport.toLowerCase()}`,
      reason: `${a.distanceKm.toFixed(1)} km is your longest ${a.sport.toLowerCase()} so far.`,
    };
  if (a.sport !== "Swim" && best((x) => x.elevationM).id === a.id)
    return {
      label: "Biggest climb",
      reason: `${a.elevationM} m of climbing is the most in any ${a.sport.toLowerCase()}.`,
    };
  return undefined;
}
