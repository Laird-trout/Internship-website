# ECE Internship Atlas — Summer 2027

A filterable catalog of Summer 2027 electrical and computer engineering internships, built for a sophomore at Oregon State University. Static site, no build step, runs on GitHub Pages.

**What's in it**

- **Catalog** — 176 employers and federal programs with typical intern roles, disciplines, sites, sophomore-friendliness, citizenship requirements, when postings usually open, and a rough pay tier. Search, filter, and sort. One-click "Near Corvallis" filter for employers with sites in Oregon, Washington, or Idaho.
- **Sophomore programs** — the named early-undergraduate programs (SULI, NASA OSTEM, NIST SURF, NREIP, AFRL Scholars, SMART, Microsoft Explore, Google STEP, NVIDIA Ignite, and more).
- **Timeline** — September 2026 through August 2027, month by month, with the fixed federal deadlines.
- **Playbook** — resume structure, projects that convert, career-fair script, interview checklist, email templates.
- **Resources** — aggregators, OSU channels, federal portals.
- **My tracker** — application tracker stored in your browser, with CSV/JSON export and import.

**What it is not.** Nothing here is a live posting. Every "opens" month, role list, and sophomore rating is a historical pattern as of September 2026. The careers links go to company portals, not individual reqs. Confirm at the source and record what you find in the tracker.

## Put it on GitHub Pages

1. Create a new public repository on GitHub (any name; `ece-internships-2027` works).
2. Upload these files, or from a terminal in this folder:
   ```bash
   git init
   git add .
   git commit -m "ECE Internship Atlas, Summer 2027"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ece-internships-2027.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
4. The site appears at `https://YOUR-USERNAME.github.io/ece-internships-2027/` within a minute or two. Every push to `main` redeploys.

A custom domain works too: add a `CNAME` file containing the domain and point a CNAME record at `YOUR-USERNAME.github.io`.

## Run it locally

Open `index.html` in a browser. There is no build step and no server needed. (Fonts load from Google Fonts; everything else is local.)

## Edit the catalog

All content lives in `data/catalog.js`. Add or fix an employer, then run:

```bash
node scripts/validate.js
```

The GitHub Action in `.github/workflows/validate.yml` runs the same check on every push and pull request. Field definitions are at the top of `data/catalog.js` and in `CONTRIBUTING.md`.

## Files

```
index.html                  page shell, tabs, playbook text
assets/style.css            styles, light and dark themes
assets/app.js               filtering, rendering, tracker
data/catalog.js             the catalog (employers, programs, timeline, resources)
scripts/validate.js         schema check
.github/workflows/          CI for the schema check
.nojekyll                   tells GitHub Pages to serve files as-is
```

## License

MIT. See `LICENSE`.
