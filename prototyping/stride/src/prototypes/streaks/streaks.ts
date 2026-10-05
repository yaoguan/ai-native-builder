import { ACTIVITIES, type Activity } from "@/lib/mock-data";

// A streak is consecutive calendar weeks (Mon–Sun, UTC) with at least one activity.
// "Today" is anchored to the athlete's latest seeded activity so the numbers stay
// stable regardless of when the prototype is opened.

const DAY = 86400000;

const mine = ACTIVITIES.filter((a) => a.athleteId === "me");

export const TODAY = Math.max(...mine.map((a) => Date.parse(a.date)));

export function dayStart(ms: number) {
  return Math.floor(ms / DAY) * DAY;
}

export function weekStart(ms: number) {
  const d = dayStart(ms);
  const dow = (new Date(d).getUTCDay() + 6) % 7; // Monday = 0
  return d - dow * DAY;
}

export type Week = { start: number; activities: Activity[]; km: number; active: boolean };
export type Day = { start: number; activities: Activity[]; active: boolean; future: boolean };

const byWeek = new Map<number, Activity[]>();
const byDay = new Map<number, Activity[]>();
for (const a of mine) {
  const t = Date.parse(a.date);
  byWeek.set(weekStart(t), [...(byWeek.get(weekStart(t)) ?? []), a]);
  byDay.set(dayStart(t), [...(byDay.get(dayStart(t)) ?? []), a]);
}

const THIS_WEEK = weekStart(TODAY);

export function recentWeeks(n: number): Week[] {
  return Array.from({ length: n }, (_, i) => {
    const start = THIS_WEEK - (n - 1 - i) * 7 * DAY;
    const activities = byWeek.get(start) ?? [];
    return {
      start,
      activities,
      km: activities.reduce((s, a) => s + a.distanceKm, 0),
      active: activities.length > 0,
    };
  });
}

export function recentDays(n: number, endMs = TODAY): Day[] {
  const end = dayStart(endMs);
  return Array.from({ length: n }, (_, i) => {
    const start = end - (n - 1 - i) * DAY;
    const activities = byDay.get(start) ?? [];
    return { start, activities, active: activities.length > 0, future: start > dayStart(TODAY) };
  });
}

/** The last `n` whole Mon–Sun weeks ending with this one, including days still to come. */
export function recentWeekDays(n: number): Day[] {
  return recentDays(n * 7, THIS_WEEK + 6 * DAY);
}

/** Mon–Sun of the current week, including days that haven't happened yet. */
export function currentWeekDays(): Day[] {
  return recentWeekDays(1);
}

export function streakStats() {
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    run = prev !== null && w - prev === 7 * DAY ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }

  // Current streak: this week counts if already active; otherwise it's still "at risk"
  // and the streak is whatever ran up to last week.
  const doneThisWeek = byWeek.has(THIS_WEEK);
  let current = 0;
  for (let w = doneThisWeek ? THIS_WEEK : THIS_WEEK - 7 * DAY; byWeek.has(w); w -= 7 * DAY) {
    current += 1;
  }

  const daysLeft = 6 - Math.round((dayStart(TODAY) - THIS_WEEK) / DAY);
  return { current, best: Math.max(best, current), doneThisWeek, daysLeft };
}

export const MILESTONES = [4, 8, 12, 26, 52];

export function nextMilestone(current: number) {
  return MILESTONES.find((m) => m > current) ?? current + 1;
}

export function fmtWeek(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
