import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.setContent('<h1>ok</h1>');
console.log(await p.textContent('h1'));
await b.close();
