/* ============================================================
   AJAR — taalkeuze (NL / EN / FR).
   content.js = Nederlandse basis. content.en.js en content.fr.js
   overschrijven de teksten; ontbrekende sleutels vallen terug op NL.
   Client-side switch: de keuze staat in localStorage, de pagina herlaadt.
   (Aparte URL's per taal + hreflang is een grotere ingreep — zie README.md.)
   Laadvolgorde in de HTML: content.js → content.en.js → content.fr.js → i18n.js → main.js
   ============================================================ */
(function () {
  'use strict';

  var LANGS = [
    { code: 'nl', label: 'Nederlands', short: 'NL' },
    { code: 'en', label: 'English',    short: 'EN' },
    { code: 'fr', label: 'Français',   short: 'FR' }
  ];
  var STORE = 'ajarLang';
  var base = window.AJAR_CONTENT_NL || window.AJAR_CONTENT || {};

  function has(code) { return LANGS.some(function (l) { return l.code === code; }); }

  /* NL-first bedrijf: standaard altijd Nederlands. Alleen een expliciete keuze van de
     bezoeker (globe-schakelaar → localStorage) wisselt naar EN/FR. Geen auto-detectie op
     browsertaal, zodat een NL-klant met een Engelse browser niet ineens op Engels landt. */
  function pick() {
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    return (saved && has(saved)) ? saved : 'nl';
  }

  /* Deep-merge: objecten recursief; arrays worden VOLLEDIG vervangen door de override
     (een vertaalde lijst levert altijd de complete array); primitieven → override wint;
     ontbreekt een sleutel in de override, dan blijft de NL-waarde staan. */
  function merge(baseVal, over) {
    if (over === undefined) return baseVal;
    if (Array.isArray(over)) return over;
    if (over && typeof over === 'object' && baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      var out = {}, k;
      for (k in baseVal) if (Object.prototype.hasOwnProperty.call(baseVal, k)) out[k] = baseVal[k];
      for (k in over) if (Object.prototype.hasOwnProperty.call(over, k)) out[k] = merge(baseVal[k], over[k]);
      return out;
    }
    return over;
  }

  var lang = pick();
  var overrides = { en: window.AJAR_CONTENT_EN, fr: window.AJAR_CONTENT_FR };
  var data = (lang !== 'nl' && overrides[lang]) ? merge(base, overrides[lang]) : base;

  window.AJAR_CONTENT = data;
  window.AJAR_LANG = lang;
  window.AJAR_LANGS = LANGS;
  window.AJAR_SET_LANG = function (code) {
    if (!has(code)) return;
    try { localStorage.setItem(STORE, code); } catch (e) {}
    location.reload();
  };

  try { document.documentElement.lang = lang; } catch (e) {}
})();
