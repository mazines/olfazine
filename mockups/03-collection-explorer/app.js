/* 03 Collection explorer: Finder-style columns on desktop, stacked hierarchy on mobile.
 * The DOM is one nested tree (year > fragrances > detail). On desktop, CSS flattens the
 * wrappers with display: contents and places each row in its column, so nothing renders twice.
 */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  function periodChip(p) {
    const unsure = p.inYear === null;
    return '<span class="ce-per' + (unsure ? " is-unsure" : "") + '">' + esc(p.text) +
      (unsure ? '<span class="ce-q">year only</span>' : "") + "</span>";
  }

  function thumb(spec) {
    return '<span class="ce-thumb">' + O.bottleSVG(spec, { width: 26 }) + "</span>";
  }

  function redactedRow(extraBottle) {
    return '<div class="ce-row ce-static">' + thumb({ shape: "redacted" }) +
      (extraBottle ? thumb({ shape: "redacted" }) : "") +
      '<span class="ce-row-text"><span class="ce-name olf-redacted">' + O.REDACTED_LABEL + "</span>" +
      '<span class="ce-sub">' + O.REDACTED_HINT + "</span></span></div>";
  }

  function linksOrEmpty(f) {
    const l = O.linksHTML(f);
    return l || '<p class="olf-empty">No verified links.</p>';
  }

  // Property sheet shown in the detail pane (desktop) or beneath the row (mobile).
  function entryDetail(e, state) {
    const f = e.fragrance;
    return '<div class="ce-detail-inner">' +
      '<div class="ce-dhead">' +
        '<figure class="ce-fig">' + O.bottleSVG(f.bottle, { width: 96, label: f.bottleLabel }) +
          "<figcaption>Illustrative bottle</figcaption></figure>" +
        '<div class="ce-dtitle"><h3 class="ce-dname">' + esc(f.displayName) + "</h3>" +
          (f.byline ? '<p class="ce-dbrand">' + esc(f.byline) + "</p>" : "") +
          '<p class="ce-badges">' + O.badgesHTML(e) + "</p></div>" +
      "</div>" +
      '<dl class="ce-props">' +
        "<dt>Worn</dt><dd><ul class=\"ce-periods\">" + e.periods.map(function (p) {
          const unsure = p.precision === "year";
          return '<li class="' + (unsure ? "is-unsure" : "") + '">' + esc(p.longText) +
            (unsure ? '<span class="ce-q">months not recorded</span>' : "") + "</li>";
        }).join("") + "</ul>" +
        (e.allYears.length > 1 ? '<p class="ce-also">Also in ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + "</p>" : "") +
        "</dd>" +
        "<dt>Memory</dt><dd>" + (e.memory ? '<p class="ce-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
          (e.sourceNote ? '<p class="ce-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") + "</dd>" +
        "<dt>Notes</dt><dd>" + O.notesHTML(f, { iconSize: 18 }) + "</dd>" +
        "<dt>Links</dt><dd>" + linksOrEmpty(f) + "</dd>" +
      "</dl>" +
      (state.mode === "owner" ? '<div class="ce-owner">' + O.editButton("Edit entry") + "</div>" : "") +
    "</div>";
  }

  function fragRow(e, j, state) {
    const style = ' style="--r:' + (j + 2) + '"';
    if (e.redacted) return '<li class="ce-frag"' + style + ">" + redactedRow(false) + "</li>";
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    return '<li class="ce-frag' + (open ? " is-open" : "") + '"' + style + ">" +
      '<button class="ce-row" ' + O.entryAttrs(state, e.year, e.key) + ">" + thumb(f.bottle) +
        '<span class="ce-row-text">' +
          '<span class="ce-name">' + esc(f.displayName) + " " + O.badgesHTML(e) + "</span>" +
          '<span class="ce-sub">' + (f.byline ? esc(f.byline) + " · " : "") + e.periodsInYear.map(periodChip).join(", ") + "</span>" +
          (f.notes.length ? '<span class="ce-notes-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="ce-chev" aria-hidden="true"></span>' +
      "</button>" +
      (open ? '<section class="ce-detail" id="e-' + O.slug(id) + '" aria-label="Detail: ' + esc(f.displayName) + '">' +
        '<h2 class="ce-pane-title">Detail</h2>' + entryDetail(e, state) + "</section>" : "") +
    "</li>";
  }

  function renderHistory(m, state) {
    const sel = m.years.find(function (y) { return state.openYears.has(y.year); }) || null;
    const hasEntry = !!(sel && sel.entries.some(function (e) { return !e.redacted && O.entryId(e.year, e.key) === state.openEntry; }));
    const rows = Math.max(m.years.length, sel ? sel.entries.length : 1);

    return '<h1 class="olf-sr">History</h1>' +
      '<div class="ce-browser" style="--rows:' + rows + '">' +
        '<div class="ce-bg ce-bg-1" aria-hidden="true"></div><div class="ce-bg ce-bg-2" aria-hidden="true"></div><div class="ce-bg ce-bg-3" aria-hidden="true"></div>' +
        '<h2 class="ce-pane-title ce-t1">Years</h2>' +
        '<ol class="ce-list ce-years">' + m.years.map(function (y, i) {
          const open = state.openYears.has(y.year);
          return '<li class="ce-item' + (open ? " is-open" : "") + '" style="--r:' + (i + 2) + '">' +
            '<button class="ce-row ce-yrow" ' + O.yearAttrs(state, y.year) + ">" +
              '<span class="ce-row-text"><span class="ce-ynum">' + y.year + "</span>" +
              '<span class="ce-sub">' + plural(y.count, "fragrance") + (y.redactedCount ? " · " + y.redactedCount + " private" : "") + "</span></span>" +
              '<span class="ce-chev" aria-hidden="true"></span>' +
            "</button>" +
            (open ? '<div class="ce-region" id="y-' + y.year + '">' +
              '<h2 class="ce-pane-title ce-t2">' + y.year + ' <span class="ce-t-count">' + plural(y.count, "fragrance") + "</span></h2>" +
              '<ul class="ce-list ce-frags">' + y.entries.map(function (e, j) { return fragRow(e, j, state); }).join("") + "</ul>" +
            "</div>" : "") +
          "</li>";
        }).join("") + "</ol>" +
        (sel ? "" : '<p class="ce-empty ce-empty-2">Select a year</p>') +
        (hasEntry ? "" : '<div class="ce-empty ce-empty-3"><span class="ce-empty-mark" aria-hidden="true"></span><p>Select a fragrance</p></div>') +
      "</div>" +
      (m.gaps.length ? '<p class="ce-gap">No entries recorded for ' + m.gaps.join(", ") + ".</p>" : "");
  }

  // ---------- To try ----------
  function memberCard(f) {
    return '<article class="ce-member">' +
      '<div class="ce-dhead">' +
        '<figure class="ce-fig">' + O.bottleSVG(f.bottle, { width: 80, label: f.bottleLabel }) + "</figure>" +
        '<div class="ce-dtitle"><h3 class="ce-dname">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</h3>" +
          (f.byline ? '<p class="ce-dbrand">' + esc(f.byline) + "</p>" : "") + "</div>" +
      "</div>" +
      '<dl class="ce-props">' +
        "<dt>Notes</dt><dd>" + O.notesHTML(f, { iconSize: 18 }) + "</dd>" +
        "<dt>Price</dt><dd>" + O.priceHTML(f) + "</dd>" +
        "<dt>Links</dt><dd>" + linksOrEmpty(f) + "</dd>" +
      "</dl>" +
    "</article>";
  }

  function renderTry(m, state) {
    const anyOpen = m.tryList.some(function (t) { return !t.redacted && state.openTry.has(t.key); });
    return '<h1 class="olf-sr">To try</h1>' +
      '<div class="ce-browser ce-try" style="--rows:' + Math.max(m.tryList.length, 1) + '">' +
        '<div class="ce-bg ce-bg-1" aria-hidden="true"></div><div class="ce-bg ce-bg-2" aria-hidden="true"></div><div class="ce-bg ce-bg-3" aria-hidden="true"></div>' +
        '<h2 class="ce-pane-title ce-t1">Groups &amp; singles</h2>' +
        '<ul class="ce-list ce-years">' + m.tryList.map(function (t, i) {
          const style = ' style="--r:' + (i + 2) + '"';
          if (t.redacted) return '<li class="ce-item"' + style + ">" + redactedRow(t.kind === "group") + "</li>";
          const open = state.openTry.has(t.key);
          const members = t.kind === "group" ? t.members : [t.fragrance];
          const head = t.kind === "group"
            ? '<span class="ce-kicker">Group · 2</span><span class="ce-name">' + esc(t.title) + " " + O.badgesHTML(t) + "</span>" +
              '<span class="ce-sub">' + members.map(function (f) { return esc(f.displayName); }).join(" + ") + "</span>"
            : '<span class="ce-kicker">Single</span><span class="ce-name">' + esc(t.fragrance.displayName) + " " + O.badgesHTML(t) + "</span>" +
              '<span class="ce-sub">' + esc(t.fragrance.byline || "") + "</span>";
          return '<li class="ce-item' + (open ? " is-open" : "") + '"' + style + ">" +
            '<button class="ce-row ce-yrow" ' + O.tryAttrs(state, t.key) + ">" +
              (t.kind === "group" ? '<span class="ce-pairthumb">' + members.map(function (f) { return thumb(f.bottle); }).join("") + "</span>" : thumb(t.fragrance.bottle)) +
              '<span class="ce-row-text">' + head + "</span>" +
              '<span class="ce-chev" aria-hidden="true"></span>' +
            "</button>" +
            (open ? '<div class="ce-region" id="t-' + O.slug(t.key) + '">' +
              '<section class="ce-members" aria-label="Members">' +
                '<h2 class="ce-pane-title">' + (t.kind === "group" ? "Members" : "Fragrance") + "</h2>" +
                '<ul class="ce-list">' + members.map(function (f) {
                  return '<li class="ce-row ce-static">' + thumb(f.bottle) +
                    '<span class="ce-row-text"><span class="ce-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
                    '<span class="ce-sub">' + esc(f.byline || "Brand unknown") + "</span></span></li>";
                }).join("") + "</ul>" +
              "</section>" +
              '<section class="ce-detail" aria-label="Detail">' +
                '<h2 class="ce-pane-title">' + (t.kind === "group" ? esc(t.title) + ' <span class="ce-t-count">2 fragrances, own details each</span>' : "Detail") + "</h2>" +
                '<div class="ce-detail-inner"><div class="ce-pair' + (t.kind === "group" ? " is-group" : "") + '">' + members.map(memberCard).join("") + "</div>" +
                (state.mode === "owner" ? '<div class="ce-owner">' + O.editButton(t.kind === "group" ? "Edit group" : "Edit") + "</div>" : "") +
                "</div>" +
              "</section>" +
            "</div>" : "") +
          "</li>";
        }).join("") + "</ul>" +
        (anyOpen ? "" : '<p class="ce-empty ce-empty-2">Select a group or fragrance</p>' +
          '<div class="ce-empty ce-empty-3"><span class="ce-empty-mark" aria-hidden="true"></span><p>Select a group or fragrance</p></div>') +
      "</div>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="ce-tag">Collection</span>',
    singleYear: true,
    singleTry: true,
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
