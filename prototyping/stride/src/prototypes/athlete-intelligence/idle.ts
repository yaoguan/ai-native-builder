import { ACTIVITIES, type Activity, type Sport } from "@/lib/mock-data";

// Idle-user "comeback" card. Rule-based and derived from the athlete's own log.
// The seeded log ends on its latest activity, so "idle" is simulated: the card treats
// today as `idleDays` after that activity and summarises the 30 days of training
// leading up to it, against the 30 days before that.

const DAY = 86400000;

const mine = ACTIVITIES.filter((a) => a.athleteId === "me").sort(
  (a, b) => Date.parse(a.date) - Date.parse(b.date),
);

export type IdleDays = 14 | 21 | 30;
export const IDLE_OPTIONS: IdleDays[] = [14, 21, 30];

export type Period = {
  activities: number;
  km: number;
  activeDays: number;
};

export type Restart = {
  sport: Sport;
  minutes: number;
  intensity: string;
  reason: string;
};

export type IdleCardData = {
  idleDays: IdleDays;
  lastActivity: Activity;
  recent: Period;
  prior: Period;
  restart: Restart;
  why: string;
  evidence: Activity[];
};

const period = (list: Activity[]): Period => ({
  activities: list.length,
  km: list.reduce((s, a) => s + a.distanceKm, 0),
  activeDays: new Set(list.map((a) => a.date.slice(0, 10))).size,
});

const median = (nums: number[]) => {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// After a longer break, start smaller: 70% of a usual session at 14 days, 50% at 30.
const RESTART_SCALE: Record<IdleDays, number> = { 14: 0.7, 21: 0.6, 30: 0.5 };

export function getIdleCard(idleDays: IdleDays): IdleCardData | undefined {
  if (mine.length === 0) return undefined;
  const lastActivity = mine[mine.length - 1];
  const last = Date.parse(lastActivity.date);
  const age = (a: Activity) => (last - Date.parse(a.date)) / DAY;

  const recentList = mine.filter((a) => age(a) < 30);
  const priorList = mine.filter((a) => age(a) >= 30 && age(a) < 60);

  const counts = new Map<Sport, Activity[]>();
  for (const a of [...recentList, ...priorList]) {
    counts.set(a.sport, [...(counts.get(a.sport) ?? []), a]);
  }
  const [usual, usualList] = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [
    lastActivity.sport,
    [lastActivity],
  ];

  const usualMinutes = median(usualList.map((a) => a.movingSeconds / 60));
  const minutes = Math.max(20, Math.round((usualMinutes * RESTART_SCALE[idleDays]) / 5) * 5);

  return {
    idleDays,
    lastActivity,
    recent: period(recentList),
    prior: period(priorList),
    restart: {
      sport: usual,
      minutes,
      intensity: "Easy, conversational",
      reason: `${usual} is what you do most, and a usual session is about ${Math.round(usualMinutes)} min. After ${idleDays} days off, ${minutes} min at an easy pace is a comfortable way back.`,
    },
    why: `Based on your ${recentList.length} activities in the 30 days up to ${new Date(
      lastActivity.date,
    ).toLocaleDateString()}, compared with ${priorList.length} in the 30 days before that.`,
    evidence: recentList.slice(-4).reverse(),
  };
}

/** Plain-language change between two numbers, without guilt when it went down. */
export function change(now: number, before: number, unit = ""): string {
  if (before === 0) return now === 0 ? "Same as before" : "No earlier month to compare";
  const diff = now - before;
  if (diff === 0) return "Same as before";
  const pct = Math.round((Math.abs(diff) / before) * 100);
  return `${diff > 0 ? "Up" : "Down"} ${pct}%${unit}`;
}
