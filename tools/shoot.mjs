// Matched screenshots + real-layout checks for every concept.
// Usage: node tools/shoot.mjs [01-journal-spine ...]
// Writes mockups/screenshots/NN-<state>-<viewport>.png and prints overflow findings.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '../mockups');
const out = path.join(root, 'screenshots');
fs.mkdirSync(out, { recursive: true });

const concepts = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(root).filter(d => /^\d\d[a-z]?-/.test(d)).sort();

const STATES = {
  history: 'view=history&year=2020&entry=h-red-tobacco&scrollTo=' + encodeURIComponent('[data-olf-entry="2020:h-red-tobacco"]'),
  try: 'view=try&group=w-tuxedo',
  first: '',
  owner: 'mode=owner&year=2019&entry=h-syn-nocturne&scrollTo=' + encodeURIComponent('[data-olf-entry="2019:h-syn-nocturne"]'),
};
const VIEWPORTS = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } };

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const findings = [];
for (const c of concepts) {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [sName, q] of Object.entries(STATES)) {
      await page.goto('file://' + path.join(root, c, 'index.html') + (q ? '?' + q : ''));
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll('body *')]
          .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed'; })
          .slice(0, 3).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'));
        return { scroll: document.documentElement.scrollWidth > w, wide };
      });
      if (overflow.scroll) findings.push(`${c} ${sName} ${vpName}: horizontal overflow (${overflow.wide.join(', ')})`);
      await page.screenshot({ path: path.join(out, `${c.slice(0, 2)}-${sName}-${vpName}.png`) });
    }
    // Small targets check on the default state.
    await page.goto('file://' + path.join(root, c, 'index.html'));
    const small = await page.evaluate(() => [...document.querySelectorAll('.olf-main button, .olf-main a')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height < 32; })
      .slice(0, 3).map(el => el.textContent.trim().slice(0, 30) + ' ' + Math.round(el.getBoundingClientRect().height) + 'px'));
    if (small.length) findings.push(`${c} ${vpName}: small touch targets: ${small.join(' | ')}`);
    if (errors.length) findings.push(`${c} ${vpName}: page errors: ${errors.join(' | ')}`);
    await page.close();
  }
  console.log('shot', c);
}
await browser.close();
console.log(findings.length ? '\nFindings:\n' + findings.join('\n') : '\nNo overflow, target, or error findings.');
