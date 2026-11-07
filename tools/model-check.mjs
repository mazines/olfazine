// Checks shared model rules without a browser.
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { window: {}, location: { search: '' }, URLSearchParams, console };
vm.createContext(ctx);
for (const f of ['mockups/shared/data.js', 'mockups/shared/core.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const Olf = ctx.window.Olf;
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

for (const mode of ['public', 'owner']) {
  const m = Olf.buildModel(mode);
  console.log(`\n== ${mode} ==`);
  for (const y of m.years) console.log(y.year, y.entries.map(e => e.redacted ? 'REDACTED' : e.fragrance.name + ' [' + e.periodsInYear.map(p => p.text).join(' + ') + ']').join(' | '));
  console.log('gaps', m.gaps.join(','));
  console.log('try', m.tryList.map(t => t.redacted ? `REDACTED(${t.kind})` : t.kind === 'group' ? t.title + ': ' + t.members.map(x => x.name).join(' + ') : t.fragrance.name).join(' | '));
  const yrs = m.years.map(y => y.year);
  ok(JSON.stringify(yrs) === '[2026,2025,2024,2020,2019,2018,2017]', 'years newest first, no 2021-2023');
  const bo = y => m.years.find(x => x.year === y).entries.filter(e => !e.redacted && e.fragrance.name === 'Black Orchid').length;
  ok(bo(2018) === 1 && bo(2019) === 1 && bo(2020) === 1, 'Black Orchid once in each of 2018, 2019, 2020');
  const json = JSON.stringify(m);
  if (mode === 'public') {
    ok(!/MYSLF|Homme Id|Angels|Sun Bleached|Tuxedo/i.test(json), 'public model has no private identity');
    ok(m.tryList.length === 3 && m.tryList.every(t => t.redacted), 'every To try tile redacted in public');
    ok(m.years.find(y => y.year === 2025).entries.every(e => e.redacted), 'all of 2025 redacted in public');
  } else {
    ok(/MYSLF/.test(json) && /Tuxedo/.test(json), 'owner sees private entries');
    const sb = m.tryList.find(t => t.key === 'w-sun-bleached');
    ok(sb && sb.wearWith[0] === 'Yves Saint Laurent Tuxedo', 'owner sees full partner name on wear-together note');
  }
}
const t = (p) => Olf.periodText(p);
ok(t({ start: { y: 2018, m: 8 }, end: { y: 2019, m: 5 } }) === 'Aug 2018 – May 2019', 'month range');
ok(t({ start: { y: 2020 }, end: { y: 2020 } }) === '2020', 'year-only single');
ok(t({ start: { y: 2017 }, end: { y: 2018 } }) === '2017 – 2018', 'year-only range');
ok(t({ start: { y: 2020, m: 1 }, end: { y: 2020, m: 12 } }) === 'Jan – Dec 2020', 'full year month precision');
ok(t({ start: { y: 2025, m: 4, approx: true }, end: null, ongoing: true }) === 'c. Apr 2025 – ongoing', 'ongoing approx');
ok(JSON.stringify(Olf.periodYears({ start: { y: 2022, m: 3 }, end: null })) === '[2022]', 'unknown end stays in start year');
ok(Olf.monthsInYear({ start: { y: 2017 }, end: { y: 2018 } }, 2017) === null, 'year precision makes no month claim');
process.exit(fail ? 1 : 0);
