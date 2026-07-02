# Bryan Mejia — Portfolio

Personal portfolio for Bryan Mejia, Forward Deployed Engineer in New York.
A zero-build static site: plain HTML, CSS, and vanilla JavaScript — no framework,
no bundler, no server. Design direction: **Kinetic Brutalist Editorial** — paper,
ink, and one loud ultramarine; typography is the interface. All dynamic behavior
runs client-side: per-letter variable-font distortion that follows the cursor,
scroll-squeezed display type, text scramble, a scroll-velocity-reactive marquee,
cursor-following project peek cards, magnetic buttons, a difference-blend custom
cursor, accordion rows, count-up stats, and a live NYC clock.

## Structure

```
index.html    — single-page site (hero / about / work / projects / stack / contact)
styles.css    — design system: paper #F2EFE6 + ink #101010 + ultramarine #2A1FEA,
                Archivo variable (wght 100–900 × wdth 62–125) / Instrument Serif / Space Mono
main.js       — all interactions; degrades under prefers-reduced-motion and on touch
assets/       — résumé PDF
netlify.toml  — publish config (no build step)
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

No build step — point any static host at the repo root.

- **Netlify**: “Add new site → Import an existing project” → pick this repo.
  Build command: *(leave empty)* · Publish directory: `.` (`netlify.toml` already sets this).
- **Cloudflare Pages**: “Create a project” → connect this repo → no build command,
  output directory `/`.
- **GitHub Pages**: Settings → Pages → deploy from `main`, root folder.

Every push to `main` redeploys automatically once the git integration is connected.

## Updating content

All content lives in `index.html` — sections are marked with
`<!-- ============ SECTION ============ -->` comments. Replace
`assets/BRYAN_MEJIA_RESUME.pdf` to update the résumé link.
