# My Gift Lockers: notes for Claude

Monorepo (pnpm + Turborepo): `apps/web` (Next.js 16), `apps/mobile` (Expo SDK 58),
`packages/core` (shared logic), `packages/brand`, `amplify/` (AWS Amplify Gen 2).
Product name is **My Gift Lockers** (plural, matching mygiftlockers.com; not "My Gift Locker"). See README.md and docs/.

## Owner's dev machine (verified 2026-11-23)

- MacBook Air (Apple silicon, arm64), macOS, zsh, Homebrew at `/opt/homebrew`
- **Xcode 27.2** (build 27B52), iOS simulator runtime **iOS 26.5**
- **In Xcode 27 the Simulator app is called "Device Hub"** (bundle id `com.apple.dt.Devices`).
  There is no "Simulator" app. To open it: Xcode → Open Developer Tool → Device Hub,
  or `open -b com.apple.dt.Devices`. Never tell the user to `open -a Simulator`.
- Simulators: iPhone 17 Pro (default), iPhone 17 / 17 Pro Max / 17e / Air / 18 Pro, iPad Pro M5, iPad Air M4, iPad mini A17 Pro
- Node 24, pnpm 11, CocoaPods 1.16 (set `LANG=en_US.UTF-8` before pod commands), gh, aws CLI
- Repo clone on the Mac: `~/Projects/mygiftlocker`
- Apple Developer Program: **Individual**, Team ID **K8F4DVG4VD** (renews 2027-11-27). Signing for devices/TestFlight
  not set up yet (Xcode needs the owner's Apple ID under Settings → Accounts).

## iOS build

```bash
cd apps/mobile && pnpm ios --device "iPhone 17 Pro"
```

- Pass `--device` with a simulator name, or Expo may pick a connected physical iPhone and fail on signing.
- `ios/` is generated (Continuous Native Generation) and git-ignored. Change native config
  in `app.json`, then `npx expo prebuild --platform ios --clean`.
- Do **not** add `ios.associatedDomains` (universal links) or Sign in with Apple entitlements
  until a signing team exists: either forces code signing even for simulator builds.
- `Link.AppleZoom` children must receive a flat style object (`StyleSheet.flatten`), not an array.
- The native large title doesn't render with the custom font on iOS 26; screens use in-page headings.
- `amplify_outputs.json` in `apps/mobile` works like the web's (git-ignored; `{}` = demo data). Create it with
  `npx ampx generate outputs --app-id dfqe2wyg1hcqx --branch claude/elegant-knuth-eur0b8 --out-dir apps/mobile`.
- Start Metro with `npx expo start` (never `CI=1`: CI mode turns off file watching and the app keeps an old bundle).
- Hermes has Intl.NumberFormat/DateTimeFormat/Collator but **no PluralRules, ListFormat, Locale or DisplayNames**.
  `@mgl/core` has built-in plural rules for our 5 languages; don't add code that needs the missing ones.

## iPhone Duo (foldable) and adaptive layout

- Simulator "iPhone Duo" needs the **iOS 27.1** runtime (installed). It has two displays:
  folded cover screen **466 × 678 pt** with an **84 pt camera/status strip down the right edge** (reported as
  `insets.right`), and the unfolded inner screen **669 × 951 pt**.
- Screenshots need a display: `xcrun simctl io "iPhone Duo" screenshot --display=1 out.png` (1 = cover, 3 = inner).
  There's no CLI to fold/unfold; use Device Hub.
- Layout follows the window, not the model (`src/lib/layout.ts`): usable width = window − side insets;
  **≥ 600 pt → list + detail panes** (unfolded Duo, iPad); height < 760 → compact heroes (folded Duo).
  The root layout pads side insets; **modal screens must apply them themselves** (use `components/Sheet.tsx`).
- Opening `mygiftlocker://…` from simctl shows an "Open in…?" prompt; `com.mygiftlocker.app://<route>` doesn't
  once the app is running.

## Shared packages

- `@mgl/messages`: UI text in all 5 languages, used by the website (next-intl) and the app (`useT` in `src/lib/i18n.ts`).
- `@mgl/data`: Amplify Data calls shared with the app. The website still uses its own `apps/web/lib/*`
  until after the Dec 8 launch; then switch it over.

## Backend

- AWS Amplify Gen 2 in `amplify/`; deployed by Amplify Hosting via `amplify.yml` (backend + site).
- Backend deps live in the root `package.json`; `amplify/` is not a workspace package.
- `apps/web/amplify_outputs.json` decides the mode: real outputs = live backend, `{}` = demo mode
  (local storage). It's git-ignored and auto-created as `{}` by `scripts/ensure-outputs.mjs`.
- Participants never sign in: link-holder operations go through `amplify/functions/exchange-api`,
  which validates the token in the link. Keep all participant-visible data behind that function.
- Typecheck the backend with `pnpm typecheck:backend`.

## Checks before calling work done

```bash
pnpm typecheck && pnpm typecheck:backend && pnpm test && pnpm --filter @mgl/web build
```
