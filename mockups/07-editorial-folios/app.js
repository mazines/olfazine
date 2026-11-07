/* 07 Editorial folios: one magazine folio per year, an asymmetric spread of entries, each opening into a full feature. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;
  const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

  function countWords(n) { return (WORDS[n] || String(n)) + (n === 1 ? " fragrance" : " fragrances"); }
  function folioNo(n) { return "Folio " + String(n).padStart(2, "0"); }
  function yearOnlyTag(p) { return p.precision === "year" ? ' <span class="ef-q">year only, months unknown</span>' : ""; }

  // Column spans for the asymmetric grid. Cycles so the spread never looks like a uniform list.
  const SPANS = [7, 5, 5, 7, 6, 6, 8, 4];

  // ---------- History ----------
  function feature(e, state) {
    const f = e.fragrance, id = O.entryId(e.year, e.key);
    return '<div class="ef-feature" id="e-' + O.slug(id) + '">' +
      '<figure class="ef-feature-fig">' + O.bottleSVG(f.bottle, { width: 220, label: f.bottleLabel }) +
        "<figcaption>Illustrative bottle, not a product photograph</figcaption></figure>" +
      '<div class="ef-feature-body">' +
        (O.badgesHTML(e) ? '<p class="ef-badges">' + O.badgesHTML(e) + "</p>" : "") +
        (e.memory
          ? '<blockquote class="ef-pull"><p>' + esc(e.memory) + "</p></blockquote>"
          : '<p class="ef-pull ef-pull-empty olf-empty">No memory recorded.</p>') +
        (e.sourceNote ? '<p class="ef-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
        '<div class="ef-sidebar">' +
          '<section><h4 class="ef-smallcaps">Worn</h4><ul class="ef-periods">' + e.periods.map(function (p) {
            return '<li class="ef-p-' + p.precision + '">' + esc(p.longText) + yearOnlyTag(p) + "</li>";
          }).join("") + "</ul>" +
          (e.allYears.length > 1 ? '<p class="ef-also">Also in the ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + " folio.</p>" : "") +
          "</section>" +
          '<section><h4 class="ef-smallcaps">Notes</h4>' + O.notesHTML(f) + "</section>" +
        "</div>" +
        '<div class="ef-links">' + O.linksHTML(f) + "</div>" +
        (state.mode === "owner" ? '<div class="ef-owner">' + O.editButton("Edit entry") + "</div>" : "") +
      "</div></div>";
  }

  function entry(e, i, state) {
    const span = SPANS[i % SPANS.length], side = i % 2 ? "right" : "left";
    if (e.redacted) {
      return '<article class="ef-entry ef-entry-redacted" style="--span:4">' +
        '<div class="ef-entry-static">' +
          '<span class="ef-entry-fig">' + O.bottleSVG({ shape: "redacted" }, { width: 72 }) + "</span>" +
          '<span class="ef-entry-text"><span class="ef-headline olf-redacted">' + O.REDACTED_LABEL + '</span><span class="ef-dek">' + O.REDACTED_HINT + "</span></span>" +
        "</div></article>";
    }
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    return '<article class="ef-entry ef-entry-' + side + (open ? " is-open" : "") + '" style="--span:' + (open ? 12 : span) + '">' +
      '<button class="ef-entry-btn" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="ef-entry-fig">' + O.bottleSVG(f.bottle, { width: open ? 96 : (span >= 7 ? 120 : 96) }) + "</span>" +
        '<span class="ef-entry-text">' +
          '<span class="ef-period ef-smallcaps">' + esc(e.periodsInYear.map(function (p) { return p.text + (p.precision === "year" ? " (year only)" : ""); }).join(", ")) + "</span>" +
          '<span class="ef-headline">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="ef-dek">' + esc(f.byline) + "</span>" : '<span class="ef-dek ef-dek-none">Brand not recorded</span>') +
          (f.notes.length ? '<span class="ef-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
          '<span class="ef-cue" aria-hidden="true">' + (open ? "Close feature" : "Read feature") + "</span>" +
        "</span>" +
      "</button>" +
      (open ? feature(e, state) : "") +
      "</article>";
  }

  function folio(y, n, state) {
    const open = state.openYears.has(y.year);
    return '<section class="ef-folio' + (open ? " is-open" : "") + '">' +
      '<h2 class="ef-folio-h"><button class="ef-folio-btn" ' + O.yearAttrs(state, y.year) + ">" +
        '<span class="ef-folio-no ef-smallcaps">' + folioNo(n) + "</span>" +
        '<span class="ef-numeral">' + y.year + "</span>" +
        '<span class="ef-folio-dek">' + countWords(y.count) + (y.redactedCount ? ", " + y.redactedCount + " private" : "") +
          '<span class="ef-folio-cue" aria-hidden="true">' + (open ? "Close spread" : "Open spread") + "</span></span>" +
      "</button></h2>" +
      (open ? '<div class="ef-spread" id="y-' + y.year + '">' + y.entries.map(function (e, i) { return entry(e, i, state); }).join("") + "</div>" : "") +
      "</section>";
  }

  function renderHistory(m, state) {
    const total = m.years.length;
    let html = '<h1 class="olf-sr">History</h1><div class="ef-folios">';
    m.years.forEach(function (y, i) {
      html += folio(y, total - i, state);
      const next = m.years[i + 1];
      if (next && y.year - next.year > 1) {
        const from = next.year + 1, to = y.year - 1;
        html += '<p class="ef-interlude ef-smallcaps">' + (from === to ? from : from + " – " + to) + " · No records kept</p>";
      }
    });
    return html + "</div>";
  }

  // ---------- To try ----------
  function memberPage(f, side) {
    return '<div class="ef-page ef-page-' + side + '">' +
      '<span class="ef-page-fig">' + O.bottleSVG(f.bottle, { width: 120 }) + "</span>" +
      '<span class="ef-headline">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
      (f.byline ? '<span class="ef-dek">' + esc(f.byline) + "</span>" : "") +
    "</div>";
  }

  function memberDetail(f) {
    return '<div class="ef-member">' +
      '<figure class="ef-member-fig">' + O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) + "</figure>" +
      '<div class="ef-member-body">' +
        '<h4 class="ef-member-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</h4>" +
        (f.byline ? '<p class="ef-dek">' + esc(f.byline) + "</p>" : "") +
        O.notesHTML(f, { limit: 7 }) + O.priceHTML(f) + '<div class="ef-links">' + O.linksHTML(f) + "</div>" +
      "</div></div>";
  }

  function tryItem(t, state) {
    if (t.redacted) {
      if (t.kind === "group") {
        return '<article class="ef-try ef-try-pair ef-entry-redacted"><div class="ef-pair ef-pair-static">' +
          '<div class="ef-page ef-page-left"><span class="ef-page-fig">' + O.bottleSVG({ shape: "redacted" }, { width: 96 }) + "</span></div>" +
          '<span class="ef-kicker"><span class="olf-redacted">' + O.REDACTED_LABEL + "</span><br>" + O.REDACTED_HINT + "</span>" +
          '<div class="ef-page ef-page-right"><span class="ef-page-fig">' + O.bottleSVG({ shape: "redacted" }, { width: 96 }) + "</span></div>" +
          "</div></article>";
      }
      return '<article class="ef-try ef-try-single ef-entry-redacted"><div class="ef-entry-static">' +
        '<span class="ef-entry-fig">' + O.bottleSVG({ shape: "redacted" }, { width: 72 }) + "</span>" +
        '<span class="ef-entry-text"><span class="ef-headline olf-redacted">' + O.REDACTED_LABEL + '</span><span class="ef-dek">' + O.REDACTED_HINT + "</span></span>" +
        "</div></article>";
    }
    const open = state.openTry.has(t.key);
    const owner = state.mode === "owner";
    if (t.kind === "group") {
      return '<article class="ef-try ef-try-pair' + (open ? " is-open" : "") + '">' +
        '<button class="ef-pair" ' + O.tryAttrs(state, t.key) + ">" +
          memberPage(t.members[0], "left") +
          '<span class="ef-kicker">' + esc(t.title) + (t.private ? " " + O.badgesHTML(t) : "") +
            '<span class="ef-cue" aria-hidden="true">' + (open ? "Close spread" : "Open spread") + "</span></span>" +
          memberPage(t.members[1], "right") +
        "</button>" +
        (open ? '<div class="ef-pair-detail" id="t-' + O.slug(t.key) + '">' +
          '<p class="ef-standfirst">Two fragrances from the wishlist, kept as a pair. Each keeps its own details and Shop link.</p>' +
          '<div class="ef-members">' + t.members.map(memberDetail).join("") + "</div>" +
          (owner ? '<div class="ef-owner">' + O.editButton("Edit group") + "</div>" : "") + "</div>" : "") +
        "</article>";
    }
    const f = t.fragrance;
    return '<article class="ef-try ef-try-single ef-entry-right' + (open ? " is-open" : "") + '">' +
      '<button class="ef-entry-btn" ' + O.tryAttrs(state, t.key) + ">" +
        '<span class="ef-entry-fig">' + O.bottleSVG(f.bottle, { width: 110 }) + "</span>" +
        '<span class="ef-entry-text"><span class="ef-period ef-smallcaps">On the wishlist</span>' +
          '<span class="ef-headline">' + esc(f.displayName) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
          (f.byline ? '<span class="ef-dek">' + esc(f.byline) + "</span>" : "") +
          (f.notes.length ? '<span class="ef-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
          '<span class="ef-cue" aria-hidden="true">' + (open ? "Close" : "Read more") + "</span>" +
        "</span></button>" +
      (open ? '<div class="ef-pair-detail" id="t-' + O.slug(t.key) + '"><div class="ef-members ef-members-one">' + memberDetail(f) + "</div>" +
        (owner ? '<div class="ef-owner">' + O.editButton("Edit") + "</div>" : "") + "</div>" : "") +
      "</article>";
  }

  function renderTry(m, state) {
    return '<h1 class="olf-sr">To try</h1>' +
      '<section class="ef-folio ef-folio-wish is-open">' +
        '<h2 class="ef-folio-h"><span class="ef-folio-static">' +
          '<span class="ef-folio-no ef-smallcaps">Back of the book</span>' +
          '<span class="ef-numeral">Wishlist</span>' +
          '<span class="ef-folio-dek">Not yet worn. Shop links open a search. Nothing here enters the History.</span>' +
        "</span></h2>" +
        '<div class="ef-wish">' + m.tryList.map(function (t) { return tryItem(t, state); }).join("") + "</div>" +
      "</section>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="ef-issue ef-smallcaps">The collected issues</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
