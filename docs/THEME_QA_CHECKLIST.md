# Theme QA Checklist

Use this checklist when a change touches layout, cards, inputs, navigation, or any other visible product surface that should behave well in both light and dark mode.

## Core checks

- verify the route in both light and dark mode
- verify the theme toggle still works
- verify the selected theme persists after navigating to another route
- verify there is no route that flashes the wrong theme after refresh

## Contrast and readability

- headings remain clearly readable against the page background
- body text uses the intended muted token, not low-contrast gray on gray
- badges, pills, and helper text remain legible in both themes
- buttons preserve contrast in default, hover, disabled, and focus states

## Surface consistency

- cards use semantic theme tokens instead of one-off `bg-white` or `text-slate-*` classes
- borders remain visible without looking too harsh in dark mode
- nested panels still separate visually from the page background
- gradient sections do not wash out content in light mode or disappear in dark mode

## Interactive states

- focus rings remain visible on keyboard navigation
- hover states are still noticeable in both themes
- selected tabs, chips, and pills remain obvious
- inputs, selects, and textareas keep readable placeholder text and typed text

## Route-specific checks for Pave

- `/create`
  - form inputs, review panels, fallback banners, and AI draft states
- `/feed`
  - hero, pills, cards, right rail, onboarding strip
- `/post/[postId]`
  - hero media panel, timeline blocks, comments rail, save/share/report controls
- `/nearby`
  - category pills, hero panel, degraded states, nearby cards
- `/profile/[username]`
  - hero stats, tabs, card grid
- `/trip/[slug]`
  - toolbar, stats panels, trip builder list and map split
- `/place/[placeId]`
  - place hub controls, list pane, map pane, empty states

## Regression guardrails

- run `pnpm lint`
- run `pnpm build`
- capture at least one screenshot in each affected theme for the changed route
- if the change affects shared tokens or shell components, spot-check at least two additional routes

## When to treat a change as incomplete

- a surface still depends on hard-coded light-only utility colors
- text is technically visible but low-confidence to read
- a route works in one theme but feels visually unintentional in the other
- screenshots would make the route look unfinished to a visitor or contributor
