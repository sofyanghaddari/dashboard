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
    origin: 'Taourirt · Marokko',
    payoff: 'Extra vierge olijfolie, rechtstreeks uit Taourirt, Marokko.',

    gaId: '',                                 // TODO: GA4 measurement ID (bijv. 'G-XXXXXXXXXX') — leeg = GA uit
    whatsappNumber: '31640293567',            // internationaal formaat zonder + of spaties
    email: 'sofyanghaddari@gmail.com',        // ontvanger van offerte-aanvragen (mailto)
    kvk: '',                                  // TODO: KvK-nummer zodra beschikbaar
    domain: 'https://sofyanghaddari.github.io/dashboard/ajar/'  // later: custom domain
  },

  /* ---------- Importeur (verplicht conform EU-regelgeving) ---------- */
  importer: {
    label: 'Importeur',
    name: 'S. Ghaddari',
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
  ctaHref: 'contact.html',

  /* ---------- Home ---------- */
  home: {
    hero: {
      kicker: 'Extra vierge olijfolie · Taourirt, Marokko',
      title: 'Extra vierge olijfolie, rechtstreeks uit Taourirt, Marokko',
      sub: 'AJAR levert koudgeperste extra vierge olijfolie van een familiebedrijf met drie generaties kennis — via één korte, directe keten naar de Nederlandse horeca en speciaalzaak.',
      image: 'hero-01.jpg'
    },
    usps: [
      { title: 'Eerste officiële importeur', text: 'AJAR wordt als eerste officieel in Nederland geïmporteerd — rechtstreeks van de producent, zonder tussenschakels.' },
      { title: 'ISO 22000-gecertificeerd', text: 'De productie is ISO 22000-gecertificeerd (uitgegeven door SGS): voedselveiligheid en traceerbaarheid, gedocumenteerd.' },
      { title: 'Korte, directe keten', text: 'Van de pers in Taourirt naar uw zaak in Nederland — vers, traceerbaar en zonder anonieme tussenhandel.' }
    ],
    story: {
      kicker: 'Het verhaal',
      title: 'Drie generaties, één ambacht',
      text: "ConservAjar SARL is een familiebedrijf uit Taourirt, in het noordoosten van Marokko, opgericht begin jaren '90. Wat begon als een lokale perserij groeide uit tot een producent van high-end olijfolie onder het eigen merk AJAR — nationaal en internationaal.",
      linkLabel: 'Lees ons verhaal',
      linkHref: 'over-ons.html',
      image: 'story-02.jpg'
    },
    product: {
      kicker: 'Het product',
      title: 'Eén olie, compromisloos',
      text: 'Extra vierge, koud geperst en gebotteld aan de bron. Geen assortiment van tientallen varianten — één olijfolie waar we volledig achter staan, in een fles van 500 ml.',
      linkLabel: 'Bekijk het product',
      linkHref: 'product.html',
      image: 'product-03.jpg'
    },
    /* Testimonials: bewust leeg — invullen zodra er echte klanten/quotes zijn. Niet verzinnen. */
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
    cta: {
      title: 'Proeven zegt meer dan lezen',
      text: 'Vraag een offerte of proefbestelling aan — we denken graag mee over volume en levering.',
      button: 'Offerte aanvragen'
    }
  },

  /* ---------- Over ons ---------- */
  about: {
    hero: {
      kicker: 'Over ons',
      title: 'Een familiebedrijf uit Taourirt',
      sub: "Sinds begin jaren '90 — eerlijk, vakkundig en zonder omwegen."
    },
    blocks: [
      {
        title: 'Van MOUSTAINE naar AJAR',
        text: "ConservAjar SARL werd begin jaren '90 opgericht onder de naam MOUSTAINE, in Taourirt, Marokko. Het bedrijf is en blijft een familiebedrijf: de kennis van het persen en verwerken van olijven is er over drie generaties opgebouwd en doorgegeven. Onder het eigen merk AJAR maakt het bedrijf high-end producten die nationaal en internationaal hun weg vinden.",
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
    ]
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
        { label: 'Herkomst', value: 'Taourirt, Marokko — eigen productie' },
        /* TODO: onderstaande vult Soef later aan (na de Marokko-trip / oogstinfo) */
        { label: 'Oogst', value: 'Volgt — informatie huidige oogst', todo: true },
        { label: 'Smaakprofiel', value: 'Volgt — proefnotities huidige oogst', todo: true }
      ]
    },
    why: {
      kicker: 'Waarom deze olie',
      title: 'Wat AJAR anders maakt',
      items: [
        { title: 'Koud geperst', text: 'De olijven worden koud geperst, waardoor smaak, geur en natuurlijke inhoudsstoffen behouden blijven.' },
        { title: 'Korte keten', text: 'Eigen productie in Taourirt en directe import naar Nederland: geen anonieme bulk, geen blends van onbekende herkomst.' },
        { title: 'Directe import', text: 'Eén importeur, één producent. Vragen over een partij of levering worden direct beantwoord — niet via drie schakels.' }
      ]
    },
    process: {
      kicker: 'Van boom tot fles',
      title: 'Vier stappen, één keten',
      steps: [
        { title: 'Oogst', text: 'De olijven worden geoogst in de omgeving van Taourirt en dezelfde periode verwerkt.', image: 'proces-04.jpg' },
        { title: 'Persing', text: 'Koude persing in de eigen perserij — de kern van drie generaties vakkennis.', image: 'proces-05.jpg' },
        { title: 'Botteling', text: 'De olie wordt aan de bron gebotteld in flessen van 500 ml, onder ISO 22000-condities.', image: 'proces-06.jpg' },
        { title: 'Import naar Nederland', text: 'Rechtstreeks naar Amsterdam, met de vereiste importdocumentatie en importeursvermelding.', image: 'proces-07.jpg' }
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
      text: 'Vraag een proefbestelling aan en beoordeel de olie in uw eigen keuken of zaak.',
      button: 'Proefbestelling aanvragen'
    }
  },

  /* ---------- Voor zakelijke klanten ---------- */
  b2b: {
    hero: {
      kicker: 'Voor zakelijke klanten',
      title: 'Rechtstreeks inkopen bij de bron',
      sub: 'AJAR levert uitsluitend B2B — aan zaken die weten wat goede olie voor hun keuken of schap betekent.'
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
        { title: 'Sample', text: 'U vraagt een proefbestelling aan; wij zorgen dat u de olie zelf kunt proeven en beoordelen.' },
        { title: 'Gesprek', text: 'We bespreken uw volume, frequentie en toepassing — aan tafel of via WhatsApp, wat u het beste uitkomt.' },
        { title: 'Offerte', text: 'U ontvangt een offerte op maat. Prijzen zijn volume-afhankelijk en altijd op aanvraag.' }
      ]
    },
    pricing: {
      title: 'Prijs op aanvraag',
      text: 'We publiceren bewust geen prijslijst: B2B-prijzen hangen af van volume, frequentie en afspraken over levering. In één kort gesprek weet u waar u aan toe bent.'
    },
    cta: {
      title: 'Klaar om te proeven?',
      text: 'Vraag vandaag een offerte of proefbestelling aan.',
      button: 'Offerte aanvragen'
    }
  },

  /* ---------- Contact ---------- */
  contact: {
    hero: {
      kicker: 'Contact',
      title: 'Vraag een offerte aan',
      sub: 'Vertel kort wie u bent en wat u zoekt — u hoort snel van ons.'
    },
    form: {
      nameLabel: 'Naam',
      companyLabel: 'Bedrijfsnaam',
      emailLabel: 'E-mailadres',
      phoneLabel: 'Telefoonnummer',
      volumeLabel: 'Gewenst volume',
      volumeOptions: [
        { value: 'proefbestelling', label: 'Proefbestelling' },
        { value: 'maandelijks-vast', label: 'Maandelijks vast volume' },
        { value: 'horeca-bulk', label: 'Horeca bulk' }
      ],
      messageLabel: 'Bericht',
      messagePlaceholder: 'Vertel kort iets over uw zaak en waar u de olie voor wilt gebruiken…',
      submitEmail: 'Verstuur via e-mail',
      submitWhatsApp: 'Verstuur via WhatsApp',
      privacyNote: 'Uw gegevens worden alleen gebruikt om uw aanvraag te beantwoorden.',
      emailSubject: 'Offerte-aanvraag AJAR olijfolie'
    },
    direct: {
      title: 'Liever direct contact?',
      text: 'Stuur een WhatsApp-bericht — dat is de snelste route.',
      whatsappLabel: 'WhatsApp openen',
      whatsappPrefill: 'Hallo, ik heb interesse in AJAR olijfolie voor mijn zaak.'
    }
  },

  /* ---------- Footer ---------- */
  footer: {
    aboutLine: 'AJAR — extra vierge olijfolie uit Taourirt, Marokko. Rechtstreeks geïmporteerd voor de Nederlandse horeca, delicatessenzaak en retail.',
    socials: [
      /* Later invullen — leeg = niet getoond. Voorbeeld: { label:'Instagram', href:'https://instagram.com/…' } */
    ]
  }
};
