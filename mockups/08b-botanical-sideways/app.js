/* 08b Botanical tree, sideways growth.
 * Desktop: the trunk runs down the left edge and off the page. Each year's fragrances branch to the
 * right on a bracket stem; an open fragrance leafs out further right, with its detail card beside the
 * leaves. Every year is open by default. Phones use the vertical 08 tree.
 */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc, BT = window.OLF_BT;
  const phone = window.matchMedia("(max-width: 899px)");
  const CAVEAT = '<p class="olf-caveat">Sample notes, unverified. Variant not confirmed.</p>';

  function leaves(f) {
    if (!f.notes.length) {
      return '<ul class="bs-leaves bs-bare"><li class="bs-leaf"><span class="bs-bud-closed" aria-hidden="true"></span>' + O.notesHTML(f) + "</li></ul>";
    }
    return '<ul class="bs-leaves" aria-label="Notes">' + f.notes.map(function (n) {
      return '<li class="bs-leaf olf-fam-' + O.family(n) + '"><span class="bt-leaf-icon">' + O.noteIcon(n, 24) + "</span>" +
        '<span class="bs-leaf-label">' + esc(n) + "</span></li>";
    }).join("") + "</ul>" + CAVEAT;
  }

  function when(p) {
    return p.inYear === null
      ? '<span class="bs-when bs-when-year">' + esc(p.text) + ' <span class="bt-q">month unknown</span></span>'
      : '<span class="bs-when">' + esc(p.text) + "</span>";
  }

  function redactedCell() {
    return '<div class="bs-cell bt-static"><span class="bt-bud">' + O.bottleSVG({ shape: "redacted" }, { width: 26 }) + "</span>" +
      '<span class="bs-text"><span class="bs-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bt-by">' + O.REDACTED_HINT + "</span></span></div>";
  }

  // ---------- History ----------
  function detailCard(e, state) {
    const f = e.fragrance;
    const others = e.allYears.filter(function (y) { return y !== e.year; });
    return '<div class="bs-card">' +
      '<figure class="bt-fig">' + O.bottleSVG(f.bottle, { width: 84, label: f.bottleLabel }) + "</figure>" +
      '<div class="bs-card-body">' +
        (state.mode === "owner" ? '<div class="bt-badges">' + O.badgesHTML(e) + "</div>" : "") +
        '<h4 class="bt-sc bs-h">Worn</h4><ul class="bt-plist">' + e.periods.map(function (p) {
          return p.inYear === null
            ? '<li class="bt-p-year">' + esc(p.longText) + ' <span class="bt-q">month not recorded</span></li>'
            : "<li>" + esc(p.longText) + "</li>";
        }).join("") + "</ul>" +
        (others.length ? '<p class="bt-also">Also grows from ' + others.join(", ") + ".</p>" : "") +
        '<h4 class="bt-sc bs-h">Memory</h4>' + (e.memory ? '<p class="bt-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
        (e.sourceNote ? '<p class="bt-also">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
        '<div class="bs-links">' + O.linksHTML(f) + "</div>" +
        (state.mode === "owner" ? '<div class="bt-owner">' + O.editButton("Edit entry") + "</div>" : "") +
      "</div></div>";
  }

  function branch(e, state) {
    if (e.redacted) return '<li class="bs-branch bs-redacted">' + redactedCell() + "</li>";
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    const uncertain = e.periodsInYear.every(function (p) { return p.inYear === null; });
    return '<li class="bs-branch' + (uncertain ? " bs-uncertain" : "") + (open ? " is-open" : "") + '">' +
      '<button class="bs-cell" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="bt-bud">' + O.bottleSVG(f.bottle, { width: 26 }) + "</span>" +
        '<span class="bs-text">' +
          '<span class="bs-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
          (state.mode === "owner" && e.private ? '<span class="bt-badges">' + O.badgesHTML(e) + "</span>" : "") +
          '<span class="bs-whens">' + e.periodsInYear.map(when).join("") + "</span>" +
        "</span>" +
        '<span class="bt-sign" aria-hidden="true"></span>' +
      "</button>" +
      (open ? '<div class="bs-growth" id="e-' + O.slug(id) + '">' + '<div class="bs-leafcol">' + leaves(f) + "</div>" + detailCard(e, state) + "</div>" : "") +
    "</li>";
  }

  function renderHistoryWide(m, state) {
    return '<h1 class="olf-sr">History</h1><ol class="bs-trunk">' + m.years.map(function (y) {
      const open = state.openYears.has(y.year);
      return '<li class="bs-year' + (open ? " is-open" : "") + '">' +
        '<h2 class="bs-year-h"><button class="bs-node" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="bt-knot" aria-hidden="true"></span><span class="bs-year-num">' + y.year + "</span>" +
        "</button></h2>" +
        (open ? '<ul class="bs-branches" id="y-' + y.year + '">' + y.entries.map(function (e) { return branch(e, state); }).join("") + "</ul>" : "") +
      "</li>";
    }).join("") + "</ol>";
  }

  // ---------- To try ----------
  function memberBlock(f) {
    return '<li class="bs-member">' +
      '<div class="bs-member-head"><span class="bt-bud">' + O.bottleSVG(f.bottle, { width: 24 }) + "</span>" +
        '<span class="bs-text"><span class="bs-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
        (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") + "</span></div>" +
      '<div class="bs-growth bs-growth-member"><div class="bs-leafcol">' + leaves(f) + "</div>" +
        '<div class="bs-card"><figure class="bt-fig">' + O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) + "</figure>" +
          '<div class="bs-card-body"><h4 class="bt-sc bs-h">Price</h4>' + O.priceHTML(f) + '<div class="bs-links">' + O.linksHTML(f) + "</div></div></div>" +
      "</div></li>";
  }

  function renderTryWide(m, state) {
    const owner = state.mode === "owner";
    const items = m.tryList.map(function (t) {
      if (t.redacted) return '<li class="bs-branch bs-redacted">' + redactedCell() + "</li>";
      const open = state.openTry.has(t.key), id = "t-" + O.slug(t.key), group = t.kind === "group";
      const f = group ? null : t.fragrance;
      let growth = "";
      if (open && group) {
        growth = '<div class="bs-growth bs-fork" id="' + id + '"><ul class="bs-members">' + t.members.map(memberBlock).join("") + "</ul>" +
          (owner ? '<div class="bt-owner">' + O.editButton("Edit group") + "</div>" : "") + "</div>";
      } else if (open) {
        growth = '<div class="bs-growth" id="' + id + '"><div class="bs-leafcol">' + leaves(f) + "</div>" +
          '<div class="bs-card"><figure class="bt-fig">' + O.bottleSVG(f.bottle, { width: 84, label: f.bottleLabel }) + "</figure>" +
            '<div class="bs-card-body"><h4 class="bt-sc bs-h">Price</h4>' + O.priceHTML(f) + '<div class="bs-links">' + O.linksHTML(f) + "</div>" +
            (owner ? '<div class="bt-owner">' + O.editButton("Edit") + "</div>" : "") + "</div></div></div>";
      }
      return '<li class="bs-branch' + (open ? " is-open" : "") + '">' +
        '<button class="bs-cell" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="bt-bud' + (group ? " bt-bud-pair" : "") + '">' +
            (group ? t.members.map(function (x) { return O.bottleSVG(x.bottle, { width: 20 }); }).join("") : O.bottleSVG(f.bottle, { width: 26 })) + "</span>" +
          '<span class="bs-text">' +
            (group ? '<span class="bt-kicker bt-sc">' + esc(t.title) + "</span>" : "") +
            '<span class="bs-name">' + (group ? t.members.map(function (x) { return esc(x.displayName); }).join(' <span class="bt-amp">&amp;</span> ') : esc(f.displayName)) + "</span>" +
            (!group && f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
            (owner ? '<span class="bt-badges">' + O.badgesHTML(t) + "</span>" : "") +
          "</span>" +
          '<span class="bt-sign" aria-hidden="true"></span>' +
        "</button>" + growth + "</li>";
    });
    return '<h1 class="olf-sr">To try</h1><div class="bs-trunk bs-seedbed"><div class="bs-year is-open">' +
      '<p class="bs-node bs-seed-node"><span class="bt-knot bt-knot-seed" aria-hidden="true"></span>' +
        '<span class="bs-seed-title">Seedlings</span></p>' +
      '<ul class="bs-branches">' + items.join("") + "</ul></div></div>";
  }

  const api = O.mount({
    openAllYears: true,
    singleTry: true,
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="bt-tag">a scent herbarium</span>',
    renderHistory: function (m, s) { return phone.matches ? BT.renderHistory(m, s) : renderHistoryWide(m, s); },
    renderTry: function (m, s) { return phone.matches ? BT.renderTry(m, s) : renderTryWide(m, s); },
  });
  phone.addEventListener("change", function () { api.rerender(); });
})();
