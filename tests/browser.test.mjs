import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const filePath = resolve(root, relative);
      if (!filePath.startsWith(`${root}${sep}`)) throw new Error('path escapes root');
      const body = await readFile(filePath);
      response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not found');
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function closeServer(server) {
  await new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose())));
}

test('mobile and desktop broadcast flow is evidence-bearing and replayable', { timeout: 30_000 }, async (context) => {
  const { server, origin } = await startServer();
  context.after(() => closeServer(server));
  const response = await fetch(origin);
  assert.match(await response.text(), /Bitcoin Emergency Broadcast System/);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  context.after(() => browser.close());

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const browserContext = await browser.newContext({ viewport });
    const page = await browserContext.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(origin, { waitUntil: 'networkidle' });

    const button = page.locator('#broadcast');
    await button.waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('#broadcast').disabled);
    assert.equal(await page.locator('#safety-ribbon').isVisible(), true);
    assert.equal(await page.locator('#pipeline-section').isVisible(), true);
    const box = await button.boundingBox();
    assert.ok(box && box.y < viewport.height, `CTA is above the fold at ${viewport.width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

    await button.click();
    await page.locator('#stage:not([hidden])').waitFor();
    assert.match(await page.locator('#telemetry').innerText(), /62%/);
    assert.match(await page.locator('#telemetry').innerText(), /2,100 sats/);
    assert.match(await page.locator('#telemetry').innerText(), /4,200 sats/);
    assert.equal(await page.locator('.pipeline li.complete').count(), 5);
    assert.equal(await page.locator('#facts .fact').count(), 3);
    assert.equal(await page.locator('#jokes .joke').count(), 3);
    assert.match(await page.locator('.facts-panel .panel-kicker').innerText(), /FIXTURE-BACKED DEMO/);
    assert.match(await button.innerText(), /REPLAY/);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'broadcast-title');
    const headingTop = await page.locator('#broadcast-title').evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(headingTop >= -2 && headingTop < 120, `result begins in view at ${viewport.width}px (top=${headingTop})`);
    const accessibility = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(accessibility.violations.map(({ id }) => id), []);

    await page.locator('[data-language="de"]').click();
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    assert.equal(await page.locator('#facts').getAttribute('lang'), 'de');
    assert.match(await page.locator('#facts').innerText(), /eingefrorene Demo-Wahrscheinlichkeit/);

    await button.click();
    assert.equal(await page.locator('#stage').count(), 1);
    assert.equal(await page.locator('#facts .fact').count(), 3);
    await browserContext.close();
  }

  const invalidContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const invalidPage = await invalidContext.newPage();
  await invalidPage.route('**/cases/flame-demo-1.json', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ schema_version: 2, id: 'flame-demo-1', raw_transaction: '00' }),
  }));
  await invalidPage.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await invalidPage.locator('#broadcast').isDisabled(), true);
  assert.equal(await invalidPage.locator('#safety-ribbon').isHidden(), true);
  assert.equal(await invalidPage.locator('#pipeline-section').isHidden(), true);
  assert.match(await invalidPage.locator('#status').innerText(), /unavailable/i);
  await invalidContext.close();
});
