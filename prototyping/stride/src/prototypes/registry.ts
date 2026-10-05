import type { ComponentType } from "react";
import DeviceSyncPrototype from "./device-sync";
import BillingPlanPrototype from "./billing-plan";
import AchievementsPrototype from "./achievements";
import SegmentHrPrototype from "./segment-hr";
import StreaksPrototype from "./streaks";
import AthleteIntelligencePrototype from "./athlete-intelligence";

export type Prototype = {
  slug: string;
  title: string;
  description: string;
  Component: ComponentType;
};

export const prototypes: Prototype[] = [
  {
    slug: "device-sync",
    title: "Device sync visibility",
    description:
      "Tests whether surfacing sync errors directly on /training (the route athletes already check for missing activities) reduces the silent gap between a failed Garmin/Wahoo handshake and the athlete noticing. Extends /training with new chrome that calls out failing devices alongside the existing weekly volume and activity table.",
    Component: DeviceSyncPrototype,
  },
  {
    slug: "billing-plan",
    title: "Plan & billing on profile",
    description:
      "Tests whether athletes can self-serve plan changes (upgrade, downgrade, cancel) without contacting support when current plan, renewal, payment, and invoices live on the profile they already visit. Extends /athlete/me with a new plan & billing surface alongside the existing trophy case and totals rails.",
    Component: BillingPlanPrototype,
  },
  {
    slug: "achievements",
    title: "Unlockable achievements",
    description:
      "Tests whether a tiered achievement system with visible 'next unlock' progress increases activity frequency by giving athletes more granular goals than streaks alone. Extends /athlete/me with a richer achievements surface that lives alongside (or replaces) the current trophy case aside on the profile.",
    Component: AchievementsPrototype,
  },
  {
    slug: "segment-hr",
    title: "Heart rate during segments",
    description:
      "Tests whether showing HR zone distribution during a segment effort — not just average HR — helps athletes diagnose whether a PR attempt was pacing-limited or cardio-limited. Extends /segment/$id by adding HR visualization alongside the existing map, leaderboard, and PR rails.",
    Component: SegmentHrPrototype,
  },
  {
    slug: "streaks",
    title: "Weekly streaks",
    description:
      "Tests whether surfacing a weekly activity streak (consecutive weeks with at least one activity) on the feed nudges athletes to log something every week instead of letting a quiet week go unnoticed. Layers a streak module onto the feed at / in three placements: aside card, header pill, and inline week strip.",
    Component: StreaksPrototype,
  },
  {
    slug: "athlete-intelligence",
    title: "Athlete intelligence",
    description:
      "Tests whether plain-language insights drawn from an athlete's own log (load, recovery, consistency, trend) plus a suggested next session help them decide what to train next instead of reading charts alone. Extends /training with the insights in three placements: briefing above the stats, side panel from the header, and tags on activity rows.",
    Component: AthleteIntelligencePrototype,
  },
];

export const prototypeBySlug = (slug: string) => prototypes.find((p) => p.slug === slug);
