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

### Accounts (optional — Supabase)

By default the app runs in **solo mode**: `profile`, `friends`, and `history`
live only in this browser's `localStorage`, no account or network needed.
Choosing "Sync across devices" on the profile screen switches to **online
mode**, backed by [Supabase](https://supabase.com) (Postgres + Auth):

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, run the SQL in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (SQL Editor → New query → paste → Run). This creates `profiles`, `friends`,
   and `history`, all with row-level security scoped to `auth.uid()`.
3. **Authentication → Sign In / Up → Anonymous Sign-Ins** — enable it (a
   player gets a working identity the instant they pick "sync," no
   email/password prompt).
4. **Authentication → URL Configuration** — set Site URL to your app's origin
   (`http://localhost:3000` in dev) and add `<origin>/auth/callback` to
   Redirect URLs (needed for the "add an email" magic-link flow).
5. Copy `.env.example` to `.env.local` and set:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

The anon key is safe to expose client-side — access is enforced entirely by
the RLS policies in the migration, not by keeping that key secret. Supabase's
built-in email sender is rate-limited (fine for testing, too slow for real
traffic) — configure custom SMTP under **Authentication → Settings** before
relying on magic links in production.

## Project structure

```
app/
  layout.jsx            fonts, root metadata
  page.jsx               app shell: theme/lang context, header, tab bar, game engine
  api/vision/route.js    server-side Anthropic proxy
  join/[code]/page.jsx   landing page for scanned invite QR codes
  auth/callback/route.js exchanges a Supabase magic-link code for a session
components/              Setup, Lobby, Fund, Live, Cashout, Reconcile, Settle,
                         Done, PlayHome, FriendsTab, ProfileTab, ChipScanner, …
lib/
  i18n.js                EN/RU dictionary + money()/locale helpers
  themes.js               Trust / Night / Steel palettes as CSS custom properties
  settle.js               minimal-transfer settlement algorithm
  chips.js                denomination ladder, assignDenoms, computeStacks
  useLocalStorageState.js SSR-safe localStorage-backed state
  useAppData.js           unifies solo (localStorage) and online (Supabase) modes
  supabase/                browser/server Supabase clients + session-refresh helper
supabase/
  migrations/0001_init.sql profiles / friends / history tables + RLS policies
proxy.js                  refreshes the Supabase session cookie on every request
                          (named `proxy.js`, not `middleware.js` — renamed in Next 16)
```

## Notes

- Solo mode needs no database — `profile`, `friends`, and `history` persist to
  `localStorage`. Online mode syncs the same data to Supabase per-account,
  gated by row-level security (see `supabase/migrations/0001_init.sql`).
- The multi-phone QR join is still simulated (no realtime game backend yet);
  the lobby's QR code is real and scannable and encodes `/join/<code>`.
- Reconciliation is locked: if counted chips don't match issued chips, the
  only way forward is a full recount — no editing a submitted count.
