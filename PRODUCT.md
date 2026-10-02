# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Members of the public who casually drink coffee, tea, energy drinks, or soda and want an easy way to see how much caffeine they've had, how much is still active, and whether it will get in the way of sleep. They log drinks quickly through the day, often on a phone, and look back now and then to spot patterns.

## Product Purpose

Kaffe is a coffee and caffeine journal. You log drinks (from a catalog or your own Blend Lab creations) and water. Kaffe estimates active caffeine with a half-life decay model, compares the daily total against a 400 mg reference, forecasts when caffeine will drop below a threshold before your bedtime, and keeps a history across weeks and months.

Success means people know where they stand on caffeine at a glance, change their behavior when it matters (switch to caffeine-free, drink water, stop earlier before bed), and come back because using it feels good, not because they feel guilty.

## Positioning

A caffeine tracker that takes health seriously without becoming clinical. Sleep and caffeine guidance should be **direct and easy to see**. The product says plainly when you're over the reference or when caffeine will still be active at bedtime. It still sounds warm, it's honest about uncertainty, and it never shames anyone. It is not a gamified streak app and it is not a medical device.

## Operating Context

- Quick logging during the day: pick a drink, adjust the portion (for example 1.5×), confirm. You can also edit the time or date, or delete and undo.
- Water logging is part of the routine. Drinking water after a caffeinated drink earns a bonus.
- Evening check: the Sleep view shows bedtime, the half-life setting, and when active caffeine will fall below the threshold.
- Looking back: History shows week and month ranges, the daily average, and days over the reference.
- Blend Lab: a small café where you stack up to six ingredient layers, discover named recipes, and log the result.
- Installable PWA that works offline. Light and dark themes.

## Capabilities and Constraints

- **Local-first, no account (binding).** Journal data lives only in the browser on that origin. There is no backend, sign-in, or sync. Export to JSON exists; import does not exist yet.
- Current implementation: plain HTML, CSS, and ES modules with no runtime dependencies or build step, deployed to Azure Static Web Apps via `npm run package:site`. The user has not made no-build, English-only, or phone-first binding. They describe the current state and future work may revisit them.
- Caffeine and kcal values in `data.js` are catalog estimates per serving. The half-life is user-adjustable and defaults to 5 h. The 400 mg/day figure is a general reference for healthy adults, not a limit. The sleep threshold is not a proven "sleep-safe" level.
- Terminology in use: "journal", "sip", "Blend Lab", "reference" (not "limit"), "wind-down".
- Undecided: journal import, localization, a PNG icon fallback for iOS home screen.

## Brand Commitments

- Name: **Kaffe** (wordmark `kaffe.`), "a little coffee journal".
- Voice: warm, lightly playful, and plain-spoken ("No sips on this page. Yet.", "A good moment to switch to caffeine-free."). Health messaging is direct but never moralizing.
- No caffeine-consumption streaks or rewards for drinking more caffeine. Rewards only go to balancing behavior such as water.

## Evidence on Hand

- Drink catalog (30 items, including named brands such as Red Bull, Monster, and Coca-Cola, used as estimates), 11 Blend Lab ingredients, and 27 recipes in `data.js`.
- Model tests and Playwright browser and accessibility tests in `tests/`, plus the tester checklist in `TESTING.md`.
- No testimonials, user counts, studies, or press exist. Do not fabricate them, and do not cite medical claims beyond the hedged references already in the app.

## Product Principles

1. **Clarity about caffeine comes first.** The current total, active caffeine, and the bedtime forecast should be readable in seconds and stated directly.
2. **Honest estimates.** Always present numbers as estimates with their caveats. Never imply medical precision or safety guarantees.
3. **Nudge toward balance, never toward more.** Reward water and earlier cut-offs. Never reward more caffeine.
4. **Your data stays yours.** Local-first and no account. Nothing leaves the device unless the user exports it.
5. **Logging stays fast and friendly.** It's a light daily habit, and delight (Blend Lab, copy) supports it rather than getting in the way.

## Accessibility & Inclusion

The existing bar is automated axe checks, keyboard navigation and accessible dialogs, ARIA-described meters and charts, a skip link, reflow without horizontal overflow from 320 to 1440 px, and readable light and dark themes. Future work must not regress below this.
