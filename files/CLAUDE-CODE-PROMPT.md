# Build prompt for Claude Code — "Colour Up" in Next.js

> How to use: create an empty folder, copy your `colour-up.jsx` file into it, open a terminal in that folder, run `claude`, and paste everything below the line. Claude Code will scaffold the project and build it. If it asks questions, answer them; if it proposes a plan, let it proceed.

---

You are building **Colour Up**, a mobile-first web app for running and settling home poker cash games. A complete, working reference implementation exists in the file `colour-up.jsx` in this folder — a single React component. **It is the source of truth for all behaviour, UI, copy, colours, and logic.** Your job is to port it faithfully to a production **Next.js** app that operates exactly as the reference does, then make it deployable. Read `colour-up.jsx` in full before writing anything, and preserve its behaviour precisely unless this document says otherwise.

## Hard product constraint: receipt-only

This app **never charges cards, holds funds, or moves money**. Its only financial output is a **settlement receipt** — the optimal list of who-pays-whom to square everyone up. Do not add any payment, wallet, "pay now", or card-charging UI or logic. (The reference already reflects this: `cfg.mode` is `"receipt"` and there is no active pay sheet. Keep it that way; you may delete any dormant card/pot code you find.)

## Stack and setup

- **Next.js** (latest stable, **App Router**), created with `create-next-app`.
- **JavaScript + JSX** (match the reference — do not convert to TypeScript unless trivial; consistency with the reference matters more).
- **Tailwind CSS** for styling (the reference uses Tailwind utility classes plus inline styles that read CSS custom properties — preserve this approach).
- **lucide-react** for icons (same icon set as the reference).
- **qrcode** npm package to render a **real, scannable QR code** in the lobby invite — this is an upgrade over the reference's decorative QR. Encode a join URL like `https://<host>/join/<code>`.
- **No database.** Persist user data in the browser with `localStorage` (details below).
- Mobile-first, single-column layout capped at ~460px, centered.
- All interactive components must be Client Components (`"use client"`), since the app is entirely stateful and interactive.

## File structure (suggested)

```
app/
  layout.jsx            // fonts, root theme wrapper, metadata
  page.jsx              // the app shell ("use client")
  api/vision/route.js   // server-side Anthropic proxy (holds the API key)
components/             // Setup, Lobby, Fund, Live, Cashout, Reconcile, Settle, Done,
                        // PlayHome, FriendsTab, ProfileTab, ChipScanner, QRCode, atoms…
lib/
  i18n.js               // the full EN/RU dictionary + money()/locale helpers
  themes.js             // the three palettes as token objects
  settle.js             // minimal-transfer settlement algorithm
  chips.js              // denomination ladder, assignDenoms, computeStacks, colour matching
```

## Design system (port exactly from the reference)

- **Fonts:** Bricolage Grotesque (display), Inter Tight (body), IBM Plex Mono (numbers/labels). Load via `next/font/google` or a CSS import — keep the same three roles.
- **Three themes**, applied as CSS custom properties on a root wrapper so switching re-themes the whole app instantly. Copy the exact hex values from the reference's `THEMES` object:
  - **Trust** (light, default): white/gray surfaces, blue primary.
  - **Night** (dark navy) and **Steel** (dark slate).
- **Semantic colour mapping — do not deviate**, it is grounded in trust/gambling colour research:
  - **Blue** = primary/trust → chrome, buttons, active states.
  - **White/Gray** = clarity/neutrality → surfaces, borders, text hierarchy.
  - **Green** = money → gains, positive nets, the pot.
  - **Red** = risk → losses, warnings, declines only (never on a call-to-action).
  - **Gold** = luxury/winning → rationed to win moments only (brand chip, "Settled" screen, receipt header, best-night stat).
- Keep the restrained formatting: minimal borders, generous spacing, one accent doing the work.

## Internationalisation

- Full **English + Russian**, every user-facing string sourced from one central dictionary (port the reference's `DICT`).
- A language toggle in the header; switching re-renders everything including the ledger and photo flows.
- **Locale-aware formatting:** numbers and currency via `en-GB` / `ru-RU` (space vs comma thousand separators); dates/times localised; **Russian pluralisation** for transfer/payment counts (1 / 2–4 / 5+ forms). Game names and handles stay as free text.

## App shell and navigation

- Bottom tab bar: **Play / Friends / You**.
- Header: brand (gold chip + wordmark), live-game timer, palette switcher (3 swatches), EN/RU toggle, ledger toggle.
- An append-only **ledger** panel (timestamped events) toggled from the header.
- A **"acting as" device switcher** shown during live game phases, letting the operator act as each seated player (the app simulates multiple phones on one device — keep this).

## The game flow (Play tab) — phases in order

Port each phase's screen and logic exactly:

1. **home** — greeting by profile name; two big cards: *Host a table* and *Join a table* (opens a camera-style scan sheet with code entry); a dated list of recent tables; a resume banner if a game is in progress.
2. **setup** — table name; buy-in amount; currency picker (`£ $ € ₸ ₽`); a **starting-stack** section that defaults to "count chips straight in <currency>" with a **Scan my chip set** option (see Chip-set scanner); a fixed receipt-only explainer (no money-mode picker). **No player seats are listed here** — players join only after the lobby opens. Show a small note saying so.
3. **lobby** — a **real QR code** + 6-char code + copy-link + a "simulate someone scanning" button that seats a friend/guest; unanimous stake agreement (every seat must agree before proceeding); require **at least 2 seated players** before taking buy-ins.
4. **fund** — record each player's buy-in. **No card charge** — buying in just records the amount (receipt-only). Show an "IN" tag per funded player.
5. **live** — per-player buy-in totals and re-buys (recorded, not charged), cash-out-early, an "exposure" card, and a banker-only "Call last hand".
6. **cashout** — each seat counts their own stack privately; see Stack counting below. A stack of **0 is valid** (busted player) — only a truly blank field blocks submission. Nobody sees another's number until all are in.
7. **reconcile** — compare counted vs issued chips. **If they don't balance, the per-player counts are READ-ONLY** and the only way forward is a **full recount**: reset every player's submitted count and send the whole table back to counting with blank fields. Nobody can edit a number to force a balance. Only a genuinely balancing count proceeds.
8. **settle** — a per-player net table (in / out / net) plus the **optimal transfer list** (fewest transfers); unanimous sign-off; a **"Finalise receipt"** action (not "pay").
9. **done** — summary stats (length, biggest win in gold, seats); a receipt with each player's net and, for this receipt-only app, the **who-pays-whom transfer list** as the deliverable; the table is saved to history with its date.

## Stack counting (cashout) — with photo auto-count

Provide three ways to enter a final stack, as in the reference:
- **Two big mode buttons:** "Type a total" and "Count by colour" (a denomination grid).
- **A prominent "Photo of my stack" button.** On capture, POST the image to `/api/vision`; the response lists chip colours and counts; **match each detected colour to the nearest denomination by RGB distance**, fill the count-by-colour grid, switch to that view, and show the computed total for the player to verify and adjust. Show a success note ("counted from your photo — check and adjust") or a graceful failure note that falls back to manual entry.
- The denominations used come from the scanned chip set if one exists, otherwise the standard colour set.

## Chip-set scanner (setup) — photo → denominations → even stacks

Port this feature exactly:
- Photo of the chips (grouped by colour) → POST to `/api/vision` → colours + counts.
- **Assign denominations** on a standard ladder `[1,5,25,100,500,1000,5000]`, most-numerous colour gets the smallest value.
- A **player-count stepper** (independent of seats) to split an **even starting stack** across N players: `perPlayer = floor(count / N)`, then **trim the highest denominations** so no single denomination exceeds ~55% of the stack's value (prevents locking value in a few big chips). Leftover chips stay in the box; every player gets an identical stack.
- Every colour, count, and denomination is **editable**; support manual add/remove of colours; full manual fallback if vision fails.
- Applying it sets the chip conversion so one full starting stack equals exactly one buy-in.

## Server-side vision proxy (required for both photo features)

Create `app/api/vision/route.js` as a **Route Handler** that holds the Anthropic API key server-side. The client must call `/api/vision` and **never** call the Anthropic API directly (the key must never reach the browser).

- Read `process.env.ANTHROPIC_API_KEY`.
- Forward a base64 image + a prompt to `https://api.anthropic.com/v1/messages` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
- Use model **`claude-haiku-4-5-20251001`** (cheapest current vision model; leave the model in one constant so it's easy to switch to `claude-sonnet-5` for higher accuracy).
- `max_tokens: 1000`. Return the raw JSON to the client.
- Prompts to use (the client sends the appropriate one):
  - Chip-set scan: *"This is a photo of poker chips grouped by colour. Identify each distinct chip colour and estimate the total number of chips of that colour visible. Respond with ONLY compact JSON, no prose: {\"chips\":[{\"color\":\"<name>\",\"hex\":\"#rrggbb\",\"count\":<integer>}]}."*
  - Stack count: *"This is a photo of one player's poker chip stack. Count the chips of each distinct colour. Respond with ONLY compact JSON, no prose: {\"chips\":[{\"color\":\"<name>\",\"hex\":\"#rrggbb\",\"count\":<integer>}]}."*
- Parse defensively (strip ```json fences, coerce counts to numbers) and handle errors so the UI can fall back to manual entry.
- Add `ANTHROPIC_API_KEY` to `.env.local` and to `.env.example`; never commit the real key.

## Settlement algorithm (port exactly)

Minimal-transfer greedy method: split players into debtors and creditors by net; repeatedly match the largest debtor against the largest creditor for the smaller of the two amounts; produces at most n−1 transfers. Keep the same function.

## Persistence (localStorage, SSR-safe)

- Persist `profile`, `friends`, and `history` in `localStorage`.
- Because Next.js renders on the server first, read `localStorage` only on the client (inside `useEffect`, guarded by `typeof window !== "undefined"`) and hydrate into state to avoid hydration mismatches. Write back whenever the data changes.
- Everything else (an in-progress game) stays in React state as in the reference.

## Profiles / Friends (port exactly)

- **Profile:** first-run registration (name, @handle, colour, home currency); once registered, show avatar, handle, lifetime stats computed from history (tables, net in green/red, best night in gold, hours), a dated history list (each row has a date tile + full date with year + time + duration), and appearance controls (theme + language).
- **Friends:** a seeded starter list; add-by-@handle; each shows tables-played-together; invite a friend into a live table.
- History rows appear both here and on the Play home; both are locale-aware.

## What is still simulated (leave as-is, but structure for later)

The multi-phone QR join is **simulated** (the "simulate someone scanning" button seats a mock player) because there is no backend yet. Keep it, but keep the lobby/players state cleanly separated so a realtime backend (e.g. Supabase) can replace the simulation later. Do **not** build accounts, a database, or realtime sync now.

## Acceptance criteria

- `npm run dev` runs the app with no console errors; it looks and behaves like `colour-up.jsx`.
- Full flow works: home → setup → lobby → fund → live → cashout → reconcile → settle → done, then the table appears in history with its date.
- EN/RU toggle switches all copy and formatting; all three themes work and re-theme instantly.
- Both photo features call `/api/vision`; the key is only ever server-side; manual fallback works if a call fails.
- The reconciliation lock is enforced: a mismatch cannot be edited away, only recounted.
- Receipt-only is intact: no card/charge/pay UI anywhere; the final deliverable is the transfer receipt.
- A stack of 0 can be submitted; the QR in the lobby is a real, scannable code.
- Mobile-first, ~460px, clean and uncluttered.

## After it builds

- Add a short `README.md`: how to run, the `ANTHROPIC_API_KEY` env var, and the deploy steps.
- Initialise git and make a first commit (do **not** commit `.env.local`).
- Tell me how to deploy it (a Next.js host with server route handlers, and where to set the `ANTHROPIC_API_KEY` environment variable).

Work in reasonable steps, keep the app running between steps, and match the reference's look and behaviour closely.
