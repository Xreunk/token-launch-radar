// Render the three gate screenshots for the Token Radar entry.
//
//   node tools/render-shots.mjs
//
// Renders, at 1280x800 (detail 1280x1000 so the farm plan shows; gate: long
// side <= 1440, short side >= 800, each file <= 512 KiB, PNG or JPEG), from
// out/dashboard + out/data.js:
//   1-board.png     the ranked board
//   2-detail.png    the detail view of the rank-1 protocol
//   3-filtered.png  the board filtered to one category
// Writes them to screenshots/ (repo), then re-run main.ts so out/ picks
// them up and writes dossier.json:
//   MAKEFUN_OUTPUT_DIR=out node main.ts --input ../kit-token-radar-01/kit/token-radar-01-kit/input/snapshot.json
//
// WORKING RENDER PATH (2026-11-15, this VM):
// - /opt/meta-chromium/chrome refuses to start: "Hatch WebGL domain policy
//   is required for browser startup". Do not use it.
// - Playwright's own browser download fails in this sandbox (CDN denied).
// - What works: Google Chrome installed from the official .deb
//   (dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb,
//   dpkg -i; /usr/bin/google-chrome, v157) + playwright-core with
//   executablePath pointing at it. playwright-core lives in /tmp/shot
//   (npm i playwright-core there); install it wherever you run this from.
// - A fresh page per shot: navigating to the same URL with a different
//   #hash is a same-document navigation that does NOT reload the page, so
//   the detail/filter hash would never apply on a reused page.
// - A bare `chrome --screenshot` of the #detail=... deep link came back
//   solid background (1 colour, 2026-11-15): scroll the detail into view
//   and let layout settle before shooting, and verify the shot has content.

import { chromium } from 'playwright-core';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const dash = `file://${join(here, 'out/dashboard/index.html')}`;
const out = join(here, 'screenshots');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function shot(url, file, width, height, scrollTo) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('PAGE ERROR:', String(e).slice(0, 300)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  if (scrollTo) {
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -10);
    }, scrollTo);
    await page.waitForTimeout(300);
  }
  const path = join(out, file);
  await page.screenshot({ path, type: 'png' });
  const bytes = statSync(path).size;
  console.log(`${file}: ${bytes} bytes${bytes > 524288 ? ' -- OVER 512 KiB, re-shoot as JPEG quality 80' : ''}`);
  if (bytes > 524288) {
    await page.screenshot({ path: path.replace(/\.png$/, '.jpg'), type: 'jpeg', quality: 80 });
    console.log('  wrote JPEG instead; delete the oversize PNG before running main.ts');
  }
  await page.close();
}

await shot(dash, '1-board.png', 1280, 800, null);
await shot(`${dash}#detail=steakhouse-financial`, '2-detail.png', 1280, 1000, '#detail');
await shot(`${dash}#cat=Risk%20Curators`, '3-filtered.png', 1280, 800, null);

await browser.close();
console.log('done. Next: MAKEFUN_OUTPUT_DIR=out node main.ts --input ../kit-token-radar-01/kit/token-radar-01-kit/input/snapshot.json');
