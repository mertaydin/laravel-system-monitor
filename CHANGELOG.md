## v0.2.1 - 2026-11-19

- Add security CI with Composer vulnerability auditing, PHPStan/Larastan analysis, Pint checks, PHP syntax validation, and automated tests.
- Add weekly Dependabot updates for Composer dependencies and GitHub Actions.

# Changelog

## v0.1.30 - 2026-11-19

- Refresh the live dashboard screenshot and README screenshot documentation.


## v0.1.29 - 2026-11-19

- Recapture the live dashboard screenshot, including the unhealthy database alert and animated warning border.
- Refresh the README screenshot documentation.

## v0.1.28 - 2026-11-19

- Document force-refreshing published dashboard assets after package updates.

## v0.1.27 - 2026-11-19

- Keep unhealthy-card red neon animation independent from both global and per-card sound preferences.
- Re-evaluate visual alert state whenever sound preferences change and on dashboard initialization.


## v0.1.26 - 2026-11-19

- Keep the animated red neon border active on every unhealthy metric card even when its alert sound is muted individually or globally.
- Decouple visual health highlighting from sound preferences; mute controls now affect audio only.


## v0.1.25 - 2026-11-19

- Include the browser-captured dashboard screenshot showing the real database failure neon alert state in the tagged release.



## v0.1.24 - 2026-11-19

- Replace the illustrative README preview with a browser-captured screenshot of the actual dashboard, showing a database connection failure and its neon alert state.
- Add an automated Playwright screenshot workflow.
## v0.1.23 - 2026-11-18

- Rebuild the README dashboard preview to reflect the current dashboard controls and monitoring cards, including per-card sound controls and refresh preferences.
- Update dashboard asset cache-busting versions to v0.1.22.
- Refresh documentation and dashboard assets for v0.1.23.


## v0.1.22 - 2026-11-18

- Refresh the README dashboard preview with the current server, PHP, database, cache, queue, and application health cards.
- Publish the refreshed documentation preview.


## v0.1.21 - 2026-11-18

- Fix per-card sound toggle initialization by attaching the control before reading its parent card state.
- Ensure per-card sound buttons remain visible and clickable.

## v0.1.20 - 2026-11-18

- Force per-card sound controls to remain visible and clickable across dashboard theme and button styles.
- Increase sound control stacking order and touch target size.

## v0.1.19 - 2026-11-18

- Replace the rotating card border with a thicker neon segment that travels around the fixed card outline.
- Persist sound preferences across page reloads while keeping settings isolated per browser tab.


## v0.1.18 - 2026-11-18

- Highlight each audible unhealthy metric card with an animated red neon border.
- Keep card highlighting synchronized with per-tab master sound and per-card mute settings.
- Tie audible alerts strictly to unhealthy metric cards so muted cards cannot trigger sound independently.


## v0.1.17 - 2026-11-18

- Isolate sound preferences per browser tab using session-scoped storage.
- Add an independent sound toggle to every metric card; muted cards no longer trigger alerts.
- Keep the dashboard-wide sound switch as a per-tab master control.


All notable changes to this project will be documented in this file.

## v0.1.16 - 2026-11-18

- Add repeating audible alerts while monitored metrics are warning or critical; stop when the dashboard returns to healthy.
- Add a dashboard sound toggle and persist the user's sound preference.
- Make manual refresh URLs unique to avoid browser and proxy cache hits.
- Bump dashboard CSS and JavaScript cache-busting versions.
- Keep refresh interval saves on a CSRF-protected form and return to the dashboard after saving.

## v0.1.15 - 2026-11-18

- Replaced JavaScript-dependent manual refresh with a native GET form.
- Replaced JavaScript-dependent automatic refresh with browser-native meta refresh, forcing fresh metric collection.
- Saved refresh interval through a standard CSRF-protected form and redirected back to the dashboard.
- Added cache-busting version query parameters for updated dashboard assets.

## v0.1.8 - 2026-11-18

- Publish the dashboard authorization callback and facade, with middleware enforcement and authorization tests.

## 0.1.1 - 2026-11-18

- Added English, Turkish, Arabic, Spanish, Hindi and Simplified Chinese dashboard translations.
- Added an in-dashboard language selector with session persistence and right-to-left layout for Arabic.
- Added a persistent dark/light theme switch with browser-local preference storage.
- Added translation publishing support.

## 0.1.0 - 2026-11-18

- Initial public release.
- Added server, PHP, Laravel, database, cache, queue and security collectors.
- Added a responsive dashboard with customizable, draggable metric cards.
- Added configurable snapshot caching and secure default middleware.
