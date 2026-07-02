# Bryan Mejia — Portfolio

Personal portfolio for Bryan Mejia, Forward Deployed Engineer in New York.
A zero-build static site: plain HTML, CSS, and vanilla JavaScript — no framework,
no bundler, no server. All dynamic behavior (neural-network hero canvas, typed
role rotation, scroll reveals, count-up stats, cursor-tracked cards) runs
client-side.

## Structure

```
index.html    — single-page site (hero / about / experience / projects / skills / leadership / contact)
styles.css    — design system: deep charcoal + phosphor amber, Space Grotesk / Inter / JetBrains Mono
main.js       — all interactions; respects prefers-reduced-motion
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
