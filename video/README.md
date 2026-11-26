# Promo video

A 45-second promo for My Gift Lockers, built with [Remotion](https://www.remotion.dev) from real
app screens with demo data (no real people), in English and Spanish, each in two shapes:

- `Landscape` / `LandscapeES` 1920×1080: Product Hunt gallery (via YouTube), homepage
- `Vertical` / `VerticalES` 1080×1920: Reels, TikTok, YouTube Shorts

```bash
cd video
pnpm install --ignore-workspace   # kept outside the workspace so Amplify never installs it
pnpm studio                        # preview and tweak in the browser
pnpm render                        # full quality → out/my-gift-lockers[-es]-16x9.mp4 / -9x16.mp4
pnpm render:web                    # 720p copies + posters → apps/web/public/video/ (the site's tour button)
pnpm music                         # rebuild the soundtrack (scripts/music.mjs) → public/music.m4a
```

- **Words** for both languages: `src/copy.ts`. **Scenes and timing**: `src/Promo.tsx`.
- **Screens**: `public/screens/en/` and `public/screens/es/` (desktop 1440×860 @2x, phone 390×844 @3x),
  captured from the demo build. The Spanish screens use Spanish demo data.
- **Gift ideas** on the AI scene were written to match Maya's locker and placed in the real gift
  finder; they're illustrative, not a live AI run. The reminder email is the app's real email.
- **Music** is original, synthesized by `scripts/music.mjs` (no samples, nothing to license). Its
  chimes are timed to the taps in `Promo.tsx`; if scene timing changes, update the times there too.

Remotion is free for individuals and companies of up to 3 people; larger teams need a company
license (remotion.dev/license).
