# Colour Up — design system

Working doc for the identity redesign (branch `redesign/identity`). This is the plan produced
before building, kept here so decisions have a record and a rundown can be written against it
afterward.

## Grounding

A home poker night: friends at a kitchen table, late, one lamp lighting the felt, the physical
ritual of stacking and counting chips, "colouring up" — trading small denominations for big ones
— at the end of the night. It has to be trustworthy enough to settle real money disputes between
friends, but warm enough that it never feels like it's treating them as counterparties. Not a
casino (no neon, no felt-green cliché, no card-suit kitsch). Not a fintech dashboard (no cold
near-black-and-one-accent minimalism).

## Critique against the defaults (before building)

Three looks explicitly ruled out, and why this plan lands elsewhere:

1. **Cream + serif display + terracotta accent.** This plan is a warm *dark* base (not cream),
   the display face is a confident geometric *sans* (not serif), and the accent is a yellow-warm
   brass/gold metal tone (not a red-orange clay). Different value, different display category,
   different hue family — not a re-skin of the default.
2. **Near-black + single acid accent.** The base here is warm brown-black (espresso, not cool
   near-black), and there are four distinct warm accents doing real semantic work (brass, green,
   red, gold) rather than one neon accent doing decoration.
3. **Broadsheet hairline rules.** Structural dividers use the poker chip's own dashed/milled edge
   instead of a thin solid rule — see Signature, below.

## Colour

One theme (per the earlier product decision — no theme switcher). Warm, dark, lamplit.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#17120E` | App background — espresso, not black |
| `felt` | `#241C15` | Card/surface — one step up from ink |
| `raise` | `#2E241A` | Elevated surface (active/raised cards) |
| `line` | `#3C2F21` | Borders, dividers (solid hairlines retired — see Signature) |
| `ivory` | `#F3E7D6` | Primary text — warm parchment, not pure white |
| `mute` | `#A6957D` | Secondary text |
| `dim` | `#6E5F4C` | Tertiary text, disabled |
| **`brass`** | `#C9973B` | **Trust** — primary accent, every-day CTAs, active states |
| **`win`** | `#4C8B5D` | **Money** — gains, positive net, the pot filling |
| **`lose`** | `#C1523E` | **Risk** — losses, warnings. Never on a positive call-to-action |
| **`gold`** | `#F0C24B` | **Win moment** — reserved, brighter than brass, only for settled/best-night |

`brass` and `gold` are deliberately close in hue but different in saturation/value so `gold`
still reads as a step up when it appears — it has to stay rare to mean something.

## Type

- **Display — Unbounded.** Geometric, confident, substantial weight range. Chosen in part
  because it's Cyrillic-native (built by a Moscow foundry with Cyrillic as a first-class script,
  not a Latin face with Cyrillic bolted on) — this app is fully bilingual, so a display face that
  goes thin or falls back to a system font in Russian would quietly break the identity for half
  the audience. Used sparingly: one screen title, one hero number, never body copy.
- **Body — Inter Tight** (kept from the previous pass — it earns its place: excellent bilingual
  legibility, doesn't compete with the display face). Carries the 95% of the UI that should stay
  quiet.
- **Figures — IBM Plex Mono** (kept, but promoted). Every money figure — buy-in, stack, net,
  transfer, pot — renders in tabular Plex Mono. This is the base of the signature (below).

Scale (mobile-first, `rem` throughout):
| Role | Size/Line | Weight |
|---|---|---|
| Display XL (screen hero) | 2rem/2.15rem | Unbounded 800 |
| Display L (section) | 1.5rem/1.7rem | Unbounded 700 |
| Display M (card title) | 1.25rem/1.4rem | Unbounded 700 |
| Body L | 0.9375rem/1.5 | Inter Tight 500 |
| Body M | 0.84375rem/1.5 | Inter Tight 400/500 |
| Eyebrow/label | 0.625rem, tracked .16em | Inter Tight 600, uppercase |
| Figure XL (hero money) | 2.25rem, tabular-nums | Plex Mono 600 |
| Figure M (line amounts) | 1.05rem, tabular-nums | Plex Mono 600 |
| Figure S (table amounts) | 0.8125rem, tabular-nums | Plex Mono 500 |

## Layout concept

Content lives inside a single pool of warm lamplight at the centre of a dark table: cards are
soft-edged "placemats" with a faint top-edge highlight, as if lit from above, not a flat
broadsheet grid. The game's real step sequence (set up → open → buy in → play → count → reconcile
→ settle) is always visible as a literal step rail, because the phases are true structure, not
decoration. Every divider — under a headline number, between steps, around an avatar — borrows
the poker chip's own dashed/milled edge instead of a flat hairline.

## Signature: the chip-edge ledger figure

Every money figure is set in tabular Plex Mono and underlined by the same dashed stroke used on
the brand's poker-chip mark (`stroke-dasharray`, echoing a chip's milled edge) — money in this
app always looks like it was stamped on a chip, never like a spreadsheet cell. That motif recurs
as the app's primary structural rule everywhere else (step rail, dividers, avatar rings),
replacing hairlines app-wide.

At the two moments that matter most — the reconciliation check and the final settle — that same
motif becomes motion: small stacks of chip-tokens animate and visually **colour up**, merging
into the fewer, larger transfers of the receipt. It dramatizes the app's actual value proposition
(fewest transfers, done in the open, never edited after the fact) instead of just stating it in
copy. `prefers-reduced-motion` gets the same end-state with no animation.

## What this rules in for usability

- First-run explainer (skippable) of the flow + the no-money-handled promise.
- A real step rail, not just a phase label — shows the true 7-step sequence.
- One-tap re-host of the last table; remembered currency/stake defaults.
- Pot-filling progress as buy-ins land; a satisfying "counted" and "settled" state.
- Plain-language recount explanation (why, not just that).
- Large tap targets, visible focus rings, ARIA labels on icon-only buttons throughout.

## What's deliberately left out

- No second theme / light mode — reopening that was explicitly rejected earlier in the project;
  redesigning the one theme is in scope, adding a switcher is not.
- No sound/haptics in this pass — real candidates later, not load-bearing for the identity.
- No receipt image export in this pass — deep-link "pay via" stays, export is a clean follow-up.
