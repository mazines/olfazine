# Olfazine

A personal fragrance journal: every fragrance I have worn, by year, and the ones I want to try next.

**Live:** https://mazines.github.io/olfazine/

It's a static site with no build step, framework or backend. GitHub Pages serves the files in this repo as they are.

## Pages

| Path | What it shows |
|---|---|
| `/` | The public journal. Fragrances marked private show as REDACTED. |
| `/admin/` | Every fragrance by name, with a Private badge on the hidden ones. It is not linked from the public page and is marked `noindex`. |

> `/admin/` is not access control. All data ships in `mockups/shared/data.js`, so anyone who reads the source can see every entry. Real privacy comes with the Firebase phase ([docs/next-phase-firebase.md](docs/next-phase-firebase.md)).

## Layout

```
index.html, admin/index.html   live pages (load the files below)
img/bottles, img/notes          bottle cutouts and note illustrations (source: Fragella)
mockups/shared/                 data.js, fragella-local.js, core.js (dates, redaction, rendering), base.css
mockups/08a-botanical-horizontal/   the chosen design (desktop: horizontal trunk)
mockups/08-botanical-tree/      vertical tree, also the phone layout of 08a
mockups/                        the 12 explored design concepts, kept as documentation
mockups/index.html              gallery of all concepts; mockups/compare.html has matched screenshots
tools/                          checks, screenshots, Fragella import, bottle cutout
```

## Run locally

Open `index.html` in a browser. No server is needed. To view the concept gallery, open `mockups/index.html`.

## Change the data

- Fragrances, wearing periods and memories live in `mockups/shared/data.js`.
  - Dates use `{ y, m? }`. An end of `null` means unknown.
  - `ongoing: true` must be set explicitly.
  - Year-only periods never show as January–December.
- To hide a fragrance on the public page, add `private: true` to its catalog record. It then shows as REDACTED in every year and view.
- On a To try tile, `wearWith: ["<catalog id>"]` adds a "Wear together with …" note.

## Refresh Fragella data

```
node tools/fragella-fetch.mjs            # dry run: prints every request
node tools/fragella-fetch.mjs --send     # needs FRAGELLA_API_KEY (env or .env.local, git-ignored)
node tools/fragella-fetch.mjs --review   # list candidate matches per fragrance
# choose matches in imports/fragella/selection.json (git-ignored)
node tools/fragella-fetch.mjs --images   # chosen bottles + note images
node tools/cutout <in.webp> <out.png>    # optional: trim a bottle to a tight, consistent frame
node tools/fragella-fetch.mjs --build    # writes mockups/shared/fragella-local.js and copies images to img/
```

## Checks

```
cd tools && npm install && cd ..
node tools/model-check.mjs   # dates, year membership, redaction
node tools/dom-check.mjs     # behaviour of every concept: tabs, expansion, redaction, collapse all
```

`tools/wkshot.swift` and `tools/cutout.swift` are macOS tools. Build them with `swiftc -O tools/<name>.swift -o tools/<name>`.

## Credits

Notes and bottle images: [Fragella](https://api.fragella.com).
