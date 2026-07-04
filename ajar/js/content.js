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
    origin: 'Marokko',
    payoff: 'Extra vierge olijfolie, rechtstreeks uit Marokko.',

    gaId: '',                                 // TODO: GA4 measurement ID (bijv. 'G-XXXXXXXXXX') — leeg = GA uit, banner verborgen
    formspreeId: '',                          // TODO (FORMSPREE_PLACEHOLDER): Formspree form-ID (bijv. 'xqkrgwyz') — leeg = formulier valt terug op WhatsApp
    email: 'sofyanghaddari@gmail.com',        // zakelijk e-mailadres (voorlopig); formulieren mailen hierheen + zichtbaar in footer/contact
    whatsappNumber: '31640293567',            // internationaal formaat zonder + of spaties
    kvk: '77755170',                          // KvK-nummer
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
    note: "Familiebedrijf, opgericht begin jaren '90 onder de naam MOUSTAINE."
  },

  /* ---------- Navigatie ---------- */
  nav: [
    { id: 'home',     label: 'Home',              href: 'index.html' },
    { id: 'over-ons', label: 'Over ons',          href: 'over-ons.html' },
    { id: 'product',  label: 'Product',           href: 'product.html' },
    { id: 'zakelijk', label: 'Zakelijke klanten', href: 'zakelijk.html' },
    { id: 'contact',  label: 'Contact',           href: 'contact.html' }
  ],
  ctaLabel: 'Offerte aanvragen',
  ctaHref: 'contact.html?aanvraag=offerte',
  sampleCtaLabel: 'Gratis sample aanvragen',
  sampleCtaHref: 'sample.html',

  /* ---------- Topbar (dunne belofte-balk boven de header) ---------- */
  topbar: {
    text: 'Gratis sample — eerst proeven, dan praten',
    href: 'sample.html'
  },

  /* ---------- Cookiebanner ---------- */
  cookies: {
    text: 'We gebruiken anonieme bezoekersstatistieken (Google Analytics) om te zien hoe de site wordt gebruikt. U kiest zelf of u dat goed vindt.',
    accept: 'Accepteren',
    decline: 'Weigeren',
    moreLabel: 'Privacyverklaring'
  },

  /* ---------- Home ---------- */
  home: {
    hero: {
      kicker: 'Voor de Nederlandse horeca & speciaalzaak',
      title: 'Extra vierge olijfolie, rechtstreeks uit Marokko',
      sub: 'AJAR levert koudgeperste extra vierge olijfolie van een familiebedrijf met drie generaties kennis — via één korte, directe keten naar de Nederlandse horeca en speciaalzaak.',
      image: 'hero-01.jpg'
    },
    usps: [
      { title: 'Eerste officiële importeur', text: 'AJAR wordt als eerste officieel in Nederland geïmporteerd — rechtstreeks van de producent, zonder tussenschakels.' },
      { title: 'ISO 22000-gecertificeerd', text: 'De productie is ISO 22000-gecertificeerd (uitgegeven door SGS): voedselveiligheid en traceerbaarheid, gedocumenteerd.' },
      { title: 'Korte, directe keten', text: 'Van de eigen pers rechtstreeks naar uw zaak in Nederland — vers, traceerbaar en zonder anonieme tussenhandel.' }
    ],
    /* Verkooppuntenwall — verborgen zolang config.showPartners = false. Alleen échte afnemers tonen. */
    partners: {
      kicker: 'Verkrijgbaar bij',
      items: [
        /* { name: 'Naam zaak', logo: 'partner-01.png' } */
      ]
    },
    story: {
      kicker: 'Het verhaal',
      title: 'Drie generaties, één ambacht',
      text: "ConservAjar SARL is een familiebedrijf uit het noordoosten van Marokko, opgericht begin jaren '90. Wat begon als een lokale perserij groeide uit tot een producent van high-end olijfolie onder het eigen merk AJAR — nationaal en internationaal.",
      linkLabel: 'Lees ons verhaal',
      linkHref: 'over-ons.html',
      image: 'story-02.jpg'
    },
    /* Full-bleed sfeer-band met quote — foto volgt uit Marokko (sfeer-09.jpg) */
    mood: {
      quote: 'Van de Marokkaanse boomgaard naar de Nederlandse tafel.',
      sub: 'Drie generaties, één pers, één keten.',
      image: 'sfeer-09.jpg'
    },
    product: {
      kicker: 'Het product',
      title: 'Eén olie, compromisloos',
      text: 'Extra vierge, koud geperst en gebotteld aan de bron. Geen assortiment van tientallen varianten — één olijfolie waar we volledig achter staan, in een fles van 500 ml.',
      linkLabel: 'Bekijk het product',
      linkHref: 'product.html',
      image: 'product-03.jpg'
    },
    /* Testimonials: bewust leeg — invullen zodra er echte klanten/quotes zijn. Niet verzinnen.
       Zolang leeg tonen we i.p.v. nep-quotes een eerlijke "waarom AJAR"-vertrouwensrij (home.trust). */
    testimonials: {
      kicker: 'Vertrouwd door',
      title: 'Onze eerste partners',
      note: 'Deze plek is gereserveerd voor de zaken die met AJAR werken.',
      items: [
        { quote: '', author: '', company: '' },
        { quote: '', author: '', company: '' },
        { quote: '', author: '', company: '' }
      ]
    },
    /* Echte vertrouwenssignalen (feiten, geen verzonnen quotes) — getoond zolang er geen testimonials zijn. */
    trust: {
      kicker: 'Waarom AJAR',
      title: 'Waarop u kunt bouwen',
      note: 'Zodra de eerste zaken met AJAR werken, leest u hier hun ervaring. Tot dan: waar wij nu al voor staan.',
      items: [
        { big: 'ISO 22000', label: 'Gecertificeerd door SGS', text: 'Voedselveiligheid en traceerbaarheid per partij — extern getoetst.' },
        { big: '1e', label: 'Officiële NL-importeur', text: 'AJAR wordt als eerste officieel in Nederland geïmporteerd.' },
        { big: '3', label: 'Generaties vakkennis', text: 'Een familiebedrijf dat al sinds begin jaren ’90 olijven perst.' },
        { big: '0', label: 'Tussenschakels', text: 'Van de eigen pers rechtstreeks naar uw zaak — geen anonieme bulk.' }
      ]
    },
    cta: {
      title: 'Proeven zegt meer dan lezen',
      text: 'Vraag een gratis sample of offerte aan — we denken graag mee over volume en levering.',
      button: 'Gratis sample aanvragen',
      buttonHref: 'sample.html',
      secondary: 'Offerte aanvragen',
      secondaryHref: 'contact.html?aanvraag=offerte'
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
        title: 'Van MOUSTAINE naar AJAR',
        text: "ConservAjar SARL werd begin jaren '90 opgericht onder de naam MOUSTAINE, in het noordoosten van Marokko. Het bedrijf is en blijft een familiebedrijf: de kennis van het persen en verwerken van olijven is er over drie generaties opgebouwd en doorgegeven. Onder het eigen merk AJAR maakt het bedrijf high-end producten die nationaal en internationaal hun weg vinden.",
        image: 'overons-08.jpg'
      },
      {
        title: 'Kwaliteit die je kunt controleren',
        text: 'De productie is gecertificeerd volgens ISO 22000, uitgegeven door SGS — een internationale norm voor voedselveiligheidsmanagement. Voor u als inkoper betekent dat: gedocumenteerde processen, traceerbaarheid per partij en een producent die audits gewend is.',
        image: ''
      },
      {
        title: 'De eerste officiële importeur in Nederland',
        text: 'AJAR was tot nu toe niet officieel verkrijgbaar in Nederland. Als familie van de oprichters brengen wij de olie nu rechtstreeks naar de Nederlandse markt — met de importeursvermelding, documentatie en korte lijnen die daarbij horen. Geen tussenhandel, wél één aanspreekpunt in Amsterdam.',
        image: ''
      }
    ],
    /* Familie-tijdlijn — namen/jaartallen van de generaties volgen na overleg met de familie (augustus). */
    timeline: {
      kicker: 'De tijdlijn',
      title: 'Drie generaties in jaartallen',
      items: [
        { year: "Begin jaren '90", title: 'Oprichting als MOUSTAINE', text: 'Het familiebedrijf begint met het persen van olijven uit de eigen boomgaarden.', todo: false },
        { year: 'Jaartal volgt', title: 'Groei tot ConservAjar SARL', text: 'Het bedrijf groeit en gaat verder onder de naam ConservAjar SARL, met het eigen merk AJAR.', todo: true },
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
      rows: [
        { label: 'Categorie', value: 'Extra vierge olijfolie (eerste persing)' },
        { label: 'Inhoud', value: '500 ml' },
        { label: 'Persing', value: 'Koud geperst' },
        { label: 'Herkomst', value: 'Noordoost-Marokko — eigen productie' },
        { label: 'Olijfvariëteit', value: 'Picholine Marocaine' },
        /* TODO: onderstaande vult Soef later aan (na de Marokko-trip / oogstinfo) */
        { label: 'Oogst', value: 'Volgt — informatie huidige oogst', todo: true },
        { label: 'Smaakprofiel', value: 'Volgt — proefnotities huidige oogst', todo: true }
      ]
    },
    /* Meetbare kwaliteitscijfers — lab-analyse wordt in Marokko geregeld (actie Soef). */
    quality: {
      kicker: 'De cijfers',
      title: 'Meetbare kwaliteit',
      note: 'Lab-analyse van de huidige oogst volgt — deze waarden worden ingevuld zodra het rapport binnen is.',
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
    /* Horeca-propositie: de fles werkt in de keuken én als verhaal op tafel. */
    dualUse: {
      kicker: 'In de keuken én op tafel',
      title: 'Eén olie, twee rollen in uw zaak',
      items: [
        { title: 'In de keuken', text: 'Een constante, koudgeperste basis voor koude én warme gerechten — dezelfde kwaliteit in elke fles, rechtstreeks van één pers.' },
        { title: 'Op tafel', text: 'Zet de fles bij het brood op tafel en het verhaal vertelt zichzelf: één familie, één boomgaard, één herkomst. Uw gasten proeven het verschil — en vragen ernaar.' }
      ]
    },
    /* Productlijn / formaten — definitieve verpakkingen volgen. */
    formats: {
      kicker: 'De lijn',
      title: 'Formaten',
      items: [
        { size: 'Proefflesje', name: 'De sample', text: 'Gratis kennismaking: genoeg om te proeven, te vergelijken en te beslissen.', shape: 'small', todo: true, todoNote: 'formaat volgt' },
        { size: '500 ml', name: 'De fles', text: 'Het hart van de lijn — voor keuken en tafel, gebotteld aan de bron.', shape: 'bottle' },
        { size: '12 × 500 ml', name: 'De doos', text: 'De B2B-eenheid waarin we leveren en rekenen.', shape: 'box', todo: true, todoNote: 'definitieve doosinhoud volgt' }
      ]
    },
    /* Proeverij in uw zaak — de importeur zelf komt langs. */
    tasting: {
      kicker: 'Proeverij',
      title: 'Proeverij in uw zaak',
      text: 'Geen vertegenwoordiger met een koffer folders — de importeur zelf komt langs, schenkt de olie en vertelt het verhaal achter de familie en de boomgaard. Voor uw team, of als proefmoment voor uw klanten. Kost u niets behalve een half uur.',
      button: 'Plan een proeverij',
      buttonHref: 'contact.html?aanvraag=proeverij'
    },
    /* Sell-through-hulp voor delicatessenzaken en retail. */
    support: {
      kicker: 'Voor de winkel',
      title: 'We helpen uw verkoop',
      items: [
        { title: 'Schapkaart met het verhaal', text: 'Een kaart bij het schap met de familie, de boomgaard en de herkomst — een verhaal verkoopt, zeker naast anonieme flessen.' },
        { title: 'Proefmoment voor uw klanten', text: 'We komen een dagdeel proeven schenken in uw winkel. Klanten die geproefd hebben, komen terug voor de fles.' },
        { title: 'Bijbestellen via één appje', text: 'Geen bestelportaal, geen minimumdrempels vol kleine letters — één WhatsApp-bericht en de volgende doos komt eraan.' }
      ]
    },
    /* Relatiegeschenken — tweede B2B-invalshoek. */
    gift: {
      kicker: 'Relatiegeschenk',
      title: 'AJAR als relatiegeschenk voor uw klanten of team',
      text: 'Een fles goede olijfolie met een echt verhaal is een geschenk dat blijft hangen — voor eindejaarspakketten, jubilea of als bedankje aan vaste relaties. We denken graag mee over aantallen en presentatie.',
      button: 'Vraag naar de mogelijkheden',
      buttonHref: 'contact.html?aanvraag=offerte'
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
        text: 'Uitgebreidere presentatie over het bedrijf, de familie en de olie. Laat uw gegevens achter, dan ontvangt u de presentatie zodra die beschikbaar is.',
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
      sub: 'Vraag een gratis proefflesje aan voor uw zaak. U proeft rustig, vergelijkt met wat u nu gebruikt, en beslist daarna. Geen verplichtingen.'
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
      volumeLabel: 'Gewenst volume',
      volumeOptions: [
        { value: 'sample', label: 'Gratis sample / proefbestelling' },
        { value: 'maandelijks-vast', label: 'Maandelijks vast volume' },
        { value: 'horeca-bulk', label: 'Horeca bulk' }
      ],
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
      whatsappPrefill: 'Hallo, ik heb interesse in AJAR olijfolie voor mijn zaak.'
    }
  },

  /* ---------- Privacyverklaring ---------- */
  privacy: {
    hero: {
      kicker: 'Privacy',
      title: 'Privacyverklaring',
      sub: 'Kort en duidelijk: welke gegevens we verwerken en waarom.'
    },
    updated: 'Laatst bijgewerkt: juli 2026',
    sections: [
      {
        title: 'Wie is verantwoordelijk?',
        body: 'Verwerkingsverantwoordelijke voor deze website is AJAR (importeur van AJAR olijfolie), gevestigd aan de Jephtastraat 28H, 1055 JV Amsterdam. Contact verloopt via WhatsApp (+31 6 40 29 35 67).'
      },
      {
        title: 'Welke gegevens verzamelen we?',
        body: 'Twee soorten. (1) Formuliergegevens: als u een sample, offerte of presentatie aanvraagt, ontvangen we de gegevens die u zelf invult — naam, bedrijfsnaam, e-mailadres, telefoonnummer en uw bericht. (2) Bezoekersstatistieken: alléén als u dat accepteert via de cookiemelding, gebruiken we Google Analytics 4 om anoniem te zien hoe de site wordt gebruikt (bezochte pagina’s, herkomst van het bezoek). IP-adressen worden daarbij geanonimiseerd. Weigert u, dan wordt er niets gemeten.'
      },
      {
        title: 'Waarvoor gebruiken we die gegevens?',
        body: 'Formuliergegevens gebruiken we uitsluitend om uw aanvraag te beantwoorden en een eventuele zakelijke relatie op te volgen. Statistieken gebruiken we om de site te verbeteren en te zien welke kanalen bezoekers opleveren. We verkopen of delen uw gegevens niet met derden voor marketing.'
      },
      {
        title: 'Hoe lang bewaren we gegevens?',
        body: 'Aanvragen bewaren we zolang dat nodig is voor het contact en maximaal 2 jaar na het laatste contactmoment, tenzij er een klantrelatie ontstaat (dan gelden de wettelijke administratietermijnen). Analytics-gegevens worden maximaal 14 maanden bewaard.'
      },
      {
        title: 'Wie verwerken er gegevens voor ons?',
        body: 'Het contactformulier wordt technisch verwerkt door Formspree; statistieken door Google (Google Analytics 4). Met deze partijen gelden verwerkersvoorwaarden. Stuurt u een WhatsApp-bericht, dan gelden de voorwaarden van WhatsApp.'
      },
      {
        title: 'Uw rechten',
        body: 'U heeft recht op inzage, correctie en verwijdering van uw gegevens, en u kunt bezwaar maken tegen verwerking. Stuur daarvoor een bericht via WhatsApp. U kunt daarnaast een klacht indienen bij de Autoriteit Persoonsgegevens.'
      },
      {
        title: 'Cookies',
        body: 'Deze site plaatst alleen cookies voor Google Analytics, en alléén nadat u daarvoor toestemming heeft gegeven via de cookiemelding. Uw keuze wordt lokaal in uw browser opgeslagen en kunt u altijd terugdraaien door de sitegegevens te wissen.'
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
      { label: 'Herkomst', value: 'Noordoost-Marokko — eigen productie' },
      { label: 'Producent', value: 'ConservAjar SARL, Taourirt, Marokko' },
      { label: 'Certificering', value: 'ISO 22000 (uitgegeven door SGS)' },
      { label: 'HS-code', value: '1509 2000 10' },
      { label: 'Houdbaarheid', value: 'Volgt — THT per partij op de fles', todo: true },
      { label: 'Bewaaradvies', value: 'Koel, donker en goed afgesloten bewaren' },
      { label: 'Verpakking', value: 'Doos à 12 × 500 ml (definitief volgt)', todo: true },
      { label: 'Importeur', value: 'AJAR, Jephtastraat 28H, 1055 JV Amsterdam' }
    ],
    footer: 'Prijzen op aanvraag — volume-afhankelijk. Contact via WhatsApp: +31 6 40 29 35 67.'
  },

  /* ---------- Footer ---------- */
  footer: {
    aboutLine: 'AJAR — extra vierge olijfolie uit Marokko. Rechtstreeks geïmporteerd voor de Nederlandse horeca, delicatessenzaak en retail.',
    privacyLabel: 'Privacyverklaring',
    socials: [
      /* Later invullen — leeg = niet getoond. Voorbeeld: { label:'Instagram', href:'https://instagram.com/…' } */
    ]
  }
};
