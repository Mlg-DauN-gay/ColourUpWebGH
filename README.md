# Colour Up

Mobile-first web app for running and settling home poker cash games. Its only
financial output is a **settlement receipt** — the fewest transfers needed to
square everyone up. It never charges cards, holds funds, or moves money.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Chip-photo recognition (optional)

Two features — chip-set scanning in setup and photo stack counting at
cashout — send a photo to `/api/vision`, a server route that proxies to the
Anthropic API. To enable them, copy `.env.example` to `.env.local` and set:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, both features fall back gracefully to manual entry — the
`ANTHROPIC_API_KEY` is only ever read server-side and never reaches the
browser.

### Accounts (Supabase)

Browsing the app — home, setting up a table's stake and chips — needs no
account. Signing in is only required at the moment a lobby actually opens
(the point where other people are about to see and join the table), via a
screen reached from the profile icon in the header. Once signed in,
`profile`, `friends`, and `history` all live in
[Supabase](https://supabase.com) (Postgres + Auth), keyed to the signed-in
user, so they follow you to any device you log into.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, run the SQL in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (SQL Editor → New query → paste → Run). This creates `profiles`, `friends`,
   and `history`, all with row-level security scoped to `auth.uid()` — a user
   can only ever read or write their own rows.
3. **Authentication → URL Configuration** — set Site URL to your app's origin
   (`http://localhost:3000` in dev) and add `<origin>/auth/callback` to
   Redirect URLs (needed for password-reset links to work).
4. Copy `.env.example` to `.env.local` and set:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

The anon key is safe to expose client-side — access is enforced entirely by
the RLS policies in the migration, not by keeping that key secret.

Login is email + password (`supabase.auth.signUp` / `signInWithPassword`),
with a "forgot password" flow via `resetPasswordForEmail`. By default,
Supabase requires confirming a signup by email before it grants a session —
for local development, **Authentication → Sign In / Up → Email → "Confirm
email"** can be turned off so signup is instant with no email round-trip.
Turn it back on (or configure custom SMTP under **Authentication →
Settings**, since Supabase's built-in email sender is rate-limited) before
real users show up — the built-in sender is fine for occasional password
resets but not for production signup volume.

## Project structure

```
app/
  layout.jsx            fonts, root metadata
  page.jsx               app shell: theme/lang context, header, game engine, auth checkpoint at lobby-open
  api/vision/route.js    server-side Anthropic proxy
  join/[code]/page.jsx   landing page for scanned invite QR codes
  auth/callback/route.js exchanges a Supabase email-confirm/reset code for a session
  auth/reset/page.jsx    "set a new password" form, landed on after a reset-link click
components/              Setup, Lobby, Fund, Live, Cashout, Reconcile, Settle,
                         Done, PlayHome, ProfileTab (profile + friends + account), AuthGate, ChipScanner, …
lib/
  i18n.js                EN/RU dictionary + money()/locale helpers
  themes.js               the single Trust palette as CSS custom properties
  settle.js               minimal-transfer settlement algorithm
  chips.js                denomination ladder, assignDenoms, computeStacks
  useAppData.js           auth session + profile/friends/history, all Supabase-backed
  supabase/                browser/server Supabase clients + session-refresh helper
supabase/
  migrations/0001_init.sql profiles / friends / history tables + RLS policies
proxy.js                  refreshes the Supabase session cookie on every request
                          (named `proxy.js`, not `middleware.js` — renamed in Next 16)
```

## Notes

- No bottom tab bar: the game flow is the whole screen, and the profile icon
  (top right of the header — an avatar once signed in, a plain outline while
  signed out) opens the merged profile/friends/account screen, with a back
  arrow to return.
- Signing in isn't required to browse or set up a table — only to open a
  lobby (`components/Setup.jsx`'s "Open lobby" routes through `openLobby()`
  in `app/page.jsx`, which sends a signed-out visitor to the profile screen
  instead of opening it). Finishing sign-up/log-in and profile creation
  there automatically finishes opening the lobby (`pendingLobby` state in
  `app/page.jsx`) — no need to go back and click "Open lobby" again.
- One fixed palette (`lib/themes.js`) — no theme switcher.
- The multi-phone QR join is still simulated (no realtime game backend yet);
  the lobby's QR code is real and scannable and encodes `/join/<code>`.
- Reconciliation is locked: if counted chips don't match issued chips, the
  only way forward is a full recount — no editing a submitted count.
