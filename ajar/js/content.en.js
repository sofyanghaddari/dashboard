/* ============================================================
   AJAR — English content (overrides the Dutch base in content.js).
   Missing keys fall back to Dutch automatically (see js/i18n.js).
   Keep the same structure/keys as content.js. Hrefs, image files,
   phone/e-mail and other language-neutral values stay as in the NL base.
   ============================================================ */
window.AJAR_CONTENT_EN = {

  importer: { label: 'Importer', country: 'The Netherlands' },
  producer: { label: 'Producer', country: 'Morocco', note: "Family business, founded in the early '90s." },

  nav: [
    { id: 'home',     label: 'Home',            href: 'index.html' },
    { id: 'over-ons', label: 'About us',        href: 'over-ons.html', children: [
      { label: 'Our story',            href: 'over-ons.html#verhaal' },
      { label: 'Quality & ISO',        href: 'over-ons.html#kwaliteit-iso' },
      { label: 'Importer in NL',       href: 'over-ons.html#importeur' },
      { label: 'Timeline',             href: 'over-ons.html#tijdlijn' }
    ] },
    { id: 'product',  label: 'Product',         href: 'product.html', children: [
      { label: 'Specifications',       href: 'product.html#specs' },
      { label: 'The olive',            href: 'product.html#de-olijf' },
      { label: 'Quality & figures',    href: 'product.html#kwaliteit' },
      { label: 'From tree to bottle',  href: 'product.html#proces' },
      { label: 'Certification',        href: 'product.html#certificering' },
      { label: 'Origin',               href: 'product.html#herkomst' }
    ] },
    { id: 'kennis',   label: 'Knowledge',       href: 'kennis.html' },
    { id: 'zakelijk', label: 'For business',    href: 'zakelijk.html', children: [
      { label: 'Who we supply',        href: 'zakelijk.html#voor-wie' },
      { label: 'How it works',         href: 'zakelijk.html#hoe-het-werkt' },
      { label: 'Range & pricing',      href: 'zakelijk.html#aanbod' },
      { label: 'How to order',         href: 'zakelijk.html#bestellen' },
      { label: 'Buyer documents',      href: 'zakelijk.html#dossier' },
      { label: 'Documentation',        href: 'zakelijk.html#documentatie' },
      { label: 'FAQ',                  href: 'zakelijk.html#faq' }
    ] },
    { id: 'contact',  label: 'Contact',         href: 'contact.html' }
  ],
  ctaLabel: 'Request a quote',
  sampleCtaLabel: 'Request a free sample',

  topbar: {
    items: [
      'Free sample — taste first, talk later',
      'Our own groves in Morocco',
      '100% Moroccan extra virgin olive oil',
      'Cold-pressed in our own mill',
      'ISO 22000-certified (SGS)'
    ],
    pendingItems: ['Fairtrade', 'Sustainable', '100% natural'],
    showPending: true,
    href: 'sample.html'
  },

  mobileCta: { sample: 'Free sample', whatsapp: 'WhatsApp' },

  marquee: ['Extra virgin', 'Cold-pressed', 'Picholine Marocaine', "Family business since the '90s", 'ISO 22000 · SGS', 'Directly imported'],

  cookies: {
    text: 'We use anonymous visitor statistics (Google Analytics) to see how the site is used. You decide whether that is OK.',
    accept: 'Accept',
    decline: 'Decline',
    moreLabel: 'Privacy statement'
  },

  home: {
    hero: {
      title: 'Extra virgin olive oil, straight from Morocco.',
      sub: 'Cold-pressed olive oil from a family business in Morocco, delivered directly to Dutch restaurants and specialty stores.'
    },
    kernpunten: {
      kicker: 'Why AJAR',
      items: ["Family mill since the '90s", 'Cold-pressed, single-origin Morocco', 'Direct contact with the importer']
    },
    partners: { kicker: 'Available at', items: [] },
    intro: {
      kicker: 'The story',
      text: 'A family business in north-eastern Morocco has pressed this oil for three generations, on the same land.',
      linkLabel: 'Read our story'
    },
    cta: {
      title: 'Taste first, then decide',
      text: 'Request a free sample bottle for your business — no strings attached.',
      button: 'Request a free sample'
    }
  },

  about: {
    hero: {
      kicker: 'About us',
      title: 'A family business from north-eastern Morocco',
      sub: "Since the early '90s — honest, skilled and without detours."
    },
    blocks: [
      {
        anchor: 'verhaal',
        title: 'A family business with deep roots',
        text: 'Our grandfather left for the Netherlands as a young man to work, returned to Morocco a few years later and opened a small olive shop. Under his five sons that grew into ConservAjar SARL, the family business where the craft of pressing and processing olives is still passed down today, three generations on.',
        image: 'fabriek-taourirt.jpg'
      },
      {
        anchor: 'kwaliteit-iso',
        title: 'Quality you can verify',
        text: 'Production is certified to ISO 22000, issued by SGS — an international standard for food-safety management. For you as a buyer that means documented processes, batch-level traceability and a producer used to audits.',
        image: ''
      },
      {
        anchor: 'importeur',
        title: 'The first official importer in the Netherlands',
        text: 'Until now AJAR was not officially available in the Netherlands. As family of the founders, we now bring the oil directly to the Dutch market — with the importer listing, documentation and short lines that come with it. No middlemen, but one point of contact in Amsterdam.',
        image: 'overons-08.jpg'
      }
    ],
    factoryGallery: {
      kicker: 'Also at ConservAjar SARL',
      text: 'The same factory processes and packs at scale — here for the wider range under the AJAR brand.',
      images: [
        { file: 'ajar-magazijn-pallets.jpg', alt: 'Warehouse with packed AJAR products on pallets' },
        { file: 'ajar-tafelolijven-emmers.jpg', alt: 'Table olives, packed at ConservAjar SARL' },
        { file: 'ajar-magazijn-conserven.jpg', alt: 'Packed preserves, ready for shipping' },
        { file: 'ajar-olijven-verpakt.jpg', alt: 'Packed olives with the AJAR label' },
        { file: 'ajar-voorraad-blikken.jpg', alt: 'Towers of pallets with AJAR cans under the loading bay, with forklift' },
        { file: 'ajar-olijven-voorraad.jpg', alt: 'Buckets of table olives stacked high in the warehouse' },
        { file: 'ajar-magazijn-tractor.jpg', alt: 'Outdoor warehouse with pallets of preserves and a tractor' }
      ]
    },
    timeline: {
      kicker: 'The timeline',
      title: 'Three generations in dates',
      items: [
        { year: "Early '90s", title: 'The family business is founded', text: 'The family business begins pressing olives from its own groves.', todo: false },
        { year: 'Year to follow', title: 'Formally registered as ConservAjar SARL', text: 'The company grows and is formally registered as ConservAjar SARL, with its own AJAR brand.', todo: true },
        { year: 'Year to follow', title: 'ISO 22000 certification (SGS)', text: 'Production is certified to ISO 22000 — food safety and traceability, externally audited by SGS.', todo: true },
        { year: '2026', title: 'First official import into the Netherlands', text: 'AJAR reaches the Dutch market officially for the first time, from Amsterdam.', todo: false }
      ],
      note: 'Names and dates of the generations will be added after consulting the family.'
    }
  },

  product: {
    hero: {
      kicker: 'The product',
      title: 'Extra virgin olive oil',
      sub: 'Cold-pressed, bottled at source, directly imported.'
    },
    specs: {
      title: 'AJAR Extra Virgin',
      rows: [
        { label: 'Category', value: 'Extra virgin olive oil (first pressing)' },
        { label: 'Volume', value: '500 ml' },
        { label: 'Olive origin', value: 'Debdou region, north-eastern Morocco — our own groves' },
        { label: 'Pressing & bottling', value: 'Cold-pressed, own factory in Taourirt (ConservAjar SARL)' },
        { label: 'Olive variety', value: 'Picholine Marocaine' }
      ]
    },
    cultivar: {
      kicker: 'The olive',
      title: 'Picholine Marocaine',
      text: 'AJAR is pressed from a single olive variety: the Picholine Marocaine, the most widely planted olive in Morocco. Not a blend of shifting varieties and origins — one olive, from our own land.',
      points: [
        { title: 'At home in the east', text: 'The variety thrives in the dry climate of eastern Morocco — precisely the Debdou area where the groves are.' },
        { title: 'One variety, no blend', text: 'Where much olive oil is a mix of varieties and countries of origin, AJAR comes from one cultivar and one producer.' }
      ]
    },
    quality: {
      kicker: 'The figures',
      title: 'Measurable quality',
      note: 'Tasting notes and lab analysis of the current harvest are on the way — we will add the flavour profile and the figures below as soon as they are in.',
      items: [
        { label: 'Acidity', value: 'To follow', unit: '% free fatty acids', todo: true, explain: 'The lower, the fresher and purer the oil. Extra virgin is by definition below 0.8%.' },
        { label: 'Polyphenols', value: 'To follow', unit: 'mg/kg', todo: true, explain: 'Natural antioxidants from the olive. Higher means a fuller, more peppery taste and longer shelf life.' },
        { label: 'Harvest year', value: 'To follow', unit: '', todo: true, explain: 'Fresh harvest, no years in storage — you know exactly which season your oil is from.' }
      ]
    },
    why: {
      kicker: 'Why this oil',
      title: 'What sets AJAR apart',
      items: [
        { title: 'Cold-pressed', text: 'The olives are cold-pressed, preserving flavour, aroma and natural compounds.' },
        { title: 'Short chain', text: 'Own production in Morocco and direct import to the Netherlands: no anonymous bulk, no blends of unknown origin.' },
        { title: 'Direct import', text: 'One importer, one producer. Questions about a batch or delivery are answered directly — not through three links.' }
      ]
    },
    compare: {
      kicker: 'The difference',
      title: 'AJAR next to supermarket olive oil',
      colA: 'AJAR',
      colB: 'Typical supermarket olive oil',
      rows: [
        { label: 'Origin', a: 'Traceable to one family business in Morocco', b: 'Often a mix of oils from the EU and beyond' },
        { label: 'Chain', a: 'Short: from our own press straight to your business', b: 'Long chain with several intermediaries' },
        { label: 'Pressing', a: 'Cold-pressed in our own mill', b: 'Varies by brand and batch' },
        { label: 'Contact', a: 'Personal contact with the importer', b: 'Anonymous shelf, no point of contact' }
      ]
    },
    process: {
      kicker: 'From tree to bottle',
      title: 'Four steps, one chain',
      steps: [
        { title: 'Harvest', text: 'The olives are hand-picked and processed within the same period.', image: 'proces-04.jpg', icon: 'olive' },
        { title: 'Pressing', text: 'Cold pressing in our own mill — the heart of three generations of craft.', image: 'proces-05.jpg', icon: 'press' },
        { title: 'Bottling', text: 'The oil is bottled at source in 500 ml bottles, under ISO 22000 conditions.', image: 'proces-06.jpg', icon: 'bottle' },
        { title: 'Import to the Netherlands', text: 'Straight to Amsterdam, with the required import documentation and importer listing.', image: 'proces-07.jpg', icon: 'truck' }
      ]
    },
    certification: {
      kicker: 'Quality & certification',
      title: 'Documented, not just promised',
      intro: 'For a B2B buyer, quality only counts when it can be demonstrated. That is why we work only with documented certification.',
      items: [
        {
          badge: 'ISO 22000',
          title: 'ISO 22000 — food safety',
          text: 'ConservAjar SARL production is certified to ISO 22000, issued by SGS. That covers the full food-safety management: from raw material to bottled oil, including batch-level traceability.',
          available: true
        },
        {
          badge: 'EUR.1',
          title: 'EUR.1 & import documents',
          text: 'The EUR.1 documentation (preferential origin EU–Morocco) and other import documents are currently being arranged and will appear here as soon as available.',
          available: false,
          note: 'To follow — being added.'
        }
      ]
    },
    origin: {
      kicker: 'Origin',
      title: 'From Debdou to your business',
      text: 'One short, verifiable chain: harvested and cold-pressed in our own factory in Taourirt, bottled at source, and imported directly to Amsterdam.',
      from: { label: 'Taourirt · Debdou', sub: 'North-eastern Morocco' },
      to: { label: 'Amsterdam', sub: 'The Netherlands' },
      steps: [
        { title: 'Harvest & pressing', text: 'Debdou region — our own groves, cold-pressed in Taourirt.' },
        { title: 'Bottling', text: 'Bottled at source under ISO 22000 conditions.' },
        { title: 'Import', text: 'Straight to Amsterdam, with import documentation.' },
        { title: 'Delivery', text: 'From Amsterdam to your business.' }
      ]
    },
    cta: {
      title: 'Taste for yourself?',
      text: 'Request a free sample and judge the oil in your own kitchen or business.',
      button: 'Request a free sample',
      secondary: 'Request a quote'
    }
  },

  b2b: {
    hero: {
      kicker: 'For business',
      title: 'Buy directly at the source',
      sub: 'AJAR supplies B2B only — to businesses that know what good oil means for their kitchen or shelf. Taste first, talk later.'
    },
    audiences: {
      kicker: 'Who for',
      title: 'Who we supply',
      items: [
        { title: 'Restaurants & catering', text: 'Restaurants and caterers who want a recognisable, consistent oil on the table and in the kitchen — with a story that strengthens the menu.' },
        { title: 'Delicatessens', text: 'Specialty stores that want to offer their customers an oil with real provenance, from one producer, with the face of the maker behind it.' },
        { title: 'Smaller retailers', text: 'Independent shops and food concepts looking to stand out from the standard shelf.' }
      ]
    },
    how: {
      kicker: 'How it works',
      title: 'From first taste to delivery',
      steps: [
        { title: 'Sample', text: 'You request a free sample; we make sure you can taste and judge the oil yourself.' },
        { title: 'Conversation', text: 'We discuss your volume, frequency and use — over a table or via WhatsApp, whatever suits you.' },
        { title: 'Quote', text: 'You receive a tailored quote. Prices are volume-dependent and always on request.' }
      ]
    },
    formats: {
      kicker: 'The line',
      title: 'What you get & what it costs',
      items: [
        { size: 'Sample bottle', name: 'The sample', text: 'A free introduction: enough to taste, compare and decide.', shape: 'small', todo: true, todoNote: 'size to follow' },
        { size: '500 ml', name: 'The bottle', text: 'The heart of the line — for kitchen and table, bottled at source.', shape: 'bottle' },
        { size: '12 × 500 ml', name: 'The case', text: 'The B2B unit we deliver and price in.', shape: 'box', todo: true, todoNote: 'final case count to follow' }
      ],
      mockup: {
        badge: 'Concept',
        caption: 'Design direction — not a product photo. The final bottle and label will follow once the packaging is ready.'
      }
    },
    pricing: {
      title: 'Price on request',
      text: 'We deliberately publish no price list: B2B prices depend on volume, frequency and delivery arrangements. One short conversation and you know where you stand.',
      fair: 'One principle stands firm: fair prices for everyone in the chain — the family behind the oil, you as the entrepreneur, and your customer.',
      packaging: 'Delivery per case of 12 × 500 ml (final case count to follow).',
      packagingTodo: true
    },
    assurance: {
      kicker: 'Why join now',
      title: 'In early, with personal attention',
      items: [
        { title: 'Direct contact, no call centre', text: 'You have one fixed point of contact — the importer himself. Questions about a batch or delivery are answered right away.' },
        { title: 'Delivery agreed in advance', text: 'We agree volume and frequency with you beforehand, so your delivery is assured — no surprises.' },
        { title: 'Growing together from the start', text: 'As one of the first customers you get personal attention, and we think along about what suits your business best.' }
      ]
    },
    support: {
      kicker: 'For the shop',
      title: 'We help your sales — and more',
      items: [
        { title: 'Shelf card with the story', text: 'A card by the shelf with the family, the grove and the origin — a story sells, especially next to anonymous bottles.' },
        { title: 'Tasting at your place', text: 'No rep with a briefcase of leaflets — the importer himself drops by, pours the oil and tells the story. For your team, or as a tasting moment for your customers. It costs you nothing but half an hour.', button: 'Plan a tasting', buttonHref: 'contact.html?aanvraag=proeverij', ga: 'proeverij_cta_click' },
        { title: 'Reorder with one message', text: 'No ordering portal, no minimum thresholds full of small print — one WhatsApp message and the next case is on its way.' },
        { title: 'AJAR as a corporate gift', text: 'A bottle with a real story, for end-of-year hampers, anniversaries or a thank-you to loyal relations. We are happy to think along about quantities and presentation.', button: 'Ask about the options', buttonHref: 'contact.html?aanvraag=relatiegeschenk', ga: 'gift_cta_click' }
      ]
    },
    ordering: {
      kicker: 'How to order',
      title: 'From order to delivery',
      rows: [
        { label: 'Minimum order', value: 'From a single case — ideal to start with', todo: false },
        { label: 'Ordering', value: 'By e-mail or one WhatsApp message; no ordering portal', todo: false },
        { label: 'Lead time', value: 'A concrete delivery date agreed when you order', todo: false },
        { label: 'Delivery', value: 'Per case of 12 × 500 ml (final case count to follow)', todo: true },
        { label: 'Payment', value: 'By invoice; terms agreed in advance, always on the quote', todo: false },
        { label: 'Price', value: 'On request — volume-dependent, clear in one short conversation', todo: false }
      ],
      note: 'Questions about a specific volume or delivery rhythm? Add it to your request and we will tailor it to you straight away.'
    },
    dossier: {
      kicker: 'For your buyer file',
      title: 'Documents & certificates',
      intro: 'Everything your purchasing or HACCP file needs, in one place. What is available now you can request directly; the rest is added as soon as it is in.',
      items: [
        { label: 'ISO 22000 certificate (SGS)', note: 'Food-safety management, externally audited', available: true },
        { label: 'Product spec sheet (PDF)', note: 'All technical product information on one A4', available: true },
        { label: 'EUR.1 / certificate of origin', note: 'Preferential origin EU–Morocco', available: false },
        { label: 'Allergen & HACCP sheet', note: 'Being added', available: false },
        { label: 'Shelf life & best-before per batch', note: 'To follow per batch on the bottle', available: false }
      ],
      requestLabel: 'Request certificate',
      requestPrefill: 'Hello, could you send me the ISO 22000 certificate and the AJAR spec sheet for my buyer file?',
      availableTag: 'Available',
      pendingTag: 'On request / to follow'
    },
    downloads: {
      kicker: 'For your buyer file',
      title: 'Documentation',
      specsheet: {
        title: 'Product spec sheet (PDF)',
        text: 'One A4 with all technical product information — product, origin, producer, certification and importer. Ready to forward to your purchasing team or kitchen.',
        button: 'Download spec sheet'
      },
      presentation: {
        title: 'AJAR company presentation',
        text: 'A more detailed presentation about the company, the family and the oil. Leave your details and download the presentation right away.',
        nameLabel: 'Name',
        emailLabel: 'E-mail address',
        companyLabel: 'Company name',
        phoneLabel: 'Phone number',
        button: 'Request presentation',
        success: 'Thank you — you will receive the presentation as soon as it is ready.',
        successDownload: 'Thank you! You can download the presentation now:',
        downloadLabel: 'Download presentation'
      }
    },
    faq: {
      kicker: 'Frequently asked',
      title: 'B2B in brief',
      items: [
        { q: 'What is the minimum order?', a: 'We work with small and large orders — from a single case to start with to a fixed monthly volume. Tell us roughly what you are looking for in your request and we will tailor it to you straight away.' },
        { q: 'What is the lead time?', a: 'We keep the lines short and agree a concrete delivery date when you order. Ask about the current lead time for your volume in your request.' },
        { q: 'How does requesting a sample work?', a: 'You request a free sample via the form or WhatsApp. You taste the oil at your leisure in your own kitchen or business, then we discuss volume and price. No obligations.' },
        { q: 'What are the payment terms?', a: 'We agree the payment terms with you in advance; they are always stated clearly on the quote — no surprises afterwards.' },
        { q: 'How do I store the oil and how long does it keep?', a: 'Store it cool, dark and well sealed — that is how extra virgin olive oil keeps its flavour longest. The best-before date is on every bottle.' },
        { q: 'Who is the importer and why does it matter?', a: 'AJAR is the official importer in the Netherlands (based in Amsterdam) and is listed as such on the bottle. For you that means: one point of contact in the Netherlands, clear liability and batch-level traceability — exactly what your HACCP file requires.' }
      ]
    },
    cta: {
      title: 'Ready to taste?',
      text: 'Request a free sample today — or a quote straight away.',
      button: 'Request a free sample',
      secondary: 'Request a quote'
    }
  },

  sample: {
    hero: {
      kicker: 'Free sample',
      title: 'Taste AJAR first — then we talk',
      sub: 'Request a free sample bottle for your business. You taste at your leisure, compare it with what you use now, and decide afterwards. No obligations.'
    },
    how: {
      kicker: 'How it works',
      steps: [
        { title: 'Request', text: 'Fill in your details below — done in one minute.' },
        { title: 'Taste', text: 'You receive a sample bottle and taste at your own pace, in your own kitchen.' },
        { title: 'Decide', text: 'Like the oil? Then we discuss volume and price. If not, it stays a good tasting moment.' }
      ]
    },
    usps: [
      { title: 'Truly free', text: 'No small print — the sample bottle costs you nothing.' },
      { title: 'Personal', text: 'You get the oil from the importer himself, not from a sales department.' },
      { title: 'Traceable', text: 'One family business in Morocco, ISO 22000-certified.' }
    ],
    form: {
      title: 'Request your sample bottle',
      companyLabel: 'Company name',
      nameLabel: 'Contact person',
      emailLabel: 'E-mail address',
      phoneLabel: 'Phone number',
      addressLabel: 'Delivery address (street + no., postcode, town)',
      messageLabel: 'Note (optional)',
      tipLabel: 'Tip a fellow business owner (optional)',
      tipPlaceholder: 'Business name + town — we will surprise them with a sample too',
      submit: 'Request a free sample',
      success: 'Request received — your sample bottle is on its way. See you soon!',
      emailSubject: 'Sample request AJAR'
    }
  },

  contact: {
    hero: {
      kicker: 'Contact',
      title: 'Request a sample or a quote',
      sub: 'Tell us briefly who you are and what you are looking for — you will hear from us soon.'
    },
    form: {
      nameLabel: 'Name',
      companyLabel: 'Company name',
      emailLabel: 'E-mail address',
      phoneLabel: 'Phone number',
      typeLabel: 'Type of business',
      typeOptions: [
        { value: '', label: 'Choose…' },
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'cafe-bar', label: 'Café / bar' },
        { value: 'cateraar', label: 'Caterer' },
        { value: 'delicatessen', label: 'Delicatessen' },
        { value: 'speciaalzaak', label: 'Specialty / fresh store' },
        { value: 'retail', label: 'Retail / shop' },
        { value: 'anders', label: 'Other' }
      ],
      volumeLabel: 'Desired volume',
      volumeOptions: [
        { value: 'sample', label: 'Free sample / trial order' },
        { value: 'maandelijks-vast', label: 'Fixed monthly volume' },
        { value: 'horeca-bulk', label: 'Hospitality bulk' },
        { value: 'relatiegeschenk', label: 'Corporate gift' }
      ],
      frequencyLabel: 'Desired delivery frequency',
      frequencyOptions: [
        { value: '', label: 'Choose…' },
        { value: 'eenmalig', label: 'One-off / trial' },
        { value: 'wekelijks', label: 'Weekly' },
        { value: 'maandelijks', label: 'Monthly' },
        { value: 'op-afroep', label: 'On call' }
      ],
      channelLabel: 'How can we best reach you?',
      channelOptions: [
        { value: 'email', label: 'E-mail' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'bellen', label: 'Call me back' }
      ],
      callTimeLabel: 'A time that suits? (optional)',
      callTimePlaceholder: 'E.g. weekdays after 3pm',
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us briefly about your business and what you want to use the oil for…',
      submit: 'Send request',
      submitWhatsApp: 'Send via WhatsApp',
      sending: 'Sending…',
      success: 'Thank you for your request — you will hear from us soon.',
      error: 'Sending failed. Please try again, or send a WhatsApp message directly.',
      privacyNote: 'Your details are used only to answer your request. See the privacy statement.',
      emailSubject: 'Request AJAR olive oil'
    },
    direct: {
      title: 'Prefer direct contact?',
      text: 'Send a WhatsApp message — that is the fastest route.',
      whatsappLabel: 'Open WhatsApp',
      whatsappPrefill: 'Hello, I am interested in AJAR olive oil for my business.',
      phoneDisplay: '+31 6 40 29 35 67',
      phoneNote: 'You can also call:',
      topicsTitle: 'Message us directly about…',
      topics: [
        { label: 'Hospitality quote', prefill: 'Hello, I would like a quote for AJAR olive oil for my hospitality business.', ga: 'wa_topic_offerte' },
        { label: 'Free sample',       prefill: 'Hello, I would like to request a free sample of AJAR olive oil for my business.', ga: 'wa_topic_sample' },
        { label: 'Plan a tasting',    prefill: 'Hello, I would like to plan an AJAR olive oil tasting at my business.', ga: 'wa_topic_proeverij' },
        { label: 'Corporate gift',    prefill: 'Hello, I am interested in AJAR olive oil as a corporate gift. Could you tell me more?', ga: 'wa_topic_gift' }
      ]
    },
    save: {
      title: 'Save our details',
      text: 'Add AJAR to your contacts or share the page with a fellow buyer.',
      vcardLabel: 'Save contact',
      shareLabel: 'Share',
      shareText: 'AJAR — extra virgin olive oil from Morocco, direct for Dutch hospitality and specialty stores.',
      qrLabel: 'Scan to open this page'
    }
  },

  knowledge: {
    hero: {
      kicker: 'Good to know',
      title: 'Olive oil, explained briefly',
      sub: 'What makes an olive oil good, and how do you recognise it as a buyer? The key terms in a row — general knowledge, no sales talk.'
    },
    intro: 'Extra virgin olive oil is a natural product with big differences in quality. These terms help you judge what you buy — from us or from anyone else.',
    items: [
      { q: 'What does "extra virgin" actually mean?', a: 'Extra virgin is the highest quality class: the oil is extracted purely mechanically from the olive (pressed, not refined with heat or chemicals) and meets strict requirements for aroma, taste and acidity. There must be no defect in the flavour whatsoever. Lower classes — "virgin", "refined" or simply "olive oil" — are processed or of lesser quality.' },
      { q: 'What does the acidity tell you?', a: 'Acidity measures the percentage of free fatty acids and is a gauge of freshness and careful processing. The lower, the better. Extra virgin is by definition below 0.8%; good oils are often well under that. High acidity points to over-ripe or damaged olives, or too long a wait between harvest and pressing.' },
      { q: 'What are polyphenols?', a: 'Polyphenols are natural antioxidants from the olive. They give an oil its characteristic light bitterness and peppery finish, contribute to shelf life and are associated with health benefits. More polyphenols generally means a fuller, more robust oil.' },
      { q: 'What do "cold-pressed" and "first pressing" mean?', a: 'Cold-pressed means the olives are processed at a low temperature (below 27 °C), so flavour, aroma and compounds are preserved. "First pressing" means the oil is extracted in one go, without reworking the pulp. Both are quality markers you will find on a good label.' },
      { q: 'Why does single-origin matter?', a: 'Single-origin means the oil comes from one source and preferably one olive variety, rather than a blend of oils from different countries. That makes the taste more consistent and the origin traceable — you know exactly what you are pouring. Much supermarket oil is precisely an anonymous blend from shifting sources.' },
      { q: 'How do you best store olive oil?', a: 'Cool, dark and well sealed. Olive oil is sensitive to light, heat and oxygen: these speed up ageing and harm the flavour. Do not put the bottle next to the stove or in the sun, and close it well after use. That keeps the oil at its best longest.' },
      { q: 'How long does olive oil keep?', a: 'Extra virgin olive oil is at its best in the year after harvest and stays good for a good while after, if stored properly. Unlike wine, olive oil does not improve with age — fresher is better. So look at the harvest year or the best-before date on the bottle, not just "best before".' },
      { q: 'How do you taste olive oil?', a: 'Professional tasters look at three things: fruitiness (the aroma of fresh olives or grass), bitterness and a peppery finish. The latter two are not defects but a sign of fresh, polyphenol-rich oil. Pour a little into a glass, warm it with your hand, smell, then take a small sip.' }
    ],
    cta: {
      title: 'Tasting says the most',
      text: 'Theory is nice, but taste decides. Request a free sample and judge the oil in your own kitchen.',
      button: 'Request a free sample',
      secondary: 'View the product'
    }
  },

  privacy: {
    hero: {
      kicker: 'Privacy',
      title: 'Privacy statement',
      sub: 'Short and clear: which data we process and why.'
    },
    updated: 'Last updated: July 2026',
    sections: [
      { title: 'Who is responsible?', body: 'The controller for this website is AJAR (importer of AJAR olive oil), based at Jephtastraat 28H, 1055 JV Amsterdam, registered with the Dutch Chamber of Commerce under number 77755170. Contact is via e-mail (sofyanghaddari@gmail.com) or WhatsApp (+31 6 40 29 35 67).' },
      { title: 'Which data do we collect?', body: 'Three kinds. (1) Form data: when you request a sample, quote or presentation, we receive the details you fill in yourself — name, company name, e-mail address, phone number, delivery address and your message. (2) Newsletter: if you subscribe, we only keep your e-mail address. (3) Visitor statistics: only if you accept via the cookie notice do we use Google Analytics 4 to see anonymously how the site is used (pages visited, source of the visit). IP addresses are anonymised. If you decline, nothing is measured.' },
      { title: 'What do we use that data for?', body: 'We use form data solely to answer your request and to follow up any business relationship. We use your newsletter address only to inform you about AJAR (such as product availability); you can unsubscribe at any time by letting us know via e-mail or WhatsApp. We use statistics to improve the site and to see which channels bring visitors. We never sell or share your data with third parties for marketing.' },
      { title: 'How long do we keep data?', body: 'We keep requests as long as needed for the contact and for a maximum of 2 years after the last contact, unless a customer relationship arises (then the statutory record-keeping periods apply, such as the 7-year tax retention period for invoices). Newsletter addresses are kept until you unsubscribe. Analytics data is kept for a maximum of 14 months.' },
      { title: 'Who processes data for us?', body: 'The forms are technically processed by Formspree; statistics by Google (Google Analytics 4, only after your consent). Processor terms apply with these parties. The website is hosted on GitHub Pages (GitHub, Inc.); as with any web server, the hosting provider may temporarily process technical log data such as IP addresses. Fonts and every other part of the site load from our own hosting — no data goes to external parties for that. If you send a WhatsApp message, WhatsApp’s terms apply.' },
      { title: 'Your rights', body: 'You have the right to access, correct and delete your data, the right to data portability, and you can object to processing. Send a message via e-mail or WhatsApp for this — we respond as quickly as possible, within a month at the latest. You can also lodge a complaint with the Dutch Data Protection Authority (autoriteitpersoonsgegevens.nl).' },
      { title: 'Cookies', body: 'This site only places cookies for Google Analytics, and only after you have given consent via the cookie notice. Your choice is stored locally in your browser. You can change your choice at any time via the "Cookie preferences" link at the bottom of the site, or by clearing your browser’s site data. Without consent, the site places no cookies at all.' },
      { title: 'Security', body: 'The connection to this website is encrypted (HTTPS). Requests only reach the importer himself — there is no external sales team or call centre with access to your data.' }
    ]
  },

  /* v7: nieuwe pagina Algemene voorwaarden — vertaald zodat EN/FR-bezoekers dezelfde
     juridische informatie krijgen als de NL-basis. */
  terms: {
    hero: {
      kicker: 'Terms',
      title: 'Terms and conditions',
      sub: 'The agreements that apply to business orders — in plain language.'
    },
    updated: 'Last updated: 11 July 2026 · version 1.1',
    sections: [
      { title: '1. Who is AJAR and what do these terms apply to?', body: 'AJAR is an importer of extra virgin olive oil, based at Jephtastraat 28H, 1055 JV Amsterdam, registered with the Dutch Chamber of Commerce under number 77755170. These terms apply to all quotes, orders and deliveries by AJAR. We supply business customers only (B2B), not consumers. Deviations from these terms only apply if we have agreed to them with you in writing (including by e-mail or WhatsApp). Any purchasing terms of the customer do not apply, unless we have explicitly accepted them in writing.' },
      { title: '2. Quotes and prices', body: 'All our quotes are without obligation and valid for 30 days, unless stated otherwise in the quote. Prices are in euros and exclude VAT; they are volume-dependent and set out per quote. Obvious mistakes or typos in a quote do not bind us — we will contact you for a corrected version.' },
      { title: '3. How does an order come about?', body: 'You order by accepting a quote, or by placing an order via e-mail or WhatsApp. The agreement is formed once AJAR confirms your order in writing. That confirmation states the volume, price, delivery date and payment arrangements — so you know exactly where you stand in advance.' },
      { title: '4. Delivery', body: 'We agree a concrete delivery date with you for every order. Stated periods are indicative and not a strict deadline; should a delivery unexpectedly be delayed, we will let you know as soon as possible and agree a new date. Delivery takes place at the address you provide within the Netherlands or Belgium, unless agreed otherwise. Risk in the products passes to you at the moment of delivery.' },
      { title: '5. Payment', body: 'You receive an invoice with every delivery. The payment term is stated on the quote and invoice; if nothing has been agreed, a term of 14 days after the invoice date applies. If payment remains outstanding after a reminder, we may charge the statutory commercial interest rate and reasonable collection costs, and suspend further deliveries until outstanding invoices are settled.' },
      { title: '6. Retention of title', body: 'Delivered products remain the property of AJAR until the corresponding invoice has been paid in full. Until then you may use or resell the products in the normal course of business, but not pledge them or give them as security.' },
      { title: '7. Quality, inspection and complaints', body: 'Please inspect the delivery on receipt. Report visible defects (damage, wrong quantities) within 48 hours of delivery; report other defects as soon as possible after discovery. If something is genuinely wrong, we will replace or credit the products concerned — we deal with this directly and without detours, you have one point of contact. Please note: olive oil is a natural product. Colour, aroma and taste may vary slightly per harvest; that is not a defect as long as the oil meets the extra virgin standard. Store the oil cool, dark and well sealed; the best-before date is on every bottle.' },
      { title: '8. Free samples', body: 'Samples are free of charge and do not obligate you to anything. No rights for future deliveries can be derived from a sample: the sample reflects the oil at that moment, and as a natural product a later batch may differ slightly within the extra virgin standard. Samples are available while stocks last, one per business.' },
      { title: '9. Liability', body: 'Our liability per event is limited to the invoice amount of the delivery to which the damage relates. We are not liable for indirect damage, such as loss of turnover or consequential damage. These limitations do not apply in the event of intent or deliberate recklessness by AJAR, or where the law does not permit a limitation.' },
      { title: '10. Force majeure', body: 'In the event of force majeure — circumstances beyond our control, such as crop failure, transport problems, import or export restrictions, or disruptions at the producer — we may suspend delivery. If the force majeure lasts longer than 60 days, both you and we may cancel the order free of charge for the part not yet delivered. Any amounts already paid for undelivered products will be refunded.' },
      { title: '11. Applicable law and disputes', body: 'Dutch law applies to all agreements with AJAR; the Vienna Sales Convention (CISG) is excluded. If we cannot reach agreement together — which we will of course try first — the Amsterdam court has jurisdiction.' },
      { title: '12. Intellectual property', body: 'All content of this website and of our materials — texts, photos and other imagery, the AJAR logo and brand name, the design, spec sheets and quotes — is the property of AJAR or used with permission, and is protected by copyright and other intellectual property rights. Copying, distributing or commercial use is not permitted without our prior written consent. If you are a customer, you are of course welcome to use our imagery and product information to present our products in your own business, menu or web shop. Brief quotation with attribution is also permitted.' },
      { title: '13. Changes', body: 'We may amend these terms. For orders already placed, the version in force at the time of your order continues to apply. The current version is always available on this page.' },
      { title: '14. Company details', body: 'AJAR, Jephtastraat 28H, 1055 JV Amsterdam, Netherlands. Chamber of Commerce: 77755170. VAT: NL003042226B35. Producer: ConservAjar SARL, Taourirt, Morocco.' }
    ]
  },

  notFound: {
    title: 'This page does not exist',
    text: 'The link is no longer correct or the page has moved.',
    homeLabel: 'To the homepage',
    whatsappLabel: 'Ask your question via WhatsApp'
  },

  newsletter: {
    enabled: true,
    title: 'Stay informed?',
    text: 'Leave your e-mail address for news and updates about AJAR.',
    placeholder: 'Your e-mail address',
    button: 'Subscribe',
    success: 'Thank you — you will hear from us shortly.',
    privacyNote: 'Only for updates about AJAR — no spam, unsubscribe any time.',
    emailSubject: 'Newsletter sign-up AJAR'
  },

  footer: {
    aboutLine: 'AJAR — extra virgin olive oil from Morocco. Directly imported for Dutch hospitality, delicatessens and retail.',
    privacyLabel: 'Privacy statement',
    termsLabel: 'Terms and conditions',
    cookiePrefsLabel: 'Cookie preferences',
    rightsLine: 'All rights reserved'
  }
};
