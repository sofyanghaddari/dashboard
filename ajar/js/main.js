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

  /* Topbar-teksten: bevestigde feiten (topbar.items) + optioneel topbar.pendingItems
     (claims in afwachting van certificering, alleen zichtbaar zolang topbar.showPending
     niet expliciet op false staat — zie de toelichting bij topbar in content.js). */
  function topbarItems() {
    const t = C.topbar;
    if (!t) return [];
    const base = t.items || (t.text ? [t.text] : []);
    const pending = (t.showPending !== false && t.pendingItems) ? t.pendingItems : [];
    return base.concat(pending);
  }

  /* Vervangbare beeld-slot: toont de foto uit assets/images/ zodra die bestaat,
     anders een rustige olijfgroen/goud gradient-placeholder met de bestandsnaam. */
  function imgSlot(file, alt, cls, eager) {
    if (!file) return '';
    const load = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return '<figure class="img-slot ' + (cls || '') + '" data-file="' + esc(file) + '">' +
      '<img src="assets/images/' + esc(file) + '" alt="' + esc(alt || '') + '" ' + load + ' ' +
      'onload="this.classList.add(\'imgok\')" ' +
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
  /* Olijftak die zichzelf tekent zodra de CTA-band in beeld komt (stroke-draw via pathLength) */
  function branchSvg() {
    return '<svg class="cta-branch" viewBox="0 0 220 56" fill="none" aria-hidden="true">' +
      '<path class="cb-stem" pathLength="1" d="M8 44 C 58 34 116 22 212 12"/>' +
      '<path class="cb-leaf" pathLength="1" d="M52 36 C 50 26 56 18 66 16 C 66 26 61 33 52 36 Z"/>' +
      '<path class="cb-leaf" pathLength="1" d="M96 29 C 102 20 112 17 121 19 C 117 28 108 33 96 29 Z"/>' +
      '<path class="cb-leaf" pathLength="1" d="M142 22 C 140 13 146 5 156 3 C 156 13 151 20 142 22 Z"/>' +
      '<circle class="cb-olive" cx="78" cy="35" r="4.5"/>' +
      '<circle class="cb-olive" cx="170" cy="17" r="4.5"/>' +
    '</svg>';
  }

  function ctaBand(cta) {
    return '<section class="cta-band reveal">' +
      '<div class="wrap cta-band-inner">' +
      branchSvg() +
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

  /* Caret-pijltje voor menu-items met een uitklap-submenu */
  const NAV_CARET = '<svg class="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  /* Taalkeuze (NL/EN/FR) — leest de globals uit i18n.js; niets tonen bij < 2 talen */
  function langSwitch() {
    const langs = window.AJAR_LANGS || [];
    const cur = window.AJAR_LANG || 'nl';
    if (langs.length < 2) return '';
    const curL = langs.find(l => l.code === cur) || langs[0];
    const globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"/></svg>';
    return '<div class="lang-switch">' +
      '<button type="button" class="lang-cur" aria-expanded="false" aria-haspopup="true" aria-label="Taal / language / langue">' +
        globe + '<span class="lang-code">' + esc(curL.short) + '</span>' + NAV_CARET +
      '</button>' +
      '<div class="lang-menu" role="menu">' + langs.map(l =>
        '<button type="button" role="menuitemradio" aria-checked="' + (l.code === cur ? 'true' : 'false') + '"' +
        (l.code === cur ? ' class="on"' : '') + ' data-lang="' + esc(l.code) + '">' + esc(l.label) + '</button>').join('') +
      '</div>' +
    '</div>';
  }

  function renderHeader() {
    const links = C.nav.map(n => {
      const activeAttr = n.id === page ? ' class="active" aria-current="page"' : '';
      /* Menu-item met submenu → dropdown (desktop: hover/klik; mobiel: inklapbaar) */
      if (n.children && n.children.length) {
        const subId = 'nav-sub-' + n.id;
        const subLinks = n.children.map(c =>
          '<a href="' + esc(c.href) + '" role="menuitem">' + esc(c.label) + '</a>'
        ).join('');
        return '<div class="nav-item has-sub">' +
          '<a href="' + esc(n.href) + '"' + activeAttr + '>' + esc(n.label) + '</a>' +
          '<button type="button" class="nav-sub-toggle" aria-expanded="false" aria-controls="' + subId + '" ' +
            'aria-label="' + esc(n.label) + ' — onderwerpen">' + NAV_CARET + '</button>' +
          '<div class="nav-sub" id="' + subId + '" role="menu">' + subLinks + '</div>' +
        '</div>';
      }
      return '<a href="' + esc(n.href) + '"' + activeAttr + '>' + esc(n.label) + '</a>';
    }).join('');

    /* Dunne belofte-topbar boven de (sticky) header — scrolt gewoon mee weg.
       Rouleert door topbarItems(); eerste item = de sample-CTA. */
    const tbItems = topbarItems();
    if (tbItems.length && page !== 'sample') {
      document.getElementById('site-header').insertAdjacentHTML('beforebegin',
        '<a class="topbar" href="' + esc(C.topbar.href) + '" data-ga-event="sample_cta_click">' +
          '<span class="tb-text">' + esc(tbItems[0]) + '</span>' +
        '</a>');
    }

    /* Skip-link voor toetsenbord/screenreader: als allereerste focusbaar element */
    if (!document.querySelector('.skip-link')) {
      document.body.insertAdjacentHTML('afterbegin',
        '<a class="skip-link" href="#site-main">Direct naar de inhoud</a>');
    }

    document.getElementById('site-header').innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="index.html" aria-label="' + esc(cfg.brandName) + ' — home">' +
          '<img src="assets/logo/ajar-header.svg" alt="' + esc(cfg.brandName) + '" class="brand-logo">' +
        '</a>' +
        '<nav class="site-nav" id="site-nav" aria-label="Hoofdnavigatie">' + links +
          /* Op sample.html zelf is "Gratis sample aanvragen" een dode link naar de eigen pagina —
             toon daar in plaats daarvan de logische vervolgstap "Offerte aanvragen". */
          (page === 'sample'
            ? '<a class="btn btn-primary nav-cta" href="' + esc(C.ctaHref) + '" data-ga-event="offerte_cta_click">' + esc(C.ctaLabel) + '</a>'
            : '<a class="btn btn-primary nav-cta" href="' + esc(C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(C.sampleCtaLabel) + '</a>') +
          langSwitch() +
        '</nav>' +
        '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">' +
          '<span></span><span></span>' +
        '</button>' +
      '</div>';

    const toggle = document.getElementById('nav-toggle');

    /* Alle open dropdowns sluiten */
    function closeSubs(except) {
      document.querySelectorAll('.nav-item.sub-open').forEach(o => {
        if (o === except) return;
        o.classList.remove('sub-open');
        const b = o.querySelector('.nav-sub-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }

    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('nav-lock', open); // scroll-lock achter volscherm-menu
      if (!open) closeSubs(); // submenu's dichtklappen bij sluiten van het hoofdmenu
    });

    /* Caret-knop: submenu open/dicht (desktop klik/touch + mobiel accordeon) */
    document.querySelectorAll('.nav-sub-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.nav-item');
        const open = item.classList.toggle('sub-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) closeSubs(item);
      });
    });

    document.getElementById('site-nav').addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
        document.documentElement.classList.remove('nav-lock');
        toggle.setAttribute('aria-expanded', 'false');
        closeSubs();
      }
    });

    /* Klik buiten een menu-item → open dropdowns sluiten (desktop) */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item')) closeSubs();
    });
    /* Escape sluit een open dropdown */
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSubs(); });

    /* Taalkeuze: menu open/dicht + taal wisselen (herlaadt de pagina in de gekozen taal) */
    const langWrap = document.querySelector('.lang-switch');
    if (langWrap) {
      const langCur = langWrap.querySelector('.lang-cur');
      langCur.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = langWrap.classList.toggle('open');
        langCur.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      langWrap.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const code = btn.dataset.lang;
          if (window.AJAR_SET_LANG && code !== (window.AJAR_LANG || 'nl')) window.AJAR_SET_LANG(code);
          else langWrap.classList.remove('open');
        });
      });
      document.addEventListener('click', (e) => { if (!e.target.closest('.lang-switch')) langWrap.classList.remove('open'); });
    }

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
    const f = C.footer;
    const navLinks = C.nav.map(n => '<a href="' + n.href + '">' + esc(n.label) + '</a>').join('');
    const socials = (f.socials || []).filter(s => s && s.href);

    document.getElementById('site-footer').innerHTML =
      /* Fluister-wordmark: reusachtige outline-"AJAR" als stille achtergrondlaag */
      '<span class="footer-wordmark" aria-hidden="true">AJAR</span>' +
      '<div class="wrap footer-inner">' +
        '<div class="footer-col footer-brand">' +
          '<img src="assets/logo/ajar-header.svg" alt="' + esc(cfg.brandName) + '" class="footer-logo">' +
          '<p>' + esc(f.aboutLine) + '</p>' +
          newsletterBlock() +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>Navigatie</h3><nav class="footer-nav">' + navLinks +
          '<a href="privacy.html">' + esc(f.privacyLabel) + '</a>' +
          '<a href="voorwaarden.html">' + esc(f.termsLabel) + '</a></nav>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h3>Contact</h3>' +
          '<a class="footer-wa" href="' + waLink(C.contact.direct.whatsappPrefill) + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">WhatsApp — snelste route</a>' +
          (C.contact.direct.phoneDisplay ? '<a href="tel:+' + esc(cfg.whatsappNumber) + '">' + esc(C.contact.direct.phoneDisplay) + '</a>' : '') +
          (cfg.email ? '<a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>' : '') +
          (socials.length ? '<div class="footer-socials">' + socials.map(s =>
            '<a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>').join('') + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="wrap footer-bottom">' +
        '<span>© ' + new Date().getFullYear() + ' ' + esc(cfg.brandName) + ' · ' + esc(cfg.tagline) +
          (f.rightsLine ? ' · ' + esc(f.rightsLine) : '') + '</span>' +
        /* Cookie-voorkeuren opnieuw kiezen — alleen zinvol als er iets te kiezen valt (GA aan) */
        (cfg.gaId ? '<button type="button" class="footer-link-btn" id="cookie-prefs">' + esc(f.cookiePrefsLabel) + '</button>' : '') +
      '</div>';

    const prefs = document.getElementById('cookie-prefs');
    if (prefs) prefs.addEventListener('click', () => {
      localStorage.removeItem(CONSENT_KEY);
      document.querySelectorAll('.cookie-banner').forEach(el => el.remove());
      initConsent();
    });
  }

  /* Nieuwsbrief-inschrijving in de footer (zelfde Formspree→mailto-fallback als de formulieren). */
  function newsletterBlock() {
    const n = C.newsletter;
    if (!n || !n.enabled) return '';
    return '<form class="newsletter" id="newsletter-form" novalidate>' +
      '<p class="newsletter-title">' + esc(n.title) + '</p>' +
      '<p class="newsletter-text">' + esc(n.text) + '</p>' +
      '<input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="newsletter-row">' +
        '<input type="email" name="email" required aria-label="' + esc(n.placeholder) + '" placeholder="' + esc(n.placeholder) + '">' +
        '<button type="submit" class="btn btn-primary" data-ga-event="newsletter_signup">' + esc(n.button) + '</button>' +
      '</div>' +
      (n.privacyNote ? '<p class="newsletter-note">' + esc(n.privacyNote) + ' <a href="privacy.html">Privacy</a></p>' : '') +
      '<p class="form-error" data-role="error" hidden></p>' +
      '<p class="form-success" data-role="success" hidden></p>' +
    '</form>';
  }

  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    const n = C.newsletter;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = formVals(form);
      if (!/.+@.+\..+/.test(v.email)) {
        showMsg(form, 'error', 'Vul een geldig e-mailadres in.');
        return;
      }
      v._subject = n.emailSubject;
      const waText = n.emailSubject + '\n\nE-mail: ' + v.email;
      const ok = await submitLead(form, v, waText, n.success);
      if (ok) gaEvent('newsletter_signup', {});
    });
  }

  /* ---------- Herbruikbare blokken ---------- */

  /* Line-iconen voor processtappen (getoond als er nog geen foto is) */
  function stepIcon(name) {
    const paths = {
      olive: '<circle cx="9" cy="14" r="3.2"/><circle cx="15.5" cy="10.5" r="2.6"/><path d="M15 8c1.5-2.5 4-3.5 6-3.5-.2 2.4-1.6 4.3-3.8 4.8"/>',
      press: '<path d="M6 4h12M12 4v5m-4 0h8l-1.5 4h-5L8 9z"/><path d="M12 13v4"/><path d="M8.5 21h7"/><path d="M10 17h4v4h-4z"/>',
      bottle: '<path d="M10.5 3h3v3l1.2 2.2c.5.9.8 1.9.8 2.9V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-7.9c0-1 .3-2 .8-2.9L10.5 6z"/><path d="M9.5 13h5"/>',
      truck: '<path d="M2 6h11v9H2z"/><path d="M13 9h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  /* Procesbeeld: toont de foto zodra die er is, anders een net gouden line-icoon (geen kale placeholder) */
  function processMedia(file, icon, alt) {
    return '<figure class="img-slot img-step proc-media" data-file="' + esc(file) + '">' +
      (file ? '<img src="assets/images/' + esc(file) + '" alt="' + esc(alt || '') + '" loading="lazy" ' +
        'onload="this.classList.add(\'imgok\')" ' +
        'onerror="this.closest(\'.img-slot\').classList.add(\'noimg\');this.remove()">' : '') +
      '<span class="proc-icon">' + stepIcon(icon) + '</span>' +
      '</figure>';
  }

  function uspGrid(items, gridClass) {
    return '<div class="' + (gridClass || 'grid-3') + '">' + items.map(u =>
      '<article class="card reveal"><span class="card-rule" aria-hidden="true"></span>' +
      '<h3>' + esc(u.title) + '</h3><p>' + esc(u.text) + '</p>' +
      (u.button ? '<a class="btn btn-ghost card-btn" href="' + esc(u.buttonHref) + '" data-ga-event="' + esc(u.ga || '') + '">' + esc(u.button) + '</a>' : '') +
      '</article>').join('') + '</div>';
  }

  /* ---------- Pagina's ---------- */

  /* Homepage: max 4 secties (hero / kernpunten / 1 beeldsectie / slot-CTA) — verbeterronde juli 2026.
     Introduceert alleen en verwijst door; alle verdieping staat op de subpagina's. */
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
      /* 1. Hero — merknaam/positionering + één zin + één CTA (sample). Simpele fade+up-reveal
         (zoals de rest van de site) — géén per-woord masker-animatie meer: die veroorzaakte een
         zichtbare "sprong"/herschikking van de titel vlak na het laden (v6-bugfix). */
      '<section class="hero">' +
        '<div class="wrap hero-inner">' +
          '<div class="hero-text reveal">' +
            '<h1 class="hero-title-anim">' + esc(h.hero.title) + '</h1>' +
            '<p class="hero-sub">' + esc(h.hero.sub) + '</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="' + esc(C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(C.sampleCtaLabel) + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="hero-media reveal" data-parallax>' + imgSlot(h.hero.image, 'Olijfgaard in noordoost-Marokko', 'img-hero', true) + '</div>' +
        '</div>' +
      '</section>' +

      partnersRow +

      /* 2. Drie kernpunten — max 6 woorden elk, geen kaarten/uitleg — onder de kicker "Waarom AJAR" */
      '<section class="section kernpunten"><div class="wrap">' +
        (h.kernpunten.kicker ? '<p class="kicker kernpunten-kicker reveal">' + esc(h.kernpunten.kicker) + '</p>' : '') +
        '<ul class="kernpunten-row reveal">' + h.kernpunten.items.map(k => '<li>' + esc(k) + '</li>').join('') + '</ul>' +
      '</div></section>' +

      /* 3. Eén beeldsectie: fabriek/bomen + één zin + link naar Over ons */
      '<section class="section split"><div class="wrap split-inner">' +
        '<div class="split-media reveal">' + imgSlot(h.intro.image, 'ConservAjar SARL, de fabriek in Taourirt', '') + '</div>' +
        '<div class="split-text reveal">' +
          '<p class="kicker">' + esc(h.intro.kicker) + '</p>' +
          '<p>' + esc(h.intro.text) + '</p>' +
          '<a class="text-link" href="' + esc(h.intro.linkHref) + '">' + esc(h.intro.linkLabel) + ' →</a>' +
        '</div>' +
      '</div></section>' +

      marqueeBand() +

      /* 4. Slot-CTA — andere formulering dan de hero, zelfde doel */
      ctaBand(h.cta);
  }

  /* Fluister-marquee: trage lopende band met alléén bevestigde feiten (content.js `marquee`).
     Twee identieke helften voor een naadloze loop; reduced-motion → staat stil. */
  function marqueeBand() {
    if (!C.marquee || !C.marquee.length) return '';
    const half = C.marquee.map(t => '<span class="mq-item">' + esc(t) + '</span><span class="mq-dot" aria-hidden="true">·</span>').join('');
    return '<div class="marquee" aria-hidden="true"><div class="marquee-track">' +
      '<div class="marquee-half">' + half + '</div><div class="marquee-half">' + half + '</div>' +
    '</div></div>';
  }

  /* Bewijs van schaal: fotostapel — de 4 fabrieksfoto's liggen overlappend op elkaar (als losse
     foto's op tafel) en komen om de beurt bovenop: vanzelf elke ~4s, of direct bij een tik.
     Verving de vlakke 2×2-grid (v6e, op verzoek van Soef). GEEN productgrid — geen namen/
     prijzen/aanbod-taal. Let op: tik = volgende foto, dus déze foto's zitten bewust niet
     meer in de lightbox. */
  function factoryGallery(g) {
    if (!g || !g.images || !g.images.length) return '';
    return '<section class="section factory-gallery"><div class="wrap">' +
      '<p class="kicker reveal">' + esc(g.kicker) + '</p>' +
      '<p class="factory-gallery-text reveal">' + esc(g.text) + '</p>' +
      '<div class="stack-gallery reveal" id="stack-gallery" role="group" aria-label="Foto’s uit de fabriek — tik voor de volgende">' +
        g.images.map((im, i) =>
          '<div class="stack-card" data-pos="' + i + '">' + imgSlot(im.file, im.alt, '') + '</div>').join('') +
      '</div>' +
      '<div class="stack-dots">' + g.images.map((_, i) =>
        '<button type="button" class="stack-dot' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"></button>').join('') +
      '</div>' +
    '</div></section>';
  }

  /* Fotostapel-gedrag: bovenste kaart glijdt opzij en schuift achteraan; pauzeert buiten
     beeld en in een verborgen tabblad; tik op de stapel = meteen de volgende. */
  function initStackGallery() {
    const g = document.getElementById('stack-gallery');
    if (!g) return;
    const cards = Array.from(g.querySelectorAll('.stack-card'));
    const dots = Array.from(document.querySelectorAll('.stack-dot'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let order = cards.map((_, i) => i);   // order[0] = index van de bovenste kaart
    let busy = false, timer = null;

    function apply() {
      order.forEach((cardIdx, pos) => cards[cardIdx].setAttribute('data-pos', pos));
      dots.forEach((d, i) => d.classList.toggle('on', i === order[0]));
    }
    function advance() {
      if (busy) return;
      if (reduce) { order.push(order.shift()); apply(); return; }
      busy = true;
      const top = cards[order[0]];
      top.classList.add('stack-leaving');
      setTimeout(() => {
        top.classList.remove('stack-leaving');
        order.push(order.shift());
        apply();
        busy = false;
      }, 480);
    }
    function start() { if (!timer && !reduce && !document.hidden) timer = setInterval(advance, 4200); }
    function stop() { clearInterval(timer); timer = null; }

    g.addEventListener('click', () => { advance(); stop(); start(); });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    });
    g.setAttribute('tabindex', '0');
    dots.forEach(d => d.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(d.dataset.i);
      if (i === order[0] || busy) return;
      order = [i].concat(order.filter(x => x !== i));
      apply();
      stop(); start();
    }));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es.forEach(en => en.isIntersecting ? start() : stop());
      }, { threshold: .25 }).observe(g);
    } else start();
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    apply();
  }

  /* Topbar-rotatie: teksten wisselen met een zachte fade-omhoog; staat stil bij reduced-motion
     en in een verborgen tabblad. */
  function initTopbarRotate() {
    const el = document.querySelector('.topbar .tb-text');
    const items = topbarItems();
    if (!el || items.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % items.length;
      el.classList.add('tb-swap');
      setTimeout(() => {
        el.style.transition = 'none';           /* sprong naar de instap-stand zonder animatie */
        el.textContent = items[i];
        el.classList.remove('tb-swap');
        el.classList.add('tb-enter');
        void el.offsetWidth;
        el.style.transition = '';
        el.classList.remove('tb-enter');        /* en zacht omhoog het beeld in */
      }, 300);
    }, 3800);
  }

  function aboutBlock(b, i) {
    const idAttr = b.anchor ? ' id="' + esc(b.anchor) + '"' : '';
    const media = b.image ? '<div class="split-media reveal">' + imgSlot(b.image, b.title, '') + '</div>' : '';
    if (media) {
      return '<section class="section split' + (i % 2 ? ' split-rev' : '') + '"' + idAttr + '><div class="wrap split-inner">' +
        media +
        '<div class="split-text reveal"><h2 class="section-title">' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p></div>' +
        '</div></section>';
    }
    return '<section class="section"' + idAttr + '><div class="wrap wrap-narrow prose reveal">' +
      '<h2 class="section-title">' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p></div></section>';
  }

  /* "Onze familie" — kort persoonlijk verhaal, ná het vertrouwensblok (ISO). Géén jaartallen
     (dat blijft voorbehouden aan de tijdlijn verderop) en géén uitgelicht citaat (zelfprijzing). */
  function familyStorySection(fs) {
    if (!fs) return '';
    return '<section class="section family-story" id="familie"><div class="wrap wrap-narrow">' +
      '<div class="section-head reveal">' + kickerTitle(fs.kicker, fs.title) + '</div>' +
      '<ol class="story">' + fs.blocks.map((b, i) =>
        '<li class="story-item reveal" style="transition-delay:' + (i * .1).toFixed(1) + 's">' +
          '<span class="story-dot" aria-hidden="true"></span>' +
          '<h3>' + esc(b.title) + '</h3><p>' + esc(b.text) + '</p>' +
        '</li>').join('') +
      '</ol>' +
    '</div></section>';
  }

  function renderAbout() {
    const a = C.about;
    const tl = a.timeline;
    return pageHero(a.hero) +
      a.blocks.slice(0, 2).map(aboutBlock).join('') +

      familyStorySection(a.familyStory) +

      a.blocks.slice(2).map((b, i) => aboutBlock(b, i + 2)).join('') +

      factoryGallery(a.factoryGallery) +

      /* Familie-tijdlijn */
      '<section class="section section-tint" id="tijdlijn"><div class="wrap wrap-narrow">' +
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

  /* Herkomst-/traceerkaart: geanimeerde route Marokko → Amsterdam met reizende marker. */
  function originMap(o) {
    if (!o) return '';
    return '<section class="section section-tint" id="herkomst"><div class="wrap">' +
      '<div class="section-head reveal">' + kickerTitle(o.kicker, o.title, o.text) + '</div>' +
      '<div class="origin-map reveal" id="origin-map">' +
        '<svg class="om-svg" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<circle class="om-halo" cx="110" cy="215" r="34"/>' +
          '<circle class="om-halo" cx="690" cy="72" r="34"/>' +
          '<path class="om-route" d="M110 215 C 300 90, 520 175, 690 72"/>' +
          '<g class="om-pin"><circle cx="110" cy="215" r="9"/><circle class="om-pin-dot" cx="110" cy="215" r="3.4"/></g>' +
          '<g class="om-pin om-pin-b"><circle cx="690" cy="72" r="9"/><circle class="om-pin-dot" cx="690" cy="72" r="3.4"/></g>' +
          '<circle class="om-marker" cx="110" cy="215" r="6.5"/>' +
        '</svg>' +
        '<div class="om-ends">' +
          '<span class="om-end om-end-a"><strong>' + esc(o.from.label) + '</strong><em>' + esc(o.from.sub) + '</em></span>' +
          '<span class="om-end om-end-b"><strong>' + esc(o.to.label) + '</strong><em>' + esc(o.to.sub) + '</em></span>' +
        '</div>' +
      '</div>' +
      '<ol class="origin-steps">' + o.steps.map((s, i) =>
        '<li class="origin-step reveal"><span class="origin-step-num">' + (i + 1) + '</span>' +
        '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>').join('') +
      '</ol>' +
    '</div></section>';
  }

  function renderProduct() {
    const p = C.product;
    return pageHero(p.hero) +

      '<section class="section" id="specs"><div class="wrap specs-inner">' +
        '<div class="specs-media reveal">' + imgSlot(p.specs.image, p.specs.title, 'img-tall') + '</div>' +
        '<div class="specs-card card reveal">' +
          '<h2 class="section-title">' + esc(p.specs.title) + '</h2>' +
          '<dl class="specs-list">' + p.specs.rows.map(r =>
            '<div class="specs-row' + (r.todo ? ' is-todo' : '') + '"><dt>' + esc(r.label) + '</dt><dd>' + esc(r.value) + '</dd></div>').join('') +
          '</dl>' +
        '</div>' +
      '</div></section>' +

      /* De olijf: Picholine Marocaine — beeld + tekst naast elkaar, 2 kaarten eronder (grid-2, geen leeg 3e vak) */
      (p.cultivar
        ? '<section class="section" id="de-olijf"><div class="wrap">' +
          '<div class="split-inner cultivar-head">' +
            (p.cultivar.image ? '<div class="split-media reveal">' + imgSlot(p.cultivar.image, 'Verse olijven, Picholine Marocaine', '') + '</div>' : '') +
            '<div class="split-text reveal">' + kickerTitle(p.cultivar.kicker, p.cultivar.title, p.cultivar.text) + '</div>' +
          '</div>' +
          uspGrid(p.cultivar.points, 'grid-2') +
          '</div></section>'
        : '') +

      /* Meetbare kwaliteitscijfers */
      '<section class="section section-tint" id="kwaliteit"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.quality.kicker, p.quality.title) + '</div>' +
        '<div class="quality-row">' + p.quality.items.map(q => {
          /* Numerieke waarden (bijv. "0,28" of "310") tellen op zodra ze in beeld scrollen */
          const num = parseFloat(String(q.value).replace(',', '.'));
          const countable = !q.todo && isFinite(num) && /^[\d.,<>\s]+$/.test(String(q.value));
          return '<div class="quality-tile reveal' + (q.todo ? ' is-todo' : '') + '">' +
            '<span class="quality-value"' + (countable ? ' data-countup="' + num + '" data-raw="' + esc(q.value) + '"' : '') + '>' + esc(q.value) + '</span>' +
            '<span class="quality-label">' + esc(q.label) + (q.unit ? ' · ' + esc(q.unit) : '') + '</span>' +
            (q.explain ? '<p class="quality-explain">' + esc(q.explain) + '</p>' : '') +
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

      marqueeBand() +

      '<section class="section section-tint" id="proces"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.process.kicker, p.process.title) + '</div>' +
        '<ol class="process" data-anim>' + p.process.steps.map((s, i) =>
          '<li class="process-step reveal">' +
            processMedia(s.image, s.icon, s.title) +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      '<section class="section" id="certificering"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(p.certification.kicker, p.certification.title, p.certification.intro) + '</div>' +
        '<div class="grid-2">' + p.certification.items.map(c =>
          '<article class="card cert-card' + (c.available ? '' : ' cert-pending') + ' reveal">' +
            '<span class="cert-badge">' + esc(c.badge) + '</span>' +
            '<h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p>' +
            (c.available ? '' : '<p class="todo-mark">' + esc(c.note || 'Volgt.') + '</p>') +
          '</article>').join('') +
        '</div>' +
      '</div></section>' +

      originMap(p.origin) +

      ctaBand(p.cta);
  }

  /* Concept-mockup van de fles met het echte logo — nadrukkelijk GEEN productfoto.
     CSS-getekende fles (zelfde stijl als de kleine .fmt-bottle-silhouetten), met het bestaande
     wordmark-logo als etiket + een duidelijk "Concept"-lint zodat niemand 'm voor de definitieve
     fles aanziet (harde regel: nooit iets tonen dat als feit kan worden aangezien). */
  function bottleMockup(m) {
    if (!m) return '';
    return '<div class="bottle-mockup-wrap reveal">' +
      '<div class="bottle-mockup">' +
        '<span class="bm-badge">' + esc(m.badge) + '</span>' +
        '<span class="bm-cap" aria-hidden="true"></span>' +
        '<span class="bm-neck" aria-hidden="true"></span>' +
        '<span class="bm-body" aria-hidden="true">' +
          '<span class="bm-label"><img src="assets/logo/ajar-wordmark.svg" alt="AJAR (concept-etiket)" loading="lazy"></span>' +
        '</span>' +
      '</div>' +
      '<p class="bottle-mockup-cap">' + esc(m.caption) + '</p>' +
    '</div>';
  }

  /* "Zo bestelt u" — concrete voorwaarden op een rij */
  function orderingSection(o) {
    if (!o) return '';
    return '<section class="section" id="bestellen"><div class="wrap wrap-narrow">' +
      '<div class="section-head reveal">' + kickerTitle(o.kicker, o.title) + '</div>' +
      '<dl class="order-list card reveal">' + o.rows.map(r =>
        '<div class="order-row' + (r.todo ? ' is-todo' : '') + '"><dt>' + esc(r.label) + '</dt><dd>' + esc(r.value) + '</dd></div>').join('') +
      '</dl>' +
      (o.note ? '<p class="form-note reveal">' + esc(o.note) + '</p>' : '') +
    '</div></section>';
  }

  const DOSSIER_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  const DOSSIER_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  /* Inkoopdossier — documenten/certificaten met status + "opvragen"-knop */
  function dossierSection(d) {
    if (!d) return '';
    return '<section class="section section-tint" id="dossier"><div class="wrap">' +
      '<div class="section-head reveal">' + kickerTitle(d.kicker, d.title, d.intro) + '</div>' +
      '<ul class="dossier-list reveal">' + d.items.map(it =>
        '<li class="dossier-item' + (it.available ? ' is-available' : ' is-pending') + '">' +
          '<span class="dossier-ic" aria-hidden="true">' + (it.available ? DOSSIER_CHECK : DOSSIER_CLOCK) + '</span>' +
          '<span class="dossier-text"><strong>' + esc(it.label) + '</strong>' + (it.note ? '<em>' + esc(it.note) + '</em>' : '') + '</span>' +
          '<span class="dossier-tag">' + esc(it.available ? d.availableTag : d.pendingTag) + '</span>' +
        '</li>').join('') +
      '</ul>' +
      '<div class="dossier-actions reveal">' +
        '<a class="btn btn-primary btn-wa" href="' + waLink(d.requestPrefill) + '" target="_blank" rel="noopener" data-ga-event="dossier_request">' + esc(d.requestLabel) + '</a>' +
      '</div>' +
    '</div></section>';
  }

  function renderB2b() {
    const b = C.b2b, d = b.downloads;
    return pageHero(b.hero, [
        { label: C.sampleCtaLabel, href: C.sampleCtaHref, primary: true, ga: 'sample_cta_click' },
        { label: C.ctaLabel, href: C.ctaHref, primary: false, ga: 'offerte_cta_click' }
      ]) +

      '<section class="section" id="voor-wie"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.audiences.kicker, b.audiences.title) + '</div>' +
        uspGrid(b.audiences.items) +
      '</div></section>' +

      '<section class="section section-tint" id="hoe-het-werkt"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.how.kicker, b.how.title) + '</div>' +
        '<ol class="process process-3" data-anim>' + b.how.steps.map((s, i) =>
          '<li class="process-step reveal">' +
            '<span class="process-num">' + (i + 1) + '</span>' +
            '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
          '</li>').join('') +
        '</ol>' +
      '</div></section>' +

      /* Wat u krijgt & wat het kost — Formaten + Prijs samengevoegd (was 2 secties) */
      '<section class="section" id="aanbod"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.formats.kicker, b.formats.title) + '</div>' +
        '<div class="fmt-row">' + b.formats.items.map(f =>
          '<div class="fmt-tile reveal' + (f.todo ? ' is-todo' : '') + '">' +
            '<span class="fmt-shape fmt-' + esc(f.shape) + '" aria-hidden="true"></span>' +
            '<span class="fmt-size">' + esc(f.size) + (f.todo ? ' <em>(' + esc(f.todoNote) + ')</em>' : '') + '</span>' +
            '<h3>' + esc(f.name) + '</h3><p>' + esc(f.text) + '</p>' +
          '</div>').join('') +
        '</div>' +

        bottleMockup(b.formats.mockup) +

        '<div class="pricing-inline reveal">' +
          '<h3>' + esc(b.pricing.title) + '</h3>' +
          '<p>' + esc(b.pricing.text) + '</p>' +
          '<p class="pricing-fair">' + esc(b.pricing.fair) + '</p>' +
          '<p class="pricing-packaging' + (b.pricing.packagingTodo ? ' is-todo' : '') + '">' + esc(b.pricing.packaging) + '</p>' +
        '</div>' +
      '</div></section>' +

      orderingSection(b.ordering) +

      /* Waarom nu instappen — eerlijke geruststelling */
      '<section class="section section-tint" id="waarom-nu"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.assurance.kicker, b.assurance.title) + '</div>' +
        uspGrid(b.assurance.items) +
      '</div></section>' +

      /* Voor de winkel — sell-through-hulp + proeverij + relatiegeschenk (was 3 secties) */
      '<section class="section" id="voor-de-winkel"><div class="wrap">' +
        '<div class="section-head reveal">' + kickerTitle(b.support.kicker, b.support.title) + '</div>' +
        uspGrid(b.support.items, 'grid-2') +
      '</div></section>' +

      dossierSection(b.dossier) +

      /* Documentatie: spec-sheet (vrij) + bedrijfspresentatie (achter mini-formulier) */
      '<section class="section section-tint" id="documentatie"><div class="wrap">' +
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

      /* FAQ */
      '<section class="section" id="faq"><div class="wrap wrap-narrow">' +
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

  /* Select-veld helper (label + <select>) */
  function selectField(name, label, options) {
    return '<label class="form-field"><span>' + esc(label) + '</span>' +
      '<select name="' + esc(name) + '">' + (options || []).map(o =>
        '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('') +
      '</select></label>';
  }

  /* WhatsApp-per-onderwerp: rij voorgevulde snelknoppen */
  function waTopicsBlock(direct) {
    if (!direct.topics || !direct.topics.length) return '';
    return '<div class="wa-topics">' +
      (direct.topicsTitle ? '<p class="wa-topics-title">' + esc(direct.topicsTitle) + '</p>' : '') +
      '<div class="wa-topics-row">' + direct.topics.map(t =>
        '<a class="wa-chip" href="' + waLink(t.prefill) + '" target="_blank" rel="noopener" data-ga-event="' + esc(t.ga || 'whatsapp_click') + '">' + esc(t.label) + '</a>').join('') +
      '</div>' +
    '</div>';
  }

  /* Bewaar/deel-kaart: vCard, Web Share en QR-code */
  function saveCard(save) {
    if (!save) return '';
    return '<div class="card reveal save-card">' +
      '<h3>' + esc(save.title) + '</h3>' +
      '<p>' + esc(save.text) + '</p>' +
      '<div class="save-actions">' +
        '<button type="button" class="btn btn-primary" id="save-vcard" data-ga-event="save_vcard">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          esc(save.vcardLabel) + '</button>' +
        '<button type="button" class="btn btn-ghost" id="save-share" data-ga-event="share_page">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>' +
          esc(save.shareLabel) + '</button>' +
      '</div>' +
      '<figure class="save-qr">' +
        '<img src="assets/qr-site.svg" alt="QR-code naar ' + esc(cfg.brandName) + '" width="120" height="120" loading="lazy">' +
        '<figcaption>' + esc(save.qrLabel) + '</figcaption>' +
      '</figure>' +
    '</div>';
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
          '<div class="form-grid">' +
            selectField('type', f.typeLabel, f.typeOptions) +
            selectField('volume', f.volumeLabel, f.volumeOptions) +
          '</div>' +
          '<div class="form-grid">' +
            selectField('frequentie', f.frequencyLabel, f.frequencyOptions) +
            '<label class="form-field"><span>' + esc(f.callTimeLabel) + '</span>' +
              '<input type="text" name="belmoment" placeholder="' + esc(f.callTimePlaceholder) + '"></label>' +
          '</div>' +
          '<fieldset class="form-field choice-field"><legend>' + esc(f.channelLabel) + '</legend>' +
            '<div class="choice-row">' + f.channelOptions.map((o, i) =>
              '<label class="choice"><input type="radio" name="kanaal" value="' + esc(o.value) + '"' + (i === 0 ? ' checked' : '') + '>' +
              '<span>' + esc(o.label) + '</span></label>').join('') +
            '</div>' +
          '</fieldset>' +
          '<label class="form-field"><span>' + esc(f.messageLabel) + '</span>' +
            '<textarea name="bericht" rows="4" placeholder="' + esc(f.messagePlaceholder) + '"></textarea>' +
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
            (c.direct.phoneDisplay ? '<p class="contact-phone">' + esc(c.direct.phoneNote) + ' <a href="tel:+' + esc(cfg.whatsappNumber) + '">' + esc(c.direct.phoneDisplay) + '</a></p>' : '') +
            (cfg.email ? '<p class="contact-phone">E-mail: <a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a></p>' : '') +
            waTopicsBlock(c.direct) +
          '</div>' +
          saveCard(c.save) +
          '<div class="card reveal">' +
            '<h3>' + esc(C.importer.label) + '</h3>' +
            '<p class="footer-legal">' + esc(C.importer.name) + '<br>' + esc(C.importer.address) + '<br>' +
              esc(C.importer.postalCity) + '<br>' + esc(C.importer.country) + '<br>' +
              'KvK: ' + esc(cfg.kvk) + (cfg.btw ? '<br>Btw: ' + esc(cfg.btw) : '') + '</p>' +
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

      (s.hero.image
        ? '<section class="section sample-media-sec"><div class="wrap wrap-narrow">' +
          '<div class="reveal">' + imgSlot(s.hero.image, 'Olijfolie proeven bij vers brood, sfeerbeeld', '') + '</div>' +
          '</div></section>'
        : '') +

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

  /* Gedeelde renderer voor juridische pagina's (privacyverklaring + algemene voorwaarden) */
  function renderLegal(p) {
    return pageHero(p.hero) +
      '<section class="section"><div class="wrap wrap-narrow prose">' +
      '<p class="form-note reveal">' + esc(p.updated) + '</p>' +
      p.sections.map(s =>
        '<div class="reveal privacy-block"><h2 class="privacy-title">' + esc(s.title) + '</h2><p>' + esc(s.body) + '</p></div>'
      ).join('') +
      '</div></section>';
  }
  function renderPrivacy() { return renderLegal(C.privacy); }
  function renderTerms() { return renderLegal(C.terms); }

  /* Kennisbank: intro + accordion met algemene olijfolie-kennis (geen productclaims) + CTA. */
  function renderKnowledge() {
    const k = C.knowledge;
    return pageHero(k.hero) +
      (k.intro
        ? '<section class="section"><div class="wrap wrap-narrow prose reveal"><p>' + esc(k.intro) + '</p></div></section>'
        : '') +
      '<section class="section section-tint" id="kennis"><div class="wrap wrap-narrow">' +
        '<div class="faq reveal">' + k.items.map(it =>
          '<details class="faq-item">' +
            '<summary>' + esc(it.q) + '</summary>' +
            '<div class="faq-body"><p>' + esc(it.a) + '</p></div>' +
          '</details>').join('') +
        '</div>' +
      '</div></section>' +
      ctaBand(k.cta);
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

  /* Zelf-tekenend succes-vinkje (stroke-draw via pathLength, zelfde stijl als de olijftak) */
  const OK_CHECK = '<svg class="ok-check" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10.5" pathLength="1"/>' +
    '<path d="M7 12.4l3.4 3.4L17.2 9" pathLength="1"/></svg>';

  function showMsg(form, role, msg) {
    form.querySelectorAll('[data-role]').forEach(el => { el.hidden = true; });
    const el = form.querySelector('[data-role=' + role + ']');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (role === 'success') {
      el.insertAdjacentHTML('afterbegin', OK_CHECK);
      /* De melding staat onder het formulier — zeker op mobiel vaak buiten beeld na submit.
         Zacht in beeld scrollen zodat de bevestiging niet gemist wordt. */
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    if (role === 'error') shakeFirstMissing(form);
  }

  /* Bij een validatiefout: het eerste ontbrekende/ongeldige veld kort schudden + focussen,
     zodat meteen duidelijk is wát er mist (de foutmelding staat onderaan het formulier). */
  function shakeFirstMissing(form) {
    const bad = Array.from(form.querySelectorAll('input, textarea')).find(el => {
      if (el.type === 'hidden' || el.name === '_gotcha') return false;
      const val = el.value.trim();
      if (el.hasAttribute('required') && !val) return true;
      if (el.type === 'email' && el.hasAttribute('required') && !/.+@.+\..+/.test(val)) return true;
      return false;
    });
    if (!bad) return;
    const wrap = bad.closest('.form-field') || bad;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wrap.classList.remove('field-shake');
      void wrap.offsetWidth; /* herstart de animatie bij herhaald indienen */
      wrap.classList.add('field-shake');
      wrap.addEventListener('animationend', () => wrap.classList.remove('field-shake'), { once: true });
    }
    bad.focus();
  }

  /* Groen vinkje per veld zodra het geldig is ingevuld (verlaagt de drempel bij lange formulieren).
     E-mail: regex; telefoon: alleen als er iets staat én het minstens 8 cijfers heeft; overige
     verplichte velden: niet leeg. Optionele lege velden krijgen géén vinkje. */
  function initFieldChecks() {
    document.querySelectorAll('form .form-field input').forEach(inp => {
      if (inp.type === 'hidden' || inp.name === '_gotcha') return;
      const wrap = inp.closest('.form-field');
      if (!wrap) return;
      const check = () => {
        const val = inp.value.trim();
        let ok = false;
        if (inp.type === 'email') ok = /.+@.+\..+/.test(val);
        else if (inp.type === 'tel') ok = val.length > 0 && (val.replace(/\D/g, '').length >= 8);
        else if (inp.hasAttribute('required')) ok = val.length > 1;
        wrap.classList.toggle('field-ok', ok);
      };
      inp.addEventListener('input', check);
      inp.addEventListener('blur', check);
    });
  }

  /* Ankernavigatie: (1) binnenkomst via deel-link met #anker licht de doelsectie op;
     (2) klik op een menu-/paginalink naar een sectie op DEZELFDE pagina scrollt er soepel
     heen (geen volledige herlaad) en licht 'm op. scroll-margin-top in de CSS houdt de
     sectie vrij van de sticky header. */
  function initAnchorFlash() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function flash(el) {
      if (!el || reduce) return;
      el.classList.remove('anchor-flash');
      void el.offsetWidth; /* herstart de animatie bij herhaald klikken */
      el.classList.add('anchor-flash');
      el.addEventListener('animationend', () => el.classList.remove('anchor-flash'), { once: true });
    }

    if (location.hash && location.hash.length > 1) {
      let el = null;
      try { el = document.querySelector(location.hash); } catch (e) { el = null; }
      if (el) setTimeout(() => flash(el), 400);
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey) return;
      let url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (_) { return; }
      if (url.pathname !== location.pathname || url.hash.length < 2) return; // andere pagina → normaal navigeren
      let target = null;
      try { target = document.querySelector(url.hash); } catch (_) { return; }
      if (!target) return;
      e.preventDefault();
      if (history.pushState) history.pushState(null, '', url.hash);
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      flash(target);
    });
  }

  async function submitLead(form, v, waText, okMsg) {
    if (v._gotcha) { showMsg(form, 'success', okMsg); return true; } // honeypot: stil laten vallen

    if (!cfg.formspreeId) {
      // Geen Formspree → nette degradatie: e-mail als er een adres is, anders WhatsApp
      if (cfg.email) {
        location.href = 'mailto:' + cfg.email +
          '?subject=' + encodeURIComponent(v._subject || (cfg.brandName + ' — aanvraag')) +
          '&body=' + encodeURIComponent(waText);
      } else {
        window.open(waLink(waText), '_blank', 'noopener');
      }
      showMsg(form, 'success', okMsg);
      return true;
    }

    const btn = form.querySelector('[type=submit]');
    const oldLabel = btn.textContent;
    btn.disabled = true; btn.textContent = C.contact.form.sending;
    btn.classList.add('btn-loading'); /* spinner in de knop — duidelijk dat er iets gebeurt */
    try {
      const resp = await fetch('https://formspree.io/f/' + encodeURIComponent(cfg.formspreeId), {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(v)
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      showMsg(form, 'success', okMsg);
      form.reset();
      return true;
    } catch (e) {
      showMsg(form, 'error', C.contact.form.error);
      return false;
    } finally {
      btn.disabled = false; btn.textContent = oldLabel;
      btn.classList.remove('btn-loading');
    }
  }

  function initContactForm() {
    const form = document.getElementById('offer-form');
    if (!form) return;
    const f = C.contact.form;

    // Voorselectie via ?aanvraag=sample|offerte|proeverij|relatiegeschenk (CTA's van andere pagina's)
    const param = new URLSearchParams(location.search).get('aanvraag');
    if (param === 'sample') form.querySelector('select[name=volume]').value = 'sample';
    if (param === 'offerte') form.querySelector('select[name=volume]').value = 'maandelijks-vast';
    if (param === 'relatiegeschenk') {
      form.querySelector('select[name=volume]').value = 'relatiegeschenk';
      form.querySelector('textarea[name=bericht]').value = 'Ik heb interesse in AJAR als relatiegeschenk.';
    }
    if (param === 'proeverij') {
      form.querySelector('select[name=volume]').value = 'sample';
      form.querySelector('textarea[name=bericht]').value = 'Ik heb interesse in een proeverij in mijn zaak.';
    }

    // Type zaak voorselecteren via ?type= (bv. vanaf een doelgroep-CTA)
    const typeParam = new URLSearchParams(location.search).get('type');
    if (typeParam && f.typeOptions.some(o => o.value === typeParam)) {
      const ts = form.querySelector('select[name=type]');
      if (ts) ts.value = typeParam;
    }

    const labelOf = (opts, val) => (opts.find(o => o.value === val) || {}).label || val;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = formVals(form);
      if (!v.naam || !v.bedrijf || !/.+@.+\..+/.test(v.email)) {
        showMsg(form, 'error', 'Vul minimaal naam, bedrijfsnaam en een geldig e-mailadres in.');
        return;
      }
      const volume = labelOf(f.volumeOptions, v.volume);
      const type = v.type ? labelOf(f.typeOptions, v.type) : '';
      const freq = v.frequentie ? labelOf(f.frequencyOptions, v.frequentie) : '';
      const kanaal = v.kanaal ? labelOf(f.channelOptions, v.kanaal) : '';
      const waText = 'Aanvraag ' + cfg.brandName + '\n\nNaam: ' + v.naam + '\nBedrijf: ' + v.bedrijf +
        (type ? '\nType zaak: ' + type : '') +
        '\nE-mail: ' + v.email + (v.telefoon ? '\nTelefoon: ' + v.telefoon : '') +
        '\nGewenst volume: ' + volume +
        (freq ? '\nLeverfrequentie: ' + freq : '') +
        (kanaal ? '\nContactvoorkeur: ' + kanaal : '') +
        (v.belmoment ? '\nGewenst belmoment: ' + v.belmoment : '') +
        (v.bericht ? '\n\n' + v.bericht : '');
      v._subject = f.emailSubject + ' — ' + volume;
      const ok = await submitLead(form, v, waText, f.success);
      if (ok) gaEvent('offerte_aanvraag', { volume: v.volume, type: v.type || '', frequentie: v.frequentie || '' });
    });
  }

  /* ---------- Bewaar/deel: vCard, Web Share, kopieer-link ---------- */

  function initSaveShare() {
    const vBtn = document.getElementById('save-vcard');
    if (vBtn) {
      vBtn.addEventListener('click', () => {
        const imp = C.importer;
        const pc = imp.postalCity || '';
        const m = pc.match(/^(\d{4}\s?[A-Za-z]{2})\s+(.+)$/); // "1055 JV Amsterdam"
        const postcode = m ? m[1] : '';
        const city = m ? m[2] : pc;
        const lines = [
          'BEGIN:VCARD', 'VERSION:3.0',
          'N:;' + cfg.brandName + ';;;', 'FN:' + cfg.brandName,
          'ORG:' + cfg.brandName,
          'TITLE:' + (cfg.payoff || cfg.tagline || ''),
          'TEL;TYPE=CELL:+' + cfg.whatsappNumber,
          cfg.email ? 'EMAIL;TYPE=WORK:' + cfg.email : '',
          'ADR;TYPE=WORK:;;' + imp.address + ';' + city + ';;' + postcode + ';' + imp.country,
          'URL:' + cfg.domain,
          'NOTE:' + (C.footer.aboutLine || ''),
          'END:VCARD'
        ].filter(Boolean);
        const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = cfg.brandName + '.vcf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      });
    }

    const sBtn = document.getElementById('save-share');
    if (sBtn) {
      sBtn.addEventListener('click', async () => {
        const data = { title: cfg.brandName, text: (C.contact.save && C.contact.save.shareText) || cfg.payoff || '', url: location.href };
        if (navigator.share) {
          try { await navigator.share(data); } catch (_) { /* geannuleerd — niets doen */ }
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(location.href);
            if (window.ajarToast) window.ajarToast('Link gekopieerd');
            else sBtn.textContent = 'Link gekopieerd';
          } catch (_) {
            window.open('mailto:?subject=' + encodeURIComponent(cfg.brandName) + '&body=' + encodeURIComponent(data.text + ' ' + location.href));
          }
        } else {
          window.open('mailto:?subject=' + encodeURIComponent(cfg.brandName) + '&body=' + encodeURIComponent(data.text + ' ' + location.href));
        }
      });
    }
  }

  /* ---------- Herkomstkaart: marker reist langs de route ---------- */

  function initOriginMap() {
    const map = document.getElementById('origin-map');
    if (!map) return;
    const route = map.querySelector('.om-route');
    const marker = map.querySelector('.om-marker');
    if (!route || !marker || typeof route.getTotalLength !== 'function') return;
    const len = route.getTotalLength();
    const place = (d) => { const p = route.getPointAtLength(d); marker.setAttribute('cx', p.x); marker.setAttribute('cy', p.y); };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { place(len); return; }

    const DUR = 3400, PAUSE = 1000, cycle = DUR + PAUSE;
    let raf = 0, t0 = 0, running = false;
    function frame(ts) {
      if (!running) return;
      if (!t0) t0 = ts;
      const phase = (ts - t0) % cycle;
      const prog = Math.min(phase / DUR, 1);
      const eased = 1 - Math.pow(1 - prog, 2);
      place(eased * len);
      marker.style.opacity = (phase > DUR) ? String(Math.max(0, 1 - (phase - DUR) / PAUSE)) : '1';
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(map);
    } else start();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
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
          s.innerHTML = OK_CHECK + esc(okMsg) + ' <a class="text-link" href="' + esc(cfg.presentationPdf) + '" download data-ga-event="presentatie_download">' + esc(d.downloadLabel) + '</a>';
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
      email: cfg.email || undefined,
      telephone: '+' + cfg.whatsappNumber,
      vatID: cfg.btw || undefined,
      taxID: cfg.kvk ? 'KvK ' + cfg.kvk : undefined,
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+' + cfg.whatsappNumber, email: cfg.email || undefined, availableLanguage: ['nl'] },
      address: { '@type': 'PostalAddress', streetAddress: C.importer.address, postalCode: '1055 JV', addressLocality: 'Amsterdam', addressCountry: 'NL' }
    };
    const product = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: cfg.brandName + ' Extra Vierge Olijfolie',
      brand: { '@type': 'Brand', name: cfg.brandName },
      description: C.product.hero.sub,
      countryOfOrigin: 'MA',
      manufacturer: { '@type': 'Organization', name: C.producer.name, address: { '@type': 'PostalAddress', addressLocality: C.producer.city, addressCountry: 'MA' } },
      offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', businessFunction: 'http://purl.org/goodrelations/v1#Sell', priceSpecification: { '@type': 'PriceSpecification', description: 'Prijs op aanvraag (B2B)' } }
    };
    const objs = [org, product];
    /* FAQ-rich-result op de zakelijk-pagina */
    if (page === 'zakelijk' && C.b2b && C.b2b.faq && C.b2b.faq.items.length) {
      objs.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: C.b2b.faq.items.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      });
    }
    /* FAQ-rich-result op de kennispagina (algemene olijfolie-kennis, vraag-vormig) */
    if (page === 'kennis' && C.knowledge && C.knowledge.items && C.knowledge.items.length) {
      objs.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: C.knowledge.items.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      });
    }
    objs.forEach(obj => {
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

  /* ---------- Micro-interacties: scroll-voortgang, terug-naar-boven,
       pagina-overgang, blur-up-fallback ---------- */

  function initEnhancements() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Blur-up: reeds-gecachte foto's meteen scherp tonen (onload vuurt dan soms niet) */
    document.querySelectorAll('.img-slot img').forEach(im => {
      if (im.complete && im.naturalWidth > 0) im.classList.add('imgok');
    });

    /* Scroll-voortgangslijn (dun goud, bovenaan) */
    let bar = null;
    if (!reduce) {
      bar = document.createElement('div');
      bar.className = 'scroll-progress';
      document.body.appendChild(bar);
    }

    /* terug-naar-boven */
    let toTop = document.createElement('button');
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Terug naar boven');
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    document.body.appendChild(toTop);
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const h = document.documentElement;
        const y = window.scrollY || h.scrollTop || 0;
        const max = h.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(y / max, 1) * 100 : 0;
        if (bar) bar.style.width = pct + '%';
        toTop.classList.toggle('show', y > 700);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Zachte pagina-overgang: interne .html-links faden uit vóór navigatie.
       Browsers met MPA View Transitions (CSS @view-transition) doen de cross-fade
       native — dan slaan we de JS-fade over (anders dubbel effect + extra 260ms). */
    const hasViewTransitions = CSS.supports && CSS.supports('view-transition-name: none');
    if (!reduce && !hasViewTransitions) {
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey) return;
        if (!/\.html($|\?|#)/.test(href) && href !== 'index.html') return;
        if (/^https?:|^mailto:|^tel:|^#/.test(href)) return;
        /* Anker naar een sectie op DEZELFDE pagina → geen herlaad-fade; de
           ankernavigatie (initAnchorFlash) scrollt er soepel heen. */
        let u; try { u = new URL(href, location.href); } catch (_) { u = null; }
        if (u && u.pathname === location.pathname && u.hash) return;
        e.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(() => { window.location.href = href; }, 260);
      });
      /* Terug-knop uit bfcache: leaving-class weghalen */
      window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));
    }
  }

  /* ---------- Luxe-laag: custom cursor, magnetische knoppen, slimme header ----------
     Allemaal desktop-only (pointer: fine) en volledig uit bij reduced-motion. */

  function initLuxe() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Slimme header: verbergt zich bij omlaag scrollen, verschijnt direct bij omhoog.
       Werkt óók op mobiel — daar wint een bezoeker het meeste schermruimte. */
    const header = document.getElementById('site-header');
    if (header && !reduce) {
      let lastY = window.scrollY, ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          if (document.body.classList.contains('nav-open')) { lastY = y; return; }
          if (y > lastY + 6 && y > 240) document.body.classList.add('hdr-hide');
          else if (y < lastY - 4 || y < 240) document.body.classList.remove('hdr-hide');
          lastY = y;
        });
      }, { passive: true });
    }

    if (reduce || !window.matchMedia('(min-width: 860px) and (pointer: fine)').matches) return;

    /* Custom cursor: gouden stip + zachte ring die meegroeit op interactieve elementen */
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let mx = -100, my = -100, rx = -100, ry = -100, visible = false;
    document.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; document.body.classList.add('cursor-on'); rx = mx; ry = my; }
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      const t = e.target.closest('a, button, summary, .faq-item, input, textarea, select, label');
      ring.classList.toggle('is-link', !!t && !!t.closest('a, button, summary'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { visible = false; document.body.classList.remove('cursor-on'); });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(follow);
    })();

    /* Magnetische knoppen: primaire CTA's trekken subtiel naar de cursor */
    document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
      let raf = 0;
      btn.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) / r.width;
          const dy = (e.clientY - r.top - r.height / 2) / r.height;
          btn.style.transform = 'translate(' + (dx * 7).toFixed(1) + 'px,' + (dy * 5).toFixed(1) + 'px)';
        });
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Lightbox voor fabrieks- en procesfoto's (klik = groot bekijken) ---------- */

  function initLightbox() {
    const targets = document.querySelectorAll('.factory-gallery-item .img-slot, .proc-media');
    if (!targets.length) return;
    let box = null;
    function close() {
      if (!box) return;
      box.classList.remove('open');
      const b = box;
      setTimeout(() => { b.remove(); }, 280);
      box = null;
      document.documentElement.classList.remove('nav-lock');
    }
    function open(src, alt) {
      close();
      box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML =
        '<button class="lightbox-close" aria-label="Sluiten">✕</button>' +
        '<img src="' + src + '" alt="' + esc(alt || '') + '">' +
        (alt ? '<p class="lightbox-cap">' + esc(alt) + '</p>' : '');
      document.body.appendChild(box);
      document.documentElement.classList.add('nav-lock');
      requestAnimationFrame(() => requestAnimationFrame(() => box && box.classList.add('open')));
      box.addEventListener('click', close);
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    targets.forEach(slot => {
      const img = slot.querySelector('img');
      if (!img) return;
      /* Pas activeren als de foto echt geladen is — icoon-tegels (404 by design) blijven gewoon tegels */
      const enable = () => {
        if (slot.classList.contains('has-lightbox')) return;
        slot.classList.add('has-lightbox');
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
        slot.addEventListener('click', () => open(img.src, img.alt));
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img.src, img.alt); }
        });
      };
      if (img.complete && img.naturalWidth > 0) enable();
      else img.addEventListener('load', enable, { once: true });
    });
  }

  /* ---------- 3D & diepte: kaart-tilt met glans, hero-diepte ---------- */

  function init3d() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !window.matchMedia('(min-width: 860px) and (pointer: fine)').matches) return;

    /* 3D-tilt + meebewegende glans op kaarten en tegels (niet op formulieren) */
    const targets = Array.from(document.querySelectorAll('.card, .fmt-tile, .quality-tile, .specs-media .img-slot'))
      .filter(el => !el.querySelector('form') && !el.closest('form'));
    targets.forEach(el => {
      el.classList.add('tilt');
      const glare = document.createElement('span');
      glare.className = 'tilt-glare';
      glare.setAttribute('aria-hidden', 'true');
      el.appendChild(glare);
      let raf = 0;
      el.addEventListener('pointerenter', () => {
        if (el.classList.contains('reveal') && !el.classList.contains('in')) return; // entrance eerst afmaken
        el.classList.add('tilt-live');
      });
      el.addEventListener('pointermove', (e) => {
        if (!el.classList.contains('tilt-live') || raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ry', ((px - .5) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        setTimeout(() => el.classList.remove('tilt-live'), 350);
      });
    });

    /* Hero-foto: lichte 3D-diepte die de muis over de hele hero volgt */
    const heroSec = document.querySelector('.hero');
    const heroImg = document.querySelector('.hero-media .img-slot');
    if (heroSec && heroImg) {
      heroImg.classList.add('hero-3d');
      heroSec.addEventListener('pointermove', (e) => {
        const r = heroSec.getBoundingClientRect();
        heroImg.style.setProperty('--hry', (((e.clientX - r.left) / r.width - .5) * 4).toFixed(2) + 'deg');
        heroImg.style.setProperty('--hrx', ((.5 - (e.clientY - r.top) / r.height) * 3).toFixed(2) + 'deg');
      });
      heroSec.addEventListener('pointerleave', () => {
        heroImg.style.setProperty('--hrx', '0deg');
        heroImg.style.setProperty('--hry', '0deg');
      });
    }
  }

  /* ---------- Sticky mobiele CTA-balk (lead-site: sample altijd binnen duimbereik) ---------- */

  function initMobileCta() {
    if (page === 'sample' || page === 'contact' || page === 'privacy' || page === 'voorwaarden') return; // formulier-/juridische pagina's
    const m = C.mobileCta;
    if (!m) return;
    const bar = document.createElement('div');
    bar.className = 'mob-cta';
    bar.innerHTML =
      '<a class="btn btn-primary" href="' + esc(C.sampleCtaHref) + '" data-ga-event="sample_cta_click">' + esc(m.sample) + '</a>' +
      '<a class="btn btn-ghost mob-cta-wa" href="' + waLink(C.contact.direct.whatsappPrefill) + '" target="_blank" rel="noopener" data-ga-event="whatsapp_click">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.4A8.5 8.5 0 1 1 21 12z"/></svg>' +
        esc(m.whatsapp) +
      '</a>';
    document.body.appendChild(bar);

    /* Verbergen zodra de CTA-band of footer in beeld is (anders dubbel op elkaar) */
    let nearEnd = false;
    let greeted = false;
    function update() {
      const show = window.scrollY > 520 && !nearEnd;
      bar.classList.toggle('show', show);
      /* éénmalige zachte puls op de sample-knop bij de allereerste verschijning — nooit herhalend */
      if (show && !greeted) {
        greeted = true;
        setTimeout(() => bar.querySelector('.btn-primary').classList.add('mob-cta-hello'), 350);
      }
    }
    const ends = document.querySelectorAll('.cta-band, .site-footer');
    if ('IntersectionObserver' in window && ends.length) {
      const seen = new Set();
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { en.isIntersecting ? seen.add(en.target) : seen.delete(en.target); });
        nearEnd = seen.size > 0;
        update();
      }, { rootMargin: '0px 0px -10% 0px' });
      ends.forEach(el => io.observe(el));
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Boot ---------- */

  const renderers = {
    home: renderHome, 'over-ons': renderAbout, product: renderProduct,
    zakelijk: renderB2b, contact: renderContact, privacy: renderPrivacy,
    sample: renderSample, kennis: renderKnowledge, voorwaarden: renderTerms
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
  initEnhancements();
  init3d();
  initMobileCta();
  initLuxe();
  initLightbox();
  initFieldChecks();
  initAnchorFlash();
  initStackGallery();
  initTopbarRotate();
  initNewsletter();
  initSaveShare();
  initOriginMap();
})();
