// Owner-run Fragella lookup for Olfazine. Run this in your own Terminal, outside Claude Code.
//
//   key: FRAGELLA_API_KEY env var, or FRAGELLA_API_KEY=... in .env.local (git-ignored)
//   node tools/fragella-fetch.mjs          # dry run: prints every request, sends nothing
//   node tools/fragella-fetch.mjs --send   # GET fragrance data + terms/docs pages
//   add --only=id1,id2 to look up just those catalog ids
//   node tools/fragella-fetch.mjs --images # chosen bottles + note images from cdn.fragella.com
//   node tools/fragella-fetch.mjs --build  # write mockups/shared/fragella-local.js
//
// Sends only GET requests to FRAGELLA_BASE with the x-api-key header and a fragrance name.
// Saves raw responses under imports/fragella/. That folder is private: keep it out of any public repo.
// Response fields are not assumed; everything is saved as returned for review.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import readline from 'node:readline/promises';

const here = path.dirname(new URL(import.meta.url).pathname);
const project = path.resolve(here, '..');
const outDir = path.join(project, 'imports', 'fragella');
const BASE = process.env.FRAGELLA_BASE || 'https://api.fragella.com/api/v1';
// Key from the environment, else from the git-ignored .env.local in the project root.
function readKey() {
  if (process.env.FRAGELLA_API_KEY) return process.env.FRAGELLA_API_KEY;
  const envFile = path.join(project, '.env.local');
  if (!fs.existsSync(envFile)) return '';
  const line = fs.readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('FRAGELLA_API_KEY='));
  return line ? line.slice('FRAGELLA_API_KEY='.length).trim() : '';
}
const KEY = readKey();
const PAGES = ['https://api.fragella.com/terms-of-use.html', 'https://api.fragella.com/docs.html'];
const mode = process.argv.includes('--images') ? 'images' : process.argv.includes('--send') ? 'send' : 'dry';
// --only id1,id2 limits the lookup to those catalog ids (saves monthly quota).
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
const DELAY_MS = 1200;

// One source of truth: the mockup catalog. Skip synthetic examples and unresolved identities.
function catalog() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(project, 'mockups/shared/data.js'), 'utf8'), ctx);
  return Object.entries(ctx.window.OLF_DATA.catalog)
    .filter(([, f]) => !f.synthetic && !f.unresolved)
    .filter(([id]) => !ONLY || ONLY.includes(id))
    .map(([id, f]) => {
      // Skip the brand when the name already starts with it ("Bentley for Men Intense").
      const brand = f.brand && !f.name.toLowerCase().startsWith(f.brand.toLowerCase()) ? f.brand : null;
      return { id, query: [brand, f.name, f.variantConfirmed ? f.variant : null].filter(Boolean).join(' ') };
    });
}

const masked = KEY ? KEY.slice(0, 3) + '…' + KEY.slice(-2) : '(not set)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const searchUrl = (q) => `${BASE}/fragrances?search=${encodeURIComponent(q)}&limit=3`;

async function dryOrSend() {
  const items = catalog();
  console.log(`Mode: ${mode}. ${items.length} API requests + ${PAGES.length} page requests.`);
  console.log(`Every API request: GET, header x-api-key: ${masked}. No other data is sent.\n`);
  for (const it of items) console.log(`GET ${searchUrl(it.query)}`);
  for (const p of PAGES) console.log(`GET ${p}   (no key)`);
  if (mode === 'dry') { console.log('\nDry run only. Re-run with --send to make these requests.'); return; }
  if (!KEY) { console.error('\nFRAGELLA_API_KEY is not set.'); process.exit(1); }

  fs.mkdirSync(outDir, { recursive: true });
  const manifest = { fetchedAt: new Date().toISOString(), base: BASE, results: [] };
  for (const p of PAGES) {
    const r = await fetch(p);
    const file = path.basename(new URL(p).pathname);
    fs.writeFileSync(path.join(outDir, file), await r.text());
    console.log(`${r.status} ${p} -> imports/fragella/${file}`);
  }
  for (const it of items) {
    const url = searchUrl(it.query);
    const r = await fetch(url, { headers: { 'x-api-key': KEY, accept: 'application/json' } });
    const body = await r.text();
    fs.writeFileSync(path.join(outDir, `${it.id}.json`), body);
    manifest.results.push({ id: it.id, query: it.query, url, status: r.status, remaining: r.headers.get('x-ratelimit-remaining') });
    console.log(`${r.status} ${it.query}`);
    if (r.status === 401 || r.status === 403) { console.error('Key rejected. Stopping.'); break; }
    if (r.status === 429) { console.error('Rate limited. Stopping; re-run later for the rest.'); break; }
    // The endpoint path is from memory. A 404 means it is wrong: stop, check docs.html, set FRAGELLA_BASE.
    if (r.status === 404) { console.error('404: endpoint path differs. Stopping. Check imports/fragella/docs.html.'); break; }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\nSaved to imports/fragella/. Next: node tools/fragella-fetch.mjs --images');
}

// Collect http(s) image URLs anywhere in the saved responses, without assuming field names.
function imageUrls(value, found = new Set()) {
  if (typeof value === 'string' && /^https?:\/\/\S+\.(png|jpe?g|webp|avif)(\?\S*)?$/i.test(value)) found.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => imageUrls(v, found));
  return found;
}

// The chosen result per catalog id (imports/fragella/selection.json).
function selected() {
  const sel = JSON.parse(fs.readFileSync(path.join(outDir, 'selection.json'), 'utf8'));
  return Object.entries(sel).filter(([k]) => !k.startsWith('_')).map(([id, i]) => {
    const rows = JSON.parse(fs.readFileSync(path.join(outDir, `${id}.json`), 'utf8'));
    return { id, r: rows[i] };
  }).filter((x) => x.r);
}
const noteFile = (name) => 'note-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.png';

// --images: only the chosen transparent bottles and their note illustrations, only from cdn.fragella.com.
async function images() {
  const jobs = [];
  const seen = new Set();
  for (const { id, r } of selected()) {
    if (r['Image URL Transparent']) jobs.push({ url: r['Image URL Transparent'], file: `bottle-${id}.webp` });
    for (const tier of Object.values(r.Notes || {})) for (const n of tier) {
      if (n.imageUrl && !seen.has(n.name)) { seen.add(n.name); jobs.push({ url: n.imageUrl, file: noteFile(n.name) }); }
    }
  }
  const allowed = jobs.filter((j) => new URL(j.url).host === 'cdn.fragella.com');
  console.log(`${allowed.length} images (bottles + note illustrations), host: cdn.fragella.com. Skipped other hosts: ${jobs.length - allowed.length}.`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ok = (await rl.question('Download them? Plain GET, no key sent. [y/N] ')).trim().toLowerCase() === 'y';
  rl.close();
  if (!ok) return;
  const imgDir = path.join(outDir, 'images');
  fs.mkdirSync(imgDir, { recursive: true });
  for (const j of allowed) {
    const r = await fetch(j.url);
    if (r.ok) fs.writeFileSync(path.join(imgDir, j.file), Buffer.from(await r.arrayBuffer()));
    console.log(`${r.status} ${j.file}`);
    await sleep(150);
  }
  console.log('Done. Tell Claude to run --build.');
}

// --build: write mockups/shared/fragella-local.js from the chosen results (local mockups only).
function build() {
  const imgDir = path.join(outDir, 'images');
  const has = (f) => fs.existsSync(path.join(imgDir, f));
  // Publishable copies live in img/ (repo root); paths are repo-relative.
  const pub = path.join(project, 'img');
  fs.mkdirSync(path.join(pub, 'bottles'), { recursive: true });
  fs.mkdirSync(path.join(pub, 'notes'), { recursive: true });
  const rel = (f) => {
    const dest = f.startsWith('trimmed/') ? 'bottles/' + path.basename(f) : f.startsWith('note-') ? 'notes/' + f.slice(5) : 'bottles/' + f;
    fs.copyFileSync(path.join(imgDir, f), path.join(pub, dest));
    return 'img/' + dest;
  };
  const out = {};
  for (const { id, r } of selected()) {
    const notes = {};
    for (const [tier, list] of Object.entries(r.Notes || {})) {
      notes[tier] = list.map((n) => ({ name: n.name, img: has(noteFile(n.name)) ? rel(noteFile(n.name)) : null }));
    }
    out[id] = {
      sourceName: r.Name, sourceBrand: r.Brand, oilType: r.OilType || null, year: r.Year || null,
      // Prefer the trimmed cutout (tools/cutout: tight crop, same height for every bottle).
      bottle: has(`trimmed/bottle-${id}.png`) ? rel(`trimmed/bottle-${id}.png`) : has(`bottle-${id}.webp`) ? rel(`bottle-${id}.webp`) : null,
      notes, accords: r['Main Accords'] || [],
    };
  }
  const file = path.join(project, 'mockups', 'shared', 'fragella-local.js');
  fs.writeFileSync(file, '/* Generated by tools/fragella-fetch.mjs --build. Source: Fragella API. */\n' +
    'window.OLF_FRAGELLA = ' + JSON.stringify(out, null, 1) + ';\n');
  const bottles = Object.values(out).filter((x) => x.bottle).length;
  console.log(`Wrote mockups/shared/fragella-local.js: ${Object.keys(out).length} fragrances, ${bottles} bottle images.`);
}

// --review: print the candidates per fragrance so the right match can be chosen.
function review() {
  for (const it of catalog()) {
    const file = path.join(outDir, `${it.id}.json`);
    if (!fs.existsSync(file)) { console.log(`${it.id}: no file`); continue; }
    let rows; try { rows = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { console.log(`${it.id}: unreadable`); continue; }
    console.log(`${it.id}  (query: ${it.query})`);
    (Array.isArray(rows) ? rows : []).forEach((r, i) =>
      console.log(`  [${i}] ${r.Name} | ${r.Brand} | ${r.OilType || '-'} | ${r.Year || '-'} | conf ${r.Confidence || '-'} | img ${r['Image URL Transparent'] ? 'yes' : 'no'}`));
  }
}

if (process.argv.includes('--review')) { review(); process.exit(0); }
if (process.argv.includes('--build')) { build(); process.exit(0); }
await (mode === 'images' ? images() : dryOrSend());
