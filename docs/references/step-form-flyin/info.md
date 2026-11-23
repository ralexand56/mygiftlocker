# step-form-flyin — "coffee flavours" animated landing page

- **Pin:** https://www.pinterest.com/pin/437130707597630990/
- **og:title:** Animated Coffee Shop UI UX Website Landing Page Animation Design [Video] | Cafe website design modern, Modern coffee landing page, Animated coffee website
- **og:description:** Have an awesome project? Let's chat👋 in**@***** | #appdesign #ui #uidesign … (hashtag list, truncated)
- **og:image:** https://i.pinimg.com/736x/6c/66/ad/6c66adfb8a067c12456b14c121c15a82.jpg (original: https://i.pinimg.com/originals/6c/66/ad/6c66adfb8a067c12456b14c121c15a82.jpg → `image.jpg`, 720x720)
- **Video:**
  - MP4 (only 240x240 despite the "720p" path): https://v1.pinimg.com/videos/mc/720p/fe/cf/6b/fecf6b3f6927341bca8727dbdd515939.mp4
  - HLS master: https://v1.pinimg.com/videos/mc/hls/fe/cf/6b/fecf6b3f6927341bca8727dbdd515939.m3u8 (480w variant `…_480w.m3u8`)
  - `video.mp4` here = the 480x480 HLS variant remuxed, audio dropped (10.5 s, 30 fps)
- **Outbound source link:** none on the pin page.
- **Files:** `page.png`, `image.jpg`, `video.mp4`, `frames/000–041.png` (0–10.25 s @ 250 ms), `contact-sheet.png`

## What it shows
A single-screen desktop landing page for a café ("coffee flavours") presented as a floating card on a soft grey gradient. It steps through 5 drinks — Latte → Macchiato → Black Coffee → Espresso → Mocha → Latte — exactly like steps of a wizard. Each step swaps a top-down product photo (left) and the copy (right).

### Layout
- Card split ~50/50 (photo panel slightly narrower, ~47 %).
- **Left:** full-bleed overhead photo — cup centred, spoon, scattered beans, a dried flower/leaf top-right. Logo "coffee flavours" top-left, tiny vertical credit text bottom-left.
- **Divider column:** a vertical stack of 5 small round thumbnails (one per drink colour: milky, tan, black, brown, dark brown) sitting on the seam — this is the **step indicator**; the active one is outlined.
- **Right:** warm off-white panel (#e6dfd8 / ~#ece7e1), small step counter "01 / 05" in a split-fraction style, serif display heading ("Latte", "Macchiato" — high-contrast serif like Playfair Display, ~#3a2f28), 3-line grey body copy, small tan/camel button "ORDER NOW" (#bfa17a-ish, tiny uppercase letter-spaced label). Social icons top-right, up/down arrows bottom-right (step nav).
- Each drink has its own background tint for the photo: Latte light grey-beige (#c9c2bb), Macchiato warm sand (#d9c3a5), Black Coffee cool sage-grey (#9fa6a2), Espresso warm tan (#c8a88c), Mocha cocoa (#9a7566).

### Motion, frame by frame (one step transition ≈ 1.0 s; steps every ≈ 2.1 s)
Example Latte → Macchiato (frames 005–012):
- **t 1.25 s (start):** right-panel copy begins to leave: old heading "Latte" moves **up** and fades/blurs out; simultaneously new heading "Macchiato" fades/blurs in from **below** (both visible, ghosted, at 1.5 s — a vertical cross-fade with ~20 px travel). Body copy and button do the same, a beat later (stagger ≈ 80–120 ms per line: counter → heading → body → button).
- **t 1.50 s:** photo panel starts to change: the **new photo slides in vertically** (new image pushes in from the top while the old is pushed down/out — at 1.5–2.0 s you see the new cup entering from the top edge and the old cup still at the bottom), i.e. a **vertical slide/parallax swap** of the image, not a fade. Props (flower, beans) ride with their photo.
- **t 2.0 s:** new photo ~75 % in, new text fully settled at its final place but the heading still sliding the last few px.
- **t 2.25–2.5 s:** photo locks into place with a soft ease-out; beans/flower land last (subtle parallax — foreground props lag the background by ~100 ms).
- The step thumbnails on the seam shift the active ring to the next item simultaneously with the text change.
- Easing throughout: smooth ease-in-out on the leaving element, ease-out on the arriving element; no bounce; whole step ~700–1000 ms.
- Same pattern repeats: 3.5 s → Black Coffee (photo enters from the bottom this time, i.e. direction alternates with nav direction), 5.25 s → Espresso, 7.0 s → Mocha, 9.25 s → back to Latte.

### Takeaways for the app's multi-step form
- Treat each step as a slide: the **item image slides in from one side while the previous one slides out the other side** (direction = forward/back). In our app use **left/right** horizontally as requested; the reference uses vertical, but the mechanics are the same.
- Stagger the content: image first, then counter → heading → body → CTA at ~100 ms intervals, each with a short (16–24 px) translate + opacity (+ slight blur) — ≈ 400–600 ms each.
- If a step shows several items, stagger their fly-ins (~60–100 ms apart) with ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- A dotted/thumbnail progress indicator that updates in sync with the transition.
- Warm, muted palette; serif display heading + small sans body.
