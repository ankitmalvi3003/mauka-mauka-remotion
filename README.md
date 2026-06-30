# Mauka Mauka Decoded — Remotion Composition

ViewBrain case study video comparing the 2015 Mauka Mauka ad vs the 2024 revival using brain analysis data.

## Quick Start (Mac)

```bash
# 1. Install dependencies
npm install

# 2. Start live preview (opens browser at localhost:3000)
npm start
```

You'll see the video playing in real time. Scrub the timeline, play/pause, inspect any frame.

## Project Structure

```
src/
├── Composition.tsx    # All 6 scenes (the main code)
├── Root.tsx           # Composition registration (resolution, fps, duration)
├── index.tsx          # Entry point
public/
├── mauka-mauka-clip-15s.mp4   # The ad footage (plays in Scene 2)
├── thumb-mauka-2015.jpg       # 2015 ad thumbnail
├── thumb-indvpak-2024.jpg     # 2024 ad thumbnail
├── narration-v6-eleven.mp3    # ElevenLabs narration (77s)
├── music.mp3                  # Background music
└── clip-frames/               # Fallback image sequence (only needed on headless servers)
```

## The 6 Scenes

| # | Time | Scene | What it shows |
|---|------|-------|--------------|
| 1 | 0-14s | Hook | Thumbnail + "You remember Mauka Mauka" + gold punchline |
| 2 | 14-28s | Live Brain Analysis | Ad footage playing + 3 brain wave charts animating in real-time + KPI cards + insights |
| 3 | 28-42s | Radar Comparison | Hexagonal radar chart: Mauka Mauka (teal) vs 2024 Ad (crimson), 6 axes |
| 4 | 42-52s | Brain Timeline | Segment-by-segment engagement comparison, color-coded |
| 5 | 52-62s | Verdict | "mechanically perfect" vs "SOUL" in gold |
| 6 | 62-77s | CTA | ViewBrain branding + URL + gold glow border |

## How to iterate

1. Run `npm start` — browser opens with live preview
2. Scrub to the frame you want to change
3. Edit `Composition.tsx` in your editor
4. Browser hot-reloads instantly — see the change
5. When happy, render the final video:

```bash
npm run build
```

This outputs `out/video.mp4` at full 1080x1920 resolution.

## Brain Data (LOCKED — do not change)

```
Mauka Mauka 2015: EP=88, ED=77, Abs=26, Att=43, Mom=44, End=28
2024 Ad:          EP=64, ED=45, Abs=10, Att=38, Mom=76, End=65
Mean Engagement: 55.9%, Emotional Seconds: 22/30, Limbic Activation: 75.7%
```

## Design System

```
Navy:    #0E1122  (background)
Teal:    #60A4A1  (Mauka Mauka)
Crimson: #C71B52  (2024 Ad)
Gold:    #F0B429  (accents)
Text:    #EEF0F4
Muted:   #9AA3B2
Card:    #161A2C
```