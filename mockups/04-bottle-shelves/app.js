/* 04 Annual bottle shelves: year chips, one shelf per chosen year, a notched detail panel under the shelf row. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  // Bottles per shelf row. The shelf is rendered in rows so the detail panel can sit right under the chosen bottle's row.
  function columns() {
    const w = window.innerWidth || 1024;
    if (w < 640) return 3;
    if (w < 980) return 4;
    return 6;
  }

  // Pack slots (width 1 or 2 columns) into rows of `cols` columns.
  function packRows(slots, cols) {
    const rows = [];
    let row = [], used = 0;
    slots.forEach(function (s) {
      const w = Math.min(s.span, cols);
      if (used + w > cols) { rows.push(row); row = []; used = 0; }
      s.col = used; s.w = w;
      row.push(s); used += w;
    });
    if (row.length) rows.push(row);
    return rows;
  }

  function notch(slot, cols) { return ((slot.col + slot.w / 2) / cols * 100).toFixed(2) + "%"; }

  function yearOnlyTag(p) { return p.precision === "year" ? ' <span class="bs-q">year only</span>' : ""; }

  // ---------- History ----------
  function bottleSlot(e, state) {
    if (e.redacted) {
      return '<li class="bs-slot bs-slot-redacted" style="--span:1">' +
        '<div class="bs-static">' +
          '<span class="bs-stand">' + O.bottleSVG({ shape: "redacted" }, { width: 96, className: "bs-art" }) + "</span>" +
          '<span class="bs-label"><span class="bs-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bs-brand">' + O.REDACTED_HINT + "</span></span>" +
        "</div></li>";
    }
    const f = e.fragrance;
    const period = e.periodsInYear.map(function (p) { return esc(p.text) + yearOnlyTag(p); }).join(", ");
    return '<li class="bs-slot" style="--span:1">' +
      '<button class="bs-bottle" id="b-' + O.slug(e.year + ":" + e.key) + '" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="bs-stand">' + O.bottleSVG(f.bottle, { width: 96, className: "bs-art" }) + "</span>" +
        '<span class="bs-label">' +
          '<span class="bs-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="bs-brand">' + esc(f.byline) + "</span>" : "") +
          '<span class="bs-period">' + period + "</span>" +
          (f.notes.length ? '<span class="bs-preview">' + esc(O.notePreview(f, 2)) + "</span>" : "") +
          (state.mode === "owner" && e.private ? '<span class="bs-badge-row">' + O.badgesHTML(e) + "</span>" : "") +
        "</span>" +
      "</button></li>";
  }

  function entryPanel(e, state, slot, cols) {
    const f = e.fragrance, id = O.entryId(e.year, e.key);
    return '<div class="bs-panel" id="e-' + O.slug(id) + '" data-notch-for="b-' + O.slug(id) + '" style="--notch:' + notch(slot, cols) + '">' +
      '<div class="bs-panel-grid">' +
        '<figure class="bs-figure">' + O.bottleSVG(f.bottle, { width: 140, label: f.bottleLabel }) + "<figcaption>Illustrative bottle</figcaption></figure>" +
        '<div class="bs-panel-body">' +
          '<h3 class="bs-panel-title">' + esc(f.displayName) + "</h3>" +
          (f.byline ? '<p class="bs-panel-brand">' + esc(f.byline) + "</p>" : "") +
          (O.badgesHTML(e) ? '<p class="bs-badges">' + O.badgesHTML(e) + "</p>" : "") +
          '<div class="bs-cols">' +
            "<div><h4>Worn</h4><ul class=\"bs-periods\">" + e.periods.map(function (p) {
              return '<li class="bs-p-' + p.precision + '">' + esc(p.longText) + yearOnlyTag(p) + "</li>";
            }).join("") + "</ul>" +
            (e.allYears.length > 1 ? '<p class="bs-also">Also on the ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + " shelf.</p>" : "") +
            "<h4>Memory</h4>" + (e.memory ? '<p class="bs-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
            (e.sourceNote ? '<p class="bs-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
            "</div>" +
            "<div><h4>Notes</h4>" + O.notesHTML(f) + '<div class="bs-links">' + O.linksHTML(f) + "</div></div>" +
          "</div>" +
          (state.mode === "owner" ? '<div class="bs-owner">' + O.editButton("Edit entry") + "</div>" : "") +
        "</div>" +
      "</div></div>";
  }

  function shelf(y, state) {
    const cols = columns();
    const slots = y.entries.map(function (e) { return { span: 1, e: e }; });
    const rows = packRows(slots, cols);
    let html = '<section class="bs-shelf" id="y-' + y.year + '" aria-label="' + y.year + ' shelf" style="--cols:' + cols + '">' +
      '<h2 class="bs-shelf-h"><span class="bs-shelf-year">' + y.year + '</span><span class="bs-shelf-count">' +
        y.count + (y.count === 1 ? " bottle" : " bottles") + (y.redactedCount ? ", " + y.redactedCount + " private" : "") + "</span></h2>";
    rows.forEach(function (row) {
      html += '<ul class="bs-row">' + row.map(function (s) { return bottleSlot(s.e, state); }).join("") + "</ul>";
      const open = row.find(function (s) { return !s.e.redacted && state.openEntry === O.entryId(s.e.year, s.e.key); });
      if (open) html += entryPanel(open.e, state, open, cols);
    });
    return html + "</section>";
  }

  function renderHistory(m, state) {
    let chips = "";
    m.years.forEach(function (y, i) {
      chips += '<li><button class="bs-chip" ' + O.yearAttrs(state, y.year) + ">" +
        '<span class="bs-chip-year">' + y.year + '</span><span class="bs-chip-count">' + y.count + '<span class="olf-sr"> ' + (y.count === 1 ? "fragrance" : "fragrances") + "</span></span></button></li>";
      const next = m.years[i + 1];
      if (next && y.year - next.year > 1) {
        const from = next.year + 1, to = y.year - 1;
        chips += '<li class="bs-chip-gap">' + (from === to ? from : from + "–" + to) + " · no records</li>";
      }
    });
    const open = m.years.filter(function (y) { return state.openYears.has(y.year); });
    return '<h1 class="olf-sr">History</h1>' +
      '<nav class="bs-years" aria-label="Years, newest first"><ul class="bs-chips">' + chips + "</ul></nav>" +
      (open.length ? open.map(function (y) { return shelf(y, state); }).join("")
        : '<p class="bs-hint">Choose a year to see its shelf.</p>');
  }

  // ---------- To try ----------
  function trySlot(t, state) {
    if (t.redacted) {
      const two = t.kind === "group";
      return '<li class="bs-slot bs-slot-redacted' + (two ? " bs-slot-pair" : "") + '" style="--span:' + (two ? 2 : 1) + '">' +
        '<div class="bs-static"><span class="bs-stand">' + O.bottleSVG({ shape: "redacted" }, { width: 96, className: "bs-art" }) +
          (two ? O.bottleSVG({ shape: "redacted" }, { width: 96, className: "bs-art" }) : "") + "</span>" +
        '<span class="bs-label"><span class="bs-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bs-brand">' + O.REDACTED_HINT + "</span></span>" +
        "</div></li>";
    }
    if (t.kind === "group") {
      return '<li class="bs-slot bs-slot-pair" style="--span:2">' +
        '<button class="bs-bottle" id="b-' + O.slug(t.key) + '" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="bs-stand">' + t.members.map(function (f) { return O.bottleSVG(f.bottle, { width: 96, className: "bs-art" }); }).join("") + "</span>" +
          '<span class="bs-bracket"><span class="bs-bracket-label">' + esc(t.title) + "</span></span>" +
          '<span class="bs-label bs-label-pair">' + t.members.map(function (f) {
            return '<span class="bs-pair-member"><span class="bs-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
              (f.byline ? '<span class="bs-brand">' + esc(f.byline) + "</span>" : "") + "</span>";
          }).join("") + "</span>" +
          (state.mode === "owner" && t.private ? '<span class="bs-badge-row">' + O.badgesHTML(t) + "</span>" : "") +
        "</button></li>";
    }
    const f = t.fragrance;
    return '<li class="bs-slot" style="--span:1">' +
      '<button class="bs-bottle" id="b-' + O.slug(t.key) + '" ' + O.tryAttrs(state, t.key) + ">" +
        '<span class="bs-stand">' + O.bottleSVG(f.bottle, { width: 96, className: "bs-art" }) + "</span>" +
        '<span class="bs-label"><span class="bs-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="bs-brand">' + esc(f.byline) + "</span>" : "") +
          (f.notes.length ? '<span class="bs-preview">' + esc(O.notePreview(f, 2)) + "</span>" : "") +
          (state.mode === "owner" && t.private ? '<span class="bs-badge-row">' + O.badgesHTML(t) + "</span>" : "") +
        "</span></button></li>";
  }

  function member(f) {
    return '<div class="bs-member">' +
      '<figure class="bs-member-fig">' + O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) + "</figure>" +
      '<div class="bs-member-body">' +
        '<h4 class="bs-member-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</h4>" +
        (f.byline ? '<p class="bs-panel-brand">' + esc(f.byline) + "</p>" : "") +
        O.notesHTML(f, { limit: 7 }) + O.priceHTML(f) + '<div class="bs-links">' + O.linksHTML(f) + "</div>" +
      "</div></div>";
  }

  function tryPanel(t, state, slot, cols) {
    const members = t.kind === "group" ? t.members : [t.fragrance];
    return '<div class="bs-panel" id="t-' + O.slug(t.key) + '" data-notch-for="b-' + O.slug(t.key) + '" style="--notch:' + notch(slot, cols) + '">' +
      (t.kind === "group" ? '<p class="bs-kicker">' + esc(t.title) + "</p>" : "") +
      (O.badgesHTML(t) ? '<p class="bs-badges">' + O.badgesHTML(t) + "</p>" : "") +
      '<div class="bs-members' + (members.length > 1 ? " bs-members-two" : "") + '">' + members.map(member).join("") + "</div>" +
      (state.mode === "owner" ? '<div class="bs-owner">' + O.editButton(t.kind === "group" ? "Edit group" : "Edit") + "</div>" : "") +
      "</div>";
  }

  function renderTry(m, state) {
    const cols = columns();
    const slots = m.tryList.map(function (t) { return { span: t.kind === "group" ? 2 : 1, t: t }; });
    const rows = packRows(slots, cols);
    let html = '<h1 class="olf-sr">To try</h1><section class="bs-shelf bs-shelf-wish" aria-label="Wishlist shelf" style="--cols:' + cols + '">' +
      '<h2 class="bs-shelf-h"><span class="bs-shelf-year">Wishlist</span><span class="bs-shelf-count">Not worn yet. Shop links open a search; nothing here is added to History.</span></h2>';
    rows.forEach(function (row) {
      html += '<ul class="bs-row">' + row.map(function (s) { return trySlot(s.t, state); }).join("") + "</ul>";
      const open = row.find(function (s) { return !s.t.redacted && state.openTry.has(s.t.key); });
      if (open) html += tryPanel(open.t, state, open, cols);
    });
    return html + "</section>";
  }

  // Refine the notch with real geometry when layout is available. The index-based value stays as fallback.
  function afterRender(m, state, panels) {
    [panels.history, panels.try].forEach(function (p) {
      p.querySelectorAll(".bs-panel[data-notch-for]").forEach(function (panel) {
        const btn = document.getElementById(panel.dataset.notchFor);
        if (!btn) return;
        const slot = btn.parentElement;
        if (!slot.offsetWidth) return;
        panel.style.setProperty("--notch", (slot.offsetLeft + slot.offsetWidth / 2) + "px");
      });
    });
  }

  const app = O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="bs-tag">bottle shelves</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
    afterRender: afterRender,
    singleYear: true,
    singleTry: true,
  });

  // Re-pack shelves when the column count changes.
  let lastCols = columns(), timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (columns() === lastCols) { afterRender(null, null, { history: document.getElementById("olf-panel-history"), try: document.getElementById("olf-panel-try") }); return; }
      lastCols = columns();
      app.rerender();
    }, 120);
  });
})();
