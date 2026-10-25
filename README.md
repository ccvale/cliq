# Cliq — making friends has never been easier

Cliq is a swipe app for **platonic** connections. You build a card that shows who you are (no photo contest, just your interests, your day-to-day and a two-color palette), swipe through people nearby, and when you both say yes, you *click* and can start talking.

This is Cliq 2.0: a ground-up redesign of the [2024 senior project](docs/Cliq%20Senior%20Project%20Report.pdf) as a native app for iOS and Android plus a web version, all from one codebase. The original Next.js app is kept in [`legacy/`](legacy) for reference.

<p>
  <img src="docs/redesign/welcome.jpg" width="200" />
  <img src="docs/redesign/discover.jpg" width="200" />
  <img src="docs/redesign/match.jpg" width="200" />
  <img src="docs/redesign/chat.jpg" width="200" />
</p>

## What's inside

```
apps/
  mobile/   Expo (SDK 58) app for iOS, Android and web — Expo Router, Reanimated, Gesture Handler
  server/   Cliq API — Hono on Node, Postgres, WebSockets, our own auth
legacy/     The original Next.js + Xata + Clerk app
docs/       Senior project report, test plan, redesign screenshots
```

### The app

- **Onboarding** in seven short steps that save as you go: name, birthday, gig, interests, palette (with a live card preview), bio, location.
- **Discover**: a physics-based swipe deck with haptics, "Let's hang" / "Not now" stamps, tap buttons for people who'd rather not drag, and the original session stats.
- **It's mutual**: a match moment where both palettes meet, then straight into chat.
- **Friends and chat**: realtime messages over WebSockets, typing indicator, read receipts, grouped bubbles tinted with your palette, unmatch, and report-and-block.
- **Your palette themes everything**, just like the original: buttons, accents, sliders and chat bubbles all follow the two colors you pick.
- **Native touches**: Face ID / fingerprint app lock, Keychain/Keystore token storage, Sign in with Apple, push notifications for matches and messages, on-device reverse geocoding, light and dark mode.
- **Web**: the same screens with a sidebar layout on wide windows; mouse drag and keyboard (Enter to send) work.

### The API (no third-party auth or database service)

| Concern | How it's done |
| --- | --- |
| Passwords | scrypt (N=2^15) with per-user salt, constant-time compare, dummy hash for unknown emails |
| Sessions | 15-minute HS256 access tokens plus single-use 30-day refresh tokens stored as SHA-256 hashes. Reusing a rotated refresh token revokes the whole session family |
| Social sign-in | Apple and Google identity tokens verified against the providers' public keys |
| Abuse | Per-IP rate limiting on auth routes, report-and-block, teens (13–17) and adults never see each other |
| Location | Coarsened to ~1km before storage; others only ever see whole miles. No geocoding API needed |
| Discovery | Bounding box in SQL, exact distance and mutual age/radius preferences in code, ranked by an evolved version of the original scoring algorithm |
| Realtime | WebSocket hub with first-message auth, Expo push fallback when the other person is offline |
| Database | Plain SQL migrations. Runs on any Postgres via `DATABASE_URL`, or embedded PGlite with zero setup |

## Getting started

You need Node 20+.

```bash
# 1. API (terminal 1)
cd apps/server
npm install
npm run seed      # demo account + a dozen people around Mahwah, NJ
npm run dev       # http://localhost:4000

# 2. App (terminal 2)
cd apps/mobile
npm install
npx expo start    # press w for web, or scan the QR code with a development build
```

Sign in with **demo@cliq.app / cliq-demo-2024**. Maya, Jordan, Theo, Riley and Diego have already liked the demo account, so swiping right on them makes a match. Use `SEED_LAT` / `SEED_LNG` to seed around your own location.

On a phone, the app talks to the API on the same machine that runs Metro. Set `EXPO_PUBLIC_API_URL` to point it somewhere else.

### Native builds

Sign in with Apple, Face ID, and push notifications need a development build rather than Expo Go:

```bash
cd apps/mobile
npx eas-cli@latest build --profile development --platform ios
```

Push notifications also need an EAS project id (`npx eas-cli init`). Set `APPLE_AUDIENCES` on the server to your bundle id (`fi.cliq.app`).

### Tests

```bash
cd apps/server && npm test        # auth, token rotation, discovery rules, matching, chat
cd apps/mobile && npx tsc --noEmit
```

## Configuration

See [`apps/server/.env.example`](apps/server/.env.example). In production, `JWT_SECRET` must be a random string of at least 32 characters and `DATABASE_URL` should point at a managed Postgres.

## What's next

- Email verification and password reset (needs an email sender)
- Optional profile photo upload
- Google sign-in button on the client (the server side is ready)
- Deploying the API (any Node host with Postgres) and the web build (`npm run export:web`, then any static host)
