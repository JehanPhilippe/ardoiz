# Design System Master — CapDevoirs

*Grounded via `ui-ux-pro-max` (Product #43 Online Course/E-learning, Palette #43 Progress Teal + Achievement Amber, Font Pairing #6 Playful Creative: Fredoka + Nunito, Charts #1/#2 accessible bar & line, UX Priority Rules 1–10) and `impeccable` Operate Mode (`mode-operate.md` + `craft-floor.md`).*

## Mode & Visual World
- **Surface Mode**: Operate (daily school homework & mastery workbench).
- **Physical Scene**: A child or parent working at a sunlit or lamp-lit study desk in the late afternoon — bright paper clarity on work surfaces anchored by a deep chalkboard/pine-teal navigation rail.
- **Signature Move**: **Frise du Parcours Scolaire & Portail N+1 (Mars)** — a horizontal multi-year school ribbon (`CP → 3e`) in the workspace header that lets students switch between archived past years and their active year, ending with the March 1st N+1 enrollment gate.

## Color System (Semantic Tokens)
- **Shell Rail (Committed Surface)**: `--color-shell: #0F2F2E` (deep pine-slate), `--color-shell-elevated: #163E3C`, `--color-shell-text: #EAF6F4`, `--color-shell-muted: #98C5BF`
- **Primary Brand Action**: `--color-primary: #0F766E` (Progress Teal, contrast ≥ 5.4:1 with white), `--color-primary-hover: #115E59`, `--color-primary-soft: #CCFBF1`
- **Achievement Accent**: `--color-accent: #D97706` (Warm Study Amber), `--color-accent-soft: #FEF3C7`, `--color-accent-ink: #92400E`
- **Ground & Surfaces**: `--color-bg: #F3F8F7` (cool mist paper), `--color-surface: #FFFFFF`, `--color-surface-subtle: #EAF3F1`, `--color-border: #C9DFDC`
- **Ink**: `--color-ink: #112A29`, `--color-ink-secondary: #3E5C5A`, `--color-ink-muted: #5A7674` (all ≥ 4.5:1 on white)
- **Semantic States**:
  - Success / Acquired: `#15803D` / soft `#DCFCE7`
  - Warning / In Progress: `#B45309` / soft `#FEF3C7`
  - Danger / Error: `#B91C1C` / soft `#FEE2E2`
  - Info / Archive: `#1D4ED8` / soft `#DBEAFE`

## Typography
- **Display / Headings**: `'Fredoka', system-ui, -apple-system, sans-serif` (weights 500, 600, 700; tracking `-0.015em` to `-0.025em`)
- **Body / UI**: `'Nunito', system-ui, -apple-system, sans-serif` (weights 400, 600, 700, 800; base `16px`, line-height `1.55`)
- **Tabular Figures**: `font-variant-numeric: tabular-nums` on all scores (`/20`, `%`), dates, countdowns, and progress tables.

## Craft & Anti-Pattern Discipline
1. **Zero emoji icons**: All UI icons come from `js/icons.js` (authored 24×24 SVG, `stroke-width: 2`, consistent rounded caps/joins).
2. **No eyebrows/kickers** above headings; headings carry their own hierarchy.
3. **No one-sided accent bars** on cards; use full borders, tonal fills, or leading icon badges.
4. **Single elevation declaration**: Border OR soft offset shadow, never heavy border + wide drop shadow together.
5. **No nested cards**: Sub-elements inside a panel use subtle horizontal rules or tinted list rows, not nested bordered boxes.
6. **Touch & Keyboard**: Min `44×44px` interactive targets, `≥ 8px` gap, clear `:focus-visible` outlines, themed `::selection` and scrollbars, full `prefers-reduced-motion` support.
