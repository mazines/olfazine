/* 10 Wearing-period atlas: each year is a 12-month track. Open a year to see one sub-track per fragrance, drawn from remembered intervals. */
(function () {
  "use strict";
  const O = window.Olf, esc = O.esc;
  const INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  function isApprox(p) { return p.precision === "approx" || /≈|c\. /.test(p.text); }

  // One interval drawn on a 12-column track. thin = density strip (no labels).
  function bars(p, lane, thin) {
    const row = "grid-row:" + lane + ";";
    if (!p.inYear) {
      return '<span class="pa-band pa-yearonly" style="grid-column:1 / -1;' + row + '">' +
        (thin ? "" : '<span class="pa-band-label">year only — months unknown</span>') + "</span>";
    }
    const iy = p.inYear;
    const cls = ["pa-bar"];
    if (isApprox(p)) cls.push("pa-approx");
    if (iy.continuesBefore) cls.push("pa-cb");
    if (iy.continuesAfter || iy.ongoing) cls.push("pa-ca");
    if (iy.ongoing) cls.push("pa-ongoing");
    if (iy.openEnd) cls.push("pa-open");
    let label = "";
    if (!thin) {
      const parts = [];
      if (isApprox(p)) parts.push("≈");
      if (iy.ongoing) parts.push("ongoing");
      label = parts.length ? '<span class="pa-bar-label">' + parts.join(" ") + "</span>" : "";
    }
    let html = '<span class="' + cls.join(" ") + '" style="grid-column:' + iy.from + " / " + (iy.to + 1) + ";" + row + '">' + label + "</span>";
    if (iy.openEnd && iy.to < 12) {
      html += '<span class="pa-tail" style="grid-column:' + (iy.to + 1) + " / " + (Math.min(12, iy.to + 3) + 1) + ";" + row + '"></span>';
    }
    return html;
  }

  function monthRuler() {
    return '<div class="pa-ruler" aria-hidden="true"><span class="pa-ruler-pad"></span><span class="pa-ruler-months">' +
      O.MONTHS.map(function (m, i) { return '<span class="pa-m"><span class="pa-mlong">' + m + '</span><span class="pa-mshort">' + INITIALS[i] + "</span></span>"; }).join("") +
      "</span></div>";
  }

  function strip(y) {
    let lane = 0, html = "";
    y.entries.forEach(function (e) {
      if (e.redacted) return; // a private entry's dates never reach the public strip
      lane += 1;
      e.periodsInYear.forEach(function (p) { html += bars(p, lane, true); });
    });
    return '<span class="pa-strip" aria-hidden="true">' + html + "</span>";
  }

  // ---------- History ----------
  function drawer(e, state) {
    const f = e.fragrance, id = O.entryId(e.year, e.key);
    return '<li class="pa-drawer" id="e-' + O.slug(id) + '">' +
      '<figure class="pa-fig">' + O.bottleSVG(f.bottle, { width: 110, label: f.bottleLabel }) + "<figcaption>Illustrative bottle</figcaption></figure>" +
      '<div class="pa-drawer-body">' +
        (O.badgesHTML(e) ? '<p class="pa-badges">' + O.badgesHTML(e) + "</p>" : "") +
        '<div class="pa-drawer-cols">' +
          "<section><h4>Worn</h4><ul class=\"pa-periods\">" + e.periods.map(function (p) {
            return '<li class="pa-p-' + p.precision + '">' + esc(p.longText) + (p.precision === "year" ? ' <span class="pa-q">year only — months unknown</span>' : "") + "</li>";
          }).join("") + "</ul>" +
          (e.allYears.length > 1 ? '<p class="pa-also">Also drawn on ' + e.allYears.filter(function (y) { return y !== e.year; }).join(", ") + ".</p>" : "") +
          "<h4>Memory</h4>" + (e.memory ? '<p class="pa-memory">' + esc(e.memory) + "</p>" : '<p class="olf-empty">No memory recorded.</p>') +
          (e.sourceNote ? '<p class="pa-source">Source wording (owner only): ' + esc(e.sourceNote) + "</p>" : "") +
          "</section>" +
          "<section><h4>Notes</h4>" + O.notesHTML(f) + '<div class="pa-links">' + O.linksHTML(f) + "</div></section>" +
        "</div>" +
        (state.mode === "owner" ? '<div class="pa-owner">' + O.editButton("Edit entry") + "</div>" : "") +
      "</div></li>";
  }

  function trackRow(e, state) {
    if (e.redacted) {
      return '<li class="pa-row pa-row-redacted">' +
        '<div class="pa-name pa-name-static">' + O.bottleSVG({ shape: "redacted" }, { width: 26 }) +
          '<span class="pa-name-text"><span class="pa-title olf-redacted">' + O.REDACTED_LABEL + '</span><span class="pa-meta">' + O.REDACTED_HINT + "</span></span></div>" +
        '<div class="pa-track pa-track-redacted" aria-hidden="true"></div></li>';
    }
    const f = e.fragrance, id = O.entryId(e.year, e.key), open = state.openEntry === id;
    return '<li class="pa-row' + (open ? " is-open" : "") + '">' +
      '<button class="pa-name" ' + O.entryAttrs(state, e.year, e.key) + ">" +
        O.bottleSVG(f.bottle, { width: 26 }) +
        '<span class="pa-name-text">' +
          '<span class="pa-title">' + esc(f.displayName) + (state.mode === "owner" && e.private ? " " + O.badgesHTML(e) : "") + "</span>" +
          '<span class="pa-meta">' + (f.byline ? esc(f.byline) + " · " : "") + '<span class="pa-mono">' +
            esc(e.periodsInYear.map(function (p) { return p.text + (p.inYear ? "" : " (year only)"); }).join(", ")) + "</span></span>" +
          (f.notes.length ? '<span class="pa-preview">' + esc(O.notePreview(f, 3)) + "</span>" : "") +
        "</span>" +
        '<span class="pa-chev" aria-hidden="true"></span>' +
      "</button>" +
      '<div class="pa-track" aria-hidden="true">' + e.periodsInYear.map(function (p) { return bars(p, 1, false); }).join("") + "</div>" +
      "</li>" + (open ? drawer(e, state) : "");
  }

  function yearRow(y, state) {
    const open = state.openYears.has(y.year);
    return '<li class="pa-year' + (open ? " is-open" : "") + '">' +
      '<h2 class="pa-year-h"><button class="pa-year-btn" ' + O.yearAttrs(state, y.year) + ">" +
        '<span class="pa-year-label"><span class="pa-year-num">' + y.year + "</span>" +
          '<span class="pa-year-count">' + y.count + (y.count === 1 ? " fragrance" : " fragrances") + (y.redactedCount ? " · " + y.redactedCount + " private" : "") + "</span></span>" +
        (open ? '<span class="pa-strip pa-strip-open" aria-hidden="true"></span>' : strip(y)) +
        '<span class="pa-chev" aria-hidden="true"></span>' +
      "</button></h2>" +
      (open ? '<ul class="pa-tracks" id="y-' + y.year + '">' + y.entries.map(function (e) { return trackRow(e, state); }).join("") + "</ul>" : "") +
      "</li>";
  }

  function legend() {
    function item(swatch, text) {
      return '<li><span class="pa-swatch" aria-hidden="true">' + swatch + "</span><span>" + text + "</span></li>";
    }
    return '<section class="pa-legend" aria-labelledby="pa-legend-h"><h2 id="pa-legend-h">Reading the atlas</h2><ul>' +
      item('<span class="pa-bar" style="grid-column:4 / 10"></span>', "Solid bar: months remembered, first and last month included.") +
      item('<span class="pa-bar pa-approx" style="grid-column:4 / 10"><span class="pa-bar-label">≈</span></span>', "Dotted edges and ≈: approximate months.") +
      item('<span class="pa-bar pa-cb pa-ca" style="grid-column:1 / 13"></span>', "Pointed end: the period continues into the previous or next year.") +
      item('<span class="pa-bar pa-ca pa-ongoing" style="grid-column:5 / 12"><span class="pa-bar-label">ongoing</span></span>', "Arrow and “ongoing”: still being worn, drawn to the current month.") +
      item('<span class="pa-bar pa-open" style="grid-column:4 / 5"></span><span class="pa-tail" style="grid-column:5 / 8"></span>', "Dashed fade: start known, end unknown. No end is implied.") +
      item('<span class="pa-band pa-yearonly" style="grid-column:1 / -1"></span>', "Hatched band: only the year is known. Months are not claimed.") +
      item('<span class="pa-track-redacted pa-swatch-fill"></span>', "Plain grey track: private entry. Its dates are not shown.") +
      "</ul></section>";
  }

  function renderHistory(m, state) {
    let rows = "";
    m.years.forEach(function (y, i) {
      rows += yearRow(y, state);
      const next = m.years[i + 1];
      if (next && y.year - next.year > 1) {
        for (let g = y.year - 1; g > next.year; g--) {
          rows += '<li class="pa-gap"><span class="pa-gap-year">' + g + '</span><span class="pa-gap-line">no records</span></li>';
        }
      }
    });
    return '<h1 class="olf-sr">History</h1>' + legend() +
      '<div class="pa-atlas">' + monthRuler() + '<ol class="pa-years">' + rows + "</ol></div>";
  }

  // ---------- To try ----------
  const PLANNED = '<span class="pa-planned"><span class="pa-planned-dot" aria-hidden="true"></span>Planned</span>';

  function line(f, badge) {
    return '<span class="pa-try-line">' + PLANNED + O.bottleSVG(f.bottle, { width: 30 }) +
      '<span class="pa-name-text"><span class="pa-title">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + (badge || "") + "</span>" +
        '<span class="pa-meta">' + esc(f.byline || "Brand not recorded") + (f.notes.length ? " · " + esc(O.notePreview(f, 3)) : "") + "</span></span></span>";
  }

  function memberDetail(f) {
    return '<div class="pa-member">' +
      '<figure class="pa-fig">' + O.bottleSVG(f.bottle, { width: 72, label: f.bottleLabel }) + "</figure>" +
      '<div class="pa-member-body"><h4 class="pa-member-name">' + esc(f.displayName) + (f.variantConfirmed ? " " + esc(f.variant) : "") + "</h4>" +
        (f.byline ? '<p class="pa-meta">' + esc(f.byline) + "</p>" : "") +
        O.notesHTML(f, { limit: 7 }) + O.priceHTML(f) + '<div class="pa-links">' + O.linksHTML(f) + "</div>" +
      "</div></div>";
  }

  function tryItem(t, state) {
    if (t.redacted) {
      return '<li class="pa-try-item pa-row-redacted' + (t.kind === "group" ? " pa-try-group" : "") + '"><div class="pa-try-btn pa-static">' +
        '<span class="pa-try-line">' + O.bottleSVG({ shape: "redacted" }, { width: 30 }) + (t.kind === "group" ? O.bottleSVG({ shape: "redacted" }, { width: 30 }) : "") +
        '<span class="pa-name-text"><span class="pa-title olf-redacted">' + O.REDACTED_LABEL + '</span><span class="pa-meta">' + O.REDACTED_HINT + "</span></span></span></div></li>";
    }
    const open = state.openTry.has(t.key), owner = state.mode === "owner";
    const members = t.kind === "group" ? t.members : [t.fragrance];
    const head = t.kind === "group"
      ? '<span class="pa-bracket-label">' + esc(t.title) + (t.private ? " " + O.badgesHTML(t) : "") + "</span>" +
        '<span class="pa-bracket">' + t.members.map(function (f) { return line(f); }).join("") + "</span>"
      : line(t.fragrance, t.private ? " " + O.badgesHTML(t) : "");
    return '<li class="pa-try-item' + (t.kind === "group" ? " pa-try-group" : "") + (open ? " is-open" : "") + '">' +
      '<button class="pa-try-btn" ' + O.tryAttrs(state, t.key) + ">" + head + '<span class="pa-chev" aria-hidden="true"></span></button>' +
      (open ? '<div class="pa-drawer pa-try-drawer" id="t-' + O.slug(t.key) + '"><div class="pa-members' + (members.length > 1 ? " pa-members-two" : "") + '">' +
        members.map(memberDetail).join("") + "</div>" +
        (owner ? '<div class="pa-owner">' + O.editButton(t.kind === "group" ? "Edit group" : "Edit") + "</div>" : "") + "</div>" : "") +
      "</li>";
  }

  function renderTry(m, state) {
    return '<h1 class="olf-sr">To try</h1>' +
      '<p class="pa-try-note">Planned only. These carry no wearing dates and draw nothing on the atlas. Shop links open a search; nothing here creates History.</p>' +
      '<ul class="pa-try">' + m.tryList.map(function (t) { return tryItem(t, state); }).join("") + "</ul>";
  }

  O.mount({
    brandHTML: '<span class="olf-wordmark">Olfazine</span><span class="pa-tag">wearing-period atlas</span>',
    renderHistory: renderHistory,
    renderTry: renderTry,
  });
})();
