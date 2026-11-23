# Architecture

## Monorepo

pnpm workspaces + Turborepo. Everything that isn't UI lives in `packages/core` so the web
app, the Expo app and the Amplify functions all run the exact same logic:

- **Sizes** — a data catalog (alpha, women's numeric, men's waist/inseam, shoes, rings, kids)
  with US → UK / EU / JP conversion. Values are always **stored in US**; the UI relabels them
  live when someone picks another system, so adding a region never needs a data migration.
- **Steps** — the invite form is data-driven (`stepsFor(ask, fit)`), so web and mobile render
  the same flow and skip irrelevant steps (e.g. dresses for men's sizing).
- **Draw names** — randomized backtracking with a most-constrained-first heuristic.
  Supports symmetric exclusions (couples), "no repeat of last year", and "one big circle".
  Uses `crypto.getRandomValues`. Covered by unit tests, including a uniformity check.

## Web (apps/web)

Next.js 16 App Router, React 19, Tailwind CSS 4, [Motion](https://motion.dev) for animation.

- **Step backdrop** (`FlyingBackdrop`): on every step, the category's illustrations fly in
  from both sides in a zipper stagger, then float. The old set retreats to its side.
- **Step card** (`StepShowcase` + JoinFlow): split card modeled on the reference. The tinted
  "photo" panel pushes in from the travel direction with props lagging for parallax; copy
  leaves upward with a blur while new lines rise in ~90ms apart; a thumbnail rail on the seam
  is the progress indicator.
- **Hero transitions**: shared `layoutId`s (card → split detail view). The details column
  slides in from the right ~250ms after the hero lands.
- Performance: transform/opacity/filter only, `will-change` on flyers, `MotionConfig reducedMotion="user"`.

## Mobile (apps/mobile)

Expo SDK 58 + Expo Router + Reanimated 4 (UI-thread animations).

- iPhone **and iPad** (`supportsTablet`, adaptive grid). If "iPhone Duo" meant something
  else (e.g. dual-screen devices), tell us and we'll adjust.
- Locker → person uses Expo Router's native **zoom transition** (`Link.AppleZoom`, iOS 18+;
  alpha API) for a true system hero animation.
- **Universal links** (`applinks:mygiftlocker.com`) are not enabled yet: that entitlement
  requires code signing even for simulator builds. Add `ios.associatedDomains` back in
  `app.json` once there's an Apple Developer team. Until then, use the `mygiftlocker://` scheme.
- The join flow mirrors the web: same core step config, same backdrop motion and easing.

### A native iOS app?

Recommendation: **ship the Expo app first.** It already compiles to a native binary, uses
native navigation and the iOS 18 zoom transition, and shares `@mgl/core` with the web.
Where we want something Expo can't do well, add it as a Swift module or extension
inside the Expo app (via the Expo Modules API) rather than a parallel app. Good candidates:
an **iMessage app extension** for sending invites, **WidgetKit** birthday countdown widgets,
and **App Intents** ("Hey Siri, what's Maya's shoe size?"). A fully separate SwiftUI app
would duplicate every feature and is only worth it if the RN app hits a real limitation.

## Backend (amplify/)

AWS Amplify Gen 2 keeps web and mobile in sync (same Cognito pool, same AppSync API with
real-time subscriptions).

- **Auth**: Google, Facebook (federated) and passwordless **email one-time codes**.
  Phone/SMS codes can be added with `phone: { otpLogin: true }`.
- **Data**: `Profile`, `Connection`, `Invite`, `Exchange`, `Participant`, `Assignment`.
  Authorization is per-row: profiles are owned by the person (or guardians for kids) and
  shared read-only with `viewers`. Each `Assignment` is only readable by its giver.
- **drawNames mutation**: a Lambda that checks the caller is the organizer, runs the shared
  matcher, and writes the assignments. The organizer never sees the matches.

### Going live with Amplify

1. Create Google and Facebook OAuth apps; set their callback URL to the Cognito domain.
2. Set secrets: `npx ampx sandbox secret set GOOGLE_CLIENT_ID` (also `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`).
3. Run `npx ampx sandbox` from the repo root. This writes `amplify_outputs.json`.
4. Web: set `NEXT_PUBLIC_AMPLIFY_CONFIG` to the contents of `amplify_outputs.json`.
   `lib/auth.ts` switches from demo mode to Cognito automatically.
5. Swap `apps/web/lib/store.ts` / `apps/mobile/src/lib/store.ts` for `generateClient<Schema>()` calls.
   The function signatures were designed to match the models.

Invites in demo mode are self-contained URL tokens, so a link works without a backend.
With Amplify, the link carries the `Invite` id and the server stores the payload.

## Invite channels

Link, SMS (`sms:` deep link), email (`mailto:`), WhatsApp, Messenger, the OS share sheet
(covers iMessage, Slack, etc.), and a QR code for in person. Future ideas: import from
phone contacts (mobile), "invite the whole family" CSV/paste, and an iMessage extension.
