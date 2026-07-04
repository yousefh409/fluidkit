# Controls Wave Implementation Plan

> **For agentic workers:** Execute phase by phase. Phase 1 ends at a hard review
> gate — do not start production component code until the prototype round is
> approved. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 8-component controls wave (Switch, Checkbox, Slider, Field,
Progress, Toast, Menu, Badge) plus the internal overlay layer, per
`docs/superpowers/specs/2026-07-04-controls-wave-design.md`.

**Architecture:** No new engine mechanics — every component is a new application
of shipped mechanics (Droplets tear/merge, Tooltip condense, Panel pour, Dialog
portal, MeniscusDivider edge). Form controls wrap real native inputs. Toast/Menu/
Dialog share one internal overlay layer. Novel visuals are prototyped and
review-approved before production code exists.

**Tech Stack:** React + Motion on the existing liquid engine; vitest + jsdom;
playground (vite) for prototypes and showcase.

**House rules that bind every task:** animate the surface, never the text;
reduced motion collapses to static states; SSR-safe; style pack
(`SurfaceStyleProps`) on every surface; docs page + showcase entry + tests land
in the same commit as the component; changelog entry per component.

---

## Phase 1 — Prototype lab (throwaway) → REVIEW GATE

Three lab pages in the playground, registered at the bottom of the showcase
sidebar under `Lab:` titles. They import engine internals directly, expose raw
parameter knobs, and are deleted (or parked) before the wave merges. Goal:
Yousef approves the motion of the three novel visuals in 2–4 live rounds.

- [ ] **Switch lab** (`playground/showcase/pages/labs/SwitchLab.tsx`): two-well
  track, droplet thumb; knobs for well spacing, bridge neck/tear threshold,
  travel spring, settle wobble; toggle by click. Show 2–3 sizes side by side.
- [ ] **Progress lab** (`playground/showcase/pages/labs/ProgressLab.tsx`):
  vessel fill with live meniscus edge; knobs for wobble amplitude/frequency,
  settle time, fill spring; scripted value playback (0→100 at varying rates)
  plus a manual scrub.
- [ ] **Toast lab** (`playground/showcase/pages/labs/ToastLab.tsx`): condense-in
  at a screen corner, evaporate-out (blur + lift + fade); knobs for condense
  pace, evaporate pace, blur amount, stack spacing; buttons to fire/dismiss
  several toasts.
- [ ] Register the three pages in `playground/showcase/registry.ts`; commit as
  one prototype commit.
- [ ] **REVIEW GATE:** run the playground, present the three labs, iterate
  rounds until approved. Record the approved parameter values in this plan file
  under each phase below before proceeding.

## Phase 2 — Overlay layer + Dialog retrofit

Pure refactor, zero visual change.

- [ ] Write tests first: z-var override respected; portal target creation is
  SSR-safe; Dialog renders identically (existing Dialog tests keep passing).
- [ ] Create internal `src/components/overlay.ts`: portal helper + z-index scale
  as CSS custom properties (`--fluidkit-z-dialog|menu|toast|tooltip`) with
  defaults ordered dialog backdrop → dialog → menu → toast → tooltip.
- [ ] Retrofit `LiquidDialog` onto it. Not a public export.
- [ ] Verify: full test suite + typecheck green; visual spot-check Dialog page.
  Commit.

## Phase 3 — Toast, then Menu (overlay consumers)

- [ ] **LiquidToast**: tests first (dispatcher before/after provider mount,
  dedupe by `id`, stack cap, hover pause, reduced-motion branch, `role="status"`).
  Then `LiquidToastProvider` + module-level `toast()` per spec, using approved
  Phase-1 condense/evaporate values. Docs page, showcase entry, changelog.
  Commit.
- [ ] **LiquidMenu**: tests first (full keyboard walk, focus return,
  outside-click close, `aria-haspopup`/`expanded`, disabled items, flip-to-fit).
  Then the component: pour-from-trigger via Panel geometry, `items` array per
  spec. Docs, showcase, changelog. Commit.
- [ ] After Menu lands, extract whatever Toast and Menu duplicated into the
  overlay module (second-consumer rule). Commit.

## Phase 4 — Droplet-thumb family: Switch → Checkbox → Slider

- [ ] **LiquidSwitch**: tests first (hidden native checkbox with switch role,
  controlled + uncontrolled, keyboard toggle, form participation via `name`,
  label association, reduced-motion branch). Then the component with approved
  Phase-1 tear/merge values. Docs, showcase, changelog. Commit.
- [ ] **LiquidCheckbox**: same test contract plus `indeterminate` (half-fill
  meniscus). Reuses Switch's droplet mechanics; extract the shared droplet-thumb
  internals now (second consumer). Docs, showcase, changelog. Commit.
- [ ] **LiquidSlider**: tests first (hidden native range input, min/max/step,
  arrow-key steps, controlled + uncontrolled, drag updates value, reduced-motion
  branch). Fill read reuses Progress's approved meniscus values; thumb reuses the
  droplet-thumb internals. Docs, showcase, changelog. Commit.

## Phase 5 — Independents: Progress, Field, Badge

- [ ] **LiquidProgress**: tests first (`role="progressbar"` + `aria-valuenow`,
  value/max clamping, wobble only while value changes — no idle loop,
  reduced-motion branch). Approved Phase-1 meniscus values. Docs, showcase,
  changelog. Commit.
- [ ] **LiquidField**: tests first (visible native input/textarea, `multiline`
  switch, label association, focus meniscus appears on focus-visible, native
  props forwarded, reduced-motion keeps focus visibility). Docs, showcase,
  changelog. Commit.
- [ ] **LiquidBadge**: tests first (count text, `max` overflow (`99+`),
  `showZero`, increment triggers droplet only when motion allowed, text
  cross-fades). Docs, showcase, changelog. Commit.

## Phase 6 — Wave close-out

- [ ] Shared focus-meniscus audit: identical treatment across the four form
  controls; WCAG focus-visibility check (contrast of the focus indication).
- [ ] Delete or park the Phase-1 lab pages; clean the registry.
- [ ] README primitives table + materials note updated with the eight entries.
- [ ] `CHANGELOG.md` release section; size budget re-pinned with rationale.
- [ ] Full verification: `npm test`, `npm run typecheck`, `npm run size`,
  `npm run check:gpu-leak`, `npm run check:pack`.
- [ ] Code review pass (requesting-code-review), fix findings.
- [ ] PR: branch `yousefh409/new-components` → `main`, spec + plan linked.

## Verification contract (every component)

jsdom render + a11y roles/labels/keyboard; controlled/uncontrolled; reduced-motion
branch renders the static state with no loop; SSR import safety (no `window` at
module scope); form controls appear in `FormData` under their `name`.
