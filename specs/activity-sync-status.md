# Spec: Pre-activity sync status

Status: draft for prototype. Owner: Yao. Product: Stride.

## Problem

Before a user starts an activity they cannot tell whether sync is working. They record a run, it does not show up, and they contact support. Sync failures are silent, so users find out afterwards, when the activity is already missing.

Evidence (read-only pulls from Linear and Intercom; counts are my own tally of recent items, not exact):

- Linear: about 11 open "Activity not syncing" issues, two of them Urgent (STR-113, STR-118). Related: "Mobile app silently drops activity when offline > 24h" (STR-131), "Activity sync failing for runs logged >12h prior on mobile" (STR-86), missing Sentry breadcrumbs on sync failures (STR-151, STR-144, STR-28).
- Intercom: in the 60 most recent conversations, about 9 of 48 message conversations and 5 of 12 tickets were "Activity not syncing" (iOS, Android, COROS; root cause tag `sync-failure`).
- PostHog: no mobile or exception events, so the current failure rate cannot be measured. Instrumenting this feature is part of the work.

## Goal

Show the user, before they start an activity, whether sync is active, so they can fix a problem first or start knowing the risk.

Success looks like fewer "Activity not syncing" conversations and fewer activities lost after recording. Targets are to be set once instrumentation gives a baseline.

## Non-goals

- Fixing the underlying sync bugs.
- Blocking the user from starting an activity. Status informs; it never gates.
- Redesigning the activity recording screen.

## Users and stories

- As a runner about to start, I see at a glance whether my activities will sync, so I am not surprised later.
- As a runner with a problem, I see what is wrong and a one-tap fix (retry, reconnect, or wait for network).
- As a runner who wants to go anyway, I can start immediately without dismissing anything.

## Where it appears

On the pre-start screen, directly above the Start button. One compact status row, expandable for detail. If sync is healthy, the row is quiet (small, neutral). If not, it is prominent but does not move the Start button.

## What "sync" means here

Two things, shown on one row with the worst state winning:

1. **Source connection:** the linked watch or provider (Garmin, COROS, Apple Health, phone GPS) is connected and authorized.
2. **Upload:** earlier activities have reached the Stride account, and new ones will upload.

Assumption to confirm: the app can read both states on the device before an activity starts.

## States

| State | Row text (draft) | Detail on expand | Action |
|---|---|---|---|
| Synced | "Sync on. Last synced 2 min ago" | Source name, last sync time | none |
| Syncing | "Syncing 1 activity..." | Progress, what is uploading | none |
| Pending | "2 activities waiting to upload" | Which ones, why (queued, waiting for network) | Sync now |
| Offline | "Offline. Activities will upload when you're back online" | Warn that long offline periods can delay uploads | Start anyway |
| Failed | "Last sync failed" | Plain-language reason, time of failure | Retry, Contact support |
| Disconnected | "Garmin disconnected" | Reason (auth expired, permission revoked) | Reconnect |
| Unknown | "Checking sync..." | none, times out to Failed after 5 s | Retry |

Rules:

- Never say "Synced" unless a check completed within the last 60 seconds or a sync finished within the last 5 minutes. Otherwise show Unknown, then re-check.
- Failed and Disconnected use a warning style plus an icon and text, not colour alone.
- The Start button is always enabled. Tapping Start in Failed, Disconnected, or Offline starts the activity immediately, with no confirmation modal.
- Copy avoids technical terms (no "error 500", no "webhook").

## Prototype scope

Code prototype with mocked data. No backend.

- One pre-start screen with the status row, expandable detail, and Start button.
- A state switcher (dev-only control) to flip between all seven states and check transitions: Syncing to Synced, Failed then Retry to Syncing to Synced, Disconnected then Reconnect.
- Mocked actions: Retry and Reconnect succeed after 1.5 s; a toggle forces them to fail.
- Mobile-width layout first, then desktop web.
- Accessibility: status changes announced to screen readers; touch targets at least 44 px; works with large text.

## Acceptance criteria

1. All seven states render with the text and actions above.
2. The Start button is enabled in every state and never shifts position when the status changes.
3. Retry in Failed moves to Syncing, then Synced on success or back to Failed with an updated time on failure.
4. Reconnect in Disconnected leads to Synced in the mock.
5. Expanding the row shows detail without covering the Start button.
6. Status is understandable without colour.
7. Unknown resolves to Synced or Failed within 5 s.

## Instrumentation (to ship with the real feature)

Events (names are proposals):

- `sync_status_viewed` with `state`, `source`, `pending_count`
- `sync_status_expanded` with `state`
- `sync_retry_tapped` with `state`, and `sync_retry_result` with `success`
- `sync_reconnect_tapped`
- `activity_started_with_sync_issue` with `state`
- `sync_status_unknown_timeout`

These give the first baseline for how often users start an activity while sync is unhealthy.

## Open questions

1. Is "sync" the watch connection, the upload queue, or both? The spec assumes both on one row.
2. Which sources must be supported at launch (Garmin, COROS, Apple Health, phone GPS)?
3. Can the app tell Disconnected from Failed today, and what reasons can it name?
4. What is the real offline-loss behaviour behind STR-131, and should the Offline state warn about it?
5. Should a persistent warning also show during the activity, or only before it starts?
6. Platform order: iOS, Android, or web first?
