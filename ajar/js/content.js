/* ============================================================
   AJAR — alle content & configuratie op één plek.
   Teksten, contactgegevens en instellingen pas je HIER aan;
   de pagina's (main.js) lezen alles uit dit bestand.
   ============================================================ */

window.AJAR_CONTENT = {

  /* ---------- Configuratie ---------- */
  config: {
    brandName: 'AJAR',                       // werkbedrijfsnaam — kan later wijzigen, alléén hier
    legalProducer: 'ConservAjar SARL',
    tagline: 'Extra vierge olijfolie',
    payoff: 'Extra vierge olijfolie, rechtstreeks uit Marokko.',

    gaId: '',                                 // TODO: GA4 measurement ID (bijv. 'G-XXXXXXXXXX') — leeg = GA uit, banner verborgen
    formspreeId: 'mbdvnykk',                  // Formspree form-ID — formulieren versturen nu direct i.p.v. mailto/WhatsApp-fallback
    email: 'sofyanghaddari@gmail.com',        // zakelijk e-mailadres (voorlopig); formulieren mailen hierheen + zichtbaar in footer/contact
    whatsappNumber: '31640293567',            // internationaal formaat zonder + of spaties
    kvk: '77755170',                          // KvK-nummer
    btw: 'NL003042226B35',                    // btw-identificatienummer
    domain: 'https://sofyanghaddari.github.io/dashboard/ajar/',  // later: custom domain (zie README.md)

    showPartners: false,                      // true zodra er echte verkooppunten/logo's zijn ("Verkrijgbaar bij")
    presentationPdf: 'assets/ajar-presentatie.pdf', // bedrijfspresentatie (gegenereerd uit deze content — zie README.md)
    specsheetPdf: 'assets/ajar-specsheet.pdf' // vrij downloadbaar spec-sheet (gegenereerd uit deze content, zie README.md)
  },

  /* ---------- Importeur (verplicht conform EU-regelgeving) ----------
     Persoonsnaam bewust weggelaten — alleen merk + adres (wettelijk minimum). */
  importer: {
    label: 'Importeur',
    name: 'AJAR',
    address: 'Jephtastraat 28H',
    postalCity: '1055 JV Amsterdam',
    country: 'Nederland'
  },

  /* ---------- Producent ---------- */
  producer: {
    label: 'Producent',
    name: 'ConservAjar SARL',
    city: 'Taourirt',
    country: 'Marokko',
    note: "Familiebedrijf, opgericht begin jaren '90."
  },

  /* ---------- Navigatie ----------
     `children` = uitklap-submenu onder een menu-item. Elke sub-link springt naar een
     sectie op de bijbehorende pagina (het `#id` moet overeenkomen met de `id=""` die
     main.js op die sectie zet — zie de renderfuncties). Zo kan een zakelijke klant
     meteen naar het juiste onderwerp klikken i.p.v. de hele pagina door te lezen.
     LET OP bij wijzigen: pas je een anchor hier aan, pas dan óók de sectie-id in main.js aan. */
  nav: [
    { id: 'home',     label: 'Home',              href: 'index.html' },
    { id: 'over-ons', label: 'Over ons',          href: 'over-ons.html', children: [
      { label: 'Ons verhaal',          href: 'over-ons.html#verhaal' },
      { label: 'Kwaliteit & ISO',      href: 'over-ons.html#kwaliteit-iso' },
      { label: 'Onze familie',         href: 'over-ons.html#familie' },
      { label: 'Importeur in Nederland', href: 'over-ons.html#importeur' },
      { label: 'Tijdlijn',             href: 'over-ons.html#tijdlijn' }
    ] },
    { id: 'product',  label: 'Product',           href: 'product.html', children: [
      { label: 'Specificaties',        href: 'product.html#specs' },
      { label: 'De olijf',             href: 'product.html#de-olijf' },
      { label: 'Kwaliteit & cijfers',  href: 'product.html#kwaliteit' },
      { label: 'Van boom tot fles',    href: 'product.html#proces' },
      { label: 'Certificering',        href: 'product.html#certificering' },
      { label: 'Herkomst',             href: 'product.html#herkomst' }
    ] },
    { id: 'kennis',   label: 'Kennis',            href: 'kennis.html' },
    { id: 'zakelijk', label: 'Zakelijke klanten', href: 'zakelijk.html', children: [
      { label: 'Voor wie',             href: 'zakelijk.html#voor-wie' },
      { label: 'Hoe het werkt',        href: 'zakelijk.html#hoe-het-werkt' },
      { label: 'Aanbod & prijs',       href: 'zakelijk.html#aanbod' },
      { label: 'Zo bestelt u',         href: 'zakelijk.html#bestellen' },
      { label: 'Inkoopdossier',        href: 'zakelijk.html#dossier' },
      { label: 'Documentatie',         href: 'zakelijk.html#documentatie' },
      { label: 'Veelgestelde vragen',  href: 'zakelijk.html#faq' }
    ] },
    { id: 'contact',  label: 'Contact',           href: 'contact.html' }
  ],
  ctaLabel: 'Offerte aanvragen',
  ctaHref: 'contact.html?aanvraag=offerte',
  sampleCtaLabel: 'Gratis sample aanvragen',
  sampleCtaHref: 'sample.html',

  /* ---------- Topbar (dunne belofte-balk boven de header) ----------
     v6e: rouleert door meerdere korte teksten (elke ~3,8s, zachte fade).
     `items` = bevestigde feiten. `pendingItems` = claims in afwachting van certificering
     ("Fairtrade"/"Duurzaam"/"100% natuurlijk") — staan er op uitdrukkelijk verzoek van Soef
     alvast bij (v6f), omdat de site pas echt gelanceerd/gepromoot wordt als de certificaten
     binnen zijn. LET OP VÓÓR DE LANCERING: zijn de certificaten er dan nog niet, zet dan
     `showPending: false` — één schakelaar en alle onbevestigde claims zijn van de site
     (zonder certificaat zijn het misleidende claims; Fairtrade is een beschermd keurmerk
     en op duurzaamheidsclaims handhaaft de ACM). */
  topbar: {
    items: [
      'Gratis sample — eerst proeven, dan praten',
      'Eigen boomgaarden in Marokko',
      '100% Marokkaanse extra vierge olijfolie',
      'Koudgeperst in de eigen perserij',
      'ISO 22000-gecertificeerd (SGS)'
    ],
    pendingItems: [
      'Fairtrade',
      'Duurzaam',
      '100% natuurlijk'
    ],
    showPending: true,
    href: 'sample.html'
  },

  /* ---------- Sticky mobiele CTA-balk (verschijnt na scrollen, niet op formulier-pagina's) ---------- */
  mobileCta: {
    sample: 'Gratis sample',
    whatsapp: 'WhatsApp'
  },

  /* ---------- Fluister-marquee (trage lopende band, alléén bevestigde feiten) ----------
     Getoond op home (onder de beeldsectie) en op Product (boven het proces). Reduced-motion:
     staat stil. Niet uitbreiden met niet-bevestigde claims (smaak/cijfers/prijzen). */
  marquee: ['Extra vierge', 'Koudgeperst', 'Picholine Marocaine', "Familiebedrijf sinds jaren '90", 'ISO 22000 · SGS', 'Rechtstreeks geïmporteerd'],

  /* ---------- Cookiebanner ---------- */
  cookies: {
    text: 'We gebruiken anonieme bezoekersstatistieken (Google Analytics) om te zien hoe de site wordt gebruikt. U kiest zelf of u dat goed vindt.',
    accept: 'Accepteren',
    decline: 'Weigeren',
    moreLabel: 'Privacyverklaring'
  },

  /* ---------- Home ----------
     Verbeterronde (juli 2026): homepage teruggebracht naar MAX 4 secties — hero, 3 kernpunten,
     1 beeldsectie, slot-CTA. Alle verdieping (familieverhaal, ISO 22000, cultivar, werkwijze, FAQ)
     stond al op de subpagina's (Over ons / Product / Zakelijke klanten) en is daar blijven staan;
     de homepage introduceert alleen en verwijst door. Verwijderd t.o.v. de vorige versie: hero-
     badges, de losse USP-kaartenrij, de Taourirt→Amsterdam route-kaart-animatie, de mood-band en
     de product-splitsectie — stuk voor stuk dekten die al bestaande content op een subpagina in
     net iets andere woorden (bijv. de route-kaart herhaalde exact wat Product's 4-stappen-proces
     al toont). Geen enkel feit is verloren gegaan; alleen de plek waar het staat is opgeschoond. */
  home: {
    hero: {
      title: 'Extra vierge olijfolie, rechtstreeks uit Marokko.',
      sub: 'Koudgeperste olijfolie van een familiebedrijf in Marokko, rechtstreeks naar de Nederlandse horeca en speciaalzaak.',
      image: 'sfeer-09.jpg'
    },
    /* Drie kernpunten, elk max 6 woorden — geen kaarten met uitleg, dat staat al op de subpagina's.
       Kicker "Waarom AJAR" erboven: korte, zelf-evidente feiten (geen zelfprijzing/superlatieven). */
    kernpunten: {
      kicker: 'Waarom AJAR',
      items: [
        "Familiefabriek sinds jaren '90",
        'Koudgeperst, single-origin Marokko',
        'Direct contact met de importeur'
      ]
    },
    /* Verkooppuntenwall — verborgen zolang config.showPartners = false. Alleen échte afnemers tonen. */
    partners: {
      kicker: 'Verkrijgbaar bij',
      items: [
        /* { name: 'Naam zaak', logo: 'partner-01.png' } */
      ]
    },
    /* De ene beeldsectie: fabriek/bomen + één zin + link naar Over ons. Foto volgt zodra
       fabriek-taourirt.jpg is aangeleverd (zie ook about.blocks[0], zelfde foto/verhaal). */
    intro: {
      kicker: 'Het verhaal',
      text: "Een familiebedrijf in noordoost-Marokko perst deze olie al sinds de jaren '90 — drie generaties op dezelfde grond.",
      linkLabel: 'Lees ons verhaal',
      linkHref: 'over-ons.html',
      image: 'fabriek-taourirt.jpg'
    },
    /* Slot-CTA — andere formulering dan de hero, zelfde doel (sample aanvragen). */
    cta: {
      title: 'Eerst proeven, dan beslissen',
      text: 'Vraag een gratis proefflesje aan voor uw zaak — zonder verplichtingen.',
      button: 'Gratis sample aanvragen',
      buttonHref: 'sample.html'
    }
  },

  /* ---------- Over ons ---------- */
  about: {
    hero: {
      kicker: 'Over ons',
      title: 'Een familiebedrijf uit noordoost-Marokko',
      sub: "Sinds begin jaren '90 — eerlijk, vakkundig en zonder omwegen."
    },
    blocks: [
      {
        anchor: 'verhaal',
        title: 'Een familiebedrijf met diepe wortels',
        /* v3 (verbeterronde): getrimd naar 2 zinnen (leesbaarheid) + 1 nieuwe zin over het bredere
           assortiment van de fabriek, als bewijs van schaal/ervaring — bewust geen productgrid of
           opsomming als aanbod, alleen olijfolie wordt in Nederland verkocht.
           v4: fabriek-taourirt.jpg is nu een ECHTE ajar.ma-foto (productielijn, medewerkers sorteren
           olijven) — geen placeholder meer, aangeleverd door Soef.
           v6: titel herschreven (was 'Van MOUSTAINE naar AJAR' — onbegrijpelijk zonder voorkennis).
           v6b: BELANGRIJK — "MOUSTAINE" is géén (voormalige) bedrijfs-/merknaam, het is de
           achternaam van Soefs opa (persoonsnaam). Eerdere sessies namen ten onrechte aan dat het
           een oude handelsnaam was en zetten 'm meermaals op de site — dat is in deze ronde overal
           verwijderd, conform de eigen harde regel #2 (geen persoonsnamen). NIET opnieuw invoeren. */
        text: "ConservAjar SARL werd begin jaren '90 opgericht in het noordoosten van Marokko — een familiebedrijf waar de kennis van het persen en verwerken van olijven al drie generaties wordt doorgegeven. Naast olijfolie conserveert het bedrijf ook tafelolijven, abrikozenpulp en specerijen onder het eigen merk AJAR, in binnen- en buitenland.",
        image: 'fabriek-taourirt.jpg'
      },
      {
        anchor: 'kwaliteit-iso',
        title: 'Kwaliteit die je kunt controleren',
        text: 'De productie is gecertificeerd volgens ISO 22000, uitgegeven door SGS — een internationale norm voor voedselveiligheidsmanagement. Voor u als inkoper betekent dat: gedocumenteerde processen, traceerbaarheid per partij en een producent die audits gewend is.',
        image: ''
      },
      {
        anchor: 'importeur',
        title: 'De eerste officiële importeur in Nederland',
        text: 'AJAR was tot nu toe niet officieel verkrijgbaar in Nederland. Als familie van de oprichters brengen wij de olie nu rechtstreeks naar de Nederlandse markt — met de importeursvermelding, documentatie en korte lijnen die daarbij horen. Geen tussenhandel, wél één aanspreekpunt in Amsterdam.',
        /* overons-08.jpg (echte AJAR-foto) verhuisd hierheen — blocks[0] gebruikt de nieuwe
           productielijn-foto (fabriek-taourirt.jpg) als sterker bewijsstuk. */
        image: 'overons-08.jpg'
      }
    ],
    /* "Onze familie" — persoonlijk verhaal, ná het vertrouwensblok (ISO 22000) en vóór "De eerste
       officiële importeur" (vertrouwen eerst, emotie als verdieping — masterprompt-volgorde).
       v6: fors ingekort (Soef: "niemand heeft daar tijd voor") — van 6 uitgebreide blokken + een
       zelfprijzend citaat naar 2 korte alinea's. Quote verwijderd (te veel zelfprijzing). "Opa"/
       "kleinzoon" mag nu expliciet gebruikt worden i.p.v. de omslachtige "de oprichter"/"zijn oudste
       kleinzoon". Nog steeds: géén namen, géén jaartallen die niet vaststaan, géén ziektenaam/
       oorzaak-gevolg-claim. */
    familyStory: {
      kicker: 'Onze familie',
      title: 'Het verhaal achter de olie',
      blocks: [
        {
          title: 'Een nieuw begin',
          text: 'Onze opa vertrok als jongvolwassene naar Nederland om te werken — uit noodzaak, niet uit avontuur. Na een paar jaar keerde hij terug naar Marokko en begon een klein winkeltje in olijven.'
        },
        {
          title: 'Van winkeltje tot AJAR',
          text: 'Wat klein begon, groeide uit tot ConservAjar, geleid door zijn vijf zonen. Zijn gezondheid liet het uiteindelijk niet meer toe zelf door te gaan — zijn kleinzoon brengt de olie nu naar Nederland.'
        }
      ]
    },
    /* Bewijs van schaal: 7 echte ajar.ma-foto's van het bredere assortiment (magazijn, tafelolijven,
       conserven) — bewust GEEN productgrid met namen/prijzen/aanbod-taal, alleen een korte kicker
       + stille foto's. Zelfde principe als de ene assortiment-zin hierboven: laat zien dat de fabriek
       op schaal werkt, zonder het als verkoopaanbod te presenteren (dat blijft olijfolie-only). */
    factoryGallery: {
      kicker: 'Ook bij ConservAjar SARL',
      text: 'Dezelfde fabriek verwerkt en verpakt op schaal — hier voor het bredere assortiment onder het merk AJAR.',
      images: [
        { file: 'ajar-magazijn-pallets.jpg', alt: 'Magazijn met verpakte AJAR-producten op pallets' },
        { file: 'ajar-tafelolijven-emmers.jpg', alt: 'Tafelolijven, verpakt bij ConservAjar SARL' },
        { file: 'ajar-magazijn-conserven.jpg', alt: 'Verpakte conserven, klaar voor verzending' },
        { file: 'ajar-olijven-verpakt.jpg', alt: 'Verpakte olijven met het AJAR-etiket' },
        { file: 'ajar-voorraad-blikken.jpg', alt: 'Torens pallets met AJAR-blikken onder het laadperron, met heftruck' },
        { file: 'ajar-olijven-voorraad.jpg', alt: 'Emmers tafelolijven, hoog opgestapeld in het magazijn' },
        { file: 'ajar-magazijn-tractor.jpg', alt: 'Buitenmagazijn met pallets vol conserven en een tractor' }
      ]
    },
    /* Familie-tijdlijn — namen/jaartallen van de generaties volgen na overleg met de familie (augustus). */
    timeline: {
      kicker: 'De tijdlijn',
      title: 'Drie generaties in jaartallen',
      items: [
        { year: "Begin jaren '90", title: 'Oprichting van het familiebedrijf', text: 'Het familiebedrijf begint met het persen van olijven uit de eigen boomgaarden.', todo: false },
        { year: 'Jaartal volgt', title: 'Formeel geregistreerd als ConservAjar SARL', text: 'Het bedrijf groeit en wordt formeel geregistreerd onder de naam ConservAjar SARL, met het eigen merk AJAR.', todo: true },
        { year: 'Jaartal volgt', title: 'ISO 22000-certificering (SGS)', text: 'De productie wordt gecertificeerd volgens ISO 22000 — voedselveiligheid en traceerbaarheid, extern getoetst door SGS.', todo: true },
        { year: '2026', title: 'Eerste officiële import in Nederland', text: 'AJAR komt vanuit Amsterdam voor het eerst officieel op de Nederlandse markt.', todo: false }
      ],
      note: 'Namen en jaartallen van de generaties worden aangevuld na overleg met de familie.'
    }
  },

  /* ---------- Product ---------- */
  product: {
    hero: {
      kicker: 'Het product',
      title: 'Extra vierge olijfolie',
      sub: 'Koud geperst, gebotteld aan de bron, rechtstreeks geïmporteerd.'
    },
    specs: {
      title: 'AJAR Extra Vierge',
      image: 'product-03.jpg',
      /* Alléén bevestigde feiten hier — "volgt"-items staan voortaan uitsluitend in
         product.quality.note, op één plek i.p.v. verspreid over specs/cultivar/quality
         (feedback 4 juli 2026: dezelfde "komt nog"-boodschap drie keer verwarde meer dan het geruststelde). */
      rows: [
        { label: 'Categorie', value: 'Extra vierge olijfolie (eerste persing)' },
        { label: 'Inhoud', value: '500 ml' },
        { label: 'Herkomst olijven', value: 'Debdou-regio, noordoost-Marokko — eigen boomgaarden' },
        { label: 'Persing & botteling', value: 'Koud geperst, eigen fabriek in Taourirt (ConservAjar SARL)' },
        { label: 'Olijfvariëteit', value: 'Picholine Marocaine' }
      ]
    },
    /* De olijf: Picholine Marocaine — cultivar bevestigd door Soef (4 juli 2026).
       image = AI-opgeschaalde stockfoto (geverse Picholine-achtige olijven), geen AJAR-oogst —
       vervang zodra een echte foto van de eigen boomgaarden in Debdou beschikbaar is. */
    cultivar: {
      kicker: 'De olijf',
      title: 'Picholine Marocaine',
      image: 'stock-cultivar-olives.jpg',
      text: 'AJAR wordt geperst van één olijfvariëteit: de Picholine Marocaine, de meest aangeplante olijf van Marokko. Geen blend van wisselende rassen en herkomsten — één olijf, van eigen grond.',
      points: [
        { title: 'Thuis in het oosten', text: 'De variëteit gedijt in het droge klimaat van oost-Marokko — precies de streek rond Debdou waar de boomgaarden staan.' },
        { title: 'Eén ras, geen blend', text: 'Waar veel olijfolie een mengsel is van rassen en landen van herkomst, komt AJAR van één cultivar en één producent.' }
      ]
    },
    /* Meetbare kwaliteitscijfers — lab-analyse wordt in Marokko geregeld (actie Soef).
       Dit is nu de ENIGE plek op de productpagina die "volgt" meldt — smaakprofiel + labcijfers samen. */
    quality: {
      kicker: 'De cijfers',
      title: 'Meetbare kwaliteit',
      note: 'Proefnotities en lab-analyse van de huidige oogst volgen — smaakprofiel en onderstaande cijfers vullen we aan zodra ze binnen zijn.',
      items: [
        { label: 'Zuurgraad', value: 'Volgt', unit: '% vrije vetzuren', todo: true, explain: 'Hoe lager, hoe verser en zuiverder de olie. Extra vierge zit per definitie onder 0,8%.' },
        { label: 'Polyfenolen', value: 'Volgt', unit: 'mg/kg', todo: true, explain: 'Natuurlijke antioxidanten uit de olijf. Hoger betekent een vollere, pittigere smaak en langere houdbaarheid.' },
        { label: 'Oogstjaar', value: 'Volgt', unit: '', todo: true, explain: 'Verse oogst, geen jarenlange opslag — u weet precies uit welk seizoen uw olie komt.' }
      ]
    },
    why: {
      kicker: 'Waarom deze olie',
      title: 'Wat AJAR anders maakt',
      items: [
        { title: 'Koud geperst', text: 'De olijven worden koud geperst, waardoor smaak, geur en natuurlijke inhoudsstoffen behouden blijven.' },
        { title: 'Korte keten', text: 'Eigen productie in Marokko en directe import naar Nederland: geen anonieme bulk, geen blends van onbekende herkomst.' },
        { title: 'Directe import', text: 'Eén importeur, één producent. Vragen over een partij of levering worden direct beantwoord — niet via drie schakels.' }
      ]
    },
    /* Vergelijkingsblok — alléén feitelijke claims. */
    compare: {
      kicker: 'Het verschil',
      title: 'AJAR naast supermarkt-olijfolie',
      colA: 'AJAR',
      colB: 'Gangbare supermarkt-olijfolie',
      rows: [
        { label: 'Herkomst', a: 'Traceerbaar tot één familiebedrijf in Marokko', b: 'Vaak een mengsel van oliën uit de EU en daarbuiten' },
        { label: 'Keten', a: 'Kort: van de eigen pers direct naar uw zaak', b: 'Lange keten met meerdere tussenschakels' },
        { label: 'Persing', a: 'Koud geperst in de eigen perserij', b: 'Wisselend per merk en partij' },
        { label: 'Contact', a: 'Persoonlijk contact met de importeur', b: 'Anoniem schap, geen aanspreekpunt' }
      ]
    },
    process: {
      kicker: 'Van boom tot fles',
      title: 'Vier stappen, één keten',
      steps: [
        { title: 'Oogst', text: 'De olijven worden met de hand geoogst en dezelfde periode verwerkt.', image: 'proces-04.jpg', icon: 'olive' },
        { title: 'Persing', text: 'Koude persing in de eigen perserij — de kern van drie generaties vakkennis.', image: 'proces-05.jpg', icon: 'press' },
        { title: 'Botteling', text: 'De olie wordt aan de bron gebotteld in flessen van 500 ml, onder ISO 22000-condities.', image: 'proces-06.jpg', icon: 'bottle' },
        { title: 'Import naar Nederland', text: 'Rechtstreeks naar Amsterdam, met de vereiste importdocumentatie en importeursvermelding.', image: 'proces-07.jpg', icon: 'truck' }
      ]
    },
    certification: {
      kicker: 'Kwaliteit & certificering',
      title: 'Gedocumenteerd, niet beloofd',
      intro: 'Voor een B2B-inkoper is kwaliteit pas iets waard als die aantoonbaar is. Daarom werken we alleen met gedocumenteerde certificering.',
      items: [
        {
          badge: 'ISO 22000',
          title: 'ISO 22000 — voedselveiligheid',
          text: 'De productie van ConservAjar SARL is gecertificeerd volgens ISO 22000, uitgegeven door SGS. Dat dekt het volledige voedselveiligheidsmanagement: van grondstof tot gebottelde fles, inclusief traceerbaarheid per partij.',
          available: true
        },
        {
          badge: 'EUR.1',
          title: 'EUR.1 & importdocumentatie',
          text: 'De EUR.1-documentatie (preferentiële oorsprong EU–Marokko) en overige importdocumenten worden op dit moment in orde gemaakt en verschijnen hier zodra beschikbaar.',
          available: false,
          note: 'Volgt — wordt aangevuld.'
        }
      ]
    },
    /* Herkomst-/traceerkaart — "van déze boomgaard naar uw zaak". Geanimeerde route
       Debdou/Taourirt (MA) → Amsterdam (NL). Abstracte kaart, geen exacte cartografie. */
    origin: {
      kicker: 'Herkomst',
      title: 'Van Debdou naar uw zaak',
      text: 'Eén korte, controleerbare keten: geoogst en koud geperst in de eigen fabriek in Taourirt, gebotteld aan de bron, en rechtstreeks geïmporteerd naar Amsterdam.',
      from: { label: 'Taourirt · Debdou', sub: 'Noordoost-Marokko' },
      to: { label: 'Amsterdam', sub: 'Nederland' },
      steps: [
        { title: 'Oogst & persing', text: 'Debdou-regio — eigen boomgaarden, koud geperst in Taourirt.' },
        { title: 'Botteling', text: 'Aan de bron gebotteld onder ISO 22000-condities.' },
        { title: 'Import', text: 'Rechtstreeks naar Amsterdam, met importdocumentatie.' },
        { title: 'Levering', text: 'Vanuit Amsterdam bij u in de zaak.' }
      ]
    },
    cta: {
      title: 'Zelf proeven?',
      text: 'Vraag een gratis sample aan en beoordeel de olie in uw eigen keuken of zaak.',
      button: 'Gratis sample aanvragen',
      buttonHref: 'sample.html',
      secondary: 'Offerte aanvragen',
      secondaryHref: 'contact.html?aanvraag=offerte'
    }
  },

  /* ---------- Voor zakelijke klanten ---------- */
  b2b: {
    hero: {
      kicker: 'Voor zakelijke klanten',
      title: 'Rechtstreeks inkopen bij de bron',
      sub: 'AJAR levert uitsluitend B2B — aan zaken die weten wat goede olie voor hun keuken of schap betekent. Eerst proeven, dan praten.'
    },
    audiences: {
      kicker: 'Voor wie',
      title: 'Wie we beleveren',
      items: [
        { title: 'Horeca', text: 'Restaurants en cateraars die een herkenbare, constante olie op tafel en in de keuken willen — met een verhaal dat het menu versterkt.' },
        { title: 'Delicatessenzaken', text: 'Speciaalzaken die hun klanten een olie met echte herkomst willen bieden, van één producent, met het gezicht van de maker erbij.' },
        { title: 'Kleinere retailers', text: 'Zelfstandige winkels en foodconcepten die zich willen onderscheiden van het standaard schap.' }
      ]
    },
    how: {
      kicker: 'Hoe het werkt',
      title: 'Van kennismaking tot levering',
      steps: [
        { title: 'Sample', text: 'U vraagt een gratis sample aan; wij zorgen dat u de olie zelf kunt proeven en beoordelen.' },
        { title: 'Gesprek', text: 'We bespreken uw volume, frequentie en toepassing — aan tafel of via WhatsApp, wat u het beste uitkomt.' },
        { title: 'Offerte', text: 'U ontvangt een offerte op maat. Prijzen zijn volume-afhankelijk en altijd op aanvraag.' }
      ]
    },
    /* v2c (4 juli 2026) — pagina ontdubbeld op verzoek van user: was 13 secties, waarvan 6 bijna-
       identieke kaartenrijen na elkaar. "In de keuken én op tafel" (dualUse) is geschrapt: de
       Horeca-kaart in b2b.audiences dekt "op tafel en in de keuken" al. Formaten+Prijs samengevoegd
       tot één "Wat u krijgt & wat het kost"-sectie. Proeverij+Sell-through-hulp+Relatiegeschenk
       samengevoegd tot één "Voor de winkel"-sectie (support.items) — "Proefmoment voor uw klanten"
       verwijderd omdat het exact hetzelfde was als de proeverij-tegel. 13 secties → 9. */
    formats: {
      kicker: 'De lijn',
      title: 'Wat u krijgt & wat het kost',
      items: [
        { size: 'Proefflesje', name: 'De sample', text: 'Gratis kennismaking: genoeg om te proeven, te vergelijken en te beslissen.', shape: 'small', todo: true, todoNote: 'formaat volgt' },
        { size: '500 ml', name: 'De fles', text: 'Het hart van de lijn — voor keuken en tafel, gebotteld aan de bron.', shape: 'bottle' },
        { size: '12 × 500 ml', name: 'De doos', text: 'De B2B-eenheid waarin we leveren en rekenen.', shape: 'box', todo: true, todoNote: 'definitieve doosinhoud volgt' }
      ],
      /* Concept-mockup van de fles met ons logo — GEEN productfoto (fles/etiket bestaan nog niet).
         Bewust duidelijk gelabeld als ontwerprichting, i.p.v. verzwegen als "gewoon een foto".
         Zie ook harde regel #1 in PROJECT.md: nooit iets tonen dat als feit kan worden aangezien. */
      mockup: {
        badge: 'Concept',
        caption: 'Ontwerprichting — geen productfoto. De definitieve fles en het etiket volgen zodra de verpakking klaar is.'
      }
    },
    pricing: {
      title: 'Prijs op aanvraag',
      text: 'We publiceren bewust geen prijslijst: B2B-prijzen hangen af van volume, frequentie en afspraken over levering. In één kort gesprek weet u waar u aan toe bent.',
      fair: 'Eén uitgangspunt staat vast: eerlijke prijzen voor iedereen in de keten — de familie achter de olie, u als ondernemer, en uw klant.',
      /* B2B rekent in dozen, niet in flessen. Definitieve doosinhoud volgt. */
      packaging: 'Levering per doos à 12 × 500 ml (definitieve doosinhoud volgt).',
      packagingTodo: true
    },
    /* Eerlijke geruststelling — draait "nieuw/onbewezen" om naar een voordeel. Geen verzonnen cijfers. */
    assurance: {
      kicker: 'Waarom nu instappen',
      title: 'Vroeg erbij, met persoonlijke aandacht',
      items: [
        { title: 'Direct contact, geen callcenter', text: 'U heeft één vast aanspreekpunt — de importeur zelf. Vragen over een partij of levering worden meteen beantwoord.' },
        { title: 'Leverafspraken vooraf', text: 'Volume en frequentie spreken we van tevoren met u af, zodat u verzekerd bent van uw levering — geen verrassingen.' },
        { title: 'Meegroeien vanaf het begin', text: 'Als een van de eerste afnemers krijgt u persoonlijke aandacht en denken we mee over wat het beste bij uw zaak past.' }
      ]
    },
    /* Voor de winkel: sell-through-hulp + proeverij + relatiegeschenk in één sectie
       (was 3 losse secties/kaarten — proeverij en gift houden hun eigen knop). */
    support: {
      kicker: 'Voor de winkel',
      title: 'We helpen uw verkoop — en meer',
      items: [
        { title: 'Schapkaart met het verhaal', text: 'Een kaart bij het schap met de familie, de boomgaard en de herkomst — een verhaal verkoopt, zeker naast anonieme flessen.' },
        { title: 'Proeverij in uw zaak', text: 'Geen vertegenwoordiger met een koffer folders — de importeur zelf komt langs, schenkt de olie en vertelt het verhaal. Voor uw team, of als proefmoment voor uw klanten. Kost u niets dan een half uur.', button: 'Plan een proeverij', buttonHref: 'contact.html?aanvraag=proeverij', ga: 'proeverij_cta_click' },
        { title: 'Bijbestellen via één appje', text: 'Geen bestelportaal, geen minimumdrempels vol kleine letters — één WhatsApp-bericht en de volgende doos komt eraan.' },
        { title: 'AJAR als relatiegeschenk', text: 'Een fles met een echt verhaal, voor eindejaarspakketten, jubilea of een bedankje aan vaste relaties. We denken graag mee over aantallen en presentatie.', button: 'Vraag naar de mogelijkheden', buttonHref: 'contact.html?aanvraag=relatiegeschenk', ga: 'gift_cta_click' }
      ]
    },
    /* Zo bestelt u — concrete voorwaarden op een rij (levertijd, minimale afname,
       betaling), zodat een inkoper niet door de FAQ hoeft te spitten. */
    ordering: {
      kicker: 'Zo bestelt u',
      title: 'Van bestelling tot levering',
      rows: [
        { label: 'Minimale afname', value: 'Vanaf één doos — ideaal om mee te starten', todo: false },
        { label: 'Bestellen', value: 'Per e-mail of één WhatsApp-bericht; geen bestelportaal', todo: false },
        { label: 'Levertijd', value: 'Concrete leverdatum bij bestelling afgesproken', todo: false },
        { label: 'Levering', value: 'Per doos à 12 × 500 ml (definitieve doosinhoud volgt)', todo: true },
        { label: 'Betaling', value: 'Op factuur; voorwaarden vooraf afgesproken, altijd op de offerte', todo: false },
        { label: 'Prijs', value: 'Op aanvraag — volume-afhankelijk, in één kort gesprek helder', todo: false }
      ],
      note: 'Vragen over een specifiek volume of leverritme? Zet het bij uw aanvraag, dan stemmen we het meteen op u af.'
    },
    /* Inkoopdossier — checklist met documenten/certificaten en hun status. Toont wat er is
       (ISO 22000) en wat volgt (EUR.1, allergenen/HACCP-blad). "available:false" = nog niet
       beschikbaar → nette "op aanvraag"-status i.p.v. een verzonnen document. */
    dossier: {
      kicker: 'Voor uw inkoopdossier',
      title: 'Documenten & certificaten',
      intro: 'Alles wat uw inkoop of HACCP-dossier nodig heeft, op één plek. Wat nu beschikbaar is, kunt u direct opvragen; de rest wordt aangevuld zodra het binnen is.',
      items: [
        { label: 'ISO 22000-certificaat (SGS)', note: 'Voedselveiligheidsmanagement, extern getoetst', available: true },
        { label: 'Product spec-sheet (PDF)', note: 'Alle technische productinformatie op één A4', available: true },
        { label: 'EUR.1 / oorsprongsdocument', note: 'Preferentiële oorsprong EU–Marokko', available: false },
        { label: 'Allergenen- & HACCP-blad', note: 'Wordt aangevuld', available: false },
        { label: 'Houdbaarheid & THT per partij', note: 'Volgt per partij op de fles', available: false }
      ],
      requestLabel: 'Certificaat opvragen',
      requestPrefill: 'Hallo, kunt u mij het ISO 22000-certificaat en het spec-sheet van AJAR toesturen voor mijn inkoopdossier?',
      availableTag: 'Beschikbaar',
      pendingTag: 'Op aanvraag / volgt'
    },
    /* Spec-sheet (vrij downloadbaar) + bedrijfspresentatie (achter mini-formulier). */
    downloads: {
      kicker: 'Voor uw inkoopdossier',
      title: 'Documentatie',
      specsheet: {
        title: 'Product spec-sheet (PDF)',
        text: 'Eén A4 met alle technische productinformatie — product, herkomst, producent, certificering en importeur. Direct door te sturen naar uw inkoop of keuken.',
        button: 'Download spec-sheet'
      },
      presentation: {
        title: 'AJAR bedrijfspresentatie',
        /* v7: tekst gecorrigeerd — de PDF bestaat al (presentationPdf is gevuld), dus geen
           "zodra beschikbaar"-belofte meer; na het formulier verschijnt direct de downloadlink. */
        text: 'Uitgebreidere presentatie over het bedrijf, de familie en de olie. Laat uw gegevens achter en download de presentatie direct.',
        nameLabel: 'Naam',
        emailLabel: 'E-mailadres',
        companyLabel: 'Bedrijfsnaam',
        phoneLabel: 'Telefoonnummer',
        button: 'Presentatie aanvragen',
        success: 'Bedankt — u ontvangt de presentatie zodra die klaar is.',
        successDownload: 'Bedankt! U kunt de presentatie nu downloaden:',
        downloadLabel: 'Download presentatie'
      }
    },
    faq: {
      kicker: 'Veelgestelde vragen',
      title: 'B2B in het kort',
      items: [
        { q: 'Wat is de minimale afname?', a: 'We werken met kleine én grote afnames — van een enkele doos om mee te starten tot een vast maandvolume. Vertel bij uw aanvraag wat u ongeveer zoekt, dan stemmen we het meteen op u af.' },
        { q: 'Wat is de levertijd?', a: 'We houden de lijnen kort en spreken bij uw bestelling een concrete leverdatum met u af. Vraag bij uw aanvraag naar de actuele levertijd voor uw volume.' },
        { q: 'Hoe werkt een sample aanvragen?', a: 'U vraagt via het formulier of WhatsApp een gratis sample aan. U proeft de olie rustig in uw eigen keuken of zaak, daarna bespreken we volume en prijs. Geen verplichtingen.' },
        { q: 'Wat zijn de betaalvoorwaarden?', a: 'De betaalvoorwaarden spreken we vooraf met u af; ze staan altijd duidelijk op de offerte — geen verrassingen achteraf.' },
        { q: 'Hoe bewaar ik de olie en hoe lang is die houdbaar?', a: 'Koel, donker en goed afgesloten bewaren — zo behoudt extra vierge olijfolie zijn smaak het langst. De houdbaarheidsdatum staat op elke fles.' },
        { q: 'Wie is de importeur en waarom maakt dat uit?', a: 'AJAR is de officiële importeur in Nederland (gevestigd in Amsterdam) en staat als zodanig op de fles. Voor u betekent dat: één aanspreekpunt in Nederland, duidelijke aansprakelijkheid en traceerbaarheid per partij — precies wat uw HACCP-dossier vraagt.' }
      ]
    },
    cta: {
      title: 'Klaar om te proeven?',
      text: 'Vraag vandaag een gratis sample aan — of direct een offerte.',
      button: 'Gratis sample aanvragen',
      buttonHref: 'sample.html',
      secondary: 'Offerte aanvragen',
      secondaryHref: 'contact.html?aanvraag=offerte'
    }
  },

  /* ---------- Gratis sample (landingspagina — doel van QR-codes) ---------- */
  sample: {
    hero: {
      kicker: 'Gratis sample',
      title: 'Proef AJAR eerst — dan praten we verder',
      sub: 'Vraag een gratis proefflesje aan voor uw zaak. U proeft rustig, vergelijkt met wat u nu gebruikt, en beslist daarna. Geen verplichtingen.',
      /* AI-opgeschaalde stockfoto (brood + olie), sfeerbeeld bij "proeven" — geen AJAR-fles. */
      image: 'stock-sample-tasting.jpg'
    },
    how: {
      kicker: 'Zo werkt het',
      steps: [
        { title: 'Aanvragen', text: 'Vul hieronder uw gegevens in — klaar in één minuut.' },
        { title: 'Proeven', text: 'U ontvangt een proefflesje en proeft op uw eigen tempo, in uw eigen keuken.' },
        { title: 'Beslissen', text: 'Bevalt de olie? Dan bespreken we volume en prijs. Zo niet, dan blijft het bij een goed proefmoment.' }
      ]
    },
    usps: [
      { title: 'Echt gratis', text: 'Geen kleine letters — het proefflesje kost u niets.' },
      { title: 'Persoonlijk', text: 'U krijgt de olie van de importeur zelf, niet van een verkoopafdeling.' },
      { title: 'Traceerbaar', text: 'Eén familiebedrijf in Marokko, ISO 22000-gecertificeerd.' }
    ],
    form: {
      title: 'Vraag uw proefflesje aan',
      companyLabel: 'Bedrijfsnaam',
      nameLabel: 'Contactpersoon',
      emailLabel: 'E-mailadres',
      phoneLabel: 'Telefoonnummer',
      addressLabel: 'Bezorgadres (straat + nr, postcode, plaats)',
      messageLabel: 'Opmerking (optioneel)',
      /* "Deel de liefde"-draai, B2B: tip een collega-ondernemer */
      tipLabel: 'Tip een collega-ondernemer (optioneel)',
      tipPlaceholder: 'Naam zaak + plaats — dan verrassen we hen ook met een proefflesje',
      submit: 'Gratis sample aanvragen',
      success: 'Aanvraag ontvangen — het proefflesje komt eraan. Tot snel!',
      emailSubject: 'Sample-aanvraag AJAR'
    }
  },

  /* ---------- Contact ---------- */
  contact: {
    hero: {
      kicker: 'Contact',
      title: 'Vraag een sample of offerte aan',
      sub: 'Vertel kort wie u bent en wat u zoekt — u hoort snel van ons.'
    },
    form: {
      nameLabel: 'Naam',
      companyLabel: 'Bedrijfsnaam',
      emailLabel: 'E-mailadres',
      phoneLabel: 'Telefoonnummer',
      /* Type zaak — helpt de aanvraag meteen te kwalificeren (feature: slimmer offerteformulier) */
      typeLabel: 'Type zaak',
      typeOptions: [
        { value: '', label: 'Kies…' },
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'cafe-bar', label: 'Café / bar' },
        { value: 'cateraar', label: 'Cateraar' },
        { value: 'delicatessen', label: 'Delicatessenzaak' },
        { value: 'speciaalzaak', label: 'Speciaal-/verszaak' },
        { value: 'retail', label: 'Retail / winkel' },
        { value: 'anders', label: 'Anders' }
      ],
      volumeLabel: 'Gewenst volume',
      volumeOptions: [
        { value: 'sample', label: 'Gratis sample / proefbestelling' },
        { value: 'maandelijks-vast', label: 'Maandelijks vast volume' },
        { value: 'horeca-bulk', label: 'Horeca bulk' },
        { value: 'relatiegeschenk', label: 'Relatiegeschenk' }
      ],
      /* Gewenste leverfrequentie */
      frequencyLabel: 'Gewenste leverfrequentie',
      frequencyOptions: [
        { value: '', label: 'Kies…' },
        { value: 'eenmalig', label: 'Eenmalig / uitproberen' },
        { value: 'wekelijks', label: 'Wekelijks' },
        { value: 'maandelijks', label: 'Maandelijks' },
        { value: 'op-afroep', label: 'Op afroep' }
      ],
      /* Voorkeur voor contactkanaal + gewenst belmoment (feature: belafspraak/terugbeloptie) */
      channelLabel: 'Hoe kunnen we u het best bereiken?',
      channelOptions: [
        { value: 'email', label: 'E-mail' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'bellen', label: 'Bel me terug' }
      ],
      callTimeLabel: 'Schikt een moment? (optioneel)',
      callTimePlaceholder: 'Bijv. doordeweeks na 15:00',
      messageLabel: 'Bericht',
      messagePlaceholder: 'Vertel kort iets over uw zaak en waar u de olie voor wilt gebruiken…',
      submit: 'Verstuur aanvraag',
      submitWhatsApp: 'Verstuur via WhatsApp',
      sending: 'Versturen…',
      success: 'Bedankt voor uw aanvraag — u hoort snel van ons.',
      error: 'Versturen is niet gelukt. Probeer het nog eens, of stuur direct een WhatsApp-bericht.',
      privacyNote: 'Uw gegevens worden alleen gebruikt om uw aanvraag te beantwoorden. Zie de privacyverklaring.',
      emailSubject: 'Aanvraag AJAR olijfolie'
    },
    direct: {
      title: 'Liever direct contact?',
      text: 'Stuur een WhatsApp-bericht — dat is de snelste route.',
      whatsappLabel: 'WhatsApp openen',
      whatsappPrefill: 'Hallo, ik heb interesse in AJAR olijfolie voor mijn zaak.',
      /* v7: nummer óók leesbaar tonen (niet iedere inkoper gebruikt WhatsApp) */
      phoneDisplay: '+31 6 40 29 35 67',
      phoneNote: 'Bellen kan ook:',
      /* WhatsApp per onderwerp — voorgevulde berichten zodat de klant meteen ter zake komt */
      topicsTitle: 'Direct appen over…',
      topics: [
        { label: 'Offerte horeca',   prefill: 'Hallo, ik wil graag een offerte voor AJAR olijfolie voor mijn horecazaak.', ga: 'wa_topic_offerte' },
        { label: 'Gratis sample',    prefill: 'Hallo, ik wil graag een gratis sample van AJAR olijfolie aanvragen voor mijn zaak.', ga: 'wa_topic_sample' },
        { label: 'Proeverij plannen', prefill: 'Hallo, ik wil graag een proeverij van AJAR olijfolie plannen in mijn zaak.', ga: 'wa_topic_proeverij' },
        { label: 'Relatiegeschenk',  prefill: 'Hallo, ik heb interesse in AJAR olijfolie als relatiegeschenk. Kunt u me meer vertellen?', ga: 'wa_topic_gift' }
      ]
    },
    /* Bewaar/deel — vCard (gaat in Contacten op iPhone/Android), Web Share en QR-code.
       (Een echte Apple Wallet-pass vereist Apple-certificaten + ondertekening — niet mogelijk
       op een statische site; de vCard is het praktische equivalent dat overal werkt.) */
    save: {
      title: 'Bewaar onze gegevens',
      text: 'Voeg AJAR toe aan uw contacten of deel de pagina met een collega-inkoper.',
      vcardLabel: 'Bewaar contact',
      shareLabel: 'Deel',
      shareText: 'AJAR — extra vierge olijfolie uit Marokko, rechtstreeks voor de Nederlandse horeca en speciaalzaak.',
      qrLabel: 'Scan om deze pagina te openen'
    }
  },

  /* ---------- Kennis (kennisbank olijfolie) ----------
     v6g: nieuwe pagina. Doel = autoriteit + SEO + koper-vertrouwen, ZONDER productclaims over
     AJAR zelf. Alles hier is algemene, verifieerbare vakkennis over olijfolie (extra vierge,
     zuurgraad, polyfenolen, bewaren, proeven, houdbaarheid, single-origin) — geen cijfers of
     smaakclaims over de eigen olie (die staan/komen op Product). Vraag-vormige titels zodat ze
     ook als FAQPage-JSON-LD kunnen dienen (rich results). Bewust compact gehouden (Soef houdt de
     site graag strak): korte, scanbare antwoorden van 2-4 zinnen. */
  knowledge: {
    hero: {
      kicker: 'Goed om te weten',
      title: 'Olijfolie, in het kort uitgelegd',
      sub: 'Wat maakt een olijfolie goed, en hoe herkent u dat als inkoper? De belangrijkste begrippen op een rij — algemene kennis, geen verkooppraat.'
    },
    intro: 'Extra vierge olijfolie is een natuurproduct met grote verschillen in kwaliteit. Deze begrippen helpen u te beoordelen wat u inkoopt — bij ons of bij een ander.',
    items: [
      { q: 'Wat betekent “extra vierge” precies?', a: 'Extra vierge is de hoogste kwaliteitsklasse: de olie is puur mechanisch uit de olijf gewonnen (geperst, niet met warmte of chemie geraffineerd) en voldoet aan strenge eisen voor geur, smaak en zuurgraad. Er mag geen enkel gebrek in de smaak zitten. Lagere klassen — “vierge”, “raffinaat” of simpelweg “olijfolie” — zijn bewerkt of van mindere kwaliteit.' },
      { q: 'Wat zegt de zuurgraad?', a: 'De zuurgraad meet het percentage vrije vetzuren en is een graadmeter voor versheid en zorgvuldige verwerking. Hoe lager, hoe beter. Extra vierge zit per definitie onder 0,8%; goede oliën zitten daar vaak ruim onder. Een hoge zuurgraad wijst op overrijpe of beschadigde olijven, of op te lang wachten tussen oogst en persing.' },
      { q: 'Wat zijn polyfenolen?', a: 'Polyfenolen zijn natuurlijke antioxidanten uit de olijf. Ze geven een olie de karakteristieke lichte bitterheid en peperige afdronk, dragen bij aan de houdbaarheid en worden in verband gebracht met gezondheidsvoordelen. Meer polyfenolen betekent doorgaans een vollere, robuustere olie.' },
      { q: 'Wat betekent “koud geperst” en “eerste persing”?', a: 'Koud geperst betekent dat de olijven onder een lage temperatuur (onder 27 °C) worden verwerkt, zodat smaak, geur en inhoudsstoffen behouden blijven. “Eerste persing” houdt in dat de olie in één keer uit de vrucht wordt gewonnen, zonder de pulp opnieuw te bewerken. Beide zijn kwaliteitskenmerken die u op een goed etiket terugvindt.' },
      { q: 'Waarom maakt single-origin uit?', a: 'Single-origin betekent dat de olie van één herkomst en bij voorkeur één olijfras komt, in plaats van een mengsel (blend) van oliën uit verschillende landen. Dat maakt de smaak constanter en de herkomst traceerbaar — u weet precies wat u schenkt. Veel supermarktolie is juist een anonieme blend uit wisselende bronnen.' },
      { q: 'Hoe bewaart u olijfolie het best?', a: 'Koel, donker en goed afgesloten. Olijfolie is gevoelig voor licht, warmte en zuurstof: die versnellen de veroudering en tasten de smaak aan. Zet de fles niet naast het fornuis of in de zon, en sluit hem na gebruik goed. Zo behoudt de olie zijn smaak en gezonde stoffen het langst.' },
      { q: 'Hoe lang is olijfolie houdbaar?', a: 'Extra vierge olijfolie is op zijn best in het jaar na de oogst en blijft daarna nog geruime tijd goed, mits juist bewaard. Anders dan wijn wordt olijfolie niet beter met de jaren — vers is beter. Kijk daarom naar het oogstjaar of de houdbaarheidsdatum op de fles, niet alleen naar “ten minste houdbaar tot”.' },
      { q: 'Hoe proeft u olijfolie?', a: 'Professionele proevers letten op drie dingen: fruitigheid (de geur van verse olijven of gras), bitterheid en een peperige afdronk. Die laatste twee zijn geen gebrek maar juist een teken van verse, polyfenolrijke olie. Schenk een klein beetje in een glaasje, warm het met uw hand, ruik, en neem dan een slokje.' }
    ],
    cta: {
      title: 'Zelf proeven zegt het meest',
      text: 'Theorie is mooi, maar smaak beslist. Vraag een gratis sample aan en beoordeel de olie in uw eigen keuken.',
      button: 'Gratis sample aanvragen',
      buttonHref: 'sample.html',
      secondary: 'Bekijk het product',
      secondaryHref: 'product.html'
    }
  },

  /* ---------- Privacyverklaring ----------
     v7 (10 juli 2026): uitgebreid — nieuwsbrief-verwerking, e-mail als contactkanaal,
     hosting (GitHub Pages), lokaal gehoste lettertypen (geen Google-CDN meer),
     dataportabiliteit, cookie-voorkeuren aanpasbaar via de footer-link. */
  privacy: {
    hero: {
      kicker: 'Privacy',
      title: 'Privacyverklaring',
      sub: 'Kort en duidelijk: welke gegevens we verwerken en waarom.'
    },
    updated: 'Laatst bijgewerkt: 10 juli 2026',
    sections: [
      {
        title: 'Wie is verantwoordelijk?',
        body: 'Verwerkingsverantwoordelijke voor deze website is AJAR (importeur van AJAR olijfolie), gevestigd aan de Jephtastraat 28H, 1055 JV Amsterdam, ingeschreven bij de Kamer van Koophandel onder nummer 77755170. Contact kan via e-mail (sofyanghaddari@gmail.com) of WhatsApp (+31 6 40 29 35 67).'
      },
      {
        title: 'Welke gegevens verzamelen we?',
        body: 'Drie soorten. (1) Formuliergegevens: als u een sample, offerte of presentatie aanvraagt, ontvangen we de gegevens die u zelf invult — naam, bedrijfsnaam, e-mailadres, telefoonnummer, bezorgadres en uw bericht. (2) Nieuwsbrief: als u zich inschrijft, bewaren we alleen uw e-mailadres. (3) Bezoekersstatistieken: alléén als u dat accepteert via de cookiemelding, gebruiken we Google Analytics 4 om anoniem te zien hoe de site wordt gebruikt (bezochte pagina’s, herkomst van het bezoek). IP-adressen worden daarbij geanonimiseerd. Weigert u, dan wordt er niets gemeten.'
      },
      {
        title: 'Waarvoor gebruiken we die gegevens?',
        body: 'Formuliergegevens gebruiken we uitsluitend om uw aanvraag te beantwoorden en een eventuele zakelijke relatie op te volgen. Uw nieuwsbrief-adres gebruiken we alleen om u te informeren over AJAR (zoals beschikbaarheid van het product); uitschrijven kan op elk moment door dat te melden via e-mail of WhatsApp. Statistieken gebruiken we om de site te verbeteren en te zien welke kanalen bezoekers opleveren. We verkopen of delen uw gegevens nooit met derden voor marketing.'
      },
      {
        title: 'Hoe lang bewaren we gegevens?',
        body: 'Aanvragen bewaren we zolang dat nodig is voor het contact en maximaal 2 jaar na het laatste contactmoment, tenzij er een klantrelatie ontstaat (dan gelden de wettelijke administratietermijnen, zoals de fiscale bewaarplicht van 7 jaar voor facturen). Nieuwsbrief-adressen bewaren we tot u zich uitschrijft. Analytics-gegevens worden maximaal 14 maanden bewaard.'
      },
      {
        title: 'Wie verwerken er gegevens voor ons?',
        body: 'De formulieren worden technisch verwerkt door Formspree; statistieken door Google (Google Analytics 4, alleen na uw toestemming). Met deze partijen gelden verwerkersvoorwaarden. De website wordt gehost op GitHub Pages (GitHub, Inc.); zoals bij elke webserver kan de hostingpartij daarbij tijdelijk technische loggegevens zoals IP-adressen verwerken. Lettertypen en alle andere onderdelen van de site laden we vanaf onze eigen hosting — daarvoor gaan geen gegevens naar externe partijen. Stuurt u een WhatsApp-bericht, dan gelden de voorwaarden van WhatsApp.'
      },
      {
        title: 'Uw rechten',
        body: 'U heeft recht op inzage, correctie en verwijdering van uw gegevens, recht op overdracht van uw gegevens (dataportabiliteit) en u kunt bezwaar maken tegen verwerking. Stuur daarvoor een bericht via e-mail of WhatsApp — we reageren zo snel mogelijk, uiterlijk binnen een maand. U kunt daarnaast een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).'
      },
      {
        title: 'Cookies',
        body: 'Deze site plaatst alleen cookies voor Google Analytics, en alléén nadat u daarvoor toestemming heeft gegeven via de cookiemelding. Uw keuze wordt lokaal in uw browser opgeslagen. U kunt uw keuze op elk moment aanpassen via de link "Cookie-voorkeuren" onderaan de site, of door de sitegegevens in uw browser te wissen. Zonder toestemming plaatst de site geen enkele cookie.'
      },
      {
        title: 'Beveiliging',
        body: 'De verbinding met deze website is versleuteld (HTTPS). Aanvragen komen alleen terecht bij de importeur zelf — er is geen extern verkoopteam of callcenter dat toegang heeft tot uw gegevens.'
      }
    ]
  },

  /* ---------- Algemene voorwaarden ----------
     v7 (10 juli 2026): nieuwe pagina. B2B verkoop- en leveringsvoorwaarden in gewone taal,
     passend bij de toon van de site. Bewust geen cijfers verzonnen: waar iets per offerte
     wordt afgesproken, staat dat er ook zo in. Bij groei of twijfel: laten toetsen door
     een jurist (staat ook in LANCERING-CHECKLIST.md). */
  terms: {
    hero: {
      kicker: 'Voorwaarden',
      title: 'Algemene voorwaarden',
      sub: 'De afspraken die gelden bij zakelijke bestellingen — in gewone taal.'
    },
    updated: 'Laatst bijgewerkt: 10 juli 2026 · versie 1.0',
    sections: [
      {
        title: '1. Wie is AJAR en waarop zijn deze voorwaarden van toepassing?',
        body: 'AJAR is importeur van extra vierge olijfolie, gevestigd aan de Jephtastraat 28H, 1055 JV Amsterdam, ingeschreven bij de Kamer van Koophandel onder nummer 77755170. Deze voorwaarden gelden voor alle offertes, bestellingen en leveringen van AJAR. We leveren uitsluitend aan zakelijke afnemers (B2B), niet aan consumenten. Afwijkingen van deze voorwaarden gelden alleen als we ze schriftelijk (ook per e-mail of WhatsApp) met u zijn overeengekomen. Eventuele inkoopvoorwaarden van de afnemer zijn niet van toepassing, tenzij we die uitdrukkelijk schriftelijk hebben aanvaard.'
      },
      {
        title: '2. Offertes en prijzen',
        body: 'Al onze offertes zijn vrijblijvend en 30 dagen geldig, tenzij in de offerte anders staat. Prijzen zijn in euro’s en exclusief btw; ze zijn volume-afhankelijk en worden per offerte vastgelegd. Kennelijke vergissingen of verschrijvingen in een offerte binden ons niet — we nemen dan contact met u op voor een correcte versie.'
      },
      {
        title: '3. Hoe komt een bestelling tot stand?',
        body: 'U bestelt door een offerte te accepteren, of door een bestelling door te geven via e-mail of WhatsApp. De overeenkomst komt tot stand zodra AJAR uw bestelling schriftelijk bevestigt. In die bevestiging staan het volume, de prijs, de leverdatum en de betaalafspraken — zo weet u vooraf precies waar u aan toe bent.'
      },
      {
        title: '4. Levering',
        body: 'De leverdatum spreken we bij elke bestelling concreet met u af. Genoemde termijnen zijn indicatief en geen fatale termijn; loopt een levering onverhoopt uit, dan hoort u dat zo snel mogelijk en spreken we een nieuwe datum af. Levering vindt plaats op het door u opgegeven bezorgadres in Nederland of België, tenzij anders overeengekomen. Het risico van de producten gaat op u over op het moment van aflevering.'
      },
      {
        title: '5. Betaling',
        body: 'U ontvangt bij elke levering een factuur. De betaaltermijn staat op de offerte en de factuur; als er niets is afgesproken geldt een termijn van 14 dagen na factuurdatum. Blijft betaling na een herinnering uit, dan mogen we de wettelijke handelsrente en redelijke incassokosten in rekening brengen en verdere leveringen opschorten totdat openstaande facturen zijn voldaan.'
      },
      {
        title: '6. Eigendomsvoorbehoud',
        body: 'Geleverde producten blijven eigendom van AJAR totdat de bijbehorende factuur volledig is betaald. Tot dat moment mag u de producten wel in de normale bedrijfsvoering gebruiken of doorverkopen, maar niet verpanden of als zekerheid geven.'
      },
      {
        title: '7. Kwaliteit, controle en klachten',
        body: 'Controleer de levering bij ontvangst. Zichtbare gebreken (schade, verkeerde aantallen) meldt u binnen 48 uur na levering; andere gebreken zo snel mogelijk na ontdekking. Is er echt iets mis, dan vervangen we de betreffende producten of crediteren we ze — dat bespreken we direct en zonder omwegen, u heeft één aanspreekpunt. Let op: olijfolie is een natuurproduct. Kleur, geur en smaak kunnen per oogst licht verschillen; dat is geen gebrek zolang de olie voldoet aan de norm voor extra vierge. Bewaar de olie koel, donker en goed afgesloten; de houdbaarheidsdatum staat op elke fles.'
      },
      {
        title: '8. Gratis samples',
        body: 'Samples zijn kosteloos en verplichten u tot niets. Aan een sample kunnen geen rechten worden ontleend voor latere leveringen: de sample toont de olie van dat moment, en als natuurproduct kan een volgende partij licht afwijken binnen de extra vierge-norm. Samples zijn beschikbaar zolang de voorraad strekt, één per zaak.'
      },
      {
        title: '9. Aansprakelijkheid',
        body: 'Onze aansprakelijkheid per gebeurtenis is beperkt tot het factuurbedrag van de levering waarop de schade betrekking heeft. We zijn niet aansprakelijk voor indirecte schade, zoals gederfde omzet of gevolgschade. Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van AJAR, of waar de wet een beperking niet toestaat.'
      },
      {
        title: '10. Overmacht',
        body: 'Bij overmacht — omstandigheden buiten onze invloed, zoals misoogst, transportproblemen, in- of uitvoerbeperkingen of storingen bij de producent — mogen we de levering opschorten. Duurt de overmacht langer dan 60 dagen, dan mogen zowel u als wij de bestelling kosteloos annuleren voor het nog niet geleverde deel. Al betaalde bedragen voor niet-geleverde producten betalen we dan terug.'
      },
      {
        title: '11. Toepasselijk recht en geschillen',
        body: 'Op alle overeenkomsten met AJAR is Nederlands recht van toepassing; het Weens Koopverdrag (CISG) is uitgesloten. Komen we er samen niet uit — wat we uiteraard eerst gewoon proberen — dan is de rechtbank Amsterdam bevoegd.'
      },
      {
        title: '12. Wijzigingen',
        body: 'We kunnen deze voorwaarden aanpassen. Voor lopende bestellingen blijft de versie gelden die van kracht was op het moment van uw bestelling. De actuele versie staat altijd op deze pagina.'
      },
      {
        title: '13. Bedrijfsgegevens',
        body: 'AJAR, Jephtastraat 28H, 1055 JV Amsterdam, Nederland. KvK: 77755170. Btw: NL003042226B35. Producent: ConservAjar SARL, Taourirt, Marokko.'
      }
    ]
  },

  /* ---------- 404 ---------- */
  notFound: {
    title: 'Deze pagina bestaat niet',
    text: 'De link klopt niet meer of de pagina is verplaatst.',
    homeLabel: 'Naar de homepage',
    whatsappLabel: 'Stel uw vraag via WhatsApp'
  },

  /* ---------- Spec-sheet (bron voor de PDF — zie README.md voor hergenereren) ---------- */
  specsheet: {
    title: 'Product spec-sheet',
    rows: [
      { label: 'Product', value: 'Extra vierge olijfolie (eerste persing, koud geperst)' },
      { label: 'Inhoud', value: '500 ml per fles' },
      { label: 'Herkomst olijven', value: 'Debdou-regio, noordoost-Marokko — eigen boomgaarden' },
      { label: 'Producent (persing & botteling)', value: 'ConservAjar SARL, Taourirt, Marokko' },
      { label: 'Certificering', value: 'ISO 22000 (uitgegeven door SGS)' },
      { label: 'HS-code', value: '1509 2000 10' },
      { label: 'Houdbaarheid', value: 'Volgt — THT per partij op de fles', todo: true },
      { label: 'Bewaaradvies', value: 'Koel, donker en goed afgesloten bewaren' },
      { label: 'Verpakking', value: 'Doos à 12 × 500 ml (definitief volgt)', todo: true },
      { label: 'Importeur', value: 'AJAR, Jephtastraat 28H, 1055 JV Amsterdam' }
    ],
    footer: 'Prijzen op aanvraag — volume-afhankelijk. Contact via WhatsApp: +31 6 40 29 35 67.'
  },

  /* ---------- Nieuwsbrief (footer-inschrijving) ----------
     v6g: verzamelt e-mailadressen van geïnteresseerde zaken. Gebruikt dezelfde
     Formspree→mailto-fallback als de andere formulieren (submitLead) — zonder formspreeId opent
     het een voorgevulde mail. `enabled: false` verbergt het blok volledig.
     v7-vervolg (10 juli 2026): tekst ging nog uit van "nog niet leverbaar" — de olie is er al,
     alleen de site wordt nog niet actief gepromoot. Herschreven naar gewone "blijf op de
     hoogte"-copy, geen leverbaarheids-belofte meer (Soef: "doe maar alsof de voorraad er al is"). */
  newsletter: {
    enabled: true,
    title: 'Op de hoogte blijven?',
    text: 'Laat uw e-mailadres achter voor nieuws en updates over AJAR.',
    placeholder: 'Uw e-mailadres',
    button: 'Inschrijven',
    success: 'Bedankt — u hoort binnenkort van ons.',
    /* v7: AVG — korte uitleg bij het veld wat er met het adres gebeurt */
    privacyNote: 'Alleen voor updates over AJAR — geen spam, uitschrijven kan altijd.',
    emailSubject: 'Nieuwsbrief-inschrijving AJAR'
  },

  /* ---------- Footer ---------- */
  footer: {
    aboutLine: 'AJAR — extra vierge olijfolie uit Marokko. Rechtstreeks geïmporteerd voor de Nederlandse horeca, delicatessenzaak en retail.',
    privacyLabel: 'Privacyverklaring',
    termsLabel: 'Algemene voorwaarden',
    cookiePrefsLabel: 'Cookie-voorkeuren',
    socials: [
      /* Later invullen — leeg = niet getoond. Voorbeeld: { label:'Instagram', href:'https://instagram.com/…' } */
    ]
  }
};

/* NL is de basistaal. js/content.en.js en js/content.fr.js overschrijven de teksten;
   js/i18n.js kiest de taal en valt terug op NL voor ontbrekende sleutels. */
window.AJAR_CONTENT_NL = window.AJAR_CONTENT;
