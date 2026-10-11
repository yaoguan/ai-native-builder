# Spec: Training intelligence card for idle users

Status: draft for prototype. Owner: Yao. Product: Stride.
Prototype: "Idle comeback" layout in `prototyping/stride/src/prototypes/athlete-intelligence`.

**In one sentence:** when a premium user has not recorded an activity for 14 days, the Training log shows a card with a recap of their last month of training and one easy session to restart, so they come back before they cancel.

## Problem

Premium users stop recording, then cancel or downgrade because they do not feel they are getting enough value. When they go quiet, nothing in the app reflects their own training back to them.

Evidence (read-only pulls from PostHog, Intercom, Linear):

| Source | Signal | Confidence |
|---|---|---|
| PostHog | 43 of 127 people marked active premium (34%) have no events since Sep 20; 16 have none in 120 days, 24 were last seen before Aug 1 | Medium: plan and status are person properties, not verified against billing |
| Intercom | 9 of 15 conversations mentioning premium are about cancelling, downgrading or refunds ("I'm looking to cut back on subscriptions"; "I ended up not using the app nearly as much as I thought") | Medium: contacts not matched to the idle users |
| Linear | No ticket covers premium value or win-back | n/a |

Not yet known: why idle users stopped. Some may have stopped because of sync failures, crashes or wrong GPS data (cited in 4 of the 15 premium conversations), in which case a restart prompt does not fix the cause. Rule 5 below handles the sync case.

## Goal and metrics

**Primary:** share of eligible users who record an activity within 14 days of first seeing the card (`activity_created` after `idle_card_viewed`).

**Baseline:** unknown. Nothing measures natural return after a 14-day gap today. Measure it first with a holdout (see Experiment).

**Secondary:** card click-through to Record; thumbs-up share among rated cards; share of viewers who record within 7 days.

**Guardrails (must not get worse):** cancellations and downgrades among viewers; support contacts mentioning the card; thumbs-down share; "Not today" rate above 70%.

## Non-goals

- Fixing sync, GPS, or crash bugs.
- The pause, downgrade and cancel flow (separate spec).
- Push, email or SMS reminders. This card is in-app only.
- Injury, health or medical advice. Content is limited to volume and consistency.
- An AI model. The prototype uses rules on the user's own log; model-generated text is a later decision.

## Who sees it (eligibility)

All must be true:

1. Plan is premium and status is active.
2. The last `activity_created` was 14 or more days ago.
3. The user has at least 3 lifetime activities (otherwise see the no-history state).
4. The user opened the app this session (the card shows on the Training log).

The card disappears the moment the user records an activity.

## States

| State | Condition | What shows |
|---|---|---|
| Eligible, with history | Rules above met | Recap tiles + comeback session |
| Eligible, thin history | Fewer than 3 activities | Welcome line + a 20 min easy session in the last sport; no recap |
| No earlier month | No activities in the 30 days before the recap window | Recap tiles; the comparison reads "No earlier month to compare" |
| Sync problem | Sync status is Failed or Disconnected | The sync fix prompt from the sync-status spec first; the card waits until sync is healthy |
| Dismissed | User tapped "Not today" | Hidden this visit; returns next visit; after 2 dismissals in a row, wait 7 days |
| Recorded | A new activity exists | Card gone |

## Content and logic

**Header:** "Welcome back", the title of the last activity, and days since.

**Recap (3 tiles):** the 30 days up to the last activity versus the 30 days before: activities, distance, active days. Declines read as a plain change ("Down 20%"), never as a failure.

**Comeback session:**
- Sport: the most-used sport across those 60 days.
- Length: median session length for that sport, scaled by days idle: 70% at 14 days, 60% at 21, 50% at 30 or more. Round to 5 min, minimum 20.
- Intensity: "Easy, conversational".
- Reason: one line stating the sport, the typical length and the days off.

**Why this?** The data window in plain words, up to 4 source activities as links, and thumbs up or down.

**Actions:** "Start now" (opens Record) and "Not today".

**Copy rules:** encouraging and neutral; no streak-loss or guilt language; no technical terms.

## Acceptance criteria

1. Given a premium user last active 13 days ago, the card does not appear.
2. Given a premium user last active 14 days ago with 3 or more activities, the card appears above the stats row on the Training log.
3. Given a free user, the card does not appear (premium first; see open questions).
4. The recap tiles use the 30 days up to the last activity and the 30 days before it.
5. The suggested length at 14, 21 and 30 days idle is 70%, 60% and 50% of the median session for the most-used sport, rounded to 5 min, never below 20.
6. Tapping "Start now" opens Record and fires `idle_card_cta_clicked`.
7. Tapping "Not today" hides the card for the visit and fires `idle_card_dismissed`.
8. After 2 consecutive dismissals the card does not appear for 7 days.
9. When sync is Failed or Disconnected the sync prompt shows instead of the card.
10. Recording an activity removes the card on next load.

## Measurement and experiment

**Events:** `idle_card_viewed` (idle_days, sport, minutes), `idle_card_cta_clicked`, `idle_card_dismissed`, `idle_card_feedback` (vote). Add `activity_created` source (in-app or synced) so the outcome is unambiguous.

**Design:** randomize eligible users 80/20 into card and holdout. The holdout provides the missing baseline.

**Sample size reality:** there are only about 43 idle premium users today. Detecting a rise from 15% to 35% needs about 75 users per arm. So run for at least 4 weeks as new users go idle, and consider adding idle free users in a second phase. Treat the first results as directional, backed by 5 to 8 interviews.

## Decisions needed

| Question | Default |
|---|---|
| Is 14 days right for every sport (a hiker idle 14 days is normal)? | Keep 14; revisit by sport after data |
| Are plan and status accurate for these users? | Verify against billing before launch |
| Should free users see it? | Premium first; free in phase 2 |
| Does `activity_created` mean in-app recording or synced import? | Confirm with engineering; changes the outcome definition |

## Risks

- Wrong data (sync or GPS errors) produces a wrong recap. Mitigation: show the data window and sources; sync-problem state.
- Added messaging adds to notification fatigue (3 Intercom conversations, STR-9). Mitigation: in-app only, capped dismissals.
- Users idle for a different reason (price, crashes) are not helped. Mitigation: the interviews and the cancellation-reason event.
