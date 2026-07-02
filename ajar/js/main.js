/* ============================================================
   AJAR — gedeelde site-logica.
   Rendert header, footer en pagina-inhoud uit js/content.js,
   regelt GA4, het offerteformulier en subtiele scroll-reveals.
   ============================================================ */

(function () {
  'use strict';

  const C = window.AJAR_CONTENT;
  if (!C) return;
  const cfg = C.config;
  const page = document.body.dataset.page || 'home';

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

  function ctaBand(cta, gaEvent) {
    return '<section class="cta-band reveal">' +
      '<div class="wrap cta-band-inner">' +
      '<div class="cta-band-drop" aria-hidden="true"></div>' +
      '<h2>' + esc(cta.title) + '</h2>' +
      '<p>' + esc(cta.text) + '</p>' +
      '<a class="btn btn-primary" href="' + esc(C.ctaHref) + '" data-ga-event="' + (gaEvent || 'offerte_cta_click') + '">' + esc(cta.button) + '</a>' +
      '</div></section>';
  }

  /* ---------- Header ---------- */

  function renderHeader() {
    const links = C.nav.map(n =>
      '<a href="' + n.href + '"' + (n.id === page ? ' class="active" aria-current="page"' : '') + '>' + esc(n.label) + '</a>'
    ).join('');

    document.getElementById('site-header').innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="index.html" aria-label="' + esc(cfg.brandName) + ' — home">' +
          '<img src="assets/logo/ajar-header.svg" alt="' + esc(cfg.brandName) + '" class="brand-logo">' +
        '</a>' +
        '<nav class="site-nav" id="site-nav" aria-label="Hoofdnavigatie">' + links +
          '<a class="btn btn-primary nav-cta" href="' + esc(C.ctaHref) + '" data-ga-event="offerte_cta_click">' + esc(C.ctaLabel) + '</a>' +
        '</nav>' +
        '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">' +
          '<span></span><span></span>' +
        '</button>' +
      '</div>';

    const toggle = document.getElementById('nav-toggle');
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('site-nav').addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    /* Dunne schaduw zodra er gescrold is */
    const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
          '<h3>Navigatie</h3><nav class="footer-nav">' + navLinks + '</nav>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>Contact</h3>' +
          '<a class="footer-wa" href="' + waLink(C.contact.direct.whatsappPrefill) + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">WhatsApp — snelste route</a>' +
          '<a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>' +
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
        '<span>' + esc(cfg.origin) + '</span>' +
      '</div>';
  }

  /* ---------- Pagina's ---------- */

  function renderHome() {
    const h = C.home;
    return '' +
      '<section class="hero">' +
        '<div class="wrap hero-inner">' +
          '<div class="hero-text reveal">' +
            '<p class="kicker">' + esc(h.hero.kicker) + '</p>' +
            '<h1>' + esc(h.hero.title) + '</h1>' +
            '<p class="hero-sub">' + esc(h.hero.sub) + '</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="' + esc(C.ctaHref) + '" data-ga-event="offerte_cta_click">' + esc(C.ctaLabel) + '</a>' +
              '<a class="btn btn-ghost" href="over-ons.html">Ontdek het verhaal</a>' +
            '</div>' +
          '</div>' +
          '<div class="hero-media reveal" data-parallax>' + imgSlot(h.hero.image, 'AJAR extra vierge olijfolie', 'img-hero') + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section usps"><div class="wrap">' +
        '<div class="grid-3">' + h.usps.map(u =>
          '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
          '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p></article>').join('') +
        '</div>' +
      '</div></section>' +

      '<section class="section split"><div class="wrap split-inner">' +
        '<div class="split-media reveal">' + imgSlot(h.story.image, 'Familiebedrijf in Taourirt', '') + '</div>' +
        '<div class="split-text reveal">' + kickerTitle(h.story.kicker, h.story.title) +
          '<p>' + esc(h.story.text) + '</p>' +
          '<a class="text-link" href="' + esc(h.story.linkHref) + '">' + esc(h.story.linkLabel) + ' →</a>' +
        '</div>' +
      '</div></section>' +

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
      ctaBand({ title: 'Kennismaken?', text: 'Vraag een offerte of proefbestelling aan — we vertellen u graag meer.', button: C.ctaLabel });
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

      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.why.kicker, p.why.title) + '</div>' +
        '<div class="grid-3">' + p.why.items.map(u =>
          '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
          '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p></article>').join('') +
        '</div>' +
      '</div></section>' +

      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.process.kicker, p.process.title) + '</div>' +
        '<ol class="process">' + p.process.steps.map((s, i) =>
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

      ctaBand(p.cta, 'offerte_cta_click');
  }

  function renderB2b() {
    const b = C.b2b;
    return pageHero(b.hero) +

      '<section class="section"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.audiences.kicker, b.audiences.title) + '</div>' +
        '<div class="grid-3">' + b.audiences.items.map(u =>
          '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
          '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p></article>').join('') +
        '</div>' +
      '</div></section>' +

      '<section class="section section-tint"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.how.kicker, b.how.title) + '</div>' +
        '<ol class="process process-3">' + b.how.steps.map((s, i) =>
          '<li class="process-step reveal">' +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      '<section class="section"><div class="wrap wrap-narrow">' +
        '<div class="card pricing-card reveal">' +
          '<h2 class="section-title">' + esc(b.pricing.title) + '</h2>' +
          '<p>' + esc(b.pricing.text) + '</p>' +
        '</div>' +
      '</div></section>' +

      ctaBand(b.cta);
  }

  function renderContact() {
    const c = C.contact, f = c.form;
    return pageHero(c.hero) +
      '<section class="section"><div class="wrap contact-inner">' +

        '<form class="card contact-form reveal" id="offer-form" novalidate>' +
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
            '<button type="submit" class="btn btn-primary" data-ga-event="offerte_aanvraag_email">' + esc(f.submitEmail) + '</button>' +
            '<button type="button" class="btn btn-ghost" id="wa-submit" data-ga-event="offerte_aanvraag_whatsapp">' + esc(f.submitWhatsApp) + '</button>' +
          '</div>' +
          '<p class="form-note">' + esc(f.privacyNote) + '</p>' +
          '<p class="form-error" id="form-error" hidden>Vul minimaal naam, bedrijfsnaam en e-mailadres in.</p>' +
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

  function pageHero(hero) {
    return '<section class="page-hero"><div class="wrap reveal">' +
      '<p class="kicker">' + esc(hero.kicker) + '</p>' +
      '<h1>' + esc(hero.title) + '</h1>' +
      (hero.sub ? '<p class="hero-sub">' + esc(hero.sub) + '</p>' : '') +
      '</div></section>';
  }

  /* ---------- Offerteformulier → mailto / WhatsApp ---------- */

  function initForm() {
    const form = document.getElementById('offer-form');
    if (!form) return;
    const err = document.getElementById('form-error');
    const f = C.contact.form;

    function collect() {
      const d = new FormData(form);
      const volume = f.volumeOptions.find(o => o.value === d.get('volume'));
      return {
        naam: (d.get('naam') || '').trim(),
        bedrijf: (d.get('bedrijf') || '').trim(),
        email: (d.get('email') || '').trim(),
        telefoon: (d.get('telefoon') || '').trim(),
        volume: volume ? volume.label : '',
        bericht: (d.get('bericht') || '').trim()
      };
    }

    function valid(v) {
      const ok = v.naam && v.bedrijf && /.+@.+\..+/.test(v.email);
      err.hidden = !!ok;
      return ok;
    }

    function bodyText(v) {
      return 'Offerte-aanvraag ' + cfg.brandName + '\n\n' +
        'Naam: ' + v.naam + '\n' +
        'Bedrijf: ' + v.bedrijf + '\n' +
        'E-mail: ' + v.email + '\n' +
        (v.telefoon ? 'Telefoon: ' + v.telefoon + '\n' : '') +
        'Gewenst volume: ' + v.volume + '\n\n' +
        (v.bericht ? 'Bericht:\n' + v.bericht + '\n' : '');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = collect();
      if (!valid(v)) return;
      gaEvent('offerte_aanvraag_email');
      location.href = 'mailto:' + cfg.email +
        '?subject=' + encodeURIComponent(f.emailSubject) +
        '&body=' + encodeURIComponent(bodyText(v));
    });

    document.getElementById('wa-submit').addEventListener('click', () => {
      const v = collect();
      if (!valid(v)) return;
      gaEvent('offerte_aanvraag_whatsapp');
      window.open(waLink(bodyText(v)), '_blank', 'noopener');
    });
  }

  /* ---------- Google Analytics (GA4) ---------- */

  function gaEvent(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function initGA() {
    if (!cfg.gaId) return; // geen ID ingesteld → GA volledig uit
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.gaId, { anonymize_ip: true });

    /* Eventtracking op alle CTA's/knoppen met data-ga-event */
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-ga-event]');
      if (el) gaEvent(el.dataset.gaEvent, { page: page });
    });
  }

  /* ---------- Scroll-reveals (subtiel, met reduced-motion-guard) ---------- */

  function initReveal() {
    const els = document.querySelectorAll('.reveal');
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

    /* Lichte parallax op de hero-afbeelding */
    const par = document.querySelector('[data-parallax]');
    if (par) {
      window.addEventListener('scroll', () => {
        const y = Math.min(window.scrollY, 600);
        par.style.transform = 'translateY(' + (y * 0.06) + 'px)';
      }, { passive: true });
    }
  }

  /* ---------- Boot ---------- */

  const renderers = { home: renderHome, 'over-ons': renderAbout, product: renderProduct, zakelijk: renderB2b, contact: renderContact };

  renderHeader();
  document.getElementById('site-main').innerHTML = (renderers[page] || renderHome)();
  renderFooter();
  if (page === 'contact') initForm();
  initGA();
  initReveal();
})();
