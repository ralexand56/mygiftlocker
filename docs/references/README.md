# Design references (Pinterest pins)

Captured 2026-11-23 with Playwright Chromium + ffmpeg. Reference material only — no app code depends on these files.

| Folder | Pin | What it's for |
|---|---|---|
| [smooth-animations](smooth-animations/info.md) | https://www.pinterest.com/pin/356839970503233941/ | Smooth / hero (shared-element) transitions to use throughout the app |
| [step-form-flyin](step-form-flyin/info.md) | https://www.pinterest.com/pin/437130707597630990/ | Multi-step form: item images slide in from the side, text cross-fades, staggered |
| [pastel-look](pastel-look/info.md) | https://www.pinterest.com/pin/356839970502763030/ | Soft pastel / clay-3D visual style |

Each folder: `page.png` (pin page screenshot, 1280x900), `image.jpg` (original-resolution pin image), `info.md`.
Video pins also have `video.mp4` (source video, audio stripped where applicable), `frames/NNN.png` (one frame every 250 ms, first 12 s) and `contact-sheet.png` (every 2nd frame = every 0.5 s, 6 columns, timestamps in red).

Note: the frames were extracted from the downloaded MP4 with ffmpeg (`fps=4`) instead of element screenshots of the playing `<video>` tag — same timing, better quality.
