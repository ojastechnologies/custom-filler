# DESIGN.md — Aero Tech Labs

Color strategy: **Restrained** — tinted neutrals plus one accent. Modern-minimal,
precision-engineered. Think a clean-room: a cool porcelain canvas, ink text, and a
single cryogenic-azure accent that ties to the flagship Laser Cryogen product. Most
emphasis is carried by ink weight and scale, not color. The accent stays under ~10% of
any surface (CTAs, links, focus, small highlights).

Implemented as CSS custom properties in `globals.css` (light + `.dark`), surfaced to
Tailwind as semantic tokens. The legacy `primary` scale is remapped to the same azure
so pages not yet rebuilt still pick up the new identity.

## Color (OKLCH)

Light
- `--bg`     oklch(0.988 0.004 240)  porcelain, faintly cool
- `--surface`    oklch(0.972 0.004 240)  sections / subtle fills
- `--raised`    oklch(0.998 0.002 240)  cards / raised surfaces
- `--fg`     oklch(0.23 0.02 256)   ink
- `--muted`    oklch(0.52 0.018 256)   secondary text
- `--line`     oklch(0.92 0.006 256)   hairline borders
- `--accent`    oklch(0.58 0.149 245)   cryogenic azure
- `--accent-hover` oklch(0.52 0.155 250)
- `--accent-fg`   oklch(0.99 0.005 240)   text on accent
- `--accent-tint`  oklch(0.95 0.03 240)   subtle accent wash
- `--ring`     oklch(0.58 0.149 245)

Dark
- `--bg`     oklch(0.205 0.012 256)  deep cool charcoal, never #000
- `--surface`    oklch(0.24 0.012 256)
- `--raised`    oklch(0.265 0.013 256)
- `--fg`     oklch(0.95 0.005 250)
- `--muted`    oklch(0.69 0.012 256)
- `--line`     oklch(0.32 0.012 256)
- `--accent`    oklch(0.72 0.13 240)   lifted for dark contrast
- `--accent-hover` oklch(0.78 0.12 238)
- `--accent-fg`   oklch(0.20 0.02 256)
- `--accent-tint`  oklch(0.30 0.04 245)
- `--ring`     oklch(0.72 0.13 240)

## Typography
- Display / headlines: **Bricolage Grotesque** (600–700). Headlines only.
- Body / UI: **Hanken Grotesk** (400/500/600).
- Fluid `clamp()` modular scale, ratio ~1.25–1.3. Tight negative tracking on display.
- Tabular figures for prices and specs. Body line length capped ~68ch.

## Spacing & layout
- Section vertical rhythm uses fluid `clamp()`; vary it, never uniform padding.
- Container max ~1200px with generous gutters. Left-aligned; asymmetric where it earns it.
- No centered icon-title-card template. No nested cards.

## Radius
- sm 6px, md 10px, lg 16px, pill for chips. Crisp, not bubbly.

## Elevation
- Hairline 1px tinted borders are the primary separation.
- Shadows are rare, soft, tinted, low-opacity. Reserved for true overlays and the
  primary CTA lift.

## Motion
- ease-out curves (quint / expo). One orchestrated page-load with subtle staggered
  reveals (opacity + small translateY, ~12–20px). No bounce, no elastic.
- Respect `prefers-reduced-motion`.

## Components
- **Button**: `solid` (accent), `quiet` (ghost/outline ink), `link`. Sizes sm/md/lg.
- **Card**: hairline border, optional hover lift. Never a side-stripe accent.
- **Container / Section**: shared primitives that own page rhythm.
- **Badge / Pill**: deal codes, spec tags, status.
- **Eyebrow**: a single small tracked label is allowed as a kicker, not on every section.
