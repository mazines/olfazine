/* Olfazine shared mockup engine.
 *
 * Every concept page loads data.js, then this file, then its own app.js.
 * This file owns the rules that must stay identical across concepts:
 * dates, year membership, redaction, links, bottle art, note icons, view state.
 * Concepts own layout and disclosure style.
 *
 * Redaction note: in the public model, private records are replaced before any
 * concept code sees them, so the rendered public DOM holds no private identity.
 * This is a design demo. The source data still ships in data.js, so it is NOT
 * access control. Phase 2 moves private records to owner-only Firestore documents.
 */
(function () {
  "use strict";

  const D = window.OLF_DATA;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ---------- small helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  // ---------- dates ----------
  // A point is { y, m?, approx? }. A period is { start, end|null, ongoing?, approx? }.
  function pointText(p, long) {
    if (!p) return "";
    const pre = p.approx ? "c. " : "";
    if (!p.m) return pre + p.y;
    return pre + (long ? MONTHS_LONG[p.m - 1] : MONTHS[p.m - 1]) + " " + p.y;
  }

  function periodText(per, opts) {
    const long = opts && opts.long;
    const s = per.start, e = per.end;
    const approx = per.approx ? "≈ " : "";
    let end;
    if (per.ongoing) end = "ongoing";
    else if (!e) end = "end unknown";
    else end = null;

    if (end) return approx + pointText(s, long) + " – " + end;
    if (s.y === e.y && !s.m && !e.m) return approx + String(s.y);            // year only, one year
    if (s.y === e.y && s.m && e.m) {
      if (s.m === e.m) return approx + pointText(s, long);
      if (s.m === 1 && e.m === 12) return approx + (long ? "All of " : "Jan – Dec ") + s.y;
      return approx + (long ? MONTHS_LONG : MONTHS)[s.m - 1] + " – " + pointText(e, long);
    }
    return approx + pointText(s, long) + " – " + pointText(e, long);
  }

  // Precision of a period, for concepts that draw uncertainty.
  function precision(per) {
    if (per.ongoing) return "ongoing";
    if (!per.end) return "open";
    if (!per.start.m || !per.end.m) return "year";
    return per.approx || per.start.approx || per.end.approx ? "approx" : "month";
  }

  // Years a period covers. Unknown end stays in the start year. Ongoing runs to today.
  function periodYears(per) {
    let last;
    if (per.ongoing) last = D.today.y;
    else if (per.end) last = per.end.y;
    else last = per.start.y;
    const out = [];
    for (let y = per.start.y; y <= last; y++) out.push(y);
    return out;
  }

  // Month span inside one year, for atlas-style concepts. null = year precision (no claim).
  function monthsInYear(per, year) {
    if (!per.start.m) return null;
    const sm = per.start.y < year ? 1 : per.start.m;
    let em;
    if (per.ongoing) em = year < D.today.y ? 12 : D.today.m;
    else if (!per.end) em = per.start.y === year ? per.start.m : null;
    else if (!per.end.m) return null;
    else em = per.end.y > year ? 12 : per.end.m;
    if (em == null) return null;
    return { from: sm, to: em, openEnd: !per.end && !per.ongoing, ongoing: !!per.ongoing,
             continuesBefore: per.start.y < year, continuesAfter: per.ongoing ? year < D.today.y : (per.end && per.end.y > year) };
  }

  // ---------- links ----------
  function shopQuery(f) {
    return [f.brand, f.name, f.variantConfirmed ? f.variant : null].filter(Boolean).join(" ");
  }
  function links(f) {
    if (f.unresolved || f.synthetic) return [];
    const q = encodeURIComponent(shopQuery(f));
    const out = [
      { kind: "shop", label: "Shop", detail: "Google Shopping search", search: true,
        href: "https://www.google.com/search?tbm=shop&q=" + q },
      { kind: "reference", label: "Fragrantica", detail: "Search, profile not verified", search: true,
        href: "https://www.fragrantica.com/search/?query=" + q },
    ];
    return out;
  }

  // ---------- note icons ----------
  // Neutral line glyphs by family. Text label is always shown next to the icon.
  const FAMILY = {
    citrus: ["bergamot", "lemon", "citrus", "orange blossom"],
    spice: ["pepper", "sichuan pepper", "pink pepper", "black pepper", "cinnamon", "cardamom", "nutmeg", "saffron", "coriander"],
    floral: ["lavender", "jasmine", "ylang-ylang", "black orchid", "rose", "iris", "violet leaf"],
    wood: ["cedar", "amberwood", "vetiver", "patchouli", "oak", "birch", "woody notes", "oud", "oakmoss"],
    resin: ["incense", "fir resin", "ambergris", "ambroxan", "labdanum", "smoke"],
    gourmand: ["vanilla", "tonka bean", "coffee", "praline", "almond"],
    green: ["rosemary", "sage", "black truffle"],
    fruit: ["pineapple", "plum", "fig"],
    musk: ["musk", "suede", "leather", "ambrette"],
    tobacco: ["tobacco", "rum", "cognac"],
    aquatic: ["sea salt"],
  };
  const NOTE_FAMILY = {};
  Object.keys(FAMILY).forEach(function (k) { FAMILY[k].forEach(function (n) { NOTE_FAMILY[n] = k; }); });
  function family(note) { return NOTE_FAMILY[note.toLowerCase()] || "neutral"; }

  const ICON_PATHS = {
    citrus: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15M4.5 12h15M6.7 6.7l10.6 10.6M17.3 6.7 6.7 17.3"/>',
    spice: '<path d="M12 3c2 3 2 6 0 9s-2 6 0 9"/><circle cx="8" cy="9" r="1.2"/><circle cx="16" cy="15" r="1.2"/>',
    floral: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c-2-3-1-6 0-6.5 1 .5 2 3.5 0 6.5zM12 14.2c2 3 1 6 0 6.5-1-.5-2-3.5 0-6.5zM9.8 12c-3 2-6 1-6.5 0 .5-1 3.5-2 6.5 0zM14.2 12c3-2 6-1 6.5 0-.5 1-3.5 2-6.5 0z"/>',
    wood: '<path d="M12 21V8M12 12l-4-3M12 15l4-3"/><path d="M7 8a5 5 0 0 1 10 0"/>',
    resin: '<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>',
    gourmand: '<path d="M8 4c-1.5 4-1.5 12 0 16M16 4c1.5 4 1.5 12 0 16M8 4c2.5 1 5.5 1 8 0M8 20c2.5-1 5.5-1 8 0"/>',
    green: '<path d="M5 19C5 10 11 5 19 5c0 8-5 14-14 14z"/><path d="M5 19 13 11"/>',
    fruit: '<circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1-4 3-5"/>',
    musk: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="2 2"/>',
    tobacco: '<path d="M4 15h13v3H4zM19 15v3M17 11c0-2 2-2 2-4"/>',
    aquatic: '<path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
    neutral: '<circle cx="12" cy="12" r="5"/>',
  };
  function noteIcon(note, size) {
    const f = typeof note === "string" ? family(note) : "neutral";
    const s = size || 20;
    return '<svg class="olf-note-icon olf-fam-' + f + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[f] + "</svg>";
  }

  // ---------- bottle art ----------
  // Illustrative silhouettes only. Same proportions everywhere so bottles read consistently.
  function bottleSVG(spec, opts) {
    opts = opts || {};
    const w = opts.width || 80, h = Math.round(w * 1.4);
    const title = opts.label ? '<title>' + esc(opts.label) + '</title>' : "";
    const role = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    const cls = 'class="olf-bottle ' + (opts.className || "") + '"';
    if (!spec || spec.shape === "none") {
      return '<svg ' + cls + ' width="' + w + '" height="' + h + '" viewBox="0 0 100 140"' + role + '>' + title +
        '<rect x="22" y="40" width="56" height="86" rx="6" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="4 4"/>' +
        '<rect x="40" y="22" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3"/>' +
        '<text x="50" y="88" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity=".55" font-family="system-ui, sans-serif">no image</text></svg>';
    }
    if (spec.shape === "redacted") {
      return '<svg ' + cls + ' width="' + w + '" height="' + h + '" viewBox="0 0 100 140"' + role + '>' + title +
        '<rect x="24" y="44" width="52" height="82" rx="8" fill="currentColor" fill-opacity=".12"/>' +
        '<rect x="40" y="26" width="20" height="16" rx="3" fill="currentColor" fill-opacity=".18"/>' +
        '<rect x="32" y="78" width="36" height="6" rx="3" fill="currentColor" fill-opacity=".22"/></svg>';
    }
    const g = spec.glass, c = spec.cap;
    const id = "g" + Math.random().toString(36).slice(2, 8);
    const defs = '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>';
    let body, cap;
    switch (spec.shape) {
      case "tall":
        body = '<rect x="30" y="38" width="40" height="92" rx="4"/>';
        cap = '<rect x="38" y="14" width="24" height="24" rx="2"/>'; break;
      case "round":
        body = '<circle cx="50" cy="90" r="36"/>';
        cap = '<rect x="38" y="30" width="24" height="22" rx="3"/>'; break;
      case "flask":
        body = '<path d="M26 58q0-14 14-14h20q14 0 14 14v62q0 10-10 10H36q-10 0-10-10z"/>';
        cap = '<rect x="40" y="22" width="20" height="22" rx="2"/>'; break;
      case "faceted":
        body = '<path d="M30 46h40l8 14v56l-8 14H30l-8-14V60z"/>';
        cap = '<path d="M38 22h24l4 22H34z"/>'; break;
      case "slim":
        body = '<rect x="34" y="34" width="32" height="96" rx="3"/>';
        cap = '<rect x="40" y="12" width="20" height="22" rx="2"/>'; break;
      default: // square
        body = '<rect x="22" y="48" width="56" height="82" rx="5"/>';
        cap = '<rect x="38" y="24" width="24" height="24" rx="2"/>';
    }
    return '<svg ' + cls + ' width="' + w + '" height="' + h + '" viewBox="0 0 100 140"' + role + '>' + title + defs +
      '<g fill="' + c + '">' + cap + '</g>' +
      '<g fill="' + g + '">' + body + '</g>' +
      '<g fill="url(#' + id + ')">' + body + '</g></svg>';
  }

  // Real bottle image when one was imported, else the drawn silhouette.
  // Asset paths are relative to the repo root. Mockups sit two folders down; site pages set their own base.
  function asset(p) { return (window.OLF_ASSET_BASE != null ? window.OLF_ASSET_BASE : "../../") + p; }

  function bottleArt(f, opts) {
    opts = opts || {};
    if (!f.image) return bottleSVG(f.bottle, opts);
    const w = opts.width || 80, h = Math.round(w * 1.4);
    const alt = opts.label ? ' alt="' + esc(opts.label) + '"' : ' alt=""';
    return '<img class="olf-bottle olf-bottle-img ' + (opts.className || "") + '" src="' + esc(asset(f.image)) + '" width="' + w + '" height="' + h + '"' + alt + ' loading="lazy" style="object-fit:contain">';
  }

  // Note illustration from the source when available, else the neutral family glyph.
  function noteArt(f, note, size) {
    const img = f.noteImages && f.noteImages[note];
    const s = size || 20;
    return img
      ? '<img class="olf-note-img" src="' + esc(asset(img)) + '" width="' + s + '" height="' + s + '" alt="" loading="lazy" style="object-fit:contain">'
      : noteIcon(note, s);
  }

  function notesCaveat(f) {
    if (f.notesStatus === "sourced") return '<p class="olf-caveat">Notes: Fragella' + (f.sourceVariant ? ", " + esc(f.sourceVariant) : "") + ". Variant not confirmed by owner.</p>";
    return '<p class="olf-caveat">Sample notes, unverified. Variant not confirmed.</p>';
  }

  // ---------- model ----------
  // mode: "public" | "owner" | "preview" (owner previewing the public view)
  function isPublic(mode) { return mode !== "owner"; }

  function fullFragrance(id) {
    const f = D.catalog[id];
    const out = Object.assign({ id: id }, f, {
      displayName: f.name,
      byline: f.brand || null,
      links: links(f),
      bottleLabel: "Illustrative bottle placeholder for " + (f.brand ? f.brand + " " : "") + f.name,
      notesStatus: f.notes.length ? "unverified" : "missing",
    });
    // Sourced data (Fragella, local import) replaces sample notes and the drawn bottle.
    const src = window.OLF_FRAGELLA && window.OLF_FRAGELLA[id];
    if (src) {
      const tiers = Object.keys(src.notes || {});
      out.pyramid = tiers.length ? src.notes : null;
      out.notes = tiers.reduce(function (all, t) { return all.concat(src.notes[t].map(function (n) { return n.name; })); }, []);
      out.noteImages = {};
      tiers.forEach(function (t) { src.notes[t].forEach(function (n) { if (n.img) out.noteImages[n.name] = n.img; }); });
      out.notesStatus = out.notes.length ? "sourced" : "missing";
      out.sourceVariant = src.oilType;
      out.image = src.bottle;
      if (src.bottle) out.bottleLabel = "Bottle of " + (f.brand ? f.brand + " " : "") + f.name + (src.oilType ? " (" + src.oilType + ")" : "");
    }
    return out;
  }

  let redactCounter = 0;
  function opaque(prefix) { redactCounter += 1; return prefix + "-" + redactCounter.toString(36) + Math.random().toString(36).slice(2, 5); }

  function buildModel(mode) {
    redactCounter = 0;
    const pub = isPublic(mode);

    // History: one row per fragrance per year. Separate intervals stay in details.
    const byYear = {};
    D.history.forEach(function (h) {
      const f = D.catalog[h.fragrance];
      const years = {};
      h.periods.forEach(function (p) { periodYears(p).forEach(function (y) { years[y] = true; }); });
      Object.keys(years).forEach(function (yStr) {
        const y = Number(yStr);
        byYear[y] = byYear[y] || [];
        if (pub && f.private) {
          // Only the year and a generic placeholder are public.
          byYear[y].push({ redacted: true, key: opaque("r" + y), year: y });
          return;
        }
        byYear[y].push({
          redacted: false,
          key: h.id,
          year: y,
          private: !!f.private,
          synthetic: !!f.synthetic,
          fragrance: fullFragrance(h.fragrance),
          periods: h.periods.map(function (p) {
            return Object.assign({}, p, {
              text: periodText(p), longText: periodText(p, { long: true }),
              precision: precision(p), years: periodYears(p), inYear: monthsInYear(p, y),
            });
          }),
          periodsInYear: h.periods.filter(function (p) { return periodYears(p).indexOf(y) !== -1; })
            .map(function (p) { return { text: periodText(p), precision: precision(p), inYear: monthsInYear(p, y) }; }),
          allYears: Object.keys(years).map(Number),
          memory: h.memory,
          sourceNote: pub ? null : (h.sourceNote || null),
        });
      });
    });

    // Public builds ship private entries only as bare placeholders: { year } with nothing else.
    (D.redactedHistory || []).forEach(function (r) {
      byYear[r.year] = byYear[r.year] || [];
      byYear[r.year].push({ redacted: true, key: opaque("r" + r.year), year: r.year });
    });

    const years = Object.keys(byYear).map(Number).sort(function (a, b) { return b - a; })
      .map(function (y) {
        const entries = byYear[y].sort(function (a, b) {
          if (a.redacted !== b.redacted) return a.redacted ? 1 : -1;
          if (a.redacted) return 0;
          const pa = a.periodsInYear[0].inYear, pb = b.periodsInYear[0].inYear;
          return (pa ? pa.from : 0) - (pb ? pb.from : 0);
        });
        return { year: y, entries: entries, count: entries.length,
                 redactedCount: entries.filter(function (e) { return e.redacted; }).length };
      });

    // Gaps: years with no entries between first and latest. Never filled with invented rows.
    const gaps = [];
    if (years.length) {
      for (let y = years[years.length - 1].year; y <= years[0].year; y++) {
        if (!byYear[y]) gaps.push(y);
      }
    }

    // To try
    const tryList = D.wishlist.map(function (w) {
      if (w.kind === "group") {
        const anyPrivate = w.members.some(function (m) { return D.catalog[m].private; });
        if (pub && anyPrivate) return { redacted: true, kind: "group", key: opaque("rg"), memberCount: 2 };
        return { redacted: false, kind: "group", key: w.id, title: w.title,
                 private: anyPrivate, members: w.members.map(fullFragrance) };
      }
      const f = D.catalog[w.fragrance];
      if (pub && f.private) return { redacted: true, kind: "single", key: opaque("rs") };
      // A partner's name shows only when the viewer may see it.
      const wearWith = (w.wearWith || []).filter(function (id) { return D.catalog[id]; }).map(function (id) {
        const p = D.catalog[id];
        return pub && p.private ? "a private entry" : [p.brand, p.name, p.variantConfirmed ? p.variant : null].filter(Boolean).join(" ");
      });
      return { redacted: false, kind: "single", key: w.id, private: !!f.private, fragrance: fullFragrance(w.fragrance), wearWith: wearWith };
    });

    for (let i = 0; i < (D.redactedWishlist || 0); i++) tryList.push({ redacted: true, kind: "single", key: opaque("rs") });

    return { mode: mode, isPublic: pub, years: years, gaps: gaps, tryList: tryList,
             latestYear: years.length ? years[0].year : null };
  }

  // ---------- shared fragments ----------
  // Concepts may use these or write their own markup. Text rules stay the same.
  const REDACTED_LABEL = "REDACTED";
  const REDACTED_HINT = "Private entry";

  function notesHTML(fr, opts) {
    opts = opts || {};
    if (!fr.notes.length) {
      return '<p class="olf-empty">' + (fr.unresolved ? "Identity unresolved. Notes, image, and links omitted until verified." : "Notes not sourced yet.") + "</p>";
    }
    const list = opts.limit ? fr.notes.slice(0, opts.limit) : fr.notes;
    return '<ul class="olf-notes" aria-label="Notes">' + list.map(function (n) {
      return '<li class="olf-note olf-fam-' + family(n) + '">' + noteArt(fr, n, opts.iconSize) + '<span>' + esc(n) + "</span></li>";
    }).join("") + "</ul>" + (opts.noCaveat ? "" : notesCaveat(fr));
  }

  function notePreview(fr, n) {
    if (!fr.notes.length) return "";
    return fr.notes.slice(0, n || 3).join(" · ");
  }

  function linksHTML(fr) {
    if (!fr.links.length) return fr.synthetic ? '<p class="olf-empty">Synthetic example. No links.</p>' : "";
    return '<ul class="olf-links">' + fr.links.map(function (l) {
      return '<li><a class="olf-link olf-link-' + l.kind + '" href="' + esc(l.href) + '" target="_blank" rel="noopener">' +
        esc(l.label) + "</a></li>";
    }).join("") + "</ul>";
  }

  function priceHTML(fr) {
    if (!fr.price) return "";
    const p = fr.price;
    return '<p class="olf-price">≈ ' + esc(p.currency) + " " + esc(p.amount) + " · " + esc(p.size) + " " + esc(fr.variant || "") +
      " · " + esc(p.kind) + ' <span class="olf-price-src">' + esc(p.source) + ", checked " + esc(p.checked) + "</span></p>";
  }

  function badgesHTML(item) {
    let out = "";
    if (item.private) out += '<span class="olf-badge olf-badge-private">Private</span>';
    if (item.synthetic || (item.fragrance && item.fragrance.synthetic)) out += '<span class="olf-badge olf-badge-synthetic">Synthetic example</span>';
    return out;
  }

  function editButton(label) {
    if (window.OLF_PRODUCTION) return "";
    return '<button type="button" class="olf-edit" data-olf-edit>' + esc(label || "Edit") + "</button>";
  }

  // ---------- state ----------
  // Survives tab switches and mode changes. Seeded from the URL so screenshots match across concepts.
  const params = new URLSearchParams(location.search);
  const state = {
    view: params.get("view") === "try" ? "try" : "history",
    mode: ["owner", "preview"].indexOf(params.get("mode")) !== -1 ? params.get("mode") : "public",
    openYears: new Set(),
    openEntry: null,        // "year:key"
    openTry: new Set(),
    scroll: { history: 0, try: 0 },
    seeded: false,
  };
  if (params.get("year")) state.openYears.add(Number(params.get("year")));
  if (params.get("entry")) state.openEntry = params.get("year") + ":" + params.get("entry");
  if (params.get("group")) state.openTry.add(params.get("group"));

  // ---------- shell ----------
  // Renders demo controls + segmented switch, wires tabs, persists scroll, re-renders on mode change.
  function mount(opts) {
    const root = document.getElementById("olf-root");
    const brand = opts.brandHTML || '<span class="olf-wordmark">Olfazine</span>';

    const demo = opts.demo !== false;
    if (!demo) state.mode = opts.mode === "owner" ? "owner" : "public";
    root.innerHTML = (demo ?
      '<div class="olf-demo" role="region" aria-label="Mockup controls">' +
        '<span class="olf-demo-label">Mockup · <strong>Simulated owner view</strong> is a design demo, not sign-in</span>' +
        '<div class="olf-demo-modes" role="group" aria-label="Viewer">' +
          '<button type="button" data-olf-mode="public">Public visitor</button>' +
          '<button type="button" data-olf-mode="owner">Owner (simulated)</button>' +
        "</div>" +
      "</div>" +
      '<div class="olf-preview-banner" hidden>Previewing the public view. <button type="button" data-olf-mode="owner">Exit preview</button></div>' : "") +
      '<header class="olf-header">' +
        '<div class="olf-brand">' + brand + "</div>" +
        (opts.collapseAll ? '<div class="olf-nav"><button type="button" class="olf-collapse" data-olf-collapse>Collapse all</button>' : "") +
        '<div class="olf-switch" role="tablist" aria-label="Journal views">' +
          '<button type="button" role="tab" id="olf-tab-history" aria-controls="olf-panel-history" data-olf-view="history">History</button>' +
          '<button type="button" role="tab" id="olf-tab-try" aria-controls="olf-panel-try" data-olf-view="try">To try</button>' +
        "</div>" + (opts.collapseAll ? "</div>" : "") +
        (demo ? '<div class="olf-owner-tools" hidden>' +
          '<button type="button" class="olf-owner-btn" data-olf-mode="preview">Preview public view</button>' +
        "</div>" : "") +
      "</header>" +
      '<main class="olf-main">' +
        '<section class="olf-panel" id="olf-panel-history" role="tabpanel" aria-labelledby="olf-tab-history" tabindex="-1"></section>' +
        '<section class="olf-panel" id="olf-panel-try" role="tabpanel" aria-labelledby="olf-tab-try" tabindex="-1"></section>' +
      "</main>" +
      '<div class="olf-toast" role="status" aria-live="polite"></div>';

    const panels = { history: root.querySelector("#olf-panel-history"), try: root.querySelector("#olf-panel-try") };
    let model;

    function render() {
      model = buildModel(state.mode);
      if (!state.seeded) {
        if (opts.openAllYears) model.years.forEach(function (y) { state.openYears.add(y.year); });
        if (opts.singleYear && state.openYears.size > 1) state.openYears = new Set([state.openYears.values().next().value]);
        if (!state.openYears.size && model.latestYear) state.openYears.add(model.latestYear);
        state.seeded = true;
      }
      document.documentElement.dataset.olfMode = state.mode;
      root.querySelectorAll("[data-olf-mode]").forEach(function (b) {
        if (b.closest(".olf-demo-modes")) {
          const on = b.dataset.olfMode === "public" ? state.mode === "public" : state.mode !== "public";
          b.setAttribute("aria-pressed", String(on));
        }
      });
      if (demo) {
        root.querySelector(".olf-owner-tools").hidden = state.mode !== "owner";
        root.querySelector(".olf-preview-banner").hidden = state.mode !== "preview";
      }
      panels.history.innerHTML = opts.renderHistory(model, state);
      panels.try.innerHTML = opts.renderTry(model, state);
      if (opts.afterRender) opts.afterRender(model, state, panels);
      syncCollapse();
      showView(state.view, true);
    }

    function showView(view, initial) {
      if (!initial) state.scroll[state.view] = window.scrollY;
      state.view = view;
      ["history", "try"].forEach(function (v) {
        const on = v === view;
        panels[v].hidden = !on;
        const tab = root.querySelector('[data-olf-view="' + v + '"]');
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      if (!initial) window.scrollTo(0, state.scroll[view]);
      if (opts.onView) opts.onView(view, state, panels);
    }

    root.addEventListener("click", function (e) {
      const t = e.target.closest("button, a");
      if (!t || !root.contains(t)) return;
      if (t.dataset.olfView) { if (t.dataset.olfView !== state.view) showView(t.dataset.olfView); return; }
      if (t.dataset.olfMode) {
        state.scroll[state.view] = window.scrollY;
        state.mode = t.dataset.olfMode;
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
        return;
      }
      if (t.hasAttribute("data-olf-collapse")) { toggleAll(); return; }
      if (t.hasAttribute("data-olf-edit")) { toast("Editor opens here in Phase 2. Nothing was saved."); return; }
      if (t.dataset.olfYear) { toggleYear(Number(t.dataset.olfYear), t); return; }
      if (t.dataset.olfEntry) { toggleEntry(t.dataset.olfEntry, t); return; }
      if (t.dataset.olfTry) { toggleTry(t.dataset.olfTry, t); return; }
      if (opts.onClick) opts.onClick(e, t, state, model, rerender);
    });

    // Arrow keys move between the two tabs.
    root.querySelector(".olf-switch").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const next = state.view === "history" ? "try" : "history";
      showView(next);
      root.querySelector('[data-olf-view="' + next + '"]').focus();
      e.preventDefault();
    });

    function rerender(which) {
      if (!which || which === "history") panels.history.innerHTML = opts.renderHistory(model, state);
      if (!which || which === "try") panels.try.innerHTML = opts.renderTry(model, state);
      if (opts.afterRender) opts.afterRender(model, state, panels);
      syncCollapse();
    }

    function refocus(selector) {
      const el = root.querySelector(selector);
      if (el) el.focus({ preventScroll: true });
    }

    // Collapse everything when anything is open; otherwise open every year again.
    function anyOpen() { return state.openYears.size > 0 || state.openEntry !== null || state.openTry.size > 0; }
    function syncCollapse() {
      const b = root.querySelector("[data-olf-collapse]");
      if (b) b.textContent = anyOpen() ? "Collapse all" : "Expand all";
    }
    function toggleAll() {
      if (anyOpen()) { state.openYears.clear(); state.openEntry = null; state.openTry.clear(); }
      else model.years.forEach(function (y) { state.openYears.add(y.year); });
      rerender();
    }

    function toggleYear(y, btn) {
      if (opts.singleYear) {
        if (state.openYears.has(y)) state.openYears.clear(); else { state.openYears.clear(); state.openYears.add(y); }
      } else if (state.openYears.has(y)) state.openYears.delete(y); else state.openYears.add(y);
      rerender("history");
      refocus('[data-olf-year="' + y + '"]' + (btn && btn.dataset.olfFocus ? '[data-olf-focus="' + btn.dataset.olfFocus + '"]' : ""));
    }
    function toggleEntry(id, btn) {
      state.openEntry = state.openEntry === id ? null : id;
      const y = Number(id.split(":")[0]);
      if (opts.singleYear) state.openYears.clear();
      state.openYears.add(y);
      rerender("history");
      refocus('[data-olf-entry="' + id + '"]' + (btn && btn.dataset.olfFocus ? '[data-olf-focus="' + btn.dataset.olfFocus + '"]' : ""));
    }
    function toggleTry(id, btn) {
      if (opts.singleTry) { const was = state.openTry.has(id); state.openTry.clear(); if (!was) state.openTry.add(id); }
      else if (state.openTry.has(id)) state.openTry.delete(id); else state.openTry.add(id);
      rerender("try");
      refocus('[data-olf-try="' + id + '"]' + (btn && btn.dataset.olfFocus ? '[data-olf-focus="' + btn.dataset.olfFocus + '"]' : ""));
    }

    let toastTimer;
    function toast(msg) {
      const el = root.querySelector(".olf-toast");
      el.textContent = msg;
      el.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2600);
    }

    render();
    if (params.get("scrollTo")) {
      const el = document.querySelector(params.get("scrollTo"));
      // Scroll only this window. scrollIntoView would also scroll a parent gallery page.
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140);
    }
    return { state: state, render: render, rerender: rerender, getModel: function () { return model; } };
  }

  // Helpers concepts use to build disclosure attributes consistently.
  function yearAttrs(state, y, extra) {
    const open = state.openYears.has(y);
    return 'type="button" data-olf-year="' + y + '" aria-expanded="' + open + '" aria-controls="y-' + y + (extra || "") + '"';
  }
  function entryId(y, key) { return y + ":" + key; }
  function entryAttrs(state, y, key, extra) {
    const id = entryId(y, key);
    return 'type="button" data-olf-entry="' + esc(id) + '" aria-expanded="' + (state.openEntry === id) + '" aria-controls="e-' + slug(id) + (extra || "") + '"';
  }
  function tryAttrs(state, key, extra) {
    return 'type="button" data-olf-try="' + esc(key) + '" aria-expanded="' + state.openTry.has(key) + '" aria-controls="t-' + slug(key) + (extra || "") + '"';
  }

  window.Olf = {
    data: D, esc: esc, slug: slug, MONTHS: MONTHS, MONTHS_LONG: MONTHS_LONG,
    periodText: periodText, pointText: pointText, precision: precision, periodYears: periodYears, monthsInYear: monthsInYear,
    family: family, noteIcon: noteIcon, bottleSVG: bottleSVG, bottleArt: bottleArt, noteArt: noteArt, notesCaveat: notesCaveat,
    buildModel: buildModel, mount: mount,
    notesHTML: notesHTML, notePreview: notePreview, linksHTML: linksHTML, priceHTML: priceHTML,
    badgesHTML: badgesHTML, editButton: editButton,
    yearAttrs: yearAttrs, entryAttrs: entryAttrs, entryId: entryId, tryAttrs: tryAttrs,
    REDACTED_LABEL: REDACTED_LABEL, REDACTED_HINT: REDACTED_HINT,
  };
})();
