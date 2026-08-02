# Colour Up — session handoff

Paste this whole file into a fresh Claude Code / Claude session to resume work.
It lives at the repo root (`HANDOFF.md`) so it travels with the code — update
it at the end of each session rather than treating it as a one-off.

## What this is

Colour Up: a mobile-first web app for running and settling home poker cash
games. Its only financial output is a **settlement receipt** — the fewest
transfers needed to square everyone up. It never charges cards, holds funds,
or moves money. That constraint is non-negotiable and applies to every future
milestone too.

- **Repo**: https://github.com/Mlg-DauN-gay/ColourUpWebGH (branch `main`, working tree clean as of this handoff)
- **Stack**: Next.js 16 (App Router, JS/JSX — not TypeScript), Tailwind CSS, lucide-react, Supabase (Postgres + Auth)
- **Not yet deployed anywhere** — only runs locally via `npm run dev`. No hosting provider chosen yet.

## ⚠️ Read this before writing any code

`AGENTS.md` (imported by `CLAUDE.md`) flags that **this Next.js version (16.x)
has breaking changes from training data** — e.g. `middleware.js` was renamed
to `proxy.js` (exporting a `proxy` function, not `middleware`). Check
`node_modules/next/dist/docs/` before assuming an API works the way you
remember. This bit us once already (see `proxy.js` at the repo root).

There's also a **custom ESLint rule** (`react-hooks/set-state-in-effect`,
part of the React Compiler plugin set) that flags *any* direct `setState`
call reachable from a `useEffect` body — including through one level of
function indirection — even for correct, non-looping code. The established
workaround in this codebase (see `lib/useAppData.js`, `app/page.jsx`) is to
wrap the effect body in an async IIFE: `useEffect(() => { (async () => {
...setState calls... })(); }, [deps]);`. For a value that a `useCallback`
needs but that changes only via imperative user actions (not every render),
sync a `useRef` via `useEffect` rather than reading the state variable
directly in the callback's closure — see `profileRef`/`modeRef`-style patterns
if you resurrect `lib/useAppData.js`'s history for reference. Run `npm run
lint` after any hook changes; don't just eyeball it.

## Current status

**Milestone 1 (accounts) is done, but reworked twice from the original spec**
based on direct user feedback mid-session. Read this section carefully —
the original 7-milestone spec (appended at the bottom of this file) describes
a *different* auth model than what's actually built. Follow what's below,
not the original M1 bullet points.

### What's actually built (as of commit `0ca177f`)

1. **Full Next.js port of the reference app** (`files/colour-up.jsx` is the
   original single-file reference — still present, still the source of truth
   for game-flow *behavior*, but no longer for UI chrome — see deviations
   below). Complete phase flow: home → setup → lobby → fund → live → cashout
   → reconcile → settle → done. EN/RU i18n. Chip-set scanner + stack
   photo-counting via a server-side `/api/vision` Anthropic proxy (falls back
   to manual entry gracefully). Real scannable QR in the lobby invite.
   Reconciliation lock (mismatch → full recount only, no editing a submitted
   count). Receipt-only — no payment UI anywhere, and it must stay that way.

2. **Accounts, via Supabase — but deferred, not upfront.** This is the
   biggest deviation from the original spec:
   - **No solo/offline mode.** The original spec called for a
     local-storage-only "solo" mode alongside a Supabase-synced "online"
     mode with a toggle. The user explicitly rejected this ("why do we even
     need sync across devices... I just want people to create an account").
     `lib/useLocalStorageState.js` was deleted; there is no local-only path
     anymore.
   - **Auth is deferred to the lobby-open checkpoint, not required upfront.**
     Also explicitly requested. Home and Setup (choosing stake/currency/chip
     scan) are fully browsable signed out. The account prompt only appears
     when `Setup`'s "Open lobby" button is clicked
     (`openLobby()` in `app/page.jsx`) — because that's the moment the table
     becomes visible/joinable by other people. If there's no session or no
     profile row yet, it redirects to the profile screen instead of a
     full-page blocking gate. A `pendingLobby` flag + `useEffect` in
     `app/page.jsx` **automatically finishes opening the lobby** once
     sign-up/log-in + profile creation complete — this was a real bug
     (fixed in commit `0ca177f`) where users got stranded on the profile
     page after finishing the account step.
   - **Email + password**, not magic links or anonymous sign-in (also an
     explicit user choice over the original spec's anonymous-sign-in
     design). `components/AuthGate.jsx` is an embeddable sign-up/log-in/
     forgot-password form (not a full page — it's rendered inside the
     Profile screen). `app/auth/callback/route.js` exchanges an email
     confirmation or password-reset code for a session;
     `app/auth/reset/page.jsx` is the "set a new password" form landed on
     after clicking a reset-link email.
   - `lib/useAppData.js` holds the whole data layer: auth session +
     `profile`/`friends`/`history`, always Supabase-backed once signed in.
   - `supabase/migrations/0001_init.sql`: `profiles`, `friends`, `history`
     tables, all RLS-scoped to `auth.uid()`. **Verified directly against the
     live project's REST API** (not just "looks right in the UI") that an
     unauthenticated request can't read another user's rows.

3. **No theme switcher — one fixed palette.** Originally three themes
   (Trust/Night/Steel) with a swatch picker in the header and profile;
   explicitly rejected by the user. `lib/themes.js` now exports a single
   `THEME` object (was `THEMES` map). If theming ever comes back, it needs
   to be re-added from scratch, not un-commented — the multi-theme code was
   deleted, not hidden.

4. **No bottom tab bar.** Originally Play/Friends/You. Explicitly rejected.
   Navigation is now: the game flow *is* the whole "Play" screen, and a
   profile icon/avatar button in the top-right of the header opens a single
   merged Profile screen (`components/ProfileTab.jsx`) with a back arrow.
   **Friends is folded into that Profile screen** (still
   `components/FriendsTab.jsx` as a component, just rendered as a section
   inside Profile instead of its own tab) — also an explicit request.

5. **Tapping the Colour Up logo navigates home** without discarding an
   in-progress game — the phase you were on is remembered
   (`resumeGp` state) so the home screen's "Resume table" banner jumps back
   to the *exact* phase, not a hardcoded one (fixed a latent bug from the
   original reference along the way).

### Supabase project state (dashboard settings already configured)

- Migration `supabase/migrations/0001_init.sql` has been run.
- **"Confirm email" is currently turned OFF** (Authentication → Sign In / Up
  → Email) — a deliberate dev-convenience tradeoff to unblock testing
  without hitting Supabase's free-tier email rate limit. **Turn this back on
  (or set up custom SMTP, e.g. Resend's free tier) before any real user could
  sign up**, or anyone can register with an email they don't own.
- "Anonymous Sign-Ins" was enabled earlier in the session for a design that
  was later scrapped (magic-link/anonymous auth). The app no longer calls
  `signInAnonymously()` anywhere — that toggle is harmless but unused; fine
  to leave on or turn off.
- Site URL / Redirect URLs are configured for `http://localhost:3000` +
  `/auth/callback`. **Will need production URLs added here once deployed.**
- A handful of throwaway test accounts exist in the project from manual
  testing (`colourup-test3@example.com` through `colourup-test5@example.com`,
  all `@example.com` — harmless, safe to ignore or delete).

### Env vars (`.env.local`, already populated locally — not committed)

```
ANTHROPIC_API_KEY=            # optional; chip-photo features fall back to manual entry without it
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### How to verify the app works

```bash
npm install
npm run dev
```
Then `npm run lint` and `npm run build` should both be clean (one pre-existing
`<img>` warning in `ChipScanner.jsx` is expected and fine to leave). Open
`http://localhost:3000`, resize to mobile width (~375–460px). Walk: Host a
table → Setup (no login needed) → Open lobby (triggers sign-up) → create
profile → should land directly in the lobby, not stranded on profile.

## Milestone 2, slice 1 — real lobby multiplayer (done this session)

The single-device "device switcher" simulation is gone. There's now a real
hosted lobby: the host creates an actual `games` row, guests join via a
real `/join/<code>` link, and the Lobby screen syncs live via Supabase
Realtime across devices. **Fund through Settle/Done are still local state**
this slice, deliberately — see "What's next" below for the follow-up.

- **Auth model** (explicit user decision, overriding the original spec's
  anonymous-sign-in idea without discussion): guests join the lobby with
  **no account at all** — they sign in anonymously
  (`supabase.auth.signInAnonymously()`, already enabled in the dashboard)
  the moment they open a join link, which gives them a real `auth.uid()`
  so all existing RLS patterns work unchanged. They're only asked to
  create a real account (email+password) at the **Fund** step, via
  `supabase.auth.updateUser({email,password})` — this **upgrades the same
  anonymous session in place** (same `auth.uid()` before/after), so their
  seat/entries rows never need migrating. This is a distinct mechanism
  from `AuthGate`'s `signUp`, which would create a new user and orphan the
  guest's seat — don't conflate the two if extending this later.
- **New schema**: `supabase/migrations/0002_multiplayer.sql` adds `games`,
  `game_players`, `entries`, `ledger`, plus a host-only `advance_phase()`
  RPC (SECURITY INVOKER — relies on RLS, not elevated privilege) and
  enables Realtime replication on `games`/`game_players`. **This migration
  has not been run against the live Supabase project** — do that via the
  SQL Editor before testing any of this for real. `entries`/`ledger` ship
  with correct ownership RLS now but have zero callers yet (see below).
- **New hook**: `lib/useGameData.js` — mirrors `useAppData.js`'s
  conventions, owns the real `games`/`game_players` state + Realtime
  subscription, exposes `createGame`/`joinGame`/`agree`/`advancePhase`.
- **Real join flow**: `app/join/[code]/page.jsx` is now a thin wrapper
  around `app/join/[code]/JoinClient.jsx`, which does the anonymous
  sign-in → game lookup → seat form → insert → redirect to `/?game=<id>`.
  The old static "type this code in manually" stub is gone.
- **The Lobby → Fund hand-off**: the moment the host advances the phase
  (or a guest observes it via Realtime), the real `game_players` rows are
  copied into the existing local `players` array (same ids), so
  Fund/Live/Cashout/Reconcile/Settle/Done run **completely unchanged** —
  see `handleLobbyBecameFund()` in `app/page.jsx`.
- **Removed**: the bottom device-switcher pill bar, `simulateJoin()`, and
  Lobby's "Simulate join" button — real joins replace all of it. No
  dev-flag fallback was kept (explicit user choice).
- **Known, deliberate gaps** (not oversights — see the migration's and
  `app/page.jsx`'s comments for detail): no leave-lobby/cancel-table
  action yet (an abandoned lobby just sits at `phase='lobby'` forever);
  refreshing mid-Fund-through-Settle loses local state (only the Lobby
  phase is actually persisted this slice — `app/page.jsx` shows a
  "table already in progress" message rather than silently misrendering
  in that case); `components/JoinSheet.jsx` (manual code-entry sheet)
  is still the old non-functional stub.

## What's next

The user gave a **7-milestone roadmap** (verbatim, appended below) for
turning this from a single-device simulation into a real multiplayer app.
**Milestone 1 is done but was substantially reworked from that spec**, and
**Milestone 2 is now underway but only its first slice is done** (real
lobby only — see above). The natural next slice is rewiring Fund → Live →
Cashout → Reconcile → Settle → Done onto the same real
`entries`/`ledger` tables and Realtime pattern established for the lobby,
plus the `player_counts`/`transfers` tables and the count-privacy +
recount-lock RPCs from the original Milestone 3 spec — deliberately not
built yet since their shape depends on that Cashout/Reconcile design.
Prioritise correctness of that integrity model over speed once you get
there, per the original spec's own instruction.

Before extending further: confirm scope with the user rather than
assuming, especially anywhere the original spec's assumptions (solo mode,
always-visible nav chrome) might resurface. The user iterates fast and
corrects architecture choices directly — expect to adjust mid-flight
rather than plan everything upfront.

**Deployment**: still nothing actually deployed. Vercel was recommended
(natural fit for Next.js, generous free Hobby tier, no issue with
Supabase Realtime since the browser talks to Supabase directly) but the
user hasn't connected the repo to a Vercel account yet — that step needs
their account, not a session running against this repo.

---

## Appendix: original 7-milestone spec (verbatim, as given by the user)

> Use this after the Next.js app from the first prompt exists and runs. Open a terminal in the project folder, run `claude`, and paste everything below the line. Work the milestones in order, keep the app running between them, and commit after each. Do not start a milestone until the previous one's acceptance checks pass.

You are extending Colour Up, a receipt-only web app for settling home poker cash games (Next.js App Router, JS/JSX, Tailwind, lucide-react, localStorage; a server route at `app/api/vision/route.js` proxies Anthropic for photo chip-counting). The current build is a polished single-device simulation: one operator acts as every player, and the "other phones" are faked. Your job is to make it genuinely multiplayer and production-ready, without ever charging cards or moving money — the app's only financial output remains a settlement receipt.

Non-negotiable constraint (repeat after every milestone): no funds ever flow through this app or its servers. No payment processing, no held balances, no card charging. "Paying" is always the players' own business, done in their own apps. Keep it receipt-only.

Preserve everything that already works: the design system and three themes, EN/RU i18n, the game-phase flow, the chip-set scanner and stack-photo counter, and the reconciliation lock. You are adding a real backend beneath the existing UX, not redesigning it.

**Note from this handoff**: "the design system and three themes" no longer applies — see deviations above. Everything else in this paragraph still holds.

### The core problem you're solving
Every integrity feature — private counts, the locked recount, watching the pot fill — only means something if each player is on their own device with their own permissions. Today the operator can type anyone's number, so the anti-cheat is decorative. The fix is a server-authoritative model where the database (not the UI) enforces who can do what. That enforcement is the most important thing you will build; treat it as security-critical.

### Milestone 1 — Backend + accounts (Supabase)
Add Supabase (Postgres + Auth + Realtime) as the backend.

- Use Supabase Auth with anonymous sign-in so a person can scan a QR and join instantly by picking a handle, with optional email magic-link to claim/persist their profile across devices.
- Create tables: `profiles` (id = auth uid, handle, display_name, color, currency), and `friends` (owner_id, friend handle/display_name/color, together_count).
- Migrate profile/friends/history persistence from localStorage to Supabase for signed-in users. Keep localStorage as an offline cache and as the store for a "solo/local" mode (one operator, no network) so the app still works with no connection — the existing simulation becomes the explicit offline mode.
- Add `.env.local` + `.env.example` entries for the Supabase URL and anon key. Never commit real secrets.

Acceptance: a user can create a profile, add friends, and see them persist after refresh and on a second device via email link; solo/offline mode still works with no network.

**Note from this handoff**: superseded — see "What's actually built" above. No solo mode, no anonymous sign-in, email+password instead of magic links, auth deferred to lobby-open instead of required for profile/friends access.

### Milestone 2 — Real multiplayer games
Model a live table on the server and sync it to every device with Realtime.

- Tables: `games` (id, code unique 6-char, host_id, title, currency, buy_in, chips, scan jsonb, phase enum, created_at, ended_at), `game_players` (id, game_id, user_id, seat_name, color, is_host, agreed, out, submitted, approved), `entries` (id, game_id, player_id, amount, chips, kind buyin|rebuy, at), `ledger` (id, game_id, at, text), `transfers` (id, game_id, from_player, to_player, amount).
- Store each player's final count in a separate `player_counts` table (game_id, player_id, chips) so it can be access-controlled independently (see M3).
- QR join: the lobby QR encodes `/join/<code>`. Opening it: authenticate (anonymous if needed), prompt for handle, insert a `game_players` seat, and the host's lobby updates live. Remove/replace the "simulate someone scanning" button with real joins (keep a dev-only seed helper behind a flag if useful).
- Realtime: every device subscribes to its current game's `games`, `game_players`, `entries`, `ledger`, `transfers` rows and re-renders on change.
- Per-device actions: a player agrees to the stake, records their own buy-in/re-buy, submits their own count, and signs off — only for themselves. The "acting as everyone" device switcher is retired for online games (keep it only inside solo/offline mode).
- Phase control: only the host advances phases, through guarded RPCs (e.g. `advance_phase`) that enforce rules server-side: can't leave lobby until ≥2 players have agreed; can't leave cashout until all counts submitted; etc.

Acceptance: two separate browsers (or phones) join the same code and play a full hand end-to-end, each controlling only their own seat, with every screen updating live.

**Note from this handoff**: "authenticate (anonymous if needed)" for QR join conflicts with the email+password-only decision — raise this with the user before implementing. "Retired for online games... keep it only inside solo/offline mode" doesn't apply since solo mode doesn't exist; decide with the user whether the device switcher goes away entirely once real multiplayer lands, or stays as a dev/testing aid.

### Milestone 3 — Integrity enforced at the database (the critical part)
Make cheating impossible through the API, not just hidden in the UI. Implement Row Level Security so:

- A player can insert/update only their own `game_players` flags (`agreed`, `out`, `submitted`, `approved`) and only their own `entries` and `player_counts` rows.
- Count privacy: `player_counts.chips` is readable by its owner always, but by other players only once `games.phase` is `settle` or `done`. During cashout, others see "counted", never the number.
- Reconciliation without revealing: a `SECURITY DEFINER` RPC returns only the aggregate counted-vs-issued totals (never per-player figures) so the table can check balance while individual counts stay private.
- Locked recount: on a mismatch, a host-only `SECURITY DEFINER` RPC resets every `submitted=false` and clears `player_counts`, sending everyone back to counting. No one — including the host — can edit a single player's number to force a balance. (This is the server-side version of the existing lock; keep the UI behaviour identical.)
- Only the host can advance phases, end the game, or run the reconcile/recount RPCs.

Acceptance (test it): using direct Supabase API calls (not the UI), a non-host cannot advance a phase, cannot read another player's count before settle, and cannot write another player's seat/count. Write a short script or notes demonstrating each is rejected by RLS.

### Milestone 4 — Secure the vision endpoint
The `/api/vision` proxy will be public once deployed; protect it so it can't be used to burn your Anthropic credits.

- Require a valid Supabase session (verify the JWT server-side) and that the caller is a participant in an active game.
- Rate-limit per user (e.g. a small Postgres counter or Upstash Redis) — a few calls per minute is plenty.
- Enforce a max image size, reject non-image payloads, and keep `max_tokens` small.
- Keep the model in one constant (`claude-haiku-4-5-20251001`), and document setting a hard monthly spend cap in the Anthropic console.

Acceptance: an unauthenticated or over-limit request to `/api/vision` is rejected; a normal in-game scan still works.

### Milestone 5 — Close the receipt loop (highest-value new feature)
Make the receipt actionable while staying receipt-only.

- Running tab across sessions: track cumulative net between the same people over time. After a receipt is finalised, update a `balances` view/table per player-pair (or per friend group) so players can see "you're +₸12,000 with Nadia over 6 tables" and settle up periodically rather than every night. Show this on the Friends and Profile screens.
- "Pay via" deep links on each transfer: render buttons that open the payer's own payment app pre-filled where the provider supports it — include Kaspi (their transfer/QR link), Revolut (`revolut.me`), PayPal (`paypal.me`), Venmo — and always a copy-amount-and-handle fallback for anything that can't be deep-linked. The app constructs a link and hands off; it never sees or moves the money. Make this explicit in the UI copy.

Acceptance: finalising a receipt updates the running balances; tapping "Pay via" opens the chosen app pre-filled (or copies the details) without the app touching funds.

### Milestone 6 — Survive a real poker night

- PWA / installable + offline: add a manifest and service worker (next-pwa or Serwist) so the app installs to the home screen. Solo/offline mode works with no connection; online mode handles dropped connections gracefully — reconnect, resync from the server, optimistic UI with rollback, and a clear "reconnecting" state. A player refreshing or losing signal mid-game rejoins their seat cleanly.
- Reconciliation escape hatch: the strict recount stays the default, but after two failed recounts let the host open a "resolve discrepancy" flow: it shows the gap, requires a ledger note, splits the difference (proportional to stacks, equally, or assigned to a volunteer), and requires unanimous sign-off. Everything is recorded in the ledger. This handles the real "a chip fell under the couch" case without a dead end.
- Exact-cent money math: do all settlement in integer minor units (cents/tiyin) and distribute any leftover unit deterministically (largest-remainder), so the receipt always sums to exactly zero. Surface rounding transparently.
- Optional host rake/tip: off by default; if enabled, a transparent line item subtracted from the pot before settlement, shown to all players and written to the ledger. (Still receipt-only — it just affects the split, no money is collected by the app.)
- Support a player joining mid-game (buys in at the current time) and variable/deeper buy-ins — the entries model already allows this; make sure the UI does too.

Acceptance: killing wifi mid-game and reconnecting resyncs correctly; a stuck reconciliation can be resolved with a signed-off, logged discrepancy; receipts always sum to zero to the cent.

**Note from this handoff**: "Solo/offline mode works with no connection" doesn't apply — solo mode doesn't exist. Offline/reconnect handling should focus entirely on the online (only) mode.

### Milestone 7 — Onboarding, accessibility, privacy, observability

- First-run onboarding: a few short cards explaining the flow (host or join → play → count → receipt) and the receipt-only, no-money-handled promise.
- Accessibility pass: verify contrast in all three themes (the light "Trust" theme especially), real focus states, ARIA labels on icon-only buttons, keyboard navigation of the core flow, and respect `prefers-reduced-motion`.
- Privacy: a plain-language privacy page (what's stored, that no money is handled), plus data export and account/data deletion for signed-in users (you now store personal data server-side).
- Observability (env-gated, optional): wire error tracking (Sentry) and privacy-friendly analytics (e.g. Plausible) behind env flags so they're off unless configured.

Acceptance: first-time users get an explanation; the core flow is keyboard- and screen-reader-navigable with adequate contrast; users can export and delete their data; a privacy page exists.

**Note from this handoff**: "verify contrast in all three themes" → just the one Trust theme now.

### Global acceptance criteria

- Two real devices join by QR/code and play a full game, each controlling only their own seat, updating live.
- Integrity is enforced by RLS: proven that a non-host can't advance phases, read others' counts pre-settle, or write others' data via direct API calls.
- `/api/vision` requires auth and is rate-limited; a spend cap is documented.
- Receipts sum to zero to the cent, drive running balances across sessions, and offer pay-via deep links without the app moving money.
- Works installed/offline in solo mode and reconnects cleanly online.
- Receipt-only is fully intact everywhere — no card/charge/hold/payment-processing code exists.
- Existing look, themes, EN/RU, phases, scanner, and reconciliation lock all still work.

**Note from this handoff**: "Works installed/offline in solo mode" → solo mode doesn't exist; this criterion needs rewording once M6 is discussed with the user.

### After each milestone
Commit with a clear message, keep the app runnable, and give me: what changed, any new env vars to set, and any Supabase migrations to run. At the end, update the README and tell me the full deploy steps (Supabase project + env vars, the Next.js host, and the Anthropic key + spend cap).

Prioritise correctness of the integrity model (M2–M3) above features. If you must cut scope to keep things working, cut from M7 first, never from M3.
