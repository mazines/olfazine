/* 05 Contact sheet: each year is a film-strip label. Opening a year shows a grid of square
 * "frames". Selecting a frame inserts a full-width detail row right after that frame's grid row. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  // Column count must match the grid breakpoints in style.css.
  function cols() {
    const w = window.innerWidth || 1024;
    if (w <= 640) return 2;
    if (w <= 1000) return 3;
    return 4;
  }

  // Split items into grid rows the same way CSS auto-placement does (no dense packing).
  function gridRows(items, n, spanOf) {
    const rows = [];
    let row = [], used = 0;
    items.forEach(function (it) {
      const s = Math.min(spanOf(it), n);
      if (used + s > n) { rows.push(row); row = []; used = 0; }
      row.push(it); used += s;
    });
    if (row.length) rows.push(row);
    return rows;
  }

  // ---------- backdrop tint from bottle glass ----------
  function rgbOf(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) { return a.map(function (v, i) { return Math.round(v * (1 - t) + b[i] * t); }); }
  function css(c) { return "rgb(" + c.join(",") + ")"; }
  function backdrop(spec) {
    if (!spec || !spec.glass) return 'style="--bd-a:#3a3835;--bd-b:#1b1a19"';
    const g = rgbOf(spec.glass);
    const lum = (0.2126 * g[0] + 0.7152 * g[1] + 0.0722 * g[2]) / 255;
    // Dark glass gets a light backdrop, light glass a dark one, so the bottle always reads.
    const centre = lum < 0.45 ? mix(g, [228, 222, 210], 0.62) : mix(g, [26, 24, 22], 0.58);
    return 'style="--bd-a:' + css(centre) + ";--bd-b:" + css(mix(centre, [17, 17, 17], 0.55)) + '"';
  }
  function photo(spec, label, cls) {
    return '<span class="cs-photo' + (cls || "") + '" ' + backdrop(spec) + ">" +
      O.bottleSVG(spec, { width: 120, label: label || null }) + "</span>";
  }
  function fno(n) { return (n < 10 ? "0" : "") + n; }

  function capPeriods(list) {
    return list.map(function (p) {
      return p.inYear === null
        ? '<span class="cs-cper cs-uncertain">' + esc(p.text) + ' <span class="cs-q">month ?</span></span>'
        : '<span class="cs-cper">' + esc(p.text) + "</span>";
    }).join("");
  }

  function redactedTile(n) {
    return '<div class="cs-tile cs-tile-redacted">' +
      '<span class="cs-photo cs-photo-redacted">' + O.bottleSVG({ shape: "redacted" }, { width: 120 }) + "</span>" +
      '<span class="cs-cap"><span class="cs-fno">' + fno(n) + '</span><span class="cs-cname olf-redacted">' + O.REDACTED_LABEL +
      '</span><span class="cs-cper">' + O.REDACTED_HINT + "</span></span></div>";
  }

  // ---------- History ----------
  function tile(e, n, state) {
    if (e.redacted) return redactedTile(n);
    const f = e.fragrance, open = state.openEntry === O.entryId(e.year, e.key);
    return '<button class="cs-tile' + (open ? " is-selected" : "") + '" ' + O.entryAttrs(state, e.year, e.key) + ">" +
      photo(f.bottle) +
      (open ? '<span class="cs-mark" aria-hidden="true">Selected</span>' : "") +
      '<span class="cs-cap"><span class="cs-fno">' + fno(n) + (open ? " ▲" : "") + "</span>" +
        '<span class="cs-cname">' + esc(f.displayName) + "</span>" +
        (state.mode === "owner" && e.private ? '<span class="cs-cbadge">' + O.badgesHTML(e) + "</span>" : "") +
        (f.byline ? '<span class="cs-cby">' + esc(f.byline) + "</span>" : "") +
        capPeriods(e.periodsInYear) +
        (f.notes.length ? '<span class="cs-cnotes">' + esc(O.notePreview(f, 2)) + "</span>" : "") +
      "</span></button>";
  }

  function periodLine(p) {
    return p.inYear === null
      ? '<li class="cs-uncertain">' + esc(p.longText) + ' <span class="cs-q">month not recorded</span></li>'
      : "<li>" + esc(p.longText) + "</li>";
  }

  function detailRow(e, n, state) {
    const f = e.fragrance, id = O.entryId(e.year, e.key);
    const others = e.allYears.filter(function (y) { return y !== e.year; });
    return '<div class="cs-detail" id="e-' + O.slug(id) + '">' +
      '<div class="cs-detail-photo">' + photo(f.bottle, f.bottleLabel, " cs-photo-lg") +
        '<p class="cs-detail-cap">Frame ' + fno(n) + " · " + e.year + " · illustrative bottle</p></div>" +
      '<div class="cs-detail-body">' +
        '<header class="cs-detail-head"><h3 class="cs-dname">' + esc(f.displayName) + "</h3>" +
          (f.byline ? '<p class="cs-dby">' + esc(f.byline) + "</p>" : "") +
          (state.mode === "owner" ? '<div class="cs-badges">' + O.badgesHTML(e) + "</div>" : "") +
        "</header>" +
        '<div class="cs-cols">' +
          '<section><h4>Worn</h4><ul class="cs-plist">' + e.periods.map(periodLine).join("") + "</ul>" +
            (others.length ? '<p class="cs-also">Also on the ' + others.join(", ") + " sheet" + (others.length > 1 ? "s" : "") + ".</p>" : "") +
          "</section>" +
          "<section><h4>Memory</h4>" + (e.memory ? '<p class="cs-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
            (e.sourceNote ? '<p class="cs-also">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
          "</section>" +
          '<section class="cs-notes"><h4>Notes</h4>' + O.notesHTML(f, { iconSize: 18 }) + "</section>" +
        "</div>" +
        '<div class="cs-actions">' + O.linksHTML(f) + (state.mode === "owner" ? O.editButton("Edit entry") : "") + "</div>" +
      "</div>" +
    "</div>";
  }

  function stripLabel(inner, attrs, cls) {
    return '<button class="cs-strip' + (cls || "") + '" ' + attrs + ">" +
      '<span class="cs-holes" aria-hidden="true"></span>' +
      '<span class="cs-strip-row">' + inner + "</span>" +
      '<span class="cs-holes" aria-hidden="true"></span></button>';
  }

  function renderHistory(m, state) {
    const n = cols();
    let out = '<h1 class="olf-sr">History</h1>';
    m.years.forEach(function (y, idx) {
      const open = state.openYears.has(y.year);
      out += '<section class="cs-roll' + (open ? " is-open" : "") + '">' +
        '<h2 class="cs-roll-h">' + stripLabel(
          '<span class="cs-film">OLF 400</span>' +
          '<span class="cs-year">' + y.year + "</span>" +
          '<span class="cs-frames">' + y.count + (y.count === 1 ? " frame" : " frames") + " · 01–" + fno(y.count) + "</span>" +
          '<span class="cs-chev" aria-hidden="true"></span>',
          O.yearAttrs(state, y.year)) + "</h2>";
      if (open) {
        const items = y.entries.map(function (e, i) { return { e: e, n: i + 1 }; });
        out += '<div class="cs-grid" id="y-' + y.year + '">' +
          gridRows(items, n, function () { return 1; }).map(function (row) {
            let html = row.map(function (it) { return tile(it.e, it.n, state); }).join("");
            const sel = row.filter(function (it) { return !it.e.redacted && state.openEntry === O.entryId(it.e.year, it.e.key); })[0];
            if (sel) html += detailRow(sel.e, sel.n, state);
            return html;
          }).join("") + "</div>";
      }
      out += "</section>";
      const next = m.years[idx + 1];
      if (next && y.year - next.year > 1) {
        const a = next.year + 1, b = y.year - 1;
        out += '<p class="cs-gap"><span>' + (a === b ? a : a + " – " + b) + "</span> unexposed · no entries</p>";
      }
    });
    return out;
  }

  // ---------- To try ----------
  function memberBlock(f, n, label) {
    return '<div class="cs-member">' + photo(f.bottle, f.bottleLabel, " cs-photo-md") +
      '<div class="cs-member-body">' +
        '<p class="cs-fno-line">' + label + " " + fno(n) + "</p>" +
        '<h3 class="cs-dname">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</h3>" +
        (f.byline ? '<p class="cs-dby">' + esc(f.byline) + "</p>" : "") +
        "<h4>Notes</h4>" + O.notesHTML(f, { iconSize: 18 }) +
        "<h4>Price</h4>" + O.priceHTML(f) +
        '<div class="cs-actions">' + O.linksHTML(f) + "</div>" +
      "</div></div>";
  }

  function renderTry(m, state) {
    const n = cols();
    let frame = 1;
    const items = m.tryList.map(function (t) {
      const it = { t: t, n: frame, span: !t.redacted && t.kind === "group" ? 2 : 1 };
      frame += it.span;
      return it;
    });
    const tiles = function (it) {
      const t = it.t;
      if (t.redacted) return redactedTile(it.n);
      const open = state.openTry.has(t.key);
      const mark = open ? '<span class="cs-mark" aria-hidden="true">Selected</span>' : "";
      if (t.kind === "group") {
        return '<button class="cs-tile cs-duo' + (open ? " is-selected" : "") + '" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="cs-tape">' + esc(t.title) + "</span>" + mark +
          '<span class="cs-duo-frames">' + t.members.map(function (f, i) {
            return '<span class="cs-duo-frame">' + photo(f.bottle) +
              '<span class="cs-cap"><span class="cs-fno">' + fno(it.n + i) + (open ? " ▲" : "") + "</span>" +
              '<span class="cs-cname">' + esc(f.displayName) + "</span>" +
              '<span class="cs-cper">' + esc(f.byline || "Brand not recorded") + "</span></span></span>";
          }).join("") + "</span>" +
          (state.mode === "owner" && t.private ? '<span class="cs-cbadge">' + O.badgesHTML(t) + "</span>" : "") +
        "</button>";
      }
      const f = t.fragrance;
      return '<button class="cs-tile' + (open ? " is-selected" : "") + '" ' + O.tryAttrs(state, t.key) + ">" +
        photo(f.bottle) + mark +
        '<span class="cs-cap"><span class="cs-fno">' + fno(it.n) + (open ? " ▲" : "") + "</span>" +
          '<span class="cs-cname">' + esc(f.displayName) + "</span>" +
          (state.mode === "owner" && t.private ? '<span class="cs-cbadge">' + O.badgesHTML(t) + "</span>" : "") +
          '<span class="cs-cper">' + esc(f.byline || "") + "</span></span></button>";
    };
    const detail = function (it) {
      const t = it.t, id = "t-" + O.slug(t.key);
      const owner = state.mode === "owner" ? '<div class="cs-actions">' + O.editButton(t.kind === "group" ? "Edit group" : "Edit") + "</div>" : "";
      if (t.kind === "group") {
        return '<div class="cs-detail cs-detail-group" id="' + id + '">' +
          '<p class="cs-group-title">' + esc(t.title) + " · frames " + fno(it.n) + "–" + fno(it.n + 1) + "</p>" +
          '<div class="cs-members">' + t.members.map(function (f, i) { return memberBlock(f, it.n + i, "Frame"); }).join("") + "</div>" +
          owner + "</div>";
      }
      return '<div class="cs-detail cs-detail-single" id="' + id + '">' + memberBlock(t.fragrance, it.n, "Frame") + owner + "</div>";
    };
    return '<h1 class="olf-sr">To try</h1>' +
      '<section class="cs-roll is-open"><h2 class="cs-roll-h"><span class="cs-strip cs-strip-static">' +
        '<span class="cs-holes" aria-hidden="true"></span><span class="cs-strip-row">' +
        '<span class="cs-film">OLF 400</span><span class="cs-year">To try</span><span class="cs-frames">wishlist roll</span>' +
        '</span><span class="cs-holes" aria-hidden="true"></span></span></h2>' +
      '<div class="cs-grid">' + gridRows(items, n, function (it) { return it.span; }).map(function (row) {
        let html = row.map(tiles).join("");
        const sel = row.filter(function (it) { return !it.t.redacted && state.openTry.has(it.t.key); })[0];
        if (sel) html += detail(sel);
        return html;
      }).join("") + "</div></section>";
  }

  const app = O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="cs-tag">contact sheets</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
    singleTry: true,
  });

  // Re-place detail rows when the column count changes.
  let lastCols = cols(), timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      const c = cols();
      if (c === lastCols) return;
      lastCols = c;
      app.rerender();
    }, 120);
  });
})();
