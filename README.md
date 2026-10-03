# Miami Grand Prix — Hospitality Web Experience

Static web project. No build, no backend, no external libraries, no network access required.
Open `index.html` directly in a modern browser, or run `npm start` to serve locally.

## Pages

- `index.html` — Living Venue: independent SVG reconstruction of the Miami International
  Autodrome with a 10-car simulated race, pan/zoom camera, leaderboard, and hospitality details.
- `hospitality.html` — Hospitality map prototype with background-image selector and 7 experiences.
- `previews/candidates/index.html` — Generated background comparison page (not used by the live pages).

## Project structure

```text
.
├── index.html              # Living Venue entry
├── hospitality.html        # Hospitality map entry
├── css/
│   ├── variables.css       # InList design tokens
│   ├── styles.css          # Living Venue styles
│   └── map.css             # Hospitality map styles
├── js/
│   ├── venue.js            # Seeded SVG architecture, paths, symbols
│   ├── race.js             # 10-car simulation (exposes MiamiRace)
│   ├── script.js           # Camera, controls, tooltips, details (exposes MiamiCamera)
│   └── map.js              # Hospitality map interactions
├── assets/
│   ├── fonts/              # Self-hosted woff2 (League Gothic, Akzidenz-Grotesk Pro)
│   ├── brand/inlist.svg    # InList logo
│   └── images/
│       ├── campus-map.png        # Active hospitality map background
│       └── campus-map-source.png # Original source campus image
├── docs/
│   ├── hospitality-decks/  # Source F1 hospitality decks (md + pdf)
│   ├── titles.md           # Experience titles
│   └── map-background-prompts.md
├── previews/               # Screenshots + generated background candidates
│   └── candidates/
├── tests/smoke.cjs         # Playwright smoke checks
├── package.json
└── .gitignore
```

## Run

```bash
# option 1: open directly
open index.html

# option 2: serve locally
npm start

# smoke tests (requires playwright: npx playwright install chromium)
npm test
```

## Notes

- Geometry is an illustrative reconstruction, not a surveyed wayfinding map.
- Race positions, car identifiers, speeds, and timing are simulated, not live F1 data.
- **Book Now** opens a `mailto:` inquiry — it does not purchase tickets or confirm a reservation.
- Confirm hospitality information and locations against current event materials before publication.
