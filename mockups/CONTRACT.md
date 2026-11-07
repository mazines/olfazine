# Olfazine mockups: concept contract

Every concept lives in `mockups/NN-name/` with exactly `index.html`, `style.css`, `app.js`.
Copy the structure of `01-journal-spine/` (the reference implementation).

## Load order (index.html)
```html
<link rel="stylesheet" href="../shared/base.css" />
<link rel="stylesheet" href="style.css" />
<div id="olf-root"></div>
<script src="../shared/data.js"></script>
<script src="../shared/core.js"></script>
<script src="app.js"></script>
```
Plain scripts, no modules, no build, no network fonts or CDNs. Pages must work from `file://`.
Use local/system font stacks only.

## What core.js gives you (`window.Olf`)
- `Olf.mount({ brandHTML, renderHistory(model, state), renderTry(model, state), afterRender?, onClick?, singleYear?, singleTry? })`
  renders the demo bar, the History/To try segmented switch, the owner tools, both panels, the toast,
  wires tab switching (scroll is saved per view), mode switching, and disclosure toggles.
- Disclosure buttons MUST use the shared attribute helpers, so the shared click handler and tests work:
  - year: `<button ${Olf.yearAttrs(state, year)}>` → `data-olf-year`
  - fragrance: `<button ${Olf.entryAttrs(state, year, entry.key)}>` → `data-olf-entry="YEAR:KEY"`
  - to-try item/group: `<button ${Olf.tryAttrs(state, item.key)}>` → `data-olf-try`
  - If one item needs two buttons (e.g. a bar and a name), add a 3rd arg suffix and `data-olf-focus="x"`.
    Only ONE element per item should carry the main data attribute if possible; tests use `querySelector`.
- Open state: `state.openYears` (Set of numbers), `state.openEntry` ("YEAR:KEY" or null), `state.openTry` (Set of keys).
  Read these when rendering. Never keep separate open state.
- Model (`buildModel` is called for you):
  - `model.years[]` newest first: `{ year, entries[], count, redactedCount }`; `model.gaps` = empty years (show as gaps only, never as entries).
  - entry (public): `{ redacted:false, key, year, private, fragrance, periods[], periodsInYear[], allYears[], memory, sourceNote }`
    - `periods[i]`: `{ text, longText, precision: month|year|approx|open|ongoing, years[], inYear: {from,to,openEnd,ongoing,continuesBefore,continuesAfter}|null }`
    - `inYear === null` means year precision. Do NOT draw it as Jan–Dec. Show it as visibly uncertain.
  - entry (redacted): `{ redacted:true, key, year }` → show `Olf.REDACTED_LABEL` + `Olf.REDACTED_HINT` and a generic placeholder
    (`Olf.bottleSVG({shape:"redacted"})`). No disclosure button, nothing else.
  - `model.tryList[]`: `{ kind:"group", title, members[fragrance], private }`, `{ kind:"single", fragrance, private }`,
    or `{ redacted:true, kind }` (the whole group redacted: no title, no member previews).
  - fragrance: `{ displayName, byline (brand|null), variant, variantConfirmed, notes[], notesStatus, unresolved, synthetic, bottle, bottleLabel, links[], price? }`
- Fragments (use them or write your own markup with the same wording/rules):
  `Olf.notesHTML(f, {limit, iconSize, noCaveat})`, `Olf.notePreview(f, n)`, `Olf.linksHTML(f)`, `Olf.priceHTML(f)`,
  `Olf.badgesHTML(entryOrItem)`, `Olf.editButton(label)`, `Olf.bottleSVG(spec, {width, label, className})`,
  `Olf.noteIcon(note, size)`, `Olf.family(note)`, `Olf.esc(str)`, `Olf.slug(str)`.

## Content rules (non-negotiable)
- Hierarchy: year → fragrance → detail. Latest year open by default (core seeds this).
- Collapsed fragrance: name, brand if known, wearing period(s) in that year, restrained notes preview (bottle thumbnail optional).
- Expanded fragrance: bottle (`f.bottleLabel` as label), ALL periods (`longText`), memory (or "No memory recorded."),
  `sourceNote` only when present (owner only), notes via `Olf.notesHTML` (keeps the "unverified" caveat), links via `Olf.linksHTML`.
  Owner mode (`state.mode === "owner"`): show `Olf.badgesHTML(entry)` and an `Olf.editButton(...)`.
- Every note icon has a visible text label. No color-only meaning.
- To try: the "Wear together" group shows its title, BOTH bottles, and separate details + Shop link for each member.
  Never invent a ratio, spray order, bundle, or recommendation. Angels' Share is its own entry.
  Show price via `Olf.priceHTML` (most say "Price not sourced yet." — that is correct).
- Tous le Jours: no image (`shape:"none"` placeholder renders "no image"), no notes, no links. Already handled by fragments.
- Links and edit buttons are NEVER inside a disclosure button. Single click/tap/keyboard expands. No double-click, no hover-only content.
- Do not render gap years as entries. You may mention or draw gaps.

## Quality bar
- Semantic buttons with aria-expanded/aria-controls (helpers do this). Put the controlled element's `id` on the revealed region
  (`y-YEAR`, `e-${Olf.slug("YEAR:KEY")}`, `t-${Olf.slug(KEY)}`).
- Visible focus, contrast ≥ 4.5:1 for text, touch targets ≥ 40px, `prefers-reduced-motion` respected (base.css does the global part).
- No horizontal overflow at 390px wide. Desktop judged at 1440×1000, mobile at 390×844.
- Style the shared chrome to fit your concept: `.olf-header`, `.olf-brand`, `.olf-wordmark`, `.olf-switch [role=tab]`
  (keep it a compact segmented pill), `.olf-owner-tools`, `.olf-main`. Override the `--olf-*` custom properties in `:root`.
- Distinct from every other concept in layout, density, typography, imagery, and disclosure behaviour. Not a re-skin.

## Verify
`node tools/dom-check.mjs NN-name` must pass all checks.
