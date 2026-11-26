# Design System — Ardoiz (Interface 1 : Ardoise & Papier Doux)

Adopted from Impeccable Operate-mode redesign (`ardoiz_ui_1`) to replace the dense 9-tab Living Tiles mosaic with a calm, focused stationery-and-chalkboard workspace tailored to CP → 3e students and parents.

## Surface Mode & Visual World
- **Mode**: Operate (daily homework, interactive chalk notes & animated slate lessons, guided/infinite exercises, method sheets, quizzes `/20`, official Éduscol curriculum, UAI Class Challenge, and multi-year history).
- **Architecture**: Calm 232px deep chalkboard-green left rail (`#112A27`) with compact school-year dropdown (`CM2 · 2026-2027 ▾`), subtle March 1st N+1 enrollment trigger, and **5 clear primary destinations** (`Aujourd’hui`, `Mon Ardoise`, `Matières`, `Challenge`, `Parcours`). On mobile (`≤ 860px`), collapses into a slim top bar + 5-slot bottom navigation bar.
- **Signature Move**: **Ardoise du jour** — a single dark chalkboard panel (`#14332F`) anchoring the top of `Aujourd’hui` with a clean geometric SVG chalk diagram and 1-click actions (`Ouvrir mon ardoise`, `Lancer l’animation ▶`), paired with a pure white checkable `Devoirs à faire` panel and a 4-column row of restrained white subject cards with subtle 4px top accent strips.

## Typography
- **Display & UI Controls**: `Plus Jakarta Sans` (`500`, `600`, `700`, `800`), crisp `-0.02em` tracking, fixed rem scale, `tabular-nums` on all scores, dates, and counters.
- **Body**: `Nunito` (`400`, `600`, `700`, `800`), `16px` base, `1.55` line-height.

## Palette
| Role | Papier Doux (default) | Ardoise Nuit (optional) |
|---|---|---|
| Workspace Ground | `#F8F6F0` | `#0F191C` |
| Left Rail | `#112A27` | `#0B1316` |
| Chalkboard Hero | `#14332F` (`#F8FAFC` ink) | `#132C2A` (`#F8FAFC` ink) |
| Card Surface | `#FFFFFF` (`1px solid #E4DFD3`) | `#162428` (`1px solid #263B40`) |
| Primary Ink | `#142321` | `#F1F5F9` |
| Muted Ink | `#60736F` | `#94A8AB` |
| Active / Chalk Highlight | `#38BDF8` / `#0284C7` | `#38BDF8` |
| Accent | `#C25100` | `#FBBF24` |
| Subject Strips | Maths `#3898DB`, Français `#DC6A4E`, Sciences `#4D9E7E`, Anglais `#D49A3A` | Calibrated light pastels |
