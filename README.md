# 2048 Triple Tile

A mobile-friendly, GitHub Pages-ready version of the classic 2048 game.

## Features

- PC keyboard controls and mobile swipe controls
- English, Chinese, and Japanese language switching
- Built-in sound effects using Web Audio, so no audio files are required
- Best score saved in the browser
- Small surprise effects: neon board unlock at 512, celebration at 2048, and a rare lucky bonus
- Pure static files: `index.html`, `styles.css`, and `app.js`

## Run Locally

Open `index.html` directly in a browser, or run a tiny local server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## GitHub Pages

This project can be published from the repository root or from a `/docs` folder.

For the simplest setup:

1. Push these files to a GitHub repository.
2. Open the repository settings.
3. Go to **Pages**.
4. Choose the branch to publish, usually `main`.
5. Choose the root folder.
6. Save and wait for GitHub Pages to deploy.

## Files

- `index.html` contains the page structure.
- `styles.css` contains the responsive layout and tile visuals.
- `app.js` contains game logic, controls, sounds, language switching, and easter eggs.
