# Bryan Mejia — Portfolio Website

An interactive single-page portfolio built with vanilla HTML, CSS, and JavaScript — no build step, no dependencies.

**Design language: "Sunset over New York."** The landing hero is a real 1080p aerial video of Manhattan at sunset — deliberately the only rich layer on the page. Everything below it switches to a flat, light cream scheme with zero heavy effects, so nothing outside the hero can lag. A soft pastel NYC skyline silhouette closes the page.

Built for performance: no fixed compositing layers, no backdrop blurs, no per-frame JS painting, no gradient repaints. The only continuous work is the hero video itself (an always-on, muted background loop with no pause control) and the pipeline packets (which stop when the diagram is off-screen).

## Interactive features

- **1080p NYC sunset video hero** (`assets/nyc-sunset-1080.mp4`, 1920×1080, ~1.4 MB), an always-on muted background loop with no pause control that keeps itself playing (retries through autoplay blocks and Low Power Mode, resuming on the visitor's first interaction if needed); JS swaps to the 720p file on small screens or data-saver connections, falls back down the quality chain on load errors, and shows a sunset gradient while the video loads or if it fails entirely
- **Light editorial body** — flat rose-cream, Playfair Display + Manrope, soft cards; visually separated from the cinematic hero; sections organized by title alone (no numbering)
- **Color palette** — Night Bordeaux `#4F000B` (ink), Dark Amaranth `#720026`, Amaranth `#CE4257` (primary accent), Coral Glow `#FF7F51`, Sandy Brown `#FF9B54` (all light surfaces; no white anywhere), over warm rose-cream backgrounds
- **3D skill constellation** — a slowly rotating sphere of all 38 skills (Fibonacci-distributed, color-coded into AI & Agentic Systems / Languages & Frameworks / Cloud & Infrastructure) spanning the full viewport width, with the editorial rail and group legend hugging the left edge; hovering a skill slows the rotation, highlights it, and shows its description in the rail; hovering a legend group dims the others. The rotation loop pauses off-screen and under reduced motion
- **Interactive places map** (About) — a palette-themed world map (`assets/world-map.svg`, built from Natural Earth data) with pulsing points; hovering or focusing a point flips a large card into view over the map with a photo/video carousel (media in `media/web/` and `media/videos/`, full images letterboxed on a night-ink backdrop), location title, event subtitle, and a short story; a Back button (or Esc, or clicking the bare map) flips it back out. Zoom in/out buttons (up to 4x) with drag-to-pan while zoomed; pins keep their size at any zoom level. Points are defined in `MAP_POINTS` in `js/main.js` as percent coordinates; the projection is equirectangular (latitude 85 to -60), so for a place at (lat, lon): `x = (lon + 180) / 360 * 100`, `y = (85 - lat) / 145 * 100`
- **Quick menu** — `Ctrl/⌘+K`: jump to sections, glide down the page (gentle auto-scroll), open links, copy email… try "Hire Bryan"
- **Letter-by-letter hero entrance** for the name
- **Scroll-driven 3D coverflow bands** — "Experience" and "Projects" are sticky full-screen stages: as you scroll, the deck flips through its cards in 3D (front card face-on, the rest receding to the viewport edge), then the page releases into the next section. Giant ghost watermarks and editorial side rails (eyebrow, serif title, italic `01 / 05` counter) frame each stage; arrow buttons and keys scroll you to the matching card. Ghost watermark style is reused behind the About section
- **Contact section** — centered editorial closer ("Let's build something together.") with a mailto CTA, a one-click copy-email button, and LinkedIn / GitHub / email cards; the footer fades to a muted night-bordeaux with outlined name mark and social links
- **NYC clock chip** — live New York time, icon follows the actual hour there (☀️ → 🌇 → 🌙)
- Scrollspy nav that goes from glass-over-video to solid cream, one-click email copy
- Respects `prefers-reduced-motion`

## Running locally

Open `index.html` directly in a browser, or serve it:

```powershell
python -m http.server 8000
# then visit http://localhost:8000
```

## Structure

```
index.html                  # main page
css/style.css               # palette theme, coverflows, constellation, components
js/main.js                  # video quality, coverflows, constellation, quick menu
assets/nyc-sunset-1080.mp4  # hero video, 1920×1080 (~1.4 MB)
assets/nyc-sunset-720.mp4   # 720p fallback for small screens (~0.6 MB)
assets/world-map.svg        # themed world map for the About places map (~120 KB)
```

Hero footage: "Drone Footage of New York City Skyline" by Advancer Drones on Pexels (free for commercial use, no attribution required).

World map: made with Natural Earth (naturalearthdata.com) 1:110m country data, which is in the public domain; projected to equirectangular and colored to this site's palette.

## Deploying

Live at **https://bryanmejiaportfolio.pages.dev** (Cloudflare Pages, project `bryanmejiaportfolio`, direct upload).

To publish an update, stage the site into `dist/` (everything except the full-res originals in `media/images/`) and deploy:

```powershell
# stage
Remove-Item dist -Recurse -Force; New-Item -ItemType Directory dist | Out-Null
Copy-Item index.html dist
"css","js","assets" | ForEach-Object { Copy-Item $_ "dist\$_" -Recurse }
New-Item -ItemType Directory dist\media | Out-Null
Copy-Item media\web dist\media\web -Recurse
Copy-Item media\videos dist\media\videos -Recurse

# deploy
npx wrangler pages deploy dist --project-name bryanmejiaportfolio
```

`media/images/` (original photos) is deliberately excluded; the site only uses the optimized `media/web/` copies. A custom domain can be attached in the Cloudflare dashboard under Workers & Pages → bryanmejiaportfolio → Custom domains. Small screens and data-saver connections automatically get the 0.6 MB 720p hero video instead of the 1.4 MB 1080p one.
