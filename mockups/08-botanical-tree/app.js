/* 08 Botanical tree: trunk (year) -> branch (fragrance) -> leaves (notes).
 * Everything sits in normal document flow. Twigs are small inline SVG curves; stems are CSS lines. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  function twig(cls, dashed) {
    return '<svg class="bt-twig ' + cls + '" viewBox="0 0 56 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<path d="M1 0 C 1.5 16, 16 27, 55 27" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" vector-effect="non-scaling-stroke"' +
      (dashed ? ' stroke-dasharray="1.5 5"' : "") + "/></svg>";
  }

  function leaves(f, plain) {
    if (!f.notes.length) {
      // Bare branch: a dashed twig ending in a closed bud, plus the shared empty text.
      return '<ul class="bt-leaves bt-bare' + (plain ? " bt-leaves-plain" : "") + '"><li class="bt-leaf bt-leaf-bare">' +
        (plain ? "" : twig("bt-twig-leaf", true)) + '<span class="bt-stub" aria-hidden="true"></span>' + O.notesHTML(f) + "</li></ul>";
    }
    return '<ul class="bt-leaves' + (plain ? " bt-leaves-plain" : "") + '" aria-label="Notes">' + f.notes.map(function (n) {
      return '<li class="bt-leaf olf-fam-' + O.family(n) + '">' + (plain ? "" : twig("bt-twig-leaf")) +
        '<span class="bt-leaf-icon">' + O.noteArt(f, n, 26) + '</span><span class="bt-leaf-label">' + esc(n) + "</span></li>";
    }).join("") + "</ul>" + O.notesCaveat(f);
  }

  function when(p) {
    return p.inYear === null
      ? '<span class="bt-when bt-when-year">' + esc(p.text) + ' <span class="bt-q">month unknown</span></span>'
      : '<span class="bt-when">' + esc(p.text) + "</span>";
  }

  function redactedBranch() {
    return '<li class="bt-branch bt-branch-redacted">' + twig("bt-twig-branch") +
      '<div class="bt-branch-btn bt-static"><span class="bt-bud">' + O.bottleSVG({ shape: "redacted" }, { width: 28 }) + "</span>" +
      '<span class="bt-btext"><span class="bt-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bt-by">' + O.REDACTED_HINT + "</span></span></div></li>";
  }

  // ---------- History ----------
  function branch(e, state) {
    if (e.redacted) return redactedBranch();
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    const uncertain = e.periodsInYear.every(function (p) { return p.inYear === null; });
    let sub = "";
    if (open) {
      sub = '<div class="bt-sub" id="e-' + O.slug(id) + '"><div class="bt-sub-grid">' +
        '<div class="bt-leafcol">' + leaves(f) + "</div>" +
        '<div class="bt-detail">' +
          '<figure class="bt-fig">' + O.bottleArt(f, { width: 92, label: f.bottleLabel }) + "</figure>" +
          '<div class="bt-dbody">' +
            (state.mode === "owner" ? '<div class="bt-badges">' + O.badgesHTML(e) + "</div>" : "") +
            (e.memory
              ? '<h4 class="bt-sc">Memory</h4><p class="bt-memory">' + esc(e.memory) + "</p>"
              : '<h4 class="bt-sc">Worn</h4><ul class="bt-plist">' + e.periods.map(function (p) { return "<li>" + esc(p.longText) + "</li>"; }).join("") + "</ul>") +
            (e.sourceNote ? '<p class="bt-also">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
            '<div class="bt-links">' + O.linksHTML(f) + "</div>" +
            (state.mode === "owner" ? '<div class="bt-owner">' + O.editButton("Edit entry") + "</div>" : "") +
          "</div>" +
        "</div>" +
      "</div></div>";
    }
    return '<li class="bt-branch' + (uncertain ? " bt-uncertain" : "") + (open ? " is-open" : "") + '">' +
      twig("bt-twig-branch", uncertain) +
      '<button class="bt-branch-btn" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="bt-bud">' + O.bottleArt(f, { width: 28 }) + "</span>" +
        '<span class="bt-btext">' +
          '<span class="bt-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
          (state.mode === "owner" && e.private ? '<span class="bt-badges">' + O.badgesHTML(e) + "</span>" : "") +
          (e.memory ? '<span class="bt-memo">' + esc(e.memory) + "</span>" : '<span class="bt-whens">' + e.periodsInYear.map(when).join("") + "</span>") +
          (f.notes.length ? '<span class="bt-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="bt-sign" aria-hidden="true"></span>' +
      "</button>" + sub + "</li>";
  }

  function renderHistory(m, state) {
    let out = '<h1 class="olf-sr">History</h1><ol class="bt-trunk">';
    m.years.forEach(function (y) {
      const open = state.openYears.has(y.year);
      out += '<li class="bt-year' + (open ? " is-open" : "") + '">' +
        '<h2 class="bt-year-h"><button class="bt-node" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="bt-knot" aria-hidden="true"></span>' +
          '<span class="bt-year-num">' + y.year + "</span>" +
        "</button></h2>" +
        (open ? '<ul class="bt-branches" id="y-' + y.year + '">' + y.entries.map(function (e) { return branch(e, state); }).join("") + "</ul>" : "") +
      "</li>";
    });
    // No roots: the trunk runs off the bottom of the page, as if the tree continues.
    return out + "</ol>";
  }

  // ---------- To try: plain tiles; "wear together" is only a note ----------
  function renderTry(m, state) {
    const items = m.tryList.map(function (t) {
      if (t.redacted) return redactedBranch();
      const open = state.openTry.has(t.key), id = "t-" + O.slug(t.key);
      const owner = state.mode === "owner", f = t.fragrance;
      const wear = t.wearWith && t.wearWith.length ? "Wear together with " + esc(t.wearWith.join(" and ")) : "";
      return '<li class="bt-branch' + (open ? " is-open" : "") + '">' + twig("bt-twig-branch") +
        '<button class="bt-branch-btn" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="bt-bud">' + O.bottleArt(f, { width: 28 }) + "</span>" +
          '<span class="bt-btext"><span class="bt-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
            (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
            (owner ? '<span class="bt-badges">' + O.badgesHTML(t) + "</span>" : "") +
            (wear ? '<span class="bt-wear">' + wear + "</span>" : "") +
          "</span>" +
          '<span class="bt-sign" aria-hidden="true"></span>' +
        "</button>" +
        (open ? '<div class="bt-sub" id="' + id + '"><div class="bt-sub-grid">' +
          '<div class="bt-leafcol">' + leaves(f) + "</div>" +
          '<div class="bt-detail"><figure class="bt-fig">' + O.bottleArt(f, { width: 92, label: f.bottleLabel }) + "</figure>" +
            '<div class="bt-dbody">' + O.priceHTML(f) +
              '<div class="bt-links">' + O.linksHTML(f) + "</div>" +
              (owner ? '<div class="bt-owner">' + O.editButton("Edit") + "</div>" : "") +
            "</div></div>" +
        "</div></div>" : "") +
      "</li>";
    });
    return '<h1 class="olf-sr">To try</h1><div class="bt-seedlings">' +
      '<ul class="bt-branches bt-seed-branches">' + items.join("") + "</ul></div>";
  }

  // Horizontal variants (08a, 08b) reuse these renderers as their phone layout.
  window.OLF_BT = { renderHistory: renderHistory, renderTry: renderTry, leaves: leaves, twig: twig, when: when };
  if (window.OLF_BT_NO_MOUNT) return;

  O.mount({
    openAllYears: true,
    brandHTML: '<span class="olf-wordmark">Olfazine</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
