# smooth-animations — Panerai e-commerce product interaction

- **Pin:** https://www.pinterest.com/pin/356839970503233941/
- **og:title:** Explore the world of E-commerce Product Interaction on our website. Discover a seamless service and stunning UI UX desig… [Video] | Electronics ecommerce, The best website, Landing page marketing
- **og:description:** Explore the world of E-commerce Product Interaction on our website. Discover a seamless service and stunning UI UX design that enhances your online shopping experience. #Ecommerce #ProductInteraction #UIUXDesign #uidesign #designer #ux design #interaction #motionui | Ui showcase, Ui design ideas, Ui and ux design
- **og:image:** https://i.pinimg.com/736x/c2/64/14/c26414c35e4e8aaa1db310d09819686e.jpg (original: https://i.pinimg.com/originals/c2/64/14/c26414c35e4e8aaa1db310d09819686e.jpg → `image.jpg`, 720x720)
- **Video:** https://v1.pinimg.com/videos/iht/720p/5a/ea/3a/5aea3a248483981958e58f97149064ed.mp4 → `video.mp4` (720x720, 30 fps, 16.0 s, h264)
  - HLS: https://v1.pinimg.com/videos/iht/hls/5a/ea/3a/5aea3a248483981958e58f97149064ed.m3u8
- **Outbound source link:** none on the pin page.
- **Files:** `page.png`, `image.jpg`, `video.mp4`, `frames/000–047.png` (0–11.75 s @ 250 ms), `contact-sheet.png`

## What it shows
A desktop landing/product-detail page for luxury watches (Panerai-styled) shown as a floating browser mockup on a grey (#6b6870-ish) backdrop. The cursor drives a horizontal product carousel, then opens a product, then plays a fullscreen exploded-view video.

### Layout
- Thin top nav bar (near-black #0b0b0d) with wordmark left, small uppercase links centre, cart/heart/user icons right.
- **Carousel state:** full-bleed black hero; product photo on the left ~45 %, huge heavy uppercase headline ("LUMINOR MARINA CARBOTECH™", "44MM" sub-line) right of centre, then a "play ▸ Made to Rule the Darkness / watch video" pill, small body copy, "DISCOVER LUMINOR →" link. Pagination dots bottom-left, ‹ › arrows bottom-right of the black area.
- The **next product peeks in** as a coloured vertical strip at the right edge (~15 % width) — olive/khaki (#6e7046) for the Submersible, saturated sky-blue (#4796cd) for the Luminor — with the next watch cropped inside it.
- **Product-detail state:** left ~65 % becomes the solid blue panel with the watch centred on it (soft shadow), small zoom/360/rotate icons on the left edge, a "watch video" circular play button right of the watch, a light/dark toggle bottom; right ~35 % is a white (#ffffff) spec column: headline, "Add to wishlist | Share" row, outlined "ADD TO BAG" button, price "£10,800", icon list (technical details, nearest boutique, appointment, sales info, warranty, download instructions).

### Typography
Extended/wide, very heavy grotesk all-caps for product names (Druk-Wide / Monument-Extended feel), tight leading, white on black. Everything else is tiny (8–10 px at this scale) uppercase or sentence-case neutral sans. Strong contrast between giant display type and micro UI copy.

### Motion, frame by frame (t = video time)
- **0.00–0.75 s** — idle on "Submersible Automatic". Cursor clicks the next-arrow / the peeking strip.
- **0.75–1.00 s — carousel slide.** Whole hero (photo + headline) translates **left** as one block while the olive strip expands/sweeps left as a wipe. At 0.75 s headline already clipped ("RSIBLE / ATIC"), at 1.0 s the new black Luminor slide is in. Total ≈ 300–400 ms, strong **ease-out** (fast start, soft landing, no bounce).
- **1.00–1.50 s — staggered settle.** New headline arrives slightly *after* the background: at 1.0 s "LUMINOR MA…" is still sliding in from the right and clipped by the blue strip; by 1.25–1.5 s it rests. New blue peek strip grows in from the right edge (≈ 0 → 15 % width) a beat later. Stagger ≈ 100–150 ms between image → headline → peek strip.
- **1.5–5.5 s** — idle; cursor hovers the peek strip (hover state: a white dot / "+" appears on the strip).
- **5.5–6.0 s — hero (shared-element) expand.** Click on the blue strip: the strip **grows leftwards to fill the hero**, covering the black slide; the strip's watch scales up and travels to centre-left; the old headline is clipped behind the expanding edge ("I MARINA TECH™" visible at 5.5 s). Then the white detail column **slides in from the right** (6.0 s: column ~10 % visible; 6.25 s fully in). Feel: ≈ 500 ms for the expand, ≈ 250 ms column, ease-in-out / ease-out, very smooth, no overshoot.
- **6.0–7.25 s** — detail idle; cursor clicks the circular "watch video" button (it fills white on press, 7.0 s).
- **7.50 s** — reverse wipe: white column slides out right, blue fills, then a **dark navy (#0e2a45 → black) fullscreen panel** wipes in; loading spinner on black (8.0–8.75 s).
- **9.0–11.5 s** — fullscreen exploded-watch video (case parts fly apart in 3D, chrome on black) with a minimal player bar.
- **11.75 s →** close (×) — reverse back to the blue detail view (the remaining 4 s repeat the detail state / loop).

### Takeaways for the app
- Use **one continuous surface that expands** (shared-element / layout animation) when going list → detail, rather than a page cut.
- Peek the *next* item at the edge in its accent colour; clicking it expands it.
- Content inside moves as layered groups with ~100–150 ms stagger; durations 300–500 ms; easing like `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) — no springiness.
- Text is masked/clipped by the moving panel edges, which sells the "wipe".
