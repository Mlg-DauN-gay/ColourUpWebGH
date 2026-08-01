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

## Project structure

```
app/
  layout.jsx            fonts, root metadata
  page.jsx               app shell: theme/lang context, header, tab bar, game engine
  api/vision/route.js    server-side Anthropic proxy
  join/[code]/page.jsx   landing page for scanned invite QR codes
components/              Setup, Lobby, Fund, Live, Cashout, Reconcile, Settle,
                         Done, PlayHome, FriendsTab, ProfileTab, ChipScanner, …
lib/
  i18n.js                EN/RU dictionary + money()/locale helpers
  themes.js               Trust / Night / Steel palettes as CSS custom properties
  settle.js               minimal-transfer settlement algorithm
  chips.js                denomination ladder, assignDenoms, computeStacks
  useLocalStorageState.js SSR-safe localStorage-backed state (profile/friends/history)
```

## Notes

- No database — `profile`, `friends`, and `history` persist to `localStorage`.
- The multi-phone QR join is simulated (no realtime backend yet); the lobby's
  QR code is real and scannable and encodes `/join/<code>`.
- Reconciliation is locked: if counted chips don't match issued chips, the
  only way forward is a full recount — no editing a submitted count.
