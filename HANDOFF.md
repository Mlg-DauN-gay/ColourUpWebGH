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

- **Repo**: https://github.com/Mlg-DauN-gay/ColourUpWebGH — **working copy is
  `~/ColourUpWebGH`, on `main`** (both M2 PRs are merged; the old
  `claude/launch-app-yb9vqz` branch has served its purpose and can be
  deleted). A second, older, orphaned clone still exists at
  `~/Desktop/ColourUp website` (stale, missing everything past M1) — that
  directory caused real confusion in one earlier session. **Don't use the
  Desktop copy** — either delete it or treat `~/ColourUpWebGH` as the only
  real one.
- **Stack**: Next.js 16 (App Router, JS/JSX — not TypeScript), Tailwind CSS, lucide-react, Supabase (Postgres + Auth)
- **Deployed**: https://colour-up-web-gh.vercel.app (Vercel, Hobby/free tier,
  auto-deploys from `main`). See "Deployment" section below for what's
  configured and what's still manual.

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

### Bugs found + fixed getting this slice working against the real project

Two different sessions independently hit and fixed overlapping problems
here — recorded together since the full picture only makes sense combined:

1. **`game_players`'s roster SELECT policy caused infinite recursion**
   (Postgres `42P17`, surfaced by PostgREST as a bare `500`). It checked
   "are you already seated here" by querying `game_players` from within
   `game_players`'s own policy — Postgres refuses that outright regardless
   of whether it would actually terminate. Two equivalent fixes exist in
   history for this: an in-place edit to `0002_multiplayer.sql` (commit
   `3698870`, helper function `public.is_game_member()`) and a separate
   migration, `supabase/migrations/0004_fix_game_players_recursion.sql`
   (helper function `public.is_seated_in_game()`). Both route the
   self-check through a `SECURITY DEFINER` function instead of a direct
   correlated subquery on the same table — **that's the pattern to reuse
   for any future policy needing "does the caller already have a row in
   this same table" logic.** Only one needs to actually be live in the
   database at a time; whichever was run last in the SQL editor wins, and
   this was re-verified working after `0004` was applied.
2. **Separately, `game_players`'s INSERT policy never actually took effect
   live** — a real host could write their own seat, but the identical
   insert as an anonymous guest (the actual join-a-table path) came back
   `42501 new row violates row-level security policy`. Schema/indexes/
   function/realtime from 0002 were all fine (those statements are
   idempotent); only the non-idempotent `create policy` statements were
   affected, most likely a partial/aborted SQL-editor run. Fixed by
   `supabase/migrations/0003_reapply_m2_policies.sql`, which re-applies
   every policy from 0002 with `drop policy if exists` guards — safe to
   re-run any time this class of bug is suspected again.

**Confirmed working end-to-end**, verified two different ways: (a) a real
user walking through sign-up → profile → Open lobby → real `games`/
`game_players` rows → Lobby screen loading correctly; (b) directly against
the live Supabase REST API with a fresh anonymous-sign-in token per
simulated guest (look up game by code → insert a seat → read the roster
back), then confirmed those inserted seats appeared live in a real
browser's lobby via Realtime with no refresh. Note for future sessions:
**a single browser's tabs all share one cookie jar/session**, so they
can't simulate two independent guests — either use two real
browsers/devices, or fake independent guests via curl + a fresh
`POST {SUPABASE_URL}/auth/v1/signup` with an empty body per guest (gets
back a real anonymous JWT you can use directly against `/rest/v1/...`).

One unrelated real gotcha hit along the way: **don't paste long secrets
(JWTs, API keys) through a chat UI into a terminal and trust it landed
intact** — one user's system silently mangled part of a pasted anon key
(likely a password manager's clipboard/secret redaction swapping
characters mid-token), producing a confusing browser error (`Failed to
execute 'fetch': ... non ISO-8859-1 code point`) that had nothing to do
with the app code. Diagnosed via
`python3 -c "open('.env.local','rb').read().decode('ascii')"` (throws with
the exact byte position if there's a hidden non-ASCII character) — worth
doing that check early if a fresh session hits a similarly weird
fetch/header error right after credentials are pasted in.

Also fixed in passing (unrelated to the RLS bugs, found while
investigating): `setProfile` in `lib/useAppData.js` silently swallowed
Supabase errors — if a profile save failed for any reason, the user was
bounced back to the profile display with zero feedback, looking exactly
like an unexplained "stuck" bug. It now returns `{ error }`, and
`ProfileTab.jsx` shows it.

### Not yet confirmed — pick this up next

A two-browser test (host + guest joining via the real link) hit an issue
on the **Fund/buy-in screen** — described only as "it bugs out," not yet
diagnosed, and not re-attempted since (the RLS work above was the
blocker being chased at the time). What's known: it happened after the
host had successfully advanced the phase and both the host's own seat
("a") and a guest seat ("B") were visible on the buy-in screen, each
correctly showing "UNPAID." Whatever went wrong after that (screenshots
suggested it may have dropped back to the Home screen unexpectedly) was
never pinned down — no browser-console screenshot exists at the actual
moment of failure. **First thing to do next session**: reproduce it with
DevTools Console open on both windows and grab a screenshot right at the
failure, since without that this is just a guess. Plausible starting
hypotheses given the architecture (not verified): something in
`handleLobbyBecameFund()` firing twice (once from the host's explicit
`onStart` call, once from the guest's Realtime-watching effect) racing
with a subsequent state update; or the guest's Fund-phase
anonymous-upgrade gate interacting oddly with a stale `session`
reference. Don't assume either without the console output.

### Root cause found + fixed: Fund phase now syncs for real

The "bugs out" report above was diagnosed, not by reading code, but by
literally simulating two independent devices: one real browser as the
host, and a second identity driven straight against the Supabase REST API
with its own fresh anonymous-sign-in token (a single browser's tabs all
share one cookie jar, so they can't stand in for two real devices — see
the note on this earlier in this file, under the M2-slice-1 RLS section).

The actual bug: Fund ran entirely on each device's own local `players`
`useState`, seeded once at the lobby hand-off and never touched again. A
buy-in recorded on one phone was invisible to every other phone —
`allFunded` could never become true on a device that didn't personally
witness every buy-in, so the game could get stuck forever on "waiting for
a buy-in" that had, in fact, already happened elsewhere. The host's "Deal"
button made it worse: it only ever called local `setGp("live")`, with no
gating (not even host-only) and no broadcast, so it could never actually
move every device into Live together even once funding looked complete.

**Fixed** (`supabase/migrations/0005_sync_fund_phase.sql`,
`lib/useGameData.js`, `app/page.jsx`, `components/Fund.jsx`):
- `entries` (already existed with correct RLS from 0002, just wasn't in
  the realtime publication) now syncs live the same way `game_players`
  does — `useGameData` fetches it, subscribes to `INSERT`s, and exposes
  `recordEntry()`/`allFunded` computed from the real rows.
- `app/page.jsx` keeps local `players[].entries` in sync with
  `gameData.entries` via an effect scoped to the fund/live phases only —
  deliberately not touching `chips`/`submitted`/`approved`/`out`, which
  are still local-only past this point (see the task below).
- `advance_phase()` now supports `fund -> live` (previously only
  `lobby -> fund`), gated on every seated player having at least one
  `entries` row — same "friendly error in front of the real RLS
  boundary" shape as the existing transition.
- The "Deal" button is now host-only (calls `advancePhase("live")`
  through the RPC); guests see a "waiting for the host" message and pick
  up the transition automatically via a Realtime-watching effect, the
  same pattern already proven for lobby -> fund.

**Verified live**, not just by reading the diff: hosted a real table in a
real browser, joined + agreed + bought in as a guest purely via curl with
a fresh anonymous token, and watched the guest's buy-in and the
fund -> live transition both appear on the host's screen with zero page
reload. Then confirmed directly against the database (as the guest's own
session) that `games.phase` had actually flipped to `'live'` — proving a
real guest device would auto-follow via the same effect, not just the
host's own screen updating.

**Deliberately not touched this pass**: Cashout, Reconcile, Settle, and
Done are still 100% local-only, same architecture gap Fund just had. That
needs `player_counts`/`transfers` tables plus the count-privacy RLS and
host-only recount-lock RPC from the original Milestone 3 spec (below) —
called out there as security-critical, so it deserves its own careful
pass rather than a rushed copy of this fix's pattern.

### A full functional audit surfaced four more real issues, now fixed

Requested explicitly ("check the whole app, think what is missing") and
run as a background agent against this codebase + HANDOFF for context.
Full report isn't reproduced here; these four were acted on immediately,
the rest triaged into "What's next" below:

1. **`games` table let any signed-in session — including a free,
   self-created anonymous one — list every open table in the whole
   project**, not just the one they had a code for (`using (true)` on the
   SELECT policy can't distinguish "I know this row's code" from "give me
   every row"). Fixed in
   `supabase/migrations/0006_fix_games_enumeration.sql`: the policy now
   only covers the host and already-seated players; the one remaining
   legitimate case (a guest looking a game up by code before they have a
   seat) goes through a new `lookup_game_by_code()` SECURITY DEFINER
   function instead — still requires the exact 6-character code, no
   listing. `JoinClient.jsx` and `useGameData.js`'s `joinGame()` both
   updated to call it instead of a raw table select. **Follow-up**: the
   new policy's raw subquery into `game_players` immediately hit the same
   cross-table version of the recursion bug from the M2-slice-1 section
   above (`games`' policy queries `game_players`, whose policy queries
   `games` right back) — fixed in
   `0007_fix_games_policy_recursion.sql` by routing it through the
   existing `is_seated_in_game()` helper instead. Verified after the fix:
   a fresh anonymous session with no seat gets an empty list (not an
   error) from a raw `games` select, can still look up a known game by
   its exact code via the RPC, and a real host can still see every game
   they've hosted.
2. **`/api/vision` had zero auth, rate limiting, or payload validation**,
   and is reachable while fully signed out (Setup, where the scanner
   lives, is deliberately browsable with no account — see M1 notes above
   — so requiring a session here would have silently broken that).
   Instead added: per-IP rate limiting (in-memory token bucket, 8
   req/min — swap for Upstash Redis per the original spec if this ever
   scales past one instance), a payload size cap, and a media-type
   allowlist. **Still needs a manual step**: set a hard monthly spend cap
   on the Anthropic API key in the Anthropic console — that's an
   account-level setting no amount of code can enforce.
3. **`setFriends`/`setHistory` silently swallowed Supabase errors** —
   same bug class as `setProfile` (fixed earlier this file), just not
   caught by that fix. A failed friend-add or history-save showed a false
   "saved!" and, worse, could duplicate on retry since the failed item
   was never marked "known" and got re-inserted next call. Both now
   return `{ error }`; `FriendsTab.jsx` shows it and no longer marks a
   failed add as added, and `release()` in `app/page.jsx` logs a distinct
   "couldn't save to history" line instead of a blanket "saved" when the
   Supabase write fails (the receipt itself is unaffected either way).
4. **A host who refreshed (or whose tab reloaded in the background, an
   ordinary mobile event) lost all memory of the table they'd just
   opened** — `finishOpenLobby()` never put the game id anywhere
   persistent (guests get it for free via `/join/[code]`'s redirect, but
   nothing did the equivalent for the host). Fixed by having
   `finishOpenLobby()` call `router.replace('/?game='+id)` right after
   creating the game, same as the guest path — the existing
   `urlGameId`-pickup effect in `app/page.jsx` already handled the rest
   generically. Verified live: hosted a table, hard-refreshed, landed
   back in the same lobby instead of Home.

## Milestone 2 slice 2 + Milestone 3 — Cashout through Done, with real count privacy (done this session)

The other big local-only gap flagged after the Fund fix — Cashout,
Reconcile, Settle, and Done ran on 100% per-device React state, same
deadlock shape Fund had (a submitted count, a sign-off, or a finished game
on one phone was invisible to every other phone). This closes it, plus
builds the integrity model the original spec's Milestone 3 calls
security-critical: a player's chip count is readable by them always, but
by no one else until every seat has locked a count and the game reaches
settle/done.

**Schema** (`supabase/migrations/0008_sync_cashout_through_done.sql`):
- `game_players` gains `out`/`submitted`/`approved` (the original spec's
  schema always listed these; only `agreed` had actually been built).
  Plain self-reported booleans, publicly visible — not the sensitive part.
- New `player_counts` table (`game_id`, `game_player_id`, `chips`) is the
  sensitive part: SELECT policy is "your own row always; anyone else's
  only once `games.phase` is `settle`/`done`"; INSERT-only, no UPDATE
  policy at all — that's what makes "no one, including the host, can edit
  a single player's number to force a balance" a real DB guarantee, not
  just a UI convention. A recount deletes and re-inserts, it never edits.
- `reconcile_totals(game_id)`: SECURITY DEFINER RPC returning only
  `{counted, issued}` aggregates — lets any participant check balance
  during cashout/reconcile without ever exposing a per-player figure.
- `recount_lock(game_id)`: host-only SECURITY DEFINER RPC, all-or-nothing
  — resets every `submitted` flag, deletes every count, drops the game
  back to `cashout`. Only callable from `reconcile`.
- `advance_phase()` extended with `live→cashout`, `cashout→reconcile`
  (gated on everyone submitted), `reconcile→settle` (gated on the
  aggregate actually balancing), `settle→done` (gated on everyone
  approved) — same host-only, friendly-error-in-front-of-RLS shape as
  `fund→live` already had.

**Client** (`lib/useGameData.js`, `app/page.jsx`, and
`components/{Live,Cashout,Reconcile,Settle}.jsx`): same sync pattern Fund
established — local `players[]` stays mirrored from the real tables via
an effect, each phase transition is a host-only action with a
Realtime-driven pickup effect for everyone else. `Reconcile.jsx` needed
an actual behavior change, not just rewiring: it used to list every
player's raw chip count, which would now leak exactly what the RLS above
exists to hide — it shows the aggregate (from `reconcile_totals()`) and a
"counted" tag for other seats, revealing figures only once the game
actually reaches `settle`. History-saving moved out of the host-only
`release()` into a per-device effect keyed on `gp === "done"`, since
every player needs their own net saved to their own history, not just
whichever device happened to click finalize.

**A real regression, found and fixed while verifying this**
(`0009_fix_join_regression.sql`): tightening `games`' SELECT policy for
the enumeration-leak fix (see above) broke `game_players`' own INSERT
policy — its own internal check queries `games` via a raw subquery, which
is itself subject to that now-tightened policy, and a first-time joiner
is by definition not yet seated and not host, so the check failed for
every real join. This is exactly the SECURITY DEFINER-bypass pattern used
everywhere else in this file; it was missed for this one call site
because the original enumeration fix was verified read-side only (could
a stranger list games?) and never re-ran the actual join flow afterward.
**Lesson for next time: after any RLS policy change, re-run the full
join-a-table flow end-to-end, not just the specific query the change was
about** — a tightened SELECT policy can silently break an unrelated
INSERT/UPDATE policy that queries the same table internally.

**Verified two ways**, not just by reading the diff:
1. Directly against the live database with two independent real sessions
   (host + a fresh anonymous session) scripted through the full
   lobby→fund→live→cashout→reconcile→settle→done lifecycle via curl,
   confirming at each step: a non-owner's `player_counts` read returns
   empty during cashout/reconcile and both rows once settle starts; a
   genuine mismatch blocks `reconcile→settle`; a non-host's `recount_lock`
   call is rejected; the host's succeeds and correctly resets
   submitted/counts and drops the phase back to `cashout`.
2. The identical flow driven through the real browser UI (host) with a
   curl-simulated guest, confirming the screens themselves respect the
   same privacy boundary — the guest's roster row shows "COUNTED" with no
   number during cashout/reconcile, the real figure only appearing once
   Settle renders — and that the aggregate "counted / issued" bar on
   `PotRail` (also re-sourced from `reconcile_totals()`, since it has the
   same leak risk the Reconcile screen had) updates live and correctly
   through every phase, ending on a correctly-populated final receipt.

**Deliberately not done this pass**: `ledger` (the append-only game-event
log table from 0002) still has zero callers — Lobby/Fund/Live events stay
in each device's local, single-device-visible `log` only. `transfers`
from the original spec's schema was skipped entirely: once `settle`
widens `player_counts` visibility to everyone, every device can
deterministically recompute the same `nets`/`transfers` client-side from
`entries` + `player_counts` (the existing `simplify()` function, unchanged),
so persisting a separate table added no correctness benefit for this pass.

## What's next

The user gave a **7-milestone roadmap** (verbatim, appended below) for
turning this from a single-device simulation into a real multiplayer app.
**Milestone 1 is done but was substantially reworked from that spec**,
and **Milestone 2 and the core of Milestone 3 are now done** — every game
phase (lobby through done) runs on real, Realtime-synced Supabase state
with the count-privacy and recount-lock guarantees Milestone 3 calls
security-critical (see the section above). The whole
lobby→fund→live→cashout→reconcile→settle→done lifecycle has been verified
end-to-end, both via direct database calls with two independent real
sessions and by driving the actual browser UI.

What's genuinely left from the original spec, roughly in priority order:
- **The `ledger` table has zero callers.** Every phase's event log
  (`mkLog`) is still purely local, single-device-visible. Wiring it up is
  low-risk (append-only, RLS already correct from 0002) but real work —
  every `mkLog(...)` call site across `app/page.jsx` would need an
  accompanying `ledger` insert, and the Ledger panel UI would need to read
  from the real table instead of local `log` state.
- **M6 items**: exact-cent money math (settlement currently uses plain
  floats with epsilon thresholds, not integer minor units +
  largest-remainder distribution), reconnect/offline handling for a
  dropped Realtime channel, the reconciliation escape hatch after repeated
  failed recounts, host rake/tip, mid-game buy-ins.
- **M7 items**: onboarding cards, an accessibility pass (most icon-only
  buttons still have no `aria-label`), a privacy page, data export/delete.
- **PWA/installable + offline** — no manifest or service worker exist yet.

Before extending further: confirm scope with the user rather than
assuming, especially anywhere the original spec's assumptions (solo mode,
always-visible nav chrome) might resurface. The user iterates fast and
corrects architecture choices directly — expect to adjust mid-flight
rather than plan everything upfront. Also worth internalizing the lesson
from this session's regression (see above): **after any RLS policy
change, re-verify the full flow it sits inside, not just the specific
scenario the change targeted** — tightening one policy can silently break
a different policy that queries the same table internally.

## Deployment

**Live at https://colour-up-web-gh.vercel.app**, deployed on Vercel's free
Hobby tier, auto-deploying from `main` on every push. Set up and verified
end-to-end (sign-up → confirm-email → login → real multiplayer lobby, all
against the same production Supabase project already used for local dev
— there's only one Supabase project, no separate prod/dev split yet).

What's configured:
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  `ANTHROPIC_API_KEY` deliberately **not** set — the user doesn't have one
  yet, so the chip-photo scanner falls back to manual entry in production
  too, same as it already did locally. Add it later (both in Vercel's
  project settings and locally in `.env.local`) whenever that feature is
  wanted; remember to also set a spend cap in the Anthropic console at
  that point (flagged since Milestone 4, still not done since there's no
  key at all yet).
- Supabase Auth URL configuration: Site URL and a redirect URL entry both
  updated to the production domain (`.../auth/callback`), alongside the
  existing `localhost:3000` entries — local dev still works unchanged.
- **"Confirm email" is now ON** (was deliberately off during earlier local
  testing — see the M1 section above). Verified live: signing up now
  requires clicking a real confirmation link before the account works,
  and Supabase actively rejects non-deliverable addresses (e.g.
  `@example.com`) at signup time. This closes the "anyone can register
  with an email they don't own" gap flagged since Milestone 1.

What's still manual / not done:
- **No custom domain** — user doesn't own one yet, explicitly deferred.
  Still on the free `.vercel.app` subdomain, which is fine for now.
- **No custom SMTP (e.g. Resend)** — also explicitly deferred, same
  reason (no domain to send from yet). Auth emails go through Supabase's
  own built-in sender, which is rate-limited but sufficient for a small
  friends-and-family user base. Revisit if signup volume ever grows or a
  domain gets bought.
- **No error tracking (Sentry) or uptime monitoring** — mentioned as
  optional/nice-to-have, not set up.
- Reconnect/offline handling (a dropped Realtime channel mid-game has no
  resync logic yet) is still the top real-world risk flagged for anyone
  actually relying on this at a live poker night — see the M6 items above.

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
