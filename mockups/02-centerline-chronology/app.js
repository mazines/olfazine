/* 02 Centerline chronology: one central spine, year pills on the spine,
 * fragrance cards alternate left and right and grow in place when opened. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  // Year-precision periods carry no month claim, so they get a visible "month unknown" tag.
  function whenChip(p) {
    if (p.inYear === null) {
      return '<span class="cc-when cc-when-year">' + esc(p.text) + ' <span class="cc-q">month unknown</span></span>';
    }
    return '<span class="cc-when">' + esc(p.text) + "</span>";
  }

  function periodItem(p) {
    if (p.inYear === null) {
      return '<li class="cc-p cc-p-year">' + esc(p.longText) + ' <span class="cc-q">month not recorded</span></li>';
    }
    return '<li class="cc-p cc-p-' + p.precision + '">' + esc(p.longText) + "</li>";
  }

  function redactedCard(cls) {
    return '<div class="cc-card cc-card-redacted' + (cls || "") + '">' +
      '<div class="cc-head cc-static">' +
        '<span class="cc-thumb">' + O.bottleSVG({ shape: "redacted" }, { width: 40 }) + "</span>" +
        '<span class="cc-text"><span class="cc-name olf-redacted">' + O.REDACTED_LABEL + '</span>' +
        '<span class="cc-by">' + O.REDACTED_HINT + "</span></span>" +
      "</div></div>";
  }

  function entryCard(e, state) {
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    const head =
      '<button class="cc-head" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="cc-thumb">' + O.bottleSVG(f.bottle, { width: 40 }) + "</span>" +
        '<span class="cc-text">' +
          '<span class="cc-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="cc-by">' + esc(f.byline) + "</span>" : "") +
          '<span class="cc-periods">' + e.periodsInYear.map(whenChip).join("") + "</span>" +
          (f.notes.length ? '<span class="cc-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="cc-toggle" aria-hidden="true"></span>' +
      "</button>";
    let detail = "";
    if (open) {
      const others = e.allYears.filter(function (y) { return y !== e.year; });
      detail =
        '<div class="cc-detail" id="e-' + O.slug(id) + '">' +
          '<figure class="cc-fig">' + O.bottleSVG(f.bottle, { width: 104, label: f.bottleLabel }) +
            "<figcaption>Illustrative bottle</figcaption></figure>" +
          '<div class="cc-body">' +
            (state.mode === "owner" ? '<div class="cc-badges">' + O.badgesHTML(e) + "</div>" : "") +
            '<h4>Worn</h4><ul class="cc-plist">' + e.periods.map(periodItem).join("") + "</ul>" +
            (others.length ? '<p class="cc-also">Also on the spine in ' + others.join(", ") + ".</p>" : "") +
            "<h4>Memory</h4>" + (e.memory ? '<p class="cc-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
            (e.sourceNote ? '<p class="cc-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
            "<h4>Notes</h4>" + O.notesHTML(f, { iconSize: 18 }) +
            '<div class="cc-links">' + O.linksHTML(f) + "</div>" +
            (state.mode === "owner" ? '<div class="cc-owner">' + O.editButton("Edit entry") + "</div>" : "") +
          "</div>" +
        "</div>";
    }
    return '<div class="cc-card' + (open ? " is-open" : "") + '">' + head + detail + "</div>";
  }

  function entryItem(e, i, state) {
    const side = i % 2 === 0 ? " cc-left" : " cc-right";
    if (e.redacted) return '<li class="cc-entry' + side + '">' + redactedCard() + "</li>";
    const uncertain = e.periodsInYear.every(function (p) { return p.inYear === null; }) ? " cc-uncertain" : "";
    return '<li class="cc-entry' + side + uncertain + '">' + entryCard(e, state) + "</li>";
  }

  // Gap ranges between listed years, drawn on the spine as quiet markers only.
  function gapMarker(newer, older) {
    if (newer - older <= 1) return "";
    const from = older + 1, to = newer - 1;
    return '<li class="cc-gap"><span class="cc-gap-label">' + (from === to ? from : from + " – " + to) +
      ' · no entries</span></li>';
  }

  function renderHistory(m, state) {
    let out = '<h1 class="olf-sr">History</h1><ol class="cc-spine">';
    m.years.forEach(function (y, idx) {
      const open = state.openYears.has(y.year);
      out += '<li class="cc-year' + (open ? " is-open" : "") + '">' +
        '<h2 class="cc-year-h"><button class="cc-pill" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="cc-pill-year">' + y.year + "</span>" +
          '<span class="cc-pill-count">' + y.count + (y.count === 1 ? " fragrance" : " fragrances") + "</span>" +
          '<span class="cc-pill-chev" aria-hidden="true"></span>' +
        "</button></h2>" +
        (open ? '<ol class="cc-entries" id="y-' + y.year + '">' +
          y.entries.map(function (e, i) { return entryItem(e, i, state); }).join("") + "</ol>" : "") +
      "</li>";
      const next = m.years[idx + 1];
      if (next) out += gapMarker(y.year, next.year);
    });
    return out + '<li class="cc-end" aria-hidden="true"></li></ol>';
  }

  // ---------- To try ----------
  function memberCard(f, open, state, t) {
    return '<div class="cc-card cc-member' + (open ? " is-open" : "") + '">' +
      '<div class="cc-member-top">' +
        '<span class="cc-thumb">' + O.bottleSVG(f.bottle, { width: open ? 72 : 48, label: open ? f.bottleLabel : null }) + "</span>" +
        '<span class="cc-text">' +
          '<span class="cc-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
          (f.byline ? '<span class="cc-by">' + esc(f.byline) + "</span>" : "") +
          (!open && f.notes.length ? '<span class="cc-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
      "</div>" +
      (open ? '<div class="cc-member-body">' +
        "<h4>Notes</h4>" + O.notesHTML(f, { iconSize: 18 }) +
        "<h4>Price</h4>" + O.priceHTML(f) +
        '<div class="cc-links">' + O.linksHTML(f) + "</div>" +
      "</div>" : "") +
    "</div>";
  }

  function renderTry(m, state) {
    let side = 0;
    const items = m.tryList.map(function (t) {
      if (t.redacted && t.kind === "group") {
        return '<li class="cc-group cc-group-redacted">' + redactedCard(" cc-centre") + "</li>";
      }
      if (t.redacted) {
        const cls = side++ % 2 === 0 ? " cc-left" : " cc-right";
        return '<li class="cc-entry' + cls + '">' + redactedCard() + "</li>";
      }
      const open = state.openTry.has(t.key);
      if (t.kind === "group") {
        return '<li class="cc-group' + (open ? " is-open" : "") + '">' +
          '<h2 class="cc-group-h"><button class="cc-bracket-label" ' + O.tryAttrs(state, t.key) + ">" +
            '<span class="cc-bracket-title">' + esc(t.title) + "</span>" +
            (state.mode === "owner" ? " " + O.badgesHTML(t) : "") +
            '<span class="cc-bracket-names">' + t.members.map(function (f) { return esc(f.displayName); }).join(" + ") + "</span>" +
            '<span class="cc-pill-chev" aria-hidden="true"></span>' +
          "</button></h2>" +
          '<div class="cc-pair" id="t-' + O.slug(t.key) + '">' +
            t.members.map(function (f) { return memberCard(f, open, state, t); }).join("") +
          "</div>" +
          (open && state.mode === "owner" ? '<div class="cc-owner cc-owner-centre">' + O.editButton("Edit group") + "</div>" : "") +
        "</li>";
      }
      const f = t.fragrance, cls = side++ % 2 === 0 ? " cc-left" : " cc-right";
      return '<li class="cc-entry' + cls + '"><div class="cc-card' + (open ? " is-open" : "") + '">' +
        '<button class="cc-head" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="cc-thumb">' + O.bottleSVG(f.bottle, { width: 40 }) + "</span>" +
          '<span class="cc-text"><span class="cc-name">' + esc(f.displayName) + "</span>" +
            (f.byline ? '<span class="cc-by">' + esc(f.byline) + "</span>" : "") +
            (state.mode === "owner" ? '<span class="cc-badges">' + O.badgesHTML(t) + "</span>" : "") +
            (f.notes.length ? '<span class="cc-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
          "</span>" +
          '<span class="cc-toggle" aria-hidden="true"></span>' +
        "</button>" +
        (open ? '<div class="cc-detail" id="t-' + O.slug(t.key) + '">' +
          '<figure class="cc-fig">' + O.bottleSVG(f.bottle, { width: 104, label: f.bottleLabel }) + "<figcaption>Illustrative bottle</figcaption></figure>" +
          '<div class="cc-body"><h4>Notes</h4>' + O.notesHTML(f, { iconSize: 18 }) +
            "<h4>Price</h4>" + O.priceHTML(f) +
            '<div class="cc-links">' + O.linksHTML(f) + "</div>" +
            (state.mode === "owner" ? '<div class="cc-owner">' + O.editButton("Edit") + "</div>" : "") +
          "</div></div>" : "") +
      "</div></li>";
    });
    return '<h1 class="olf-sr">To try</h1><ol class="cc-spine cc-try">' + items.join("") +
      '<li class="cc-end" aria-hidden="true"></li></ol>';
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="cc-tag">a chronology of scent</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
