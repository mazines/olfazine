/* 06 Fragrance index: a book index. Dense rows with leaders, tree branches on expand. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;

  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }

  function perText(p) {
    const unsure = p.inYear === null;
    return '<span class="fi-per' + (unsure ? " is-unsure" : "") + '">' + esc(p.text) +
      (unsure ? ' <span class="fi-q">year only</span>' : "") + "</span>";
  }

  function notesLine(f) {
    if (!f.notes.length) return '<span class="fi-notes fi-notes-none">' + (f.unresolved ? "unresolved" : "notes not sourced") + "</span>";
    return '<span class="fi-notes">' + esc(f.notes.slice(0, 3).join(", ").toLowerCase()) + "</span>";
  }

  // Tree branches. Lines are CSS borders, so screen readers hear only the list content.
  function node(label, children, cls) {
    return '<li class="fi-node' + (cls ? " " + cls : "") + '"><span class="fi-label">' + label + "</span>" +
      (children ? '<ul class="fi-tree">' + children + "</ul>" : "") + "</li>";
  }
  function leaf(html, cls) { return '<li class="fi-leaf' + (cls ? " " + cls : "") + '">' + html + "</li>"; }

  function notesBranch(f) {
    if (!f.notes.length) return node("Notes", leaf(O.notesHTML(f)));
    return node("Notes", f.notes.map(function (n) {
      return leaf('<span class="fi-note olf-fam-' + O.family(n) + '">' + O.noteIcon(n, 16) + "<span>" + esc(n) + "</span></span>");
    }).join("") + leaf('<span class="olf-caveat">Sample notes, unverified. Variant not confirmed.</span>', "fi-caveat"));
  }

  function linksBranch(f) {
    const l = O.linksHTML(f);
    return node("Links", leaf(l || '<span class="olf-empty">No verified links.</span>'));
  }

  function entryBranches(e, state) {
    const f = e.fragrance;
    const worn = e.periods.map(function (p) {
      const unsure = p.precision === "year";
      return leaf('<span class="fi-per' + (unsure ? " is-unsure" : "") + '">' + esc(p.longText) + "</span>" +
        (unsure ? ' <span class="fi-q">months not recorded</span>' : ""));
    }).join("") +
      (e.allYears.length > 1 ? leaf('<span class="fi-see">see also ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + "</span>") : "");
    const memory = (e.memory ? leaf('<span class="fi-memory">' + esc(e.memory) + "</span>") : leaf('<span class="olf-empty">No memory recorded.</span>')) +
      (e.sourceNote ? leaf('<span class="fi-source">Source wording (owner only): ' + esc(e.sourceNote) + "</span>") : "");
    return '<div class="fi-expand" id="e-' + O.slug(O.entryId(e.year, e.key)) + '">' +
      '<ul class="fi-tree fi-root" aria-label="Details for ' + esc(f.displayName) + '">' +
        node("Worn", worn) + node("Memory", memory) + notesBranch(f) + linksBranch(f) +
      "</ul>" +
      '<figure class="fi-fig">' + O.bottleSVG(f.bottle, { width: 76, label: f.bottleLabel }) + "<figcaption>Illustrative</figcaption></figure>" +
      (state.mode === "owner" ? '<div class="fi-owner">' + O.badgesHTML(e) + O.editButton("Edit entry") + "</div>" : "") +
    "</div>";
  }

  function row(e, state) {
    if (e.redacted) {
      return '<li class="fi-row fi-redacted"><div class="fi-line fi-static">' +
        '<span class="fi-namecell">' + O.bottleSVG({ shape: "redacted" }, { width: 16, className: "fi-ph" }) +
        '<span class="fi-name olf-redacted">' + O.REDACTED_LABEL + '</span> <span class="fi-brand">' + O.REDACTED_HINT + "</span></span></div></li>";
    }
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    return '<li class="fi-row' + (open ? " is-open" : "") + '">' +
      '<button class="fi-line" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        '<span class="fi-namecell"><span class="fi-name">' + esc(f.displayName) + "</span>" +
          (f.byline ? ' <span class="fi-brand">' + esc(f.byline) + "</span>" : "") +
          (e.private ? " " + O.badgesHTML(e) : "") + "</span>" +
        '<span class="fi-leader" aria-hidden="true"></span>' +
        '<span class="fi-period">' + e.periodsInYear.map(perText).join(", ") + "</span>" +
        notesLine(f) +
      "</button>" +
      (open ? entryBranches(e, state) : "") +
    "</li>";
  }

  function renderHistory(m, state) {
    let prev = null, out = "";
    m.years.forEach(function (y) {
      if (prev !== null && prev - y.year > 1) {
        const a = y.year + 1, b = prev - 1;
        out += '<li class="fi-gap"><span class="fi-gap-years">' + (a === b ? a : a + "–" + b) + "</span> no entries recorded</li>";
      }
      prev = y.year;
      const open = state.openYears.has(y.year);
      out += '<li class="fi-year' + (open ? " is-open" : "") + '">' +
        '<h2 class="fi-yh"><button class="fi-yhead" ' + O.yearAttrs(state, y.year) + ">" +
          '<span class="fi-ynum">' + y.year + "</span>" +
          '<span class="fi-yrule" aria-hidden="true"></span>' +
          '<span class="fi-ycount">' + plural(y.count, "entry").replace("entrys", "entries") + (y.redactedCount ? ", " + y.redactedCount + " private" : "") + "</span>" +
          '<span class="fi-sign" aria-hidden="true"></span>' +
        "</button></h2>" +
        (open ? '<ol class="fi-rows" id="y-' + y.year + '">' + y.entries.map(function (e) { return row(e, state); }).join("") + "</ol>" : "") +
      "</li>";
    });
    return '<h1 class="olf-sr">History</h1><ol class="fi-index">' + out + "</ol>";
  }

  // ---------- To try ----------
  function memberLine(f) {
    return '<span class="fi-subline"><span class="fi-namecell"><span class="fi-name">' + esc(f.displayName) +
      (f.variantConfirmed ? " " + esc(f.variant) : "") + "</span>" +
      (f.byline ? ' <span class="fi-brand">' + esc(f.byline) + "</span>" : "") + "</span>" +
      '<span class="fi-leader" aria-hidden="true"></span>' + notesLine(f) + "</span>";
  }

  function memberBranches(f) {
    return notesBranch(f) + node("Price", leaf(O.priceHTML(f))) + linksBranch(f);
  }

  function renderTry(m, state) {
    return '<h1 class="olf-sr">To try</h1><p class="fi-try-head"><span>To try</span><span class="fi-yrule" aria-hidden="true"></span><span class="fi-ycount">' +
      plural(m.tryList.length, "item") + '</span></p><ol class="fi-rows fi-try">' + m.tryList.map(function (t) {
      if (t.redacted) {
        const ph = O.bottleSVG({ shape: "redacted" }, { width: 16, className: "fi-ph" });
        return '<li class="fi-row fi-redacted' + (t.kind === "group" ? " fi-group" : "") + '"><div class="fi-line fi-static">' +
          '<span class="fi-namecell">' + ph + (t.kind === "group" ? ph : "") +
          '<span class="fi-name olf-redacted">' + O.REDACTED_LABEL + '</span> <span class="fi-brand">' + O.REDACTED_HINT + "</span></span></div></li>";
      }
      const open = state.openTry.has(t.key);
      if (t.kind === "group") {
        return '<li class="fi-row fi-group' + (open ? " is-open" : "") + '">' +
          '<button class="fi-line fi-gline" ' + O.tryAttrs(state, t.key) + ">" +
            '<span class="fi-glabel">' + esc(t.title) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
            t.members.map(memberLine).join("") +
          "</button>" +
          (open ? '<div class="fi-expand fi-expand-group" id="t-' + O.slug(t.key) + '">' +
            '<ul class="fi-tree fi-root" aria-label="' + esc(t.title) + ' members">' +
              t.members.map(function (f) {
                return node(esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + (f.byline ? ' <span class="fi-brand">' + esc(f.byline) + "</span>" : ""),
                  memberBranches(f), "fi-member");
              }).join("") +
            "</ul>" +
            '<div class="fi-figs">' + t.members.map(function (f) {
              return '<figure class="fi-fig">' + O.bottleSVG(f.bottle, { width: 64, label: f.bottleLabel }) + "<figcaption>" + esc(f.displayName) + "</figcaption></figure>";
            }).join("") + "</div>" +
            (state.mode === "owner" ? '<div class="fi-owner">' + O.editButton("Edit group") + "</div>" : "") +
          "</div>" : "") +
        "</li>";
      }
      const f = t.fragrance;
      return '<li class="fi-row' + (open ? " is-open" : "") + '">' +
        '<button class="fi-line" ' + O.tryAttrs(state, t.key) + ">" +
          '<span class="fi-namecell"><span class="fi-name">' + esc(f.displayName) + "</span>" +
            (f.byline ? ' <span class="fi-brand">' + esc(f.byline) + "</span>" : "") + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
          '<span class="fi-leader" aria-hidden="true"></span>' +
          '<span class="fi-period fi-kind">single</span>' + notesLine(f) +
        "</button>" +
        (open ? '<div class="fi-expand" id="t-' + O.slug(t.key) + '">' +
          '<ul class="fi-tree fi-root" aria-label="Details for ' + esc(f.displayName) + '">' + memberBranches(f) + "</ul>" +
          '<figure class="fi-fig">' + O.bottleSVG(f.bottle, { width: 76, label: f.bottleLabel }) + "<figcaption>Illustrative</figcaption></figure>" +
          (state.mode === "owner" ? '<div class="fi-owner">' + O.editButton("Edit") + "</div>" : "") +
        "</div>" : "") +
      "</li>";
    }).join("") + "</ol>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="fi-tag">Index of fragrances</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
