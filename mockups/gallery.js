/* Gallery for comparing the ten concepts at matched states and viewports. */
(function () {
  "use strict";

  // Tradeoffs are filled in after review. Keep each line short.
  const CONCEPTS = [
    { n: "01", dir: "01-journal-spine", name: "Journal spine",
      what: "Left timeline; spacious rows; detail grows as an inline branch.",
      plus: "Calm, readable, closest to a personal journal.", minus: "Least visually surprising." },
    { n: "02", dir: "02-centerline-chronology", name: "Centerline chronology",
      what: "Central year spine; fragrances alternate left and right.",
      plus: "Strong sense of time passing.", minus: "Alternation costs width; single column on phones." },
    { n: "03", dir: "03-collection-explorer", name: "Collection explorer",
      what: "Three desktop panes: years, fragrances, detail. Stacked on phones.",
      plus: "Fast browsing; detail never pushes the list away.", minus: "App-like; less journal feel." },
    { n: "04", dir: "04-bottle-shelves", name: "Annual bottle shelves",
      what: "Year chips reveal a shelf of bottles; detail opens beneath the shelf.",
      plus: "Bottle-led and tactile.", minus: "Depends on bottle imagery quality." },
    { n: "05", dir: "05-contact-sheet", name: "Photographic contact sheet",
      what: "Year sections open image grids; selection opens a full-width row.",
      plus: "Image-forward, scannable at a glance.", minus: "Placeholder bottles show most here." },
    { n: "06", dir: "06-fragrance-index", name: "Fragrance index",
      what: "Dense typographic rows; detail as indented branches.",
      plus: "Most information per screen.", minus: "Austere; imagery is secondary." },
    { n: "07", dir: "07-editorial-folios", name: "Editorial folios",
      what: "Huge year numerals; magazine-style entries and feature blocks.",
      plus: "Most expressive and memorable.", minus: "Long scroll; more design upkeep." },
    { n: "08", dir: "08-botanical-tree", name: "Botanical tree",
      what: "Trunk (year) → branch (fragrance) → leaves (notes).",
      plus: "Makes the hierarchy literal; notes take centre stage.", minus: "Decorative lines need care on phones." },
    { n: "08a", dir: "08a-botanical-horizontal", name: "Botanical tree · horizontal trunk",
      what: "Years along a horizontal trunk; fragrances hang below; notes string along a stem in the panel.",
      plus: "Whole collection visible at once on desktop.", minus: "Phones fall back to the vertical tree." },
    { n: "08b", dir: "08b-botanical-sideways", name: "Botanical tree · sideways growth",
      what: "Trunk down the left; fragrances branch right; notes leaf further right beside the detail.",
      plus: "Year, fragrance, and notes read left to right in one line.", minus: "Phones fall back to the vertical tree." },
    { n: "09", dir: "09-yearly-card-stacks", name: "Yearly card stacks",
      what: "Each year is a card stack that opens into a grid; cards expand inline.",
      plus: "Friendly, tactile, good on phones.", minus: "Softer, less editorial." },
    { n: "10", dir: "10-wearing-period-atlas", name: "Wearing-period atlas",
      what: "Month tracks per year; intervals, gaps, and uncertainty drawn to scale.",
      plus: "Shows dates honestly, including gaps.", minus: "Data-viz feel; memories are one click deeper." },
  ];

  // Three strongest directions, in order.
  const RECS = [
    { n: "01", title: "Journal spine",
      why: "Best fit for an elegant personal journal. Memories read like prose, and the fewest moving parts carry into Phase 2." },
    { n: "08", title: "Botanical tree",
      why: "Most distinctive. Notes become illustrated leaves, which showcases the note art you like. Trades some density for character." },
    { n: "04", title: "Annual bottle shelves",
      why: "Most tactile, and the strongest To try (the Wear together pair stands on one shelf). Its quality depends on real bottle images." },
  ];

  const STATES = {
    history: "view=history&year=2020&entry=h-br540&scrollTo=" + encodeURIComponent('[data-olf-entry="2020:h-br540"]'),
    try: "view=try&group=w-tuxedo",
    default: "",
  };
  const VP = { desktop: [1440, 1000], mobile: [390, 844] };

  const grid = document.getElementById("grid");
  const form = document.querySelector(".g-controls");

  function url(c, s, mode) {
    const q = [STATES[s], mode === "owner" ? "mode=owner" : ""].filter(Boolean).join("&");
    return c.dir + "/index.html" + (q ? "?" + q : "");
  }

  function frame(c, href, vp) {
    const [w, h] = VP[vp];
    return '<div class="g-frame g-' + vp + '" style="--w:' + w + ";--h:" + h + '">' +
      '<div class="g-frame-label">' + w + "×" + h + "</div>" +
      '<div class="g-viewport"><iframe loading="lazy" src="' + href + '" width="' + w + '" height="' + h +
      '" title="' + c.n + " " + c.name + " at " + w + "×" + h + '" tabindex="-1"></iframe></div></div>';
  }

  function render() {
    const s = form.state.value, mode = form.mode.value, vp = form.vp.value;
    grid.className = "g-grid g-vp-" + vp;
    grid.innerHTML = CONCEPTS.map(function (c) {
      const href = url(c, s, mode);
      const frames = vp === "both" ? frame(c, href, "desktop") + frame(c, href, "mobile") : frame(c, href, vp);
      return '<li class="g-card" id="c' + c.n + '">' +
        '<div class="g-card-head"><span class="g-num">' + c.n + "</span>" +
          '<h2><a href="' + c.dir + '/index.html">' + c.name + "</a></h2>" +
          '<a class="g-open" href="' + href + '" target="_blank" rel="noopener">Open this state ↗</a></div>' +
        '<p class="g-what">' + c.what + "</p>" +
        '<dl class="g-trade"><div><dt>Strength</dt><dd>' + c.plus + "</dd></div><div><dt>Tradeoff</dt><dd>" + c.minus + "</dd></div></dl>" +
        '<div class="g-frames">' + frames + "</div>" +
      "</li>";
    }).join("");
    fit();
  }

  // Scale each fixed-size viewport to the width its box has.
  function fit() {
    document.querySelectorAll(".g-frame").forEach(function (f) {
      const w = Number(getComputedStyle(f).getPropertyValue("--w"));
      const box = f.querySelector(".g-viewport");
      const scale = box.clientWidth / w;
      f.style.setProperty("--scale", scale);
    });
  }

  document.getElementById("recs").innerHTML = RECS.map(function (r) {
    return '<li><a href="#c' + r.n + '"><strong>' + r.n + " " + r.title + "</strong></a> " + r.why + "</li>";
  }).join("");
  document.getElementById("combo").textContent =
    "Worth combining: use the 10 atlas density strip as the collapsed year row in 01 or 08, so dates stay honest at a glance.";

  form.addEventListener("change", render);
  window.addEventListener("resize", fit);
  render();
})();
