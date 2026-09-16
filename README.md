# Portfolio — Elco van Rijswijk

Static portfolio website (no build step) with three parts:

| Page | File | What it does |
| --- | --- | --- |
| Homepage | `index.html` | Introduction text, links to resume, portfolio and travel map |
| Portfolio | `portfolio.html` | Skills and project grid, loaded from `data/projects.json` |
| Travel map | `map.html` | Leaflet world map with clustered pins, photo popups and a lightbox, loaded from `data/places.json` |

## Run locally

The pages load JSON via `fetch`, so open them through a web server rather than `file://`:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publish on GitHub Pages

1. Create a repository (for a root-level site name it `<username>.github.io`).
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

`.nojekyll` is included so folders and files are served as-is.

## Add your resume

Drop your PDF at `assets/resume/resume.pdf` (that exact path is what every page links to).

## Add a project

Append an object to `data/projects.json`:

```json
{
  "title": "My Project",
  "description": "What it does and what you did.",
  "tags": ["Python", "Data"],
  "image": "assets/projects/my-project.jpg",
  "links": [{ "label": "Repo", "url": "https://github.com/..." }]
}
```

`image` may be left as `""` — a gradient placeholder is shown instead. Tags automatically become filter chips.

## Add a place to the map

1. Put the full-size photo in `assets/photos/` and (optionally) a small version in `assets/photos/thumbs/`.
2. Append an object to `data/places.json`:

```json
{
  "name": "Kyoto",
  "country": "Japan",
  "lat": 35.0116,
  "lng": 135.7681,
  "date": "2022",
  "note": "Optional short story about the trip.",
  "photos": [
    {
      "src": "assets/photos/kyoto-1.jpg",
      "thumb": "assets/photos/thumbs/kyoto-1.jpg",
      "caption": "Bamboo forest"
    }
  ]
}
```

Coordinates: right-click a spot on [openstreetmap.org](https://www.openstreetmap.org) → *Show address* to read the lat/lng.

Optional thumbnail generation (keeps the map fast):

```bash
mkdir -p assets/photos/thumbs
mogrify -path assets/photos/thumbs -resize 400x400^ -gravity center -extent 400x400 assets/photos/*.jpg
```

Stats in the sidebar (places / countries / photos) are computed automatically.

## Customising

- Colors, fonts and radii live in the `:root` block of `assets/css/style.css`; the light theme overrides them under `html[data-theme="light"]`.
- Update your name, social links and email in the header/footer of the three HTML files.
- Map tiles come from CARTO (dark/light variants swap with the theme toggle).
