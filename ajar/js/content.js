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

  /* ---------- Sticky mobiele CTA-balk (verschijnt na scrollen, niet op formulier-pagina's) ---------- */
  mobileCta: {
    sample: 'Gratis sample',
    whatsapp: 'WhatsApp'
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
      /* v2d (4 juli 2026): hero-01.jpg (berg+bassin, Soefs eigen foto) op verzoek van Soef vervangen
         door een sfeerbeeld — bestand blijft in assets/images/ staan, alleen losgekoppeld. Nieuwe
         foto is een AI-opgeschaalde stockfoto (geen AJAR-boomgaard) — vandaar generieke alt-tekst,
         geen "eigen land"-claim. Vervang door een échte AJAR-foto zodra beschikbaar. */
      image: 'stock-hero-orchard.jpg',
      /* Vertrouwenschips direct in de hero — alleen harde feiten.
         Let op: "Taourirt" mag hier NOOIT aan de boomgaarden/grond gekoppeld worden —
         Taourirt is uitsluitend de vestigingsplaats van de fabriek/pers (ConservAjar SARL).
         De boomgaarden liggen in de Debdou-regio. Zie ook home.route en product.cultivar. */
      badges: ['ISO 22000 · SGS', 'Picholine Marocaine', 'Eigen pers in Taourirt']
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
    /* De route: geanimeerde kaart Debdou-regio → Amsterdam — de korte keten als beeld.
       Boomgaarden = Debdou-regio; Taourirt = alleen de fabriek/pers (genoemd in de tekst,
       bewust géén los kaartpunt — dat zou de kaart onnodig drukker maken). */
    route: {
      kicker: 'De route',
      title: 'Van boomgaard naar uw zaak',
      text: 'Geen verzamelpartijen, geen anonieme tussenhandel. De olijven komen van eigen boomgaarden in de Debdou-regio, worden geperst en gebotteld in de eigen fabriek in Taourirt, en gaan rechtstreeks naar Nederland.',
      from: 'Debdou-regio — eigen boomgaarden',
      fromCountry: 'Marokko',
      to: 'Amsterdam — importeur',
      toCountry: 'Nederland',
      stats: ['± 2.100 km hemelsbreed', 'één importeur', 'nul tussenschakels']
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
    /* Eerlijke geruststelling i.p.v. verzonnen quotes — getoond zolang er geen testimonials zijn.
       BEWUST geen herhaling van ISO 22000 / eerste-importeur / geen-tussenschakels: die feiten
       staan al in de hero-badges én de USP's hierboven. Drie keer dezelfde drie feiten op één
       pagina overladen een zakelijke bezoeker eerder dan dat het overtuigt (feedback 4 juli 2026). */
    trust: {
      kicker: 'Nog geen klantverhalen',
      title: 'Eerlijk: wij zijn nieuw in Nederland',
      note: 'AJAR wordt hier voor het eerst officieel geïmporteerd — er zijn dus nog geen quotes om te tonen, en die verzinnen we niet. Zodra de eerste zaken met ons werken, leest u hier hun ervaring.'
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
      volumeLabel: 'Gewenst volume',
      volumeOptions: [
        { value: 'sample', label: 'Gratis sample / proefbestelling' },
        { value: 'maandelijks-vast', label: 'Maandelijks vast volume' },
        { value: 'horeca-bulk', label: 'Horeca bulk' },
        { value: 'relatiegeschenk', label: 'Relatiegeschenk' }
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

  /* ---------- Footer ---------- */
  footer: {
    aboutLine: 'AJAR — extra vierge olijfolie uit Marokko. Rechtstreeks geïmporteerd voor de Nederlandse horeca, delicatessenzaak en retail.',
    privacyLabel: 'Privacyverklaring',
    socials: [
      /* Later invullen — leeg = niet getoond. Voorbeeld: { label:'Instagram', href:'https://instagram.com/…' } */
    ]
  }
};
