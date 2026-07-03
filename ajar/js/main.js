/* ============================================================
   AJAR — gedeelde site-logica.
   Rendert header, footer en pagina-inhoud uit js/content.js.
   Regelt: cookiebanner + GA4 (alleen ná toestemming),
   Formspree-formulieren met honeypot en WhatsApp-fallback,
   structured data (JSON-LD) en subtiele scroll-reveals.
   ============================================================ */

(function () {
  'use strict';

  const C = window.AJAR_CONTENT;
  if (!C) return;
  const cfg = C.config;
  const page = document.body.dataset.page || 'home';
  const CONSENT_KEY = 'ajarCookieConsent'; // 'granted' | 'denied'

  /* ---------- Helpers ---------- */

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function waLink(text) {
    return 'https://wa.me/' + cfg.whatsappNumber + '?text=' + encodeURIComponent(text || '');
  }

  /* Vervangbare beeld-slot: toont de foto uit assets/images/ zodra die bestaat,
     anders een rustige olijfgroen/goud gradient-placeholder met de bestandsnaam. */
  function imgSlot(file, alt, cls) {
    if (!file) return '';
    return '<figure class="img-slot ' + (cls || '') + '" data-file="' + esc(file) + '">' +
      '<img src="assets/images/' + esc(file) + '" alt="' + esc(alt || '') + '" loading="lazy" ' +
      'onerror="this.closest(\'.img-slot\').classList.add(\'empty\');this.remove()">' +
      '<span class="img-slot-note">Foto volgt · ' + esc(file) + '</span>' +
      '</figure>';
  }

  function kickerTitle(kicker, title, sub) {
    return (kicker ? '<p class="kicker">' + esc(kicker) + '</p>' : '') +
      (title ? '<h2 class="section-title">' + esc(title) + '</h2>' : '') +
      (sub ? '<p class="section-sub">' + esc(sub) + '</p>' : '');
  }

  /* CTA-band met primaire (sample) en optionele secundaire (offerte) knop */
  function ctaBand(cta) {
    return '<section class="cta-band reveal">' +
      '<div class="wrap cta-band-inner">' +
      '<div class="cta-band-drop" aria-hidden="true"></div>' +
      '<h2>' + esc(cta.title) + '</h2>' +
      '<p>' + esc(cta.text) + '</p>' +
      '<div class="cta-band-actions">' +
      '<a class="btn btn-primary" href="' + esc(cta.buttonHref || C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(cta.button) + '</a>' +
      (cta.secondary ? '<a class="btn btn-ghost btn-ghost-light" href="' + esc(cta.secondaryHref || C.ctaHref) + '" data-ga-event="offerte_cta_click">' + esc(cta.secondary) + '</a>' : '') +
      '</div>' +
      '</div></section>';
  }

  /* ---------- Header ---------- */

  function renderHeader() {
    const links = C.nav.map(n =>
      '<a href="' + n.href + '"' + (n.id === page ? ' class="active" aria-current="page"' : '') + '>' + esc(n.label) + '</a>'
    ).join('');

    /* Dunne belofte-topbar boven de (sticky) header — scrolt gewoon mee weg */
    if (C.topbar && C.topbar.text && page !== 'sample') {
      document.getElementById('site-header').insertAdjacentHTML('beforebegin',
        '<a class="topbar" href="' + esc(C.topbar.href) + '" data-ga-event="sample_cta_click">' + esc(C.topbar.text) + '</a>');
    }

    document.getElementById('site-header').innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="index.html" aria-label="' + esc(cfg.brandName) + ' — home">' +
          '<img src="assets/logo/ajar-header.svg" alt="' + esc(cfg.brandName) + '" class="brand-logo">' +
        '</a>' +
        '<nav class="site-nav" id="site-nav" aria-label="Hoofdnavigatie">' + links +
          '<a class="btn btn-primary nav-cta" href="' + esc(C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(C.sampleCtaLabel) + '</a>' +
        '</nav>' +
        '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">' +
          '<span></span><span></span>' +
        '</button>' +
      '</div>';

    const toggle = document.getElementById('nav-toggle');
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('nav-lock', open); // scroll-lock achter volscherm-menu
    });
    document.getElementById('site-nav').addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
        document.documentElement.classList.remove('nav-lock');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Logo inline laden zodat de olijftak (.hdr-twig) bij hover kan meewiegen.
       Mislukt de fetch, dan blijft de gewone <img> gewoon staan. */
    fetch('assets/logo/ajar-header.svg')
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(svg => {
        const brand = document.querySelector('.brand');
        if (brand) brand.innerHTML = '<span class="brand-logo brand-logo-inline" aria-hidden="true">' + svg + '</span>';
      })
      .catch(() => {});
  }

  /* ---------- Footer ---------- */

  function renderFooter() {
    const f = C.footer, imp = C.importer, prod = C.producer;
    const navLinks = C.nav.map(n => '<a href="' + n.href + '">' + esc(n.label) + '</a>').join('');
    const socials = (f.socials || []).filter(s => s && s.href);

    document.getElementById('site-footer').innerHTML =
      '<div class="wrap footer-inner">' +
        '<div class="footer-col footer-brand">' +
          '<img src="assets/logo/ajar-header.svg" alt="' + esc(cfg.brandName) + '" class="footer-logo">' +
          '<p>' + esc(f.aboutLine) + '</p>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>Navigatie</h3><nav class="footer-nav">' + navLinks +
          '<a href="privacy.html">' + esc(f.privacyLabel) + '</a></nav>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>Contact</h3>' +
          '<a class="footer-wa" href="' + waLink(C.contact.direct.whatsappPrefill) + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">WhatsApp — snelste route</a>' +
          (cfg.email ? '<a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>' : '') +
          (socials.length ? '<div class="footer-socials">' + socials.map(s =>
            '<a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>' + esc(imp.label) + '</h3>' +
          '<p class="footer-legal">' + esc(imp.name) + '<br>' + esc(imp.address) + '<br>' + esc(imp.postalCity) + '<br>' + esc(imp.country) + '<br>' +
            'KvK: ' + (cfg.kvk ? esc(cfg.kvk) : '<span class="todo-mark">volgt</span>') + '</p>' +
          '<h3>' + esc(prod.label) + '</h3>' +
          '<p class="footer-legal">' + esc(prod.name) + '<br>' + esc(prod.city) + ', ' + esc(prod.country) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="wrap footer-bottom">' +
        '<span>© ' + new Date().getFullYear() + ' ' + esc(cfg.brandName) + ' · ' + esc(cfg.tagline) + '</span>' +
        '<a href="privacy.html">' + esc(f.privacyLabel) + '</a>' +
        '<span>' + esc(cfg.origin) + '</span>' +
      '</div>';
  }

  /* ---------- Herbruikbare blokken ---------- */

  function uspGrid(items) {
    return '<div class="grid-3">' + items.map(u =>
      '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
      '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p></article>').join('') + '</div>';
  }

  /* ---------- Pagina's ---------- */

  function renderHome() {
    const h = C.home;
    const partnersRow = (cfg.showPartners && h.partners.items.length)
      ? '<section class="section partners"><div class="wrap">' +
        '<p class="kicker partners-kicker reveal">' + esc(h.partners.kicker) + '</p>' +
        '<div class="partners-row reveal">' + h.partners.items.map(p =>
          p.logo ? '<img src="assets/images/' + esc(p.logo) + '" alt="' + esc(p.name) + '" loading="lazy">'
                 : '<span class="partner-name">' + esc(p.name) + '</span>').join('') +
        '</div></div></section>'
      : '';

    return '' +
      '<section class="hero">' +
        '<div class="wrap hero-inner">' +
          '<div class="hero-text reveal">' +
            '<p class="kicker">' + esc(h.hero.kicker) + '</p>' +
            '<h1>' + esc(h.hero.title) + '</h1>' +
            '<p class="hero-sub">' + esc(h.hero.sub) + '</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="' + esc(C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(C.sampleCtaLabel) + '</a>' +
              '<a class="btn btn-ghost" href="' + esc(C.ctaHref) + '" data-ga-event="offerte_cta_click">' + esc(C.ctaLabel) + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="hero-media reveal" data-parallax>' + imgSlot(h.hero.image, 'AJAR extra vierge olijfolie', 'img-hero') + '</div>' +
        '</div>' +
      '</section>' +

      partnersRow +

      '<section class="section usps"><div class="wrap">' + uspGrid(h.usps) + '</div></section>' +

      '<section class="section split"><div class="wrap split-inner">' +
        '<div class="split-media reveal">' + imgSlot(h.story.image, 'Familiebedrijf in Taourirt', '') + '</div>' +
        '<div class="split-text reveal">' + kickerTitle(h.story.kicker, h.story.title) +
          '<p>' + esc(h.story.text) + '</p>' +
          '<a class="text-link" href="' + esc(h.story.linkHref) + '">' + esc(h.story.linkLabel) + ' →</a>' +
        '</div>' +
      '</div></section>' +

      /* Full-bleed sfeer-band met quote */
      '<section class="mood-band reveal">' +
        imgSlot(h.mood.image, '', 'img-mood') +
        '<div class="mood-quote"><p class="mood-text">' + esc(h.mood.quote) + '</p>' +
        '<p class="mood-sub">' + esc(h.mood.sub) + '</p></div>' +
      '</section>' +

      '<section class="section split split-rev"><div class="wrap split-inner">' +
        '<div class="split-media reveal">' + imgSlot(h.product.image, 'AJAR fles 500 ml', '') + '</div>' +
        '<div class="split-text reveal">' + kickerTitle(h.product.kicker, h.product.title) +
          '<p>' + esc(h.product.text) + '</p>' +
          '<a class="text-link" href="' + esc(h.product.linkHref) + '">' + esc(h.product.linkLabel) + ' →</a>' +
        '</div>' +
      '</div></section>' +

      '<section class="section testimonials"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(h.testimonials.kicker, h.testimonials.title) + '</div>' +
        '<div class="grid-3">' + h.testimonials.items.map(t => t.quote
          ? '<figure class="card quote-card reveal"><blockquote>“' + esc(t.quote) + '”</blockquote>' +
            '<figcaption>' + esc(t.author) + (t.company ? ' · ' + esc(t.company) : '') + '</figcaption></figure>'
          : '<div class="card quote-card quote-empty reveal" aria-hidden="true"><span class="quote-empty-mark">”</span>' +
            '<p>' + esc(h.testimonials.note) + '</p></div>').join('') +
        '</div>' +
      '</div></section>' +

      ctaBand(h.cta);
  }

  function renderAbout() {
    const a = C.about;
    const tl = a.timeline;
    return pageHero(a.hero) +
      a.blocks.map((b, i) => {
        const media = b.image ? '<div class="split-media reveal">' + imgSlot(b.image, b.title, '') + '</div>' : '';
        if (media) {
          return '<section class="section split' + (i % 2 ? ' split-rev' : '') + '"><div class="wrap split-inner">' +
            media +
            '<div class="split-text reveal"><h2 class="section-title">' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p></div>' +
            '</div></section>';
        }
        return '<section class="section"><div class="wrap wrap-narrow prose reveal">' +
          '<h2 class="section-title">' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p></div></section>';
      }).join('') +

      /* Familie-tijdlijn */
      '<section class="section section-tint"><div class="wrap wrap-narrow">' +
        '<div class="section-head reveal">' + kickerTitle(tl.kicker, tl.title) + '</div>' +
        '<ol class="timeline" data-anim>' + tl.items.map(t =>
          '<li class="timeline-item reveal' + (t.todo ? ' is-todo' : '') + '">' +
            '<span class="timeline-dot" aria-hidden="true"></span>' +
            '<span class="timeline-year">' + esc(t.year) + '</span>' +
            '<h3>' + esc(t.title) + '</h3><p>' + esc(t.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
        '<p class="form-note reveal">' + esc(tl.note) + '</p>' +
      '</div></section>' +

      ctaBand({ title: 'Kennismaken?', text: 'Vraag een gratis sample aan — we vertellen u graag meer.', button: C.sampleCtaLabel, buttonHref: C.sampleCtaHref, secondary: C.ctaLabel, secondaryHref: C.ctaHref });
  }

  function renderProduct() {
    const p = C.product;
    return pageHero(p.hero) +

      '<section class="section"><div class="wrap specs-inner">' +
        '<div class="specs-media reveal">' + imgSlot(p.specs.image, p.specs.title, 'img-tall') + '</div>' +
        '<div class="specs-card card reveal">' +
          '<h2 class="section-title">' + esc(p.specs.title) + '</h2>' +
          '<dl class="specs-list">' + p.specs.rows.map(r =>
            '<div class="specs-row' + (r.todo ? ' is-todo' : '') + '"><dt>' + esc(r.label) + '</dt><dd>' + esc(r.value) + '</dd></div>').join('') +
          '</dl>' +
        '</div>' +
      '</div></section>' +

      /* Meetbare kwaliteitscijfers */
      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.quality.kicker, p.quality.title) + '</div>' +
        '<div class="quality-row">' + p.quality.items.map(q => {
          /* Numerieke waarden (bijv. "0,28" of "310") tellen op zodra ze in beeld scrollen */
          const num = parseFloat(String(q.value).replace(',', '.'));
          const countable = !q.todo && isFinite(num) && /^[\d.,<>\s]+$/.test(String(q.value));
          return '<div class="quality-tile reveal' + (q.todo ? ' is-todo' : '') + '">' +
            '<span class="quality-value"' + (countable ? ' data-countup="' + num + '" data-raw="' + esc(q.value) + '"' : '') + '>' + esc(q.value) + '</span>' +
            '<span class="quality-label">' + esc(q.label) + (q.unit ? ' · ' + esc(q.unit) : '') + '</span>' +
          '</div>';
        }).join('') +
        '</div>' +
        '<p class="form-note reveal">' + esc(p.quality.note) + '</p>' +
      '</div></section>' +

      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.why.kicker, p.why.title) + '</div>' +
        uspGrid(p.why.items) +
      '</div></section>' +

      /* Vergelijkingsblok */
      '<section class="section"><div class="wrap wrap-narrow">' +
        '<div class="section-head reveal">' + kickerTitle(p.compare.kicker, p.compare.title) + '</div>' +
        '<div class="compare card reveal">' +
          '<div class="compare-head"><span></span><span class="compare-col-a">' + esc(p.compare.colA) + '</span><span>' + esc(p.compare.colB) + '</span></div>' +
          p.compare.rows.map(r =>
            '<div class="compare-row"><span class="compare-label">' + esc(r.label) + '</span>' +
            '<span class="compare-a">' + esc(r.a) + '</span>' +
            '<span class="compare-b">' + esc(r.b) + '</span></div>').join('') +
        '</div>' +
      '</div></section>' +

      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.process.kicker, p.process.title) + '</div>' +
        '<ol class="process" data-anim>' + p.process.steps.map((s, i) =>
          '<li class="process-step reveal">' +
            imgSlot(s.image, s.title, 'img-step') +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.certification.kicker, p.certification.title, p.certification.intro) + '</div>' +
        '<div class="grid-2">' + p.certification.items.map(c =>
          '<article class="card cert-card' + (c.available ? '' : ' cert-pending') + ' reveal">' +
            '<span class="cert-badge">' + esc(c.badge) + '</span>' +
            '<h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p>' +
            (c.available ? '' : '<p class="todo-mark">' + esc(c.note || 'Volgt.') + '</p>') +
          '</article>').join('') +
        '</div>' +
      '</div></section>' +

      ctaBand(p.cta);
  }

  function renderB2b() {
    const b = C.b2b, d = b.downloads;
    return pageHero(b.hero, [
        { label: C.sampleCtaLabel, href: C.sampleCtaHref, primary: true, ga: 'sample_cta_click' },
        { label: C.ctaLabel, href: C.ctaHref, primary: false, ga: 'offerte_cta_click' }
      ]) +

      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.audiences.kicker, b.audiences.title) + '</div>' +
        uspGrid(b.audiences.items) +
      '</div></section>' +

      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.how.kicker, b.how.title) + '</div>' +
        '<ol class="process process-3" data-anim>' + b.how.steps.map((s, i) =>
          '<li class="process-step reveal">' +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      /* In de keuken én op tafel */
      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.dualUse.kicker, b.dualUse.title) + '</div>' +
        '<div class="grid-2">' + b.dualUse.items.map(u =>
          '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
          '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p></article>').join('') +
        '</div>' +
      '</div></section>' +

      /* Formaten-lijn */
      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.formats.kicker, b.formats.title) + '</div>' +
        '<div class="fmt-row">' + b.formats.items.map(f =>
          '<div class="fmt-tile reveal' + (f.todo ? ' is-todo' : '') + '">' +
            '<span class="fmt-shape fmt-' + esc(f.shape) + '" aria-hidden="true"></span>' +
            '<span class="fmt-size">' + esc(f.size) + (f.todo ? ' <em>(' + esc(f.todoNote) + ')</em>' : '') + '</span>' +
            '<h3>' + esc(f.name) + '</h3><p>' + esc(f.text) + '</p>' +
          '</div>').join('') +
        '</div>' +
      '</div></section>' +

      '<section class="section"><div class="wrap wrap-narrow">' +
        '<div class="card pricing-card reveal">' +
          '<h2 class="section-title">' + esc(b.pricing.title) + '</h2>' +
          '<p>' + esc(b.pricing.text) + '</p>' +
          '<p class="pricing-fair">' + esc(b.pricing.fair) + '</p>' +
          '<p class="pricing-packaging' + (b.pricing.packagingTodo ? ' is-todo' : '') + '">' + esc(b.pricing.packaging) + '</p>' +
        '</div>' +
      '</div></section>' +

      /* Proeverij in uw zaak */
      '<section class="section section-tint"><div class="wrap wrap-narrow">' +
        '<div class="card gift-card tasting-card reveal">' +
          '<p class="kicker">' + esc(b.tasting.kicker) + '</p>' +
          '<h2 class="section-title">' + esc(b.tasting.title) + '</h2>' +
          '<p>' + esc(b.tasting.text) + '</p>' +
          '<a class="btn btn-primary" href="' + esc(b.tasting.buttonHref) + '" data-ga-event="proeverij_cta_click">' + esc(b.tasting.button) + '</a>' +
        '</div>' +
      '</div></section>' +

      /* Sell-through-hulp voor winkels */
      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.support.kicker, b.support.title) + '</div>' +
        uspGrid(b.support.items) +
      '</div></section>' +

      /* Documentatie: spec-sheet (vrij) + bedrijfspresentatie (achter mini-formulier) */
      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(d.kicker, d.title) + '</div>' +
        '<div class="grid-2">' +
          '<article class="card sheen-card reveal"><span class="card-rule" aria-hidden="true"></span>' +
            '<h3>' + esc(d.specsheet.title) + '</h3><p>' + esc(d.specsheet.text) + '</p>' +
            '<a class="btn btn-primary dl-btn" href="' + esc(cfg.specsheetPdf) + '" download data-ga-event="specsheet_download">' + esc(d.specsheet.button) + '</a>' +
          '</article>' +
          '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
            '<h3>' + esc(d.presentation.title) + '</h3><p>' + esc(d.presentation.text) + '</p>' +
            '<form id="pres-form" class="pres-form" novalidate>' +
              '<input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">' +
              '<div class="form-grid">' +
                '<label class="form-field"><span>' + esc(d.presentation.nameLabel) + ' *</span><input type="text" name="naam" required></label>' +
                '<label class="form-field"><span>' + esc(d.presentation.companyLabel) + ' *</span><input type="text" name="bedrijf" required></label>' +
                '<label class="form-field"><span>' + esc(d.presentation.emailLabel) + ' *</span><input type="email" name="email" required></label>' +
                '<label class="form-field"><span>' + esc(d.presentation.phoneLabel) + '</span><input type="tel" name="telefoon" inputmode="tel"></label>' +
              '</div>' +
              '<button type="submit" class="btn btn-ghost" data-ga-event="presentatie_aanvraag">' + esc(d.presentation.button) + '</button>' +
              '<p class="form-error" data-role="error" hidden></p>' +
              '<p class="form-success" data-role="success" hidden></p>' +
            '</form>' +
          '</article>' +
        '</div>' +
      '</div></section>' +

      /* Relatiegeschenken */
      '<section class="section"><div class="wrap wrap-narrow">' +
        '<div class="card gift-card reveal">' +
          '<p class="kicker">' + esc(b.gift.kicker) + '</p>' +
          '<h2 class="section-title">' + esc(b.gift.title) + '</h2>' +
          '<p>' + esc(b.gift.text) + '</p>' +
          '<a class="btn btn-ghost" href="' + esc(b.gift.buttonHref) + '" data-ga-event="offerte_cta_click">' + esc(b.gift.button) + '</a>' +
        '</div>' +
      '</div></section>' +

      /* FAQ */
      '<section class="section section-tint"><div class="wrap wrap-narrow">' +
        '<div class="section-head reveal">' + kickerTitle(b.faq.kicker, b.faq.title) + '</div>' +
        '<div class="faq reveal">' + b.faq.items.map(f =>
          '<details class="faq-item' + (f.todo ? ' is-todo' : '') + '">' +
            '<summary>' + esc(f.q) + '</summary>' +
            '<div class="faq-body"><p>' + esc(f.a) + '</p></div>' +
          '</details>').join('') +
        '</div>' +
      '</div></section>' +

      ctaBand(b.cta);
  }

  function renderContact() {
    const c = C.contact, f = c.form;
    return pageHero(c.hero) +
      '<section class="section"><div class="wrap contact-inner">' +

        '<form class="card contact-form reveal" id="offer-form" novalidate>' +
          '<input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="form-grid">' +
            field('naam', f.nameLabel, 'text', true) +
            field('bedrijf', f.companyLabel, 'text', true) +
            field('email', f.emailLabel, 'email', true) +
            field('telefoon', f.phoneLabel, 'tel', false) +
          '</div>' +
          '<label class="form-field"><span>' + esc(f.volumeLabel) + '</span>' +
            '<select name="volume">' + f.volumeOptions.map(o =>
              '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('') + '</select>' +
          '</label>' +
          '<label class="form-field"><span>' + esc(f.messageLabel) + '</span>' +
            '<textarea name="bericht" rows="5" placeholder="' + esc(f.messagePlaceholder) + '"></textarea>' +
          '</label>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn btn-primary" id="form-submit" data-ga-event="offerte_aanvraag">' + esc(cfg.formspreeId ? f.submit : f.submitWhatsApp) + '</button>' +
          '</div>' +
          '<p class="form-note">' + esc(f.privacyNote) + ' <a href="privacy.html">Privacyverklaring</a></p>' +
          '<p class="form-error" data-role="error" hidden></p>' +
          '<p class="form-success" data-role="success" hidden></p>' +
        '</form>' +

        '<aside class="contact-aside">' +
          '<div class="card reveal">' +
            '<h3>' + esc(c.direct.title) + '</h3>' +
            '<p>' + esc(c.direct.text) + '</p>' +
            '<a class="btn btn-primary btn-wa" href="' + waLink(c.direct.whatsappPrefill) + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">' + esc(c.direct.whatsappLabel) + '</a>' +
          '</div>' +
          '<div class="card reveal">' +
            '<h3>' + esc(C.importer.label) + '</h3>' +
            '<p class="footer-legal">' + esc(C.importer.name) + '<br>' + esc(C.importer.address) + '<br>' +
              esc(C.importer.postalCity) + '<br>' + esc(C.importer.country) + '</p>' +
          '</div>' +
        '</aside>' +

      '</div></section>';

    function field(name, label, type, required) {
      return '<label class="form-field"><span>' + esc(label) + (required ? ' *' : '') + '</span>' +
        '<input type="' + type + '" name="' + name + '"' + (required ? ' required' : '') +
        (type === 'tel' ? ' inputmode="tel"' : '') + '></label>';
    }
  }

  function renderSample() {
    const s = C.sample, f = s.form;
    return pageHero(s.hero) +

      '<section class="section"><div class="wrap">' +
        '<ol class="process process-3" data-anim>' + s.how.steps.map((st, i) =>
          '<li class="process-step reveal">' +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      '<section class="section section-tint"><div class="wrap contact-inner">' +
        '<form class="card contact-form reveal" id="sample-form" novalidate>' +
          '<h2 class="section-title">' + esc(f.title) + '</h2>' +
          '<input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="form-grid">' +
            '<label class="form-field"><span>' + esc(f.companyLabel) + ' *</span><input type="text" name="bedrijf" required></label>' +
            '<label class="form-field"><span>' + esc(f.nameLabel) + ' *</span><input type="text" name="naam" required></label>' +
            '<label class="form-field"><span>' + esc(f.emailLabel) + ' *</span><input type="email" name="email" required></label>' +
            '<label class="form-field"><span>' + esc(f.phoneLabel) + '</span><input type="tel" name="telefoon" inputmode="tel"></label>' +
          '</div>' +
          '<label class="form-field"><span>' + esc(f.addressLabel) + ' *</span><input type="text" name="adres" required></label>' +
          '<label class="form-field"><span>' + esc(f.messageLabel) + '</span><textarea name="bericht" rows="3"></textarea></label>' +
          '<label class="form-field tip-field"><span>' + esc(f.tipLabel) + '</span>' +
            '<input type="text" name="tip" placeholder="' + esc(f.tipPlaceholder) + '"></label>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn btn-primary" data-ga-event="sample_aanvraag">' + esc(f.submit) + '</button>' +
          '</div>' +
          '<p class="form-note">' + esc(C.contact.form.privacyNote) + ' <a href="privacy.html">Privacyverklaring</a></p>' +
          '<p class="form-error" data-role="error" hidden></p>' +
          '<p class="form-success" data-role="success" hidden></p>' +
        '</form>' +

        '<aside class="contact-aside">' +
          '<div class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
            s.usps.map(u => '<h3>' + esc(u.title) + '</h3><p class="sample-usp">' + esc(u.text) + '</p>').join('') +
          '</div>' +
          '<div class="card reveal">' +
            '<h3>' + esc(C.contact.direct.title) + '</h3>' +
            '<p>' + esc(C.contact.direct.text) + '</p>' +
            '<a class="btn btn-primary btn-wa" href="' + waLink('Hallo, ik wil graag een gratis sample van AJAR olijfolie aanvragen voor mijn zaak.') + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">' + esc(C.contact.direct.whatsappLabel) + '</a>' +
          '</div>' +
        '</aside>' +
      '</div></section>';
  }

  function initSampleForm() {
    const form = document.getElementById('sample-form');
    if (!form) return;
    const f = C.sample.form;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = formVals(form);
      if (!v.naam || !v.bedrijf || !/.+@.+\..+/.test(v.email) || !v.adres) {
        showMsg(form, 'error', 'Vul minimaal bedrijfsnaam, contactpersoon, e-mailadres en bezorgadres in.');
        return;
      }
      v._subject = f.emailSubject + ' — ' + v.bedrijf;
      const waText = 'Sample-aanvraag ' + cfg.brandName + '\n\nBedrijf: ' + v.bedrijf + '\nContactpersoon: ' + v.naam +
        '\nE-mail: ' + v.email + (v.telefoon ? '\nTelefoon: ' + v.telefoon : '') +
        '\nBezorgadres: ' + v.adres +
        (v.bericht ? '\nOpmerking: ' + v.bericht : '') +
        (v.tip ? '\nTip collega-ondernemer: ' + v.tip : '');
      const ok = await submitLead(form, v, waText, f.success);
      if (ok) gaEvent('sample_aanvraag', { tip: v.tip ? 'ja' : 'nee' });
    });
  }

  function renderPrivacy() {
    const p = C.privacy;
    return pageHero(p.hero) +
      '<section class="section"><div class="wrap wrap-narrow prose">' +
      '<p class="form-note reveal">' + esc(p.updated) + '</p>' +
      p.sections.map(s =>
        '<div class="reveal privacy-block"><h2 class="privacy-title">' + esc(s.title) + '</h2><p>' + esc(s.body) + '</p></div>'
      ).join('') +
      '</div></section>';
  }

  function pageHero(hero, actions) {
    return '<section class="page-hero"><div class="wrap reveal">' +
      '<p class="kicker">' + esc(hero.kicker) + '</p>' +
      '<h1>' + esc(hero.title) + '</h1>' +
      (hero.sub ? '<p class="hero-sub">' + esc(hero.sub) + '</p>' : '') +
      (actions && actions.length
        ? '<div class="hero-actions">' + actions.map(a =>
            '<a class="btn ' + (a.primary ? 'btn-primary' : 'btn-ghost') + '" href="' + esc(a.href) + '" data-ga-event="' + esc(a.ga) + '">' + esc(a.label) + '</a>'
          ).join('') + '</div>'
        : '') +
      '</div></section>';
  }

  /* ---------- Formulieren: Formspree met WhatsApp-fallback + honeypot ---------- */

  function formVals(form) {
    const d = new FormData(form), o = {};
    d.forEach((v, k) => { o[k] = String(v).trim(); });
    return o;
  }

  function showMsg(form, role, msg) {
    form.querySelectorAll('[data-role]').forEach(el => { el.hidden = true; });
    const el = form.querySelector('[data-role=' + role + ']');
    if (el) { el.textContent = msg; el.hidden = false; }
  }

  /* Eén gouden druppel valt bij een succesvolle aanvraag — klein merkmoment */
  function dropCelebrate(form) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = form.querySelector('[data-role=success]');
    if (!s) return;
    const d = document.createElement('span');
    d.className = 'drop-fall';
    d.setAttribute('aria-hidden', 'true');
    s.prepend(d);
    d.addEventListener('animationend', () => d.remove());
  }

  async function submitLead(form, v, waText, okMsg) {
    if (v._gotcha) { showMsg(form, 'success', okMsg); return true; } // honeypot: stil laten vallen

    if (!cfg.formspreeId) {
      // Geen Formspree ingesteld → nette degradatie naar WhatsApp met voorgevuld bericht
      window.open(waLink(waText), '_blank', 'noopener');
      showMsg(form, 'success', okMsg);
      dropCelebrate(form);
      return true;
    }

    const btn = form.querySelector('[type=submit]');
    const oldLabel = btn.textContent;
    btn.disabled = true; btn.textContent = C.contact.form.sending;
    try {
      const resp = await fetch('https://formspree.io/f/' + encodeURIComponent(cfg.formspreeId), {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(v)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      showMsg(form, 'success', okMsg);
      dropCelebrate(form);
      form.reset();
      return true;
    } catch (e) {
      showMsg(form, 'error', C.contact.form.error);
      return false;
    } finally {
      btn.disabled = false; btn.textContent = oldLabel;
    }
  }

  function initContactForm() {
    const form = document.getElementById('offer-form');
    if (!form) return;
    const f = C.contact.form;

    // Voorselectie via ?aanvraag=sample|offerte|proeverij (CTA's van andere pagina's)
    const param = new URLSearchParams(location.search).get('aanvraag');
    if (param === 'sample') form.querySelector('select[name=volume]').value = 'sample';
    if (param === 'proeverij') {
      form.querySelector('select[name=volume]').value = 'sample';
      form.querySelector('textarea[name=bericht]').value = 'Ik heb interesse in een proeverij in mijn zaak.';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = formVals(form);
      if (!v.naam || !v.bedrijf || !/.+@.+\..+/.test(v.email)) {
        showMsg(form, 'error', 'Vul minimaal naam, bedrijfsnaam en een geldig e-mailadres in.');
        return;
      }
      const volume = (f.volumeOptions.find(o => o.value === v.volume) || {}).label || v.volume;
      const waText = 'Aanvraag ' + cfg.brandName + '\n\nNaam: ' + v.naam + '\nBedrijf: ' + v.bedrijf +
        '\nE-mail: ' + v.email + (v.telefoon ? '\nTelefoon: ' + v.telefoon : '') +
        '\nGewenst volume: ' + volume + (v.bericht ? '\n\n' + v.bericht : '');
      v._subject = f.emailSubject + ' — ' + volume;
      const ok = await submitLead(form, v, waText, f.success);
      if (ok) gaEvent('offerte_aanvraag', { volume: v.volume });
    });
  }

  function initPresentationForm() {
    const form = document.getElementById('pres-form');
    if (!form) return;
    const d = C.b2b.downloads.presentation;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = formVals(form);
      if (!v.naam || !v.bedrijf || !/.+@.+\..+/.test(v.email)) {
        showMsg(form, 'error', 'Vul minimaal naam, bedrijfsnaam en een geldig e-mailadres in.');
        return;
      }
      v._subject = 'Aanvraag bedrijfspresentatie ' + cfg.brandName;
      const waText = 'Aanvraag bedrijfspresentatie ' + cfg.brandName + '\n\nNaam: ' + v.naam +
        '\nBedrijf: ' + v.bedrijf + '\nE-mail: ' + v.email + (v.telefoon ? '\nTelefoon: ' + v.telefoon : '');
      const okMsg = cfg.presentationPdf ? d.successDownload : d.success;
      const ok = await submitLead(form, v, waText, okMsg);
      if (ok) {
        gaEvent('presentatie_aanvraag', {});
        if (cfg.presentationPdf) {
          const s = form.querySelector('[data-role=success]');
          s.innerHTML = esc(okMsg) + ' <a class="text-link" href="' + esc(cfg.presentationPdf) + '" download data-ga-event="presentatie_download">' + esc(d.downloadLabel) + '</a>';
        }
      }
    });
  }

  /* ---------- Cookiebanner + Google Analytics (GA4, alleen ná toestemming) ---------- */

  function gaEvent(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function loadGA() {
    if (!cfg.gaId || window.gtag) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // UTM-parameters (?utm_source=… van QR-codes) pikt GA4 automatisch op uit de URL
    window.gtag('config', cfg.gaId, { anonymize_ip: true });
  }

  function initConsent() {
    if (!cfg.gaId) return; // geen GA-ID → niets te meten, geen banner nodig

    const choice = localStorage.getItem(CONSENT_KEY);
    if (choice === 'granted') { loadGA(); return; }
    if (choice === 'denied') return;

    const k = C.cookies;
    const el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookies');
    el.innerHTML =
      '<p>' + esc(k.text) + ' <a href="privacy.html">' + esc(k.moreLabel) + '</a></p>' +
      '<div class="cookie-actions">' +
        '<button class="btn btn-primary" id="ck-accept">' + esc(k.accept) + '</button>' +
        '<button class="btn btn-ghost" id="ck-decline">' + esc(k.decline) + '</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('#ck-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'granted'); el.remove(); loadGA();
    });
    el.querySelector('#ck-decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'denied'); el.remove();
    });
  }

  /* Eventtracking op alle CTA's/knoppen met data-ga-event (werkt pas na consent) */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-ga-event]');
    if (el) gaEvent(el.dataset.gaEvent, { page: page });
  });

  /* ---------- Structured data (schema.org JSON-LD) ---------- */

  function injectJsonLd() {
    const org = {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: cfg.brandName,
      description: C.footer.aboutLine,
      url: cfg.domain,
      logo: cfg.domain + 'assets/logo/ajar-wordmark.svg',
      address: { '@type': 'PostalAddress', streetAddress: C.importer.address, postalCode: '1055 JV', addressLocality: 'Amsterdam', addressCountry: 'NL' }
    };
    const product = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: cfg.brandName + ' Extra Vierge Olijfolie',
      brand: { '@type': 'Brand', name: cfg.brandName },
      description: C.home.product.text,
      countryOfOrigin: 'MA',
      manufacturer: { '@type': 'Organization', name: C.producer.name, address: { '@type': 'PostalAddress', addressLocality: C.producer.city, addressCountry: 'MA' } },
      offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', businessFunction: 'http://purl.org/goodrelations/v1#Sell', priceSpecification: { '@type': 'PriceSpecification', description: 'Prijs op aanvraag (B2B)' } }
    };
    [org, product].forEach(obj => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  /* ---------- Scroll-reveals & animatie-hooks (met reduced-motion-guard) ---------- */

  function initReveal() {
    const els = document.querySelectorAll('.reveal, [data-anim]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));

    /* Hero-parallax + licht na-ijlen van split-foto's (alleen desktop, echte muis) */
    const hero = document.querySelector('[data-parallax]');
    const splits = window.matchMedia('(min-width: 860px) and (pointer: fine)').matches
      ? Array.from(document.querySelectorAll('.split-media .img-slot'))
      : [];
    if (hero || splits.length) {
      let ticking = false;
      const update = () => {
        ticking = false;
        if (hero) hero.style.transform = 'translateY(' + (Math.min(window.scrollY, 600) * 0.06) + 'px)';
        const vh = window.innerHeight;
        splits.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) return;
          const centerOffset = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
          el.style.transform = 'translateY(' + (centerOffset * -18).toFixed(1) + 'px)';
        });
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    }
  }

  /* ---------- Count-up op meetbare kwaliteitscijfers ---------- */

  function initCountUp() {
    const els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return; // eindwaarde staat er al
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.countup);
        const raw = el.dataset.raw || String(target);
        const decimals = (raw.split(/[.,]/)[1] || '').length;
        const comma = raw.includes(',');
        const t0 = performance.now(), dur = 1100;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          let out = (target * eased).toFixed(decimals);
          if (comma) out = out.replace('.', ',');
          el.textContent = p < 1 ? out : raw;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- FAQ: vloeiend open- en dichtklappen ---------- */

  function initFaq() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    items.forEach(d => {
      const summary = d.querySelector('summary');
      const body = d.querySelector('.faq-body');
      if (!summary || !body) return;
      summary.addEventListener('click', (e) => {
        if (reduce) return; // standaard instant gedrag
        e.preventDefault();
        if (d.hasAttribute('data-busy')) return;
        d.setAttribute('data-busy', '');
        if (d.open) {
          body.style.height = body.scrollHeight + 'px';
          requestAnimationFrame(() => { body.style.height = '0px'; body.style.opacity = '0'; });
          body.addEventListener('transitionend', function done() {
            body.removeEventListener('transitionend', done);
            d.open = false;
            body.style.height = body.style.opacity = '';
            d.removeAttribute('data-busy');
          });
        } else {
          d.open = true;
          const h = body.scrollHeight;
          body.style.height = '0px'; body.style.opacity = '0';
          requestAnimationFrame(() => { body.style.height = h + 'px'; body.style.opacity = '1'; });
          body.addEventListener('transitionend', function done() {
            body.removeEventListener('transitionend', done);
            body.style.height = body.style.opacity = '';
            d.removeAttribute('data-busy');
          });
        }
      });
    });
  }

  /* ---------- Boot ---------- */

  const renderers = {
    home: renderHome, 'over-ons': renderAbout, product: renderProduct,
    zakelijk: renderB2b, contact: renderContact, privacy: renderPrivacy,
    sample: renderSample
  };

  renderHeader();
  document.getElementById('site-main').innerHTML = (renderers[page] || renderHome)();
  renderFooter();
  initContactForm();
  initSampleForm();
  initPresentationForm();
  initConsent();
  injectJsonLd();
  initReveal();
  initCountUp();
  initFaq();
})();
