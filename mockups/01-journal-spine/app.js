/* 01 Journal spine: left timeline, spacious rows, inline detail branches. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  function row(e, state) {
    if (e.redacted) {
      return '<li class="js-row js-row-redacted">' +
        '<div class="js-node" aria-hidden="true"></div>' +
        '<div class="js-row-head js-static">' + O.bottleSVG({ shape: "redacted" }, { width: 40 }) +
          '<div><p class="js-name olf-redacted">' + O.REDACTED_LABEL + '</p><p class="js-meta">' + O.REDACTED_HINT + "</p></div>" +
        "</div></li>";
    }
    const id = O.entryId(e.year, e.key), open = state.openEntry === id, f = e.fragrance;
    const head =
      '<button class="js-row-head" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        O.bottleSVG(f.bottle, { width: 40 }) +
        '<span class="js-row-text">' +
          '<span class="js-name">' + esc(f.displayName) + "</span>" +
          '<span class="js-meta">' + (f.byline ? esc(f.byline) + " · " : "") + esc(e.periodsInYear.map(function (p) { return p.text; }).join(", ")) + "</span>" +
          (f.notes.length ? '<span class="js-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="js-chev" aria-hidden="true"></span>' +
      "</button>";
    let detail = "";
    if (open) {
      detail =
        '<div class="js-detail" id="e-' + O.slug(id) + '">' +
          '<div class="js-branch" aria-hidden="true"></div>' +
          '<div class="js-detail-grid">' +
            '<figure class="js-figure">' + O.bottleSVG(f.bottle, { width: 120, label: f.bottleLabel }) +
              '<figcaption>Illustrative bottle</figcaption></figure>' +
            '<div class="js-detail-body">' +
              '<div class="js-badges">' + O.badgesHTML(e) + "</div>" +
              '<h4>Worn</h4><ul class="js-periods">' + e.periods.map(function (p) {
                return '<li class="js-p-' + p.precision + '">' + esc(p.longText) + (p.precision === "year" ? ' <span class="js-q">year only</span>' : "") + "</li>";
              }).join("") + "</ul>" +
              (e.allYears.length > 1 ? '<p class="js-also">Also listed under ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + ".</p>" : "") +
              "<h4>Memory</h4>" + (e.memory ? '<p class="js-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
              (e.sourceNote ? '<p class="js-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
              "<h4>Notes</h4>" + O.notesHTML(f) +
              O.linksHTML(f) +
              (state.mode === "owner" ? '<div class="js-owner">' + O.editButton("Edit entry") + "</div>" : "") +
            "</div>" +
          "</div>" +
        "</div>";
    }
    return '<li class="js-row' + (open ? " is-open" : "") + '"><div class="js-node" aria-hidden="true"></div>' + head + detail + "</li>";
  }

  function renderHistory(m, state) {
    return '<h1 class="olf-sr">History</h1><ol class="js-years">' + m.years.map(function (y) {
      const open = state.openYears.has(y.year);
      return '<li class="js-year' + (open ? " is-open" : "") + '">' +
        '<h2 class="js-year-h"><button ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="js-year-num">' + y.year + '</span><span class="js-year-count">' + y.count + (y.count === 1 ? " fragrance" : " fragrances") + "</span>" +
        "</button></h2>" +
        (open ? '<ol class="js-rows" id="y-' + y.year + '">' + y.entries.map(function (e) { return row(e, state); }).join("") + "</ol>" : "") +
      "</li>";
    }).join("") + "</ol>" +
    (m.gaps.length ? '<p class="js-gap">No entries recorded for ' + m.gaps.join(", ") + ".</p>" : "");
  }

  function member(f) {
    return '<div class="js-member">' +
      O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) +
      '<div><p class="js-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + '</p><p class="js-meta">' + esc(f.byline || "") + "</p>" +
        O.notesHTML(f, { limit: 6 }) + O.priceHTML(f) + O.linksHTML(f) +
      "</div></div>";
  }

  function renderTry(m, state) {
    return '<h1 class="olf-sr">To try</h1><ul class="js-try">' + m.tryList.map(function (t) {
      if (t.redacted) {
        return '<li class="js-try-item js-row-redacted"><div class="js-row-head js-static">' +
          O.bottleSVG({ shape: "redacted" }, { width: 40 }) + (t.kind === "group" ? O.bottleSVG({ shape: "redacted" }, { width: 40 }) : "") +
          '<div><p class="js-name olf-redacted">' + O.REDACTED_LABEL + '</p><p class="js-meta">' + O.REDACTED_HINT + "</p></div></div></li>";
      }
      const open = state.openTry.has(t.key);
      if (t.kind === "group") {
        return '<li class="js-try-item js-group' + (open ? " is-open" : "") + '">' +
          '<button class="js-row-head" ' + O.tryAttrs(state, t.key) + ">" +
            '<span class="js-pair">' + t.members.map(function (f) { return O.bottleSVG(f.bottle, { width: 40 }); }).join("") + "</span>" +
            '<span class="js-row-text"><span class="js-kicker">' + esc(t.title) + " " + O.badgesHTML(t) + '</span><span class="js-name">' +
              t.members.map(function (f) { return esc(f.displayName); }).join(' <span class="js-plus">+</span> ') + "</span></span>" +
            '<span class="js-chev" aria-hidden="true"></span>' +
          "</button>" +
          (open ? '<div class="js-detail" id="t-' + O.slug(t.key) + '"><div class="js-branch" aria-hidden="true"></div><div class="js-members">' +
            t.members.map(member).join("") + "</div>" +
            (state.mode === "owner" ? '<div class="js-owner">' + O.editButton("Edit group") + "</div>" : "") + "</div>" : "") +
        "</li>";
      }
      const f = t.fragrance;
      return '<li class="js-try-item' + (open ? " is-open" : "") + '">' +
        '<button class="js-row-head" ' + O.tryAttrs(state, t.key) + ">" + O.bottleSVG(f.bottle, { width: 40 }) +
          '<span class="js-row-text"><span class="js-name">' + esc(f.displayName) + " " + O.badgesHTML(t) + '</span><span class="js-meta">' + esc(f.byline || "") + "</span>" +
          (f.notes.length ? '<span class="js-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") + "</span>" +
          '<span class="js-chev" aria-hidden="true"></span>' +
        "</button>" +
        (open ? '<div class="js-detail" id="t-' + O.slug(t.key) + '"><div class="js-branch" aria-hidden="true"></div><div class="js-members">' + member(f) + "</div>" +
          (state.mode === "owner" ? '<div class="js-owner">' + O.editButton("Edit") + "</div>" : "") + "</div>" : "") +
      "</li>";
    }).join("") + "</ul>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="js-tag">a scent journal</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
