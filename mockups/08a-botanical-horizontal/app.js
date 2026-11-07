/* 08a Botanical tree, horizontal trunk.
 * Desktop: years are knots along a horizontal trunk, oldest to newest, left to right. Each year's
 * fragrances hang below its knot. An open fragrance unfolds a full-width panel under the canopy,
 * with its notes strung as leaves along a horizontal stem. Phones use the vertical 08 tree.
 */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc, BT = window.OLF_BT;
  // Below 1200px nine-plus year columns get too narrow: use the vertical tree.
  const phone = window.matchMedia("(max-width: 1199px)");

  // Notes hang from one horizontal stem, each on its own short twig. Tiers only when the source gives them.
  function leafRow(f, names) {
    return '<ul class="bh-leafline" aria-label="Notes">' + names.map(function (n) {
      return '<li class="bh-leaf olf-fam-' + O.family(n) + '"><span class="bt-leaf-icon">' + O.noteArt(f, n, 26) + "</span>" +
        '<span class="bh-leaf-label">' + esc(n) + "</span></li>";
    }).join("") + "</ul>";
  }
  function leafLine(f) {
    if (!f.notes.length) {
      return '<div class="bh-leafline bh-bare"><span class="bh-bud-closed" aria-hidden="true"></span>' + O.notesHTML(f) + "</div>";
    }
    if (f.pyramid) {
      return '<div class="bh-tiers">' + Object.keys(f.pyramid).map(function (tier) {
        return '<div class="bh-tier"><h4 class="bt-sc bh-tier-h">' + esc(tier) + "</h4>" +
          leafRow(f, f.pyramid[tier].map(function (n) { return n.name; })) + "</div>";
      }).join("") + "</div>" + O.notesCaveat(f);
    }
    return leafRow(f, f.notes) + O.notesCaveat(f);
  }

  function when(p) {
    return p.inYear === null
      ? '<span class="bh-when bh-when-year">' + esc(p.text) + ' <span class="bt-q">month unknown</span></span>'
      : '<span class="bh-when">' + esc(p.text) + "</span>";
  }

  // ---------- History ----------
  function twig(e, state) {
    if (e.redacted) {
      return '<li class="bh-twig bh-twig-redacted"><div class="bh-twig-btn bt-static">' +
        '<span class="bt-bud">' + O.bottleSVG({ shape: "redacted" }, { width: 24 }) + "</span>" +
        '<span class="bh-ttext"><span class="bh-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bt-by">' + O.REDACTED_HINT + "</span></span></div></li>";
    }
    const f = e.fragrance, open = state.openEntry === O.entryId(e.year, e.key);
    const uncertain = e.periodsInYear.every(function (p) { return p.inYear === null; });
    return '<li class="bh-twig' + (uncertain ? " bh-uncertain" : "") + (open ? " is-open" : "") + '">' +
      '<button class="bh-twig-btn" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="bt-bud">' + O.bottleArt(f, { width: 24 }) + "</span>" +
        '<span class="bh-ttext">' +
          '<span class="bh-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
          (state.mode === "owner" && e.private ? '<span class="bt-badges">' + O.badgesHTML(e) + "</span>" : "") +
          (e.memory ? "" : '<span class="bh-whens">' + e.periodsInYear.map(when).join("") + "</span>") +
        "</span>" +
      "</button></li>";
  }

  function panel(e, state) {
    const f = e.fragrance, id = O.entryId(e.year, e.key);
    return '<section class="bh-panel" id="e-' + O.slug(id) + '" data-col="' + e.year + '" aria-label="' + esc(f.displayName) + ' details">' +
      '<div class="bh-panel-head"><span class="bh-panel-name">' + esc(f.displayName) + "</span>" +
        (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
        (state.mode === "owner" ? '<span class="bt-badges">' + O.badgesHTML(e) + "</span>" : "") +
      "</div>" +
      leafLine(f) +
      '<div class="bh-panel-body">' +
        '<figure class="bt-fig">' + O.bottleArt(f, { width: 96, label: f.bottleLabel }) + "</figure>" +
        '<div class="bh-col bh-col-wide">' + (e.memory
          ? '<h4 class="bt-sc bh-h">Memory</h4><p class="bt-memory">' + esc(e.memory) + "</p>"
          : '<h4 class="bt-sc bh-h">Worn</h4><ul class="bt-plist">' + e.periods.map(function (p) { return "<li>" + esc(p.longText) + "</li>"; }).join("") + "</ul>") +
          (e.sourceNote ? '<p class="bt-also">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
        "</div>" +
        '<div class="bh-col">' + O.linksHTML(f) + (state.mode === "owner" ? '<div class="bt-owner">' + O.editButton("Edit entry") + "</div>" : "") + "</div>" +
      "</div></section>";
  }

  function renderHistoryWide(m, state) {
    let openEntry = null;
    // Chronological left to right: oldest year first.
    const cols = m.years.slice().reverse().map(function (y) {
      const open = state.openYears.has(y.year);
      y.entries.forEach(function (e) { if (!e.redacted && state.openEntry === O.entryId(e.year, e.key)) openEntry = e; });
      return '<li class="bh-year' + (open ? " is-open" : "") + '" data-col="' + y.year + '">' +
        '<h2 class="bh-year-h"><button class="bh-knot-btn" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="bt-knot" aria-hidden="true"></span><span class="bh-year-num">' + y.year + "</span>" +
        "</button></h2>" +
        (open ? '<ul class="bh-twigs" id="y-' + y.year + '">' + y.entries.map(function (e) { return twig(e, state); }).join("") + "</ul>" : "") +
      "</li>";
    }).join("");
    return '<h1 class="olf-sr">History</h1><div class="bh-canopy"><ol class="bh-trunk" style="--n:' + m.years.length + '">' + cols + "</ol>" +
      (openEntry ? panel(openEntry, state) : "") + "</div>";
  }

  // ---------- To try: plain tiles; "wear together" is only a note ----------
  function wearNote(t) {
    return t.wearWith && t.wearWith.length ? '<span class="bh-wear">Wear together with ' + esc(t.wearWith.join(" and ")) + "</span>" : "";
  }

  function tryPanel(t, state) {
    const f = t.fragrance, owner = state.mode === "owner";
    return '<section class="bh-panel" id="t-' + O.slug(t.key) + '" data-col="' + esc(t.key) + '" aria-label="' + esc(f.displayName) + ' details">' +
      '<div class="bh-panel-head"><span class="bh-panel-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
        (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
        (owner ? '<span class="bt-badges">' + O.badgesHTML(t) + "</span>" : "") + "</div>" +
      (t.wearWith && t.wearWith.length ? '<p class="bh-wear bh-wear-panel">Wear together with ' + esc(t.wearWith.join(" and ")) + "</p>" : "") +
      leafLine(f) +
      '<div class="bh-member-body"><figure class="bt-fig">' + O.bottleArt(f, { width: 72, label: f.bottleLabel }) + "</figure>" +
        '<div class="bh-col">' + O.priceHTML(f) + O.linksHTML(f) + (owner ? '<div class="bt-owner">' + O.editButton("Edit") + "</div>" : "") + "</div></div>" +
    "</section>";
  }

  function renderTryWide(m, state) {
    let openItem = null;
    const owner = state.mode === "owner";
    const cols = m.tryList.map(function (t) {
      if (t.redacted) {
        return '<li class="bh-seed bh-twig-redacted"><div class="bh-twig-btn bt-static"><span class="bt-bud">' + O.bottleSVG({ shape: "redacted" }, { width: 24 }) + "</span>" +
          '<span class="bh-ttext"><span class="bh-name olf-redacted">' + O.REDACTED_LABEL + '</span><span class="bt-by">' + O.REDACTED_HINT + "</span></span></div></li>";
      }
      const open = state.openTry.has(t.key), f = t.fragrance;
      if (open) openItem = t;
      return '<li class="bh-seed' + (open ? " is-open" : "") + '" data-col="' + esc(t.key) + '">' +
        '<button class="bh-twig-btn" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="bt-bud">' + O.bottleArt(f, { width: 24 }) + "</span>" +
          '<span class="bh-ttext">' +
            '<span class="bh-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
            (f.byline ? '<span class="bt-by">' + esc(f.byline) + "</span>" : "") +
            (owner ? '<span class="bt-badges">' + O.badgesHTML(t) + "</span>" : "") +
            wearNote(t) +
          "</span>" +
        "</button></li>";
    }).join("");
    return '<h1 class="olf-sr">To try</h1><div class="bh-canopy bh-seedbed">' +
      '<ol class="bh-seeds">' + cols + "</ol>" + (openItem ? tryPanel(openItem, state) : "") + "</div>";
  }

  // Point each open panel's stem at the column it belongs to.
  function aimPanels(panels) {
    [panels.history, panels.try].forEach(function (p) {
      const panelEl = p.querySelector(".bh-panel");
      if (!panelEl) return;
      const col = p.querySelector('[data-col="' + panelEl.dataset.col + '"]:not(.bh-panel)');
      const open = p.querySelector(".bh-twig.is-open .bh-twig-btn, .bh-seed.is-open .bh-twig-btn");
      const target = (panelEl.closest(".bh-seedbed") ? col : open) || col;
      if (!target || !target.getBoundingClientRect) return;
      const x = target.getBoundingClientRect().left + Math.min(28, target.offsetWidth / 2) - panelEl.getBoundingClientRect().left;
      if (x > 0) panelEl.style.setProperty("--stem-x", x + "px");
    });
  }

  // Live site pages set OLF_PRODUCTION (no mockup bar) and OLF_VIEW ("public", or "owner" for /admin/).
  const api = O.mount({
    demo: !window.OLF_PRODUCTION,
    mode: window.OLF_VIEW,
    openAllYears: true,
    collapseAll: true,
    singleTry: true,
    brandHTML: '<span class="olf-wordmark">Olfazine</span>',
    renderHistory: function (m, s) { return phone.matches ? BT.renderHistory(m, s) : renderHistoryWide(m, s); },
    renderTry: function (m, s) { return phone.matches ? BT.renderTry(m, s) : renderTryWide(m, s); },
    afterRender: function (m, s, panels) { if (!phone.matches) aimPanels(panels); },
  });
  phone.addEventListener("change", function () { api.rerender(); });
  window.addEventListener("resize", function () { if (!phone.matches) aimPanels({ history: document.getElementById("olf-panel-history"), try: document.getElementById("olf-panel-try") }); });
})();
