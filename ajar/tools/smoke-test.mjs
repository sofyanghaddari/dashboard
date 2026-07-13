#!/usr/bin/env node
/* AJAR — smoke-test (v21)
   Laadt alle 9 pagina's + de gedeelde 404.html headless en faalt (exit 1) zodra er
   iets kapot is: JS-fouten, CSP-violations, een img-slot die noch de foto noch de
   placeholder-staat bereikt, of een offerteformulier dat niet meer client-side
   valideert/vult. Draait lokaal (`node ajar/tools/smoke-test.mjs`, host de repo-root
   eerst met bv. `python3 -m http.server 8000`) en in CI via
   .github/workflows/ajar-smoke-test.yml — geen build-stap nodig, dus dit is het enige
   vangnet vóór een vergissing live staat. */

import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8000';
const PAGES = ['index', 'over-ons', 'product', 'zakelijk', 'kennis', 'contact', 'sample', 'privacy', 'voorwaarden'];

let failures = [];

function fail(page, msg) {
  failures.push(page + ': ' + msg);
}

async function loadAndCollect(browser, name, url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  // "Failed to load resource" is Chromium's eigen netwerk-log voor elke 404. Voor foto's onder
  // assets/images/ is dat soms verwacht gedrag (de .webp/.jpg-fallbackketen probeert bewust-nog-
  // ontbrekende foto's als proces-06/07) — dat wordt al apart en preciezer gecontroleerd via de
  // .img-slot-resolutiecheck hieronder. Een 404 op iets anders (CSS/JS/font/andere asset) is wél
  // een echte fout en moet de test laten falen.
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (/Failed to load resource/.test(msg.text())) return;
    consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() < 400) return;
    if (/\/assets\/images\/.*\.(jpe?g|webp)$/i.test(res.url())) return;
    fail(name, 'HTTP ' + res.status() + ' op ' + res.url());
  });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations = window.__cspViolations || [];
      window.__cspViolations.push(e.violatedDirective + ' :: ' + e.blockedURI);
    });
  });

  let response;
  try {
    response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    fail(name, 'kon niet laden: ' + e.message);
    await page.close();
    return null;
  }
  if (!response || response.status() >= 400) {
    fail(name, 'HTTP status ' + (response ? response.status() : 'geen response'));
  }

  // scroll om lazy-loaded foto's te forceren
  const height = await page.evaluate(() => document.body.scrollHeight).catch(() => 0);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);

  const violations = await page.evaluate(() => window.__cspViolations || []);
  violations.forEach((v) => fail(name, 'CSP-violation: ' + v));
  consoleErrors.forEach((e) => fail(name, 'console-fout: ' + e));

  return page;
}

async function checkPage(browser, name, url) {
  const page = await loadAndCollect(browser, name, url);
  if (!page) return;

  // elke .img-slot moet ófwel een geladen foto (imgok) ófwel de nette placeholder tonen —
  // nooit een kapot/onopgelost image-element.
  const stuckSlots = await page.$$eval('.img-slot', (els) =>
    els.filter((fig) => {
      const img = fig.querySelector('img');
      const resolved = fig.classList.contains('empty') || fig.classList.contains('noimg') ||
        (img && img.classList.contains('imgok'));
      return !resolved;
    }).map((fig) => fig.dataset.file || '(onbekend bestand)')
  );
  stuckSlots.forEach((f) => fail(name, 'foto-slot niet opgelost: ' + f));

  // basischeck: skip-link, hoofdnavigatie en footer moeten aanwezig zijn op elke pagina
  const hasSkipLink = await page.$('.skip-link') !== null;
  if (!hasSkipLink) fail(name, 'skip-link ontbreekt');
  const hasHeader = await page.$('#site-header a, #site-header button') !== null;
  if (!hasHeader) fail(name, 'header lijkt niet gerenderd');
  const hasFooter = await page.$('#site-footer') !== null;
  if (!hasFooter) fail(name, 'footer ontbreekt');

  // contact-formulier: kernvelden aanwezig + client-side validatie werkt (geen echte submit)
  if (name === 'contact') {
    const hasForm = await page.$('#offer-form') !== null;
    if (!hasForm) fail(name, 'offerteformulier ontbreekt');
    else {
      await page.click('#form-submit').catch(() => {});
      await page.waitForTimeout(300);
      const errorShown = await page.$eval('[data-role=error]', (el) => !el.hidden).catch(() => false);
      if (!errorShown) fail(name, 'lege formulier-submit toont geen validatiefout (client-side check kapot?)');
      const chipCount = await page.$$eval('fieldset.choice-field input[name=belmoment]', (els) => els.length).catch(() => 0);
      if (chipCount < 2) fail(name, 'tijdvak-chips (belmoment) ontbreken of onvolledig');
    }
  }

  await page.close();
}

/* 404.html is een losstaande, minimale statische pagina (geen header/footer/skip-link uit
   main.js) — alleen laden + geen fouten/CSP-violations + AJAR-branding aanwezig. */
async function check404Page(browser, url) {
  const page = await loadAndCollect(browser, '404', url);
  if (!page) return;
  const title = await page.title();
  if (!/AJAR/.test(title)) fail('404', 'AJAR-branding niet gevonden in de paginatitel');
  const logoOk = await page.$eval('img', (img) => img.complete && img.naturalWidth > 0).catch(() => false);
  if (!logoOk) fail('404', 'AJAR-logo op de 404-pagina laadt niet');
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });

  for (const p of PAGES) {
    await checkPage(browser, p, BASE + '/ajar/' + p + '.html');
  }
  await check404Page(browser, BASE + '/404.html');

  await browser.close();

  if (failures.length) {
    console.error('\nSMOKE-TEST GEFAALD (' + failures.length + ' probleem/problemen):\n');
    failures.forEach((f) => console.error('  ✗ ' + f));
    process.exit(1);
  } else {
    console.log('Smoke-test OK — alle ' + (PAGES.length + 1) + ' pagina\'s geladen zonder fouten, CSP-violations of kapotte foto-slots.');
  }
})();
