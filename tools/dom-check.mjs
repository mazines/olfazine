// DOM behaviour checks for every concept, without a real browser.
// Usage: node tools/dom-check.mjs [01-journal-spine ...]
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../mockups');
const concepts = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(root).filter(d => /^\d\d[a-z]?-/.test(d)).sort();

const PRIVATE = /MYSLF|Homme Id|Angels|Sun Bleached|Tuxedo|Aventus/;
let failures = 0;

async function load(concept, search = '') {
  const dir = path.join(root, concept);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    url: 'file://' + dir + '/index.html' + search,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  w.addEventListener('error', e => errors.push(e.message));
  // Run external and inline scripts in document order.
  for (const s of [...w.document.querySelectorAll('script')]) {
    const src = s.getAttribute('src');
    try { w.eval(src ? fs.readFileSync(path.join(dir, src), 'utf8') : s.textContent); }
    catch (e) { errors.push((src || 'inline script') + ': ' + e.message); }
  }
  return { w, d: w.document, errors };
}

const click = (el) => el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click', { bubbles: true }));
const visibleText = (d, sel) => {
  const el = d.querySelector(sel);
  return el && !el.hidden ? el.textContent : '';
};

for (const c of concepts) {
  const results = [];
  const ok = (cond, msg) => { results.push((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) failures++; };
  try {
    let { d, errors } = await load(c);
    ok(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
    const hist = d.getElementById('olf-panel-history'), tryP = d.getElementById('olf-panel-try');
    ok(hist && !hist.hidden && tryP && tryP.hidden, 'History visible first, To try hidden');
    ok(d.querySelector('[data-olf-year="2026"]')?.getAttribute('aria-expanded') === 'true', 'latest year (2026) expanded by default');
    ok(!hist.textContent.includes('Aventus') && /REDACTED/.test(hist.textContent), 'current year (2026) redacted in public');

    // Year expansion
    const y2020 = d.querySelector('[data-olf-year="2020"]');
    ok(!!y2020, 'year 2020 control exists');
    if (y2020) {
      ok(y2020.tagName === 'BUTTON' && y2020.getAttribute('aria-expanded') !== null, 'year control is a button with aria-expanded');
      // Some concepts open every year by default; only click a closed year.
      if (y2020.getAttribute('aria-expanded') !== 'true') click(y2020);
      ok(d.getElementById('olf-panel-history').textContent.includes('Baccarat Rouge 540'), 'clicking 2020 reveals its fragrances');
      // Fragrance expansion
      const br = d.querySelector('[data-olf-entry="2020:h-br540"]');
      ok(!!br, 'Baccarat Rouge 540 entry control in 2020');
      if (br) {
        click(br);
        const t = d.getElementById('olf-panel-history').textContent;
        ok(t.includes('2020'), 'Baccarat Rouge 540 detail shows its period');
        ok(t.includes('Sophomore year of college, COVID'), 'Baccarat Rouge 540 detail shows memory');
        const again = d.querySelector('[data-olf-entry="2020:h-br540"]');
        ok(again && again.getAttribute('aria-expanded') === 'true', 'entry reports aria-expanded=true');
        ok(!again.querySelector('a, button'), 'no links/buttons nested inside the disclosure button');
      }
      ok(d.querySelectorAll('[data-olf-entry="2020:h-br540"]').length === 1, 'Baccarat Rouge 540 appears once in 2020');
    }
    ok(!d.querySelector('[data-olf-year="2023"]'), 'no empty 2023 year control');

    // Tab switch preserves state
    const tabTry = d.querySelector('[data-olf-view="try"]');
    click(tabTry);
    ok(d.getElementById('olf-panel-try').hidden === false && d.getElementById('olf-panel-history').hidden === true, 'To try tab switches panels');
    ok(tabTry.getAttribute('aria-selected') === 'true', 'To try tab aria-selected');
    // Every To try fragrance is private: the public sees only REDACTED tiles, no controls.
    ok(!d.querySelector('#olf-panel-try [data-olf-try]'), 'public To try has no openable tiles');
    ok((d.getElementById('olf-panel-try').textContent.match(/REDACTED/g) || []).length >= 3, 'public To try shows 3 REDACTED tiles');
    click(d.querySelector('[data-olf-view="history"]'));
    ok(d.querySelector('[data-olf-entry="2020:h-br540"]')?.getAttribute('aria-expanded') === 'true', 'History expansion preserved after tab round-trip');

    // Public redaction: all of 2025 is private.
    ok(!PRIVATE.test(d.getElementById('olf-root').innerHTML), 'public DOM has no private identities');
    const y2025 = d.querySelector('[data-olf-year="2025"]');
    if (y2025.getAttribute('aria-expanded') !== 'true') click(y2025);
    ok(/REDACTED/.test(d.getElementById('olf-panel-history').textContent), 'History shows REDACTED in 2025');
    ok(!PRIVATE.test(d.getElementById('olf-root').innerHTML), 'public DOM still clean after expanding 2025');

    // Owner view
    click(d.querySelector('.olf-demo [data-olf-mode="owner"]'));
    ok(/MYSLF/.test(d.getElementById('olf-panel-history').textContent), 'owner sees private entry name in 2025');
    if (c.startsWith('08')) ok(/Aventus/.test(d.getElementById('olf-panel-history').textContent), 'owner sees current-year entry (Aventus)');
    ok(/Private/.test(d.getElementById('olf-root').textContent), 'owner sees Private badge');
    click(d.querySelector('[data-olf-view="try"]'));
    const tux = d.querySelector('[data-olf-try="w-tuxedo"]');
    ok(!!tux && !!d.querySelector('[data-olf-try="w-sun-bleached"]'), 'owner: Sun Bleached and Tuxedo are separate tiles');
    if (tux) {
      click(tux);
      const t = d.getElementById('olf-panel-try').textContent;
      ok(t.includes('Tuxedo'), 'owner: Tuxedo tile opens');
      ok([...d.querySelectorAll('#olf-panel-try a')].some(a => /Shop/.test(a.textContent)), 'owner: open tile has a Shop link');
      if (c === '08-botanical-tree' || c.startsWith('08a')) ok(/Wear together with Une Nuit Nomade Sun Bleached Extrait/.test(t), 'owner: wear-together note names the full partner');
      ok(!/ratio|spray order|bundle|Price not sourced/i.test(t), 'no invented ratio/order/bundle copy, no empty price line');
    }
    ok(d.getElementById('olf-panel-try').textContent.includes("Angels' Share"), "owner: Angels' Share listed");
    click(d.querySelector('[data-olf-mode="preview"]'));
    ok(!PRIVATE.test(d.querySelector('.olf-main').innerHTML), 'preview public view hides private identities');
    ok(!d.querySelector('.olf-preview-banner').hidden, 'preview banner visible');

    // Collapse all / Expand all (only concepts that opt in)
    const coll = d.querySelector('[data-olf-collapse]');
    if (coll) {
      click(d.querySelector('.olf-demo [data-olf-mode="public"]'));
      click(d.querySelector('[data-olf-view="history"]'));
      click(d.querySelector('[data-olf-collapse]'));
      ok(!d.querySelector('[data-olf-year][aria-expanded="true"]') && d.querySelector('[data-olf-collapse]').textContent === 'Expand all', 'Collapse all closes every year; label flips');
      click(d.querySelector('[data-olf-collapse]'));
      ok(d.querySelectorAll('[data-olf-year][aria-expanded="true"]').length === d.querySelectorAll('[data-olf-year]').length, 'Expand all reopens every year');
    }

    // URL seeding for matched screenshots
    ({ d, errors } = await load(c, '?view=try&group=w-tuxedo&mode=owner'));
    ok(!d.getElementById('olf-panel-try').hidden && d.querySelector('[data-olf-try="w-tuxedo"]')?.getAttribute('aria-expanded') === 'true', 'URL state seeds To try + open tile');
    ({ d } = await load(c, '?year=2020&entry=h-br540'));
    ok(d.querySelector('[data-olf-entry="2020:h-br540"]')?.getAttribute('aria-expanded') === 'true', 'URL state seeds year + entry');
  } catch (e) {
    ok(false, 'crashed: ' + e.stack);
  }
  console.log(c + '\n' + results.join('\n'));
}
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
