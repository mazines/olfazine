/* Olfazine mockup data. Local design exploration only.
 *
 * Rules carried from the brief:
 * - Fragrance identity (catalog) is separate from wearing periods and memories (history).
 * - Concentrations are unconfirmed unless supplied. No variant is chosen silently.
 * - Notes are UNVERIFIED SAMPLES for layout. Phase 2 replaces them with sourced data.
 * - Bottle art is an illustrative placeholder, never a product photo.
 * - Privacy belongs to the fragrance record, so it applies to every period and every view.
 *   Private (owner, 2026-11-06): all of 2025 and every To try fragrance.
 */
(function () {
  "use strict";

  // shape: tall | square | round | flask | faceted | slim | none
  const catalog = {
    "dior-sauvage": {
      name: "Sauvage", brand: "Dior", variant: null,
      bottle: { shape: "square", glass: "#2c3e57", cap: "#1b1b1b" },
      notes: ["Bergamot", "Sichuan pepper", "Lavender", "Ambroxan", "Cedar"],
    },
    "tf-black-orchid": {
      name: "Black Orchid", brand: "Tom Ford", variant: null,
      bottle: { shape: "faceted", glass: "#1d1a22", cap: "#c9a45c" },
      notes: ["Black truffle", "Ylang-ylang", "Black orchid", "Patchouli", "Incense", "Vanilla"],
    },
    "mancera-red-tobacco": {
      name: "Red Tobacco", brand: "Mancera", variant: null,
      bottle: { shape: "tall", glass: "#7a1f1f", cap: "#d8c7a0" },
      notes: ["Tobacco", "Cinnamon", "Saffron", "Patchouli", "Oud", "Vanilla"],
    },
    "mfk-br540": {
      name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", variant: null,
      bottle: { shape: "faceted", glass: "#c2463e", cap: "#e9d9b8" },
      notes: ["Saffron", "Jasmine", "Amberwood", "Ambergris", "Fir resin", "Cedar"],
    },
    "kilian-intoxicated": {
      name: "Intoxicated", brand: "KILIAN PARIS", variant: null,
      bottle: { shape: "round", glass: "#3b2618", cap: "#111111" },
      notes: ["Coffee", "Cardamom", "Cinnamon", "Nutmeg"],
    },
    "amour-tous-le-jours": {
      // Kept exactly as written. Identity unresolved: no notes, image, or product links.
      name: "Tous le Jours", brand: "Amour", variant: null, unresolved: true,
      bottle: { shape: "none" },
      notes: [],
    },
    "le-labo-tonka-25": {
      name: "Tonka 25", brand: "Le Labo", variant: "Eau de Parfum", variantConfirmed: true,
      bottle: { shape: "round", glass: "#dcd6c8", cap: "#6b6b6b" },
      notes: [],
    },
    "paco-invictus-victory": {
      name: "Invictus Victory", brand: "Paco Rabanne", variant: null,
      bottle: { shape: "flask", glass: "#2b2b2b", cap: "#c7a250" },
      notes: ["Lemon", "Pink pepper", "Lavender", "Incense", "Tonka bean", "Vanilla"],
    },
    "paco-phantom": {
      name: "Phantom", brand: "Paco Rabanne", variant: null,
      bottle: { shape: "tall", glass: "#9aa3ad", cap: "#d9dde1" },
      notes: ["Lemon", "Lavender", "Vanilla", "Vetiver", "Patchouli"],
    },
    "bentley-men-intense": {
      name: "Bentley for Men Intense", brand: "Bentley", variant: null,
      bottle: { shape: "square", glass: "#4a2f1d", cap: "#b8b8b8" },
      notes: ["Rum", "Black pepper", "Cinnamon", "Incense", "Leather", "Cedar"],
    },
    "ysl-myslf": {
      private: true, name: "MYSLF", brand: "Yves Saint Laurent", variant: null,
      bottle: { shape: "slim", glass: "#d8d4cc", cap: "#141414" },
      notes: ["Bergamot", "Orange blossom", "Patchouli", "Woody notes"],
    },
    "guerlain-lhomme-ideal": {
      private: true, name: "L'Homme Idéal", brand: "Guerlain", variant: null,
      bottle: { shape: "flask", glass: "#5c3a1e", cap: "#2a2a2a" },
      notes: ["Almond", "Citrus", "Rosemary", "Tonka bean", "Vetiver"],
    },
    "creed-aventus": {
      name: "Aventus", brand: "Creed", variant: null,
      bottle: { shape: "tall", glass: "#1e2a24", cap: "#c4c4c4" },
      notes: ["Pineapple", "Bergamot", "Birch", "Patchouli", "Oakmoss", "Musk"],
    },
    "kilian-angels-share": {
      private: true, name: "Angels' Share", brand: "KILIAN PARIS", variant: null,
      bottle: { shape: "round", glass: "#8a4b16", cap: "#111111" },
      notes: ["Cognac", "Cinnamon", "Tonka bean", "Oak", "Praline", "Vanilla"],
    },
    "unn-sun-bleached-extrait": {
      // Identity confirmed by owner. Notes not sourced yet.
      private: true, name: "Sun Bleached", brand: "Une Nuit Nomade", variant: "Extrait", variantConfirmed: true,
      bottle: { shape: "square", glass: "#e8dcc2", cap: "#b48a52" },
      notes: [],
    },
    "ysl-tuxedo": {
      private: true, name: "Tuxedo", brand: "Yves Saint Laurent", variant: null,
      bottle: { shape: "slim", glass: "#151515", cap: "#151515" },
      notes: ["Violet leaf", "Coriander", "Black pepper", "Rose", "Patchouli", "Vanilla", "Ambergris"],
    },
    "paco-1-million": {
      name: "1 Million", brand: "Paco Rabanne", variant: "Eau de Toilette", variantConfirmed: true,
      bottle: { shape: "square", glass: "#c9a443", cap: "#a8842c" },
      notes: [],
    },
    "versace-eros-parfum": {
      name: "Eros", brand: "Versace", variant: "Parfum", variantConfirmed: true,
      bottle: { shape: "square", glass: "#1f6f8b", cap: "#c8a24a" },
      notes: [],
    },
    "ard-al-zaafaran-oudi": {
      name: "Oudi", brand: "Ard Al Zaafaran", variant: "Eau de Parfum", variantConfirmed: true,
      shopUrl: "https://modestycollection.com.au/products/oudi-perfume",
      bottle: { shape: "square", glass: "#7a2a22", cap: "#1a1a1a" },
      notes: [],
    },
    "nishane-ani": {
      name: "Ani", brand: "Nishane", variant: "Extrait de Parfum", variantConfirmed: true,
      bottle: { shape: "square", glass: "#e8e4da", cap: "#c9a24a" },
      notes: [],
    },
  };

  // Dates: { y, m? } with m 1-12. Month endpoints are inclusive.
  // end: null means unknown. ongoing must be explicit.
  const history = [
    { id: "h-sauvage", fragrance: "dior-sauvage",
      periods: [{ start: { y: 2017 }, end: { y: 2018 } }],
      memory: "High School" },
    { id: "h-black-orchid", fragrance: "tf-black-orchid",
      periods: [{ start: { y: 2019 }, end: { y: 2019 } }],
      memory: "Freshman Year of College",
      sourceNote: "Freshman Year of College (original life-stage note)" },
    { id: "h-red-tobacco", fragrance: "mancera-red-tobacco",
      periods: [{ start: { y: 2020, m: 1 }, end: { y: 2020, m: 12 } }],
      memory: "Sophomore year of college, COVID" },
    { id: "h-br540", fragrance: "mfk-br540",
      periods: [{ start: { y: 2020, m: 1 }, end: { y: 2020, m: 12 } }],
      memory: "Sophomore year of college, COVID",
      sourceNote: "Originally written as MFK br450; confirmed as Baccarat Rouge 540." },
    { id: "h-intoxicated", fragrance: "kilian-intoxicated",
      periods: [{ start: { y: 2020, m: 1 }, end: { y: 2020, m: 12 } }],
      memory: "Sophomore year of college, COVID" },
    { id: "h-tous-le-jours", fragrance: "amour-tous-le-jours",
      periods: [{ start: { y: 2020, m: 1 }, end: { y: 2020, m: 12 } }],
      memory: "Sophomore year of college, COVID" },
    { id: "h-tonka-25", fragrance: "le-labo-tonka-25",
      periods: [{ start: { y: 2021 }, end: { y: 2021 } }],
      memory: "During COVID" },
    { id: "h-invictus-victory", fragrance: "paco-invictus-victory",
      periods: [{ start: { y: 2022 }, end: { y: 2022 } }],
      memory: "Senior Year of College, 1st year post-college",
      sourceNote: "Senior Year of College, 1st year post-college (original note)" },
    { id: "h-phantom", fragrance: "paco-phantom",
      periods: [{ start: { y: 2024 }, end: { y: 2024 } }],
      memory: "Year 1" },
    { id: "h-bentley", fragrance: "bentley-men-intense",
      periods: [{ start: { y: 2024, m: 11 }, end: { y: 2024, m: 12 } }],
      memory: "New Orleans → Miami → Jamaica → Cartagena → NYC" },
    { id: "h-myslf", fragrance: "ysl-myslf",
      periods: [{ start: { y: 2025, m: 1 }, end: { y: 2025, m: 3 } }],
      memory: null },
    { id: "h-lhomme-ideal", fragrance: "guerlain-lhomme-ideal",
      periods: [{ start: { y: 2025, m: 3 }, end: { y: 2025, m: 6 } }],
      memory: "Year 2" },
    { id: "h-aventus", fragrance: "creed-aventus",
      periods: [{ start: { y: 2026, m: 1 }, end: { y: 2026, m: 6 } }],
      memory: "Cairo Bullshit Trip; Year 3" },

    { id: "h-1-million", fragrance: "paco-1-million",
      periods: [{ start: { y: 2017 }, end: { y: 2017 } }],
      memory: null },
    { id: "h-eros", fragrance: "versace-eros-parfum",
      periods: [{ start: { y: 2019 }, end: { y: 2019 } }],
      memory: null },
    { id: "h-oudi", fragrance: "ard-al-zaafaran-oudi",
      periods: [{ start: { y: 2019 }, end: { y: 2019 } }],
      memory: null },
    { id: "h-ani", fragrance: "nishane-ani",
      periods: [{ start: { y: 2022 }, end: { y: 2022 } }],
      memory: null },
  ];

  // To try. Plain tiles. wearWith only adds a "Wear together with ..." note. Clicking Shop never writes history.
  const wishlist = [
    { id: "w-sun-bleached", kind: "single", fragrance: "unn-sun-bleached-extrait", wearWith: ["ysl-tuxedo"] },
    { id: "w-tuxedo", kind: "single", fragrance: "ysl-tuxedo", wearWith: ["unn-sun-bleached-extrait"] },
    { id: "w-angels-share", kind: "single", fragrance: "kilian-angels-share" },
  ];

  window.OLF_DATA = { catalog, history, wishlist, today: { y: 2026, m: 11 } };
})();
