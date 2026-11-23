# My Gift Locker: notes for Claude

Monorepo (pnpm + Turborepo): `apps/web` (Next.js 16), `apps/mobile` (Expo SDK 58),
`packages/core` (shared logic), `packages/brand`, `amplify/` (AWS Amplify Gen 2).
Product name is **My Gift Locker** (not "M Gift Locker"). See README.md and docs/.

## Owner's dev machine (verified 2026-11-23)

- MacBook Air (Apple silicon, arm64), macOS, zsh, Homebrew at `/opt/homebrew`
- **Xcode 27.2** (build 27B52), iOS simulator runtime **iOS 26.5**
- **In Xcode 27 the Simulator app is called "Device Hub"** (bundle id `com.apple.dt.Devices`).
  There is no "Simulator" app. To open it: Xcode → Open Developer Tool → Device Hub,
  or `open -b com.apple.dt.Devices`. Never tell the user to `open -a Simulator`.
- Simulators: iPhone 17 Pro (default), iPhone 17 / 17 Pro Max / 17e / Air / 18 Pro, iPad Pro M5, iPad Air M4, iPad mini A17 Pro
- Node 24, pnpm 11, CocoaPods 1.16 (set `LANG=en_US.UTF-8` before pod commands), gh, aws CLI
- Repo clone on the Mac: `~/Projects/mygiftlocker`
- No Apple Developer team or signing certificate yet: builds work on simulators only

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
