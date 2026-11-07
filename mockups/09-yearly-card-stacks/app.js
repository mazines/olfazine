/* 09 Yearly card stacks: each year is a small stack of cards; open it to deal a grid; open a card inline. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  // Animate only what just opened, not every card on each re-render.
  let prevYears = null, prevEntry, prevTry = null; // prevEntry stays undefined until the first render, so seeded cards do not animate.

  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }

  function perChip(p) {
    const unsure = p.inYear === null;
    return '<span class="cs-per' + (unsure ? " is-unsure" : "") + '">' + esc(p.text) +
      (unsure ? ' <span class="cs-q">year only</span>' : "") + "</span>";
  }

  function linksOrEmpty(f) { return O.linksHTML(f) || '<p class="olf-empty">No verified links.</p>'; }

  function stackThumbs(entries) {
    return '<span class="cs-thumbs" aria-hidden="true">' + entries.slice(0, 3).map(function (e) {
      return '<span class="cs-thumb">' + O.bottleSVG(e.redacted ? { shape: "redacted" } : e.fragrance.bottle, { width: 30 }) + "</span>";
    }).join("") + "</span>";
  }

  function cardDetail(e, state) {
    const f = e.fragrance;
    return '<div class="cs-detail" id="e-' + O.slug(O.entryId(e.year, e.key)) + '">' +
      '<figure class="cs-fig">' + O.bottleSVG(f.bottle, { width: 120, label: f.bottleLabel }) + "<figcaption>Illustrative bottle</figcaption></figure>" +
      '<div class="cs-body">' +
        (O.badgesHTML(e) ? '<p class="cs-badges">' + O.badgesHTML(e) + "</p>" : "") +
        '<section><h4>Worn</h4><ul class="cs-periods">' + e.periods.map(function (p) {
          const unsure = p.precision === "year";
          return '<li><span class="cs-per' + (unsure ? " is-unsure" : "") + '">' + esc(p.longText) + "</span>" +
            (unsure ? ' <span class="cs-q">months not recorded</span>' : "") + "</li>";
        }).join("") + "</ul>" +
        (e.allYears.length > 1 ? '<p class="cs-also">Also in the ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + " stack.</p>" : "") +
        "</section>" +
        "<section><h4>Memory</h4>" + (e.memory ? '<p class="cs-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
          (e.sourceNote ? '<p class="cs-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") + "</section>" +
        "<section><h4>Notes</h4>" + O.notesHTML(f, { iconSize: 18 }) + "</section>" +
        '<section class="cs-links">' + linksOrEmpty(f) + "</section>" +
        (state.mode === "owner" ? '<div class="cs-owner">' + O.editButton("Edit entry") + "</div>" : "") +
      "</div>" +
    "</div>";
  }

  function card(e, i, state, fresh) {
    const delay = ' style="--i:' + i + '"';
    if (e.redacted) {
      return '<li class="cs-card cs-redacted' + (fresh ? " is-dealt" : "") + '"' + delay + '><div class="cs-card-face">' +
        '<span class="cs-art">' + O.bottleSVG({ shape: "redacted" }, { width: 56 }) + "</span>" +
        '<span class="cs-text"><span class="cs-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="cs-meta">' + O.REDACTED_HINT + "</span></span>" +
        "</div></li>";
    }
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    const justOpened = open && prevEntry !== undefined && prevEntry !== id;
    return '<li class="cs-card' + (open ? " is-open" : "") + (fresh ? " is-dealt" : "") + (justOpened ? " is-unfolding" : "") + '"' + delay + ">" +
      '<button class="cs-card-face" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="cs-art">' + O.bottleSVG(f.bottle, { width: open ? 44 : 56 }) + "</span>" +
        '<span class="cs-text">' +
          '<span class="cs-name">' + esc(f.displayName) + (e.private ? " " + O.badgesHTML(e) : "") + "</span>" +
          '<span class="cs-meta">' + esc(f.byline || "Brand unknown") + "</span>" +
          '<span class="cs-when">' + e.periodsInYear.map(perChip).join(", ") + "</span>" +
          (f.notes.length ? '<span class="cs-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="cs-toggle" aria-hidden="true"></span>' +
      "</button>" +
      (open ? cardDetail(e, state) : "") +
    "</li>";
  }

  function renderHistory(m, state) {
    const fresh = new Set();
    state.openYears.forEach(function (y) { if (prevYears && !prevYears.has(y)) fresh.add(y); });
    prevYears = new Set(state.openYears);
    const html = '<h1 class="olf-sr">History</h1><ol class="cs-years">' + m.years.map(function (y) {
      const open = state.openYears.has(y.year);
      const depth = Math.min(y.count - 1, 2);
      if (!open) {
        return '<li class="cs-year">' +
          '<div class="cs-stack" data-depth="' + depth + '">' +
            '<h2 class="cs-yh"><button class="cs-top" ' + O.yearAttrs(state, y.year) + ">" +
              '<span class="cs-ynum">' + y.year + "</span>" +
              '<span class="cs-ycount">' + plural(y.count, "fragrance") + (y.redactedCount ? " · " + y.redactedCount + " private" : "") + "</span>" +
              stackThumbs(y.entries) +
              '<span class="cs-hint">Open stack</span>' +
            "</button></h2>" +
          "</div></li>";
      }
      return '<li class="cs-year is-open">' +
        '<h2 class="cs-yh"><button class="cs-openbar" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="cs-ynum">' + y.year + "</span>" +
          '<span class="cs-ycount">' + plural(y.count, "fragrance") + (y.redactedCount ? " · " + y.redactedCount + " private" : "") + "</span>" +
          '<span class="cs-hint">Stack up</span>' +
        "</button></h2>" +
        '<ul class="cs-grid" id="y-' + y.year + '">' + y.entries.map(function (e, i) { return card(e, i, state, fresh.has(y.year)); }).join("") + "</ul>" +
      "</li>";
    }).join("") + "</ol>" +
    (m.gaps.length ? '<p class="cs-gap">No stacks for ' + m.gaps.join(", ") + ". Nothing was recorded those years.</p>" : "");
    prevEntry = state.openEntry;
    return html;
  }

  // ---------- To try ----------
  function memberCard(f) {
    return '<article class="cs-card cs-mcard">' +
      '<div class="cs-mhead"><span class="cs-art">' + O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) + "</span>" +
        '<span class="cs-text"><span class="cs-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
        '<span class="cs-meta">' + esc(f.byline || "Brand unknown") + "</span></span></div>" +
      '<div class="cs-mbody"><section><h4>Notes</h4>' + O.notesHTML(f, { iconSize: 18 }) + "</section>" +
        "<section><h4>Price</h4>" + O.priceHTML(f) + "</section>" +
        '<section class="cs-links">' + linksOrEmpty(f) + "</section></div>" +
    "</article>";
  }

  function renderTry(m, state) {
    const freshKey = [];
    state.openTry.forEach(function (k) { if (prevTry && !prevTry.has(k)) freshKey.push(k); });
    prevTry = new Set(state.openTry);
    return '<h1 class="olf-sr">To try</h1><ul class="cs-trygrid">' + m.tryList.map(function (t) {
      if (t.redacted) {
        const ph = O.bottleSVG({ shape: "redacted" }, { width: 30 });
        return '<li class="cs-titem"><div class="cs-stack" data-depth="' + (t.kind === "group" ? 1 : 0) + '"><div class="cs-top cs-static">' +
          '<span class="cs-thumbs" aria-hidden="true"><span class="cs-thumb">' + ph + "</span>" + (t.kind === "group" ? '<span class="cs-thumb">' + ph + "</span>" : "") + "</span>" +
          '<span class="cs-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="cs-meta">' + O.REDACTED_HINT + "</span></div></div></li>";
      }
      const open = state.openTry.has(t.key), fresh = freshKey.indexOf(t.key) !== -1;
      const id = "t-" + O.slug(t.key);
      if (t.kind === "group") {
        if (!open) {
          return '<li class="cs-titem"><div class="cs-stack" data-depth="1">' +
            '<button class="cs-top" ' + O.tryAttrs(state, t.key) + ">" +
              '<span class="cs-kicker">' + esc(t.title) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
              '<span class="cs-name">' + t.members.map(function (f) { return esc(f.displayName); }).join(" + ") + "</span>" +
              '<span class="cs-thumbs" aria-hidden="true">' + t.members.map(function (f) { return '<span class="cs-thumb">' + O.bottleSVG(f.bottle, { width: 30 }) + "</span>"; }).join("") + "</span>" +
              '<span class="cs-hint">Open pair</span>' +
            "</button></div></li>";
        }
        return '<li class="cs-titem is-open">' +
          '<button class="cs-openbar" ' + O.tryAttrs(state, t.key) + ">" +
            '<span class="cs-kicker">' + esc(t.title) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
            '<span class="cs-ycount">2 fragrances</span><span class="cs-hint">Stack up</span>' +
          "</button>" +
          '<div class="cs-pair' + (fresh ? " is-dealt" : "") + '" id="' + id + '">' +
            memberCard(t.members[0]) +
            '<div class="cs-join" aria-hidden="true"><span>' + esc(t.title) + "</span></div>" +
            memberCard(t.members[1]) +
          "</div>" +
          (state.mode === "owner" ? '<div class="cs-owner">' + O.editButton("Edit group") + "</div>" : "") +
        "</li>";
      }
      const f = t.fragrance;
      return '<li class="cs-titem cs-single' + (open ? " is-open" : "") + '">' +
        '<div class="cs-card' + (open ? " is-open" : "") + (fresh ? " is-unfolding" : "") + '">' +
          '<button class="cs-card-face" ' + O.tryAttrs(state, t.key) + ">" +
            '<span class="cs-art">' + O.bottleSVG(f.bottle, { width: open ? 44 : 56 }) + "</span>" +
            '<span class="cs-text"><span class="cs-name">' + esc(f.displayName) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
              '<span class="cs-meta">' + esc(f.byline || "Brand unknown") + "</span>" +
              (f.notes.length ? '<span class="cs-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") + "</span>" +
            '<span class="cs-toggle" aria-hidden="true"></span>' +
          "</button>" +
          (open ? '<div class="cs-detail" id="' + id + '">' +
            '<figure class="cs-fig">' + O.bottleSVG(f.bottle, { width: 120, label: f.bottleLabel }) + "<figcaption>Illustrative bottle</figcaption></figure>" +
            '<div class="cs-body"><section><h4>Notes</h4>' + O.notesHTML(f, { iconSize: 18 }) + "</section>" +
              "<section><h4>Price</h4>" + O.priceHTML(f) + "</section>" +
              '<section class="cs-links">' + linksOrEmpty(f) + "</section>" +
              (state.mode === "owner" ? '<div class="cs-owner">' + O.editButton("Edit") + "</div>" : "") +
            "</div></div>" : "") +
        "</div>" +
      "</li>";
    }).join("") + "</ul>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="cs-tag">stacks by year</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
