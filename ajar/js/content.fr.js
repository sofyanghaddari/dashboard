/* ============================================================
   AJAR — contenu français (remplace la base néerlandaise de content.js).
   Les clés manquantes reviennent automatiquement au néerlandais (voir js/i18n.js).
   Conserver la même structure/les mêmes clés que content.js. Les liens (href),
   fichiers image, téléphone/e-mail et autres valeurs neutres restent ceux de la base NL.
   ============================================================ */
window.AJAR_CONTENT_FR = {

  importer: { label: "Importateur", country: "Pays-Bas" },
  producer: { label: "Producteur", country: "Maroc", note: "Entreprise familiale, fondée au début des années 90." },

  nav: [
    { id: "home",     label: "Accueil",        href: "index.html" },
    { id: "over-ons", label: "À propos",       href: "over-ons.html", children: [
      { label: "Notre histoire",        href: "over-ons.html#verhaal" },
      { label: "Qualité & ISO",         href: "over-ons.html#kwaliteit-iso" },
      { label: "Notre famille",         href: "over-ons.html#familie" },
      { label: "Importateur aux P.-B.", href: "over-ons.html#importeur" },
      { label: "Chronologie",           href: "over-ons.html#tijdlijn" }
    ] },
    { id: "product",  label: "Produit",        href: "product.html", children: [
      { label: "Spécifications",        href: "product.html#specs" },
      { label: "L’olive",               href: "product.html#de-olijf" },
      { label: "Qualité & chiffres",    href: "product.html#kwaliteit" },
      { label: "De l’arbre à la bouteille", href: "product.html#proces" },
      { label: "Certification",         href: "product.html#certificering" },
      { label: "Origine",               href: "product.html#herkomst" }
    ] },
    { id: "kennis",   label: "Savoir",         href: "kennis.html" },
    { id: "zakelijk", label: "Professionnels", href: "zakelijk.html", children: [
      { label: "Pour qui",              href: "zakelijk.html#voor-wie" },
      { label: "Comment ça marche",     href: "zakelijk.html#hoe-het-werkt" },
      { label: "Offre & prix",          href: "zakelijk.html#aanbod" },
      { label: "Comment commander",     href: "zakelijk.html#bestellen" },
      { label: "Dossier d’achat",       href: "zakelijk.html#dossier" },
      { label: "Documentation",         href: "zakelijk.html#documentatie" },
      { label: "FAQ",                   href: "zakelijk.html#faq" }
    ] },
    { id: "contact",  label: "Contact",        href: "contact.html" }
  ],
  ctaLabel: "Demander un devis",
  sampleCtaLabel: "Demander un échantillon gratuit",

  topbar: {
    items: [
      "Échantillon gratuit — goûtez d’abord, on parle ensuite",
      "Nos propres oliveraies au Maroc",
      "Huile d’olive extra vierge 100 % marocaine",
      "Pressée à froid dans notre propre moulin",
      "Certifiée ISO 22000 (SGS)"
    ],
    pendingItems: ["Commerce équitable", "Durable", "100 % naturel"],
    showPending: true,
    href: "sample.html"
  },

  mobileCta: { sample: "Échantillon gratuit", whatsapp: "WhatsApp" },

  marquee: ["Extra vierge", "Pressée à froid", "Picholine Marocaine", "Entreprise familiale depuis les années 90", "ISO 22000 · SGS", "Importée en direct"],

  cookies: {
    text: "Nous utilisons des statistiques de visite anonymes (Google Analytics) pour voir comment le site est utilisé. C’est vous qui décidez si cela vous convient.",
    accept: "Accepter",
    decline: "Refuser",
    moreLabel: "Déclaration de confidentialité"
  },

  home: {
    hero: {
      title: "Huile d’olive extra vierge, directement du Maroc.",
      sub: "Huile d’olive pressée à froid d’une entreprise familiale au Maroc, livrée directement à la restauration et aux épiceries fines néerlandaises."
    },
    kernpunten: {
      kicker: "Pourquoi AJAR",
      items: ["Moulin familial depuis les années 90", "Pressée à froid, origine unique Maroc", "Contact direct avec l’importateur"]
    },
    partners: { kicker: "Disponible chez", items: [] },
    intro: {
      kicker: "L’histoire",
      text: "Une entreprise familiale du nord-est du Maroc presse cette huile depuis les années 90 — trois générations sur la même terre.",
      linkLabel: "Lire notre histoire"
    },
    cta: {
      title: "Goûtez d’abord, décidez ensuite",
      text: "Demandez un flacon d’essai gratuit pour votre établissement — sans engagement.",
      button: "Demander un échantillon gratuit"
    }
  },

  about: {
    hero: {
      kicker: "À propos",
      title: "Une entreprise familiale du nord-est du Maroc",
      sub: "Depuis le début des années 90 — honnête, savoir-faire, sans détours."
    },
    blocks: [
      {
        anchor: "verhaal",
        title: "Une entreprise familiale aux racines profondes",
        text: "ConservAjar SARL a été fondée au début des années 90 dans le nord-est du Maroc — une entreprise familiale où le savoir-faire du pressage et de la transformation des olives se transmet depuis trois générations. Outre l’huile d’olive, l’entreprise conserve aussi des olives de table, de la pulpe d’abricot et des épices sous sa propre marque AJAR, au pays et à l’étranger.",
        image: "fabriek-taourirt.jpg"
      },
      {
        anchor: "kwaliteit-iso",
        title: "Une qualité que vous pouvez vérifier",
        text: "La production est certifiée ISO 22000, délivrée par SGS — une norme internationale de gestion de la sécurité des aliments. Pour vous, acheteur, cela signifie des processus documentés, une traçabilité par lot et un producteur habitué aux audits.",
        image: ""
      },
      {
        anchor: "importeur",
        title: "Le premier importateur officiel aux Pays-Bas",
        text: "Jusqu’ici, AJAR n’était pas officiellement disponible aux Pays-Bas. En tant que famille des fondateurs, nous apportons désormais l’huile directement sur le marché néerlandais — avec la mention de l’importateur, la documentation et les circuits courts qui vont avec. Pas d’intermédiaires, mais un seul interlocuteur à Amsterdam.",
        image: "overons-08.jpg"
      }
    ],
    familyStory: {
      kicker: "Notre famille",
      title: "L’histoire derrière l’huile",
      blocks: [
        {
          title: "Un nouveau départ",
          text: "Notre grand-père est parti travailler aux Pays-Bas jeune homme — par nécessité, non par goût de l’aventure. Après quelques années, il est rentré au Maroc et a ouvert une petite boutique d’olives."
        },
        {
          title: "De la petite boutique à AJAR",
          text: "Ce qui a commencé petit est devenu ConservAjar, dirigée par ses cinq fils. Sa santé ne lui permettant plus de continuer lui-même, son petit-fils apporte aujourd’hui l’huile aux Pays-Bas."
        }
      ]
    },
    factoryGallery: {
      kicker: "Aussi chez ConservAjar SARL",
      text: "La même usine transforme et conditionne à grande échelle — ici pour la gamme plus large sous la marque AJAR.",
      images: [
        { file: "ajar-magazijn-pallets.jpg", alt: "Entrepôt avec des produits AJAR emballés sur palettes" },
        { file: "ajar-tafelolijven-emmers.jpg", alt: "Olives de table, conditionnées chez ConservAjar SARL" },
        { file: "ajar-magazijn-conserven.jpg", alt: "Conserves emballées, prêtes à l’expédition" },
        { file: "ajar-olijven-verpakt.jpg", alt: "Olives emballées avec l’étiquette AJAR" }
      ]
    },
    timeline: {
      kicker: "La chronologie",
      title: "Trois générations en dates",
      items: [
        { year: "Début des années 90", title: "Fondation de l’entreprise familiale", text: "L’entreprise familiale commence à presser les olives de ses propres oliveraies.", todo: false },
        { year: "Année à venir", title: "Enregistrée officiellement sous ConservAjar SARL", text: "L’entreprise grandit et est enregistrée officiellement sous le nom ConservAjar SARL, avec sa propre marque AJAR.", todo: true },
        { year: "Année à venir", title: "Certification ISO 22000 (SGS)", text: "La production est certifiée ISO 22000 — sécurité des aliments et traçabilité, auditée en externe par SGS.", todo: true },
        { year: "2026", title: "Première importation officielle aux Pays-Bas", text: "AJAR arrive officiellement pour la première fois sur le marché néerlandais, depuis Amsterdam.", todo: false }
      ],
      note: "Les noms et dates des générations seront ajoutés après concertation avec la famille."
    }
  },

  product: {
    hero: {
      kicker: "Le produit",
      title: "Huile d’olive extra vierge",
      sub: "Pressée à froid, mise en bouteille à la source, importée en direct."
    },
    specs: {
      title: "AJAR Extra Vierge",
      rows: [
        { label: "Catégorie", value: "Huile d’olive extra vierge (première pression)" },
        { label: "Contenance", value: "500 ml" },
        { label: "Origine des olives", value: "Région de Debdou, nord-est du Maroc — nos propres oliveraies" },
        { label: "Pressage & mise en bouteille", value: "Pressée à froid, usine propre à Taourirt (ConservAjar SARL)" },
        { label: "Variété d’olive", value: "Picholine Marocaine" }
      ]
    },
    cultivar: {
      kicker: "L’olive",
      title: "Picholine Marocaine",
      text: "AJAR est pressée à partir d’une seule variété d’olive : la Picholine Marocaine, l’olive la plus plantée du Maroc. Pas d’assemblage de variétés et d’origines changeantes — une seule olive, de notre propre terre.",
      points: [
        { title: "Chez elle à l’est", text: "La variété prospère dans le climat sec de l’est du Maroc — précisément la région de Debdou où se trouvent les oliveraies." },
        { title: "Une variété, pas d’assemblage", text: "Là où beaucoup d’huiles d’olive sont un mélange de variétés et de pays d’origine, AJAR provient d’un seul cultivar et d’un seul producteur." }
      ]
    },
    quality: {
      kicker: "Les chiffres",
      title: "Une qualité mesurable",
      note: "Les notes de dégustation et l’analyse en laboratoire de la récolte actuelle arrivent — nous compléterons le profil aromatique et les chiffres ci-dessous dès qu’ils seront disponibles.",
      items: [
        { label: "Acidité", value: "À venir", unit: "% d’acides gras libres", todo: true, explain: "Plus elle est basse, plus l’huile est fraîche et pure. L’extra vierge est par définition sous 0,8 %." },
        { label: "Polyphénols", value: "À venir", unit: "mg/kg", todo: true, explain: "Antioxydants naturels de l’olive. Plus élevé signifie un goût plus plein et plus poivré et une meilleure conservation." },
        { label: "Année de récolte", value: "À venir", unit: "", todo: true, explain: "Récolte fraîche, sans années de stockage — vous savez exactement de quelle saison provient votre huile." }
      ]
    },
    why: {
      kicker: "Pourquoi cette huile",
      title: "Ce qui distingue AJAR",
      items: [
        { title: "Pressée à froid", text: "Les olives sont pressées à froid, ce qui préserve le goût, l’arôme et les composés naturels." },
        { title: "Circuit court", text: "Production propre au Maroc et importation directe aux Pays-Bas : pas de vrac anonyme, pas d’assemblages d’origine inconnue." },
        { title: "Importation directe", text: "Un importateur, un producteur. Les questions sur un lot ou une livraison reçoivent une réponse directe — pas via trois maillons." }
      ]
    },
    compare: {
      kicker: "La différence",
      title: "AJAR face à l’huile de supermarché",
      colA: "AJAR",
      colB: "Huile d’olive de supermarché courante",
      rows: [
        { label: "Origine", a: "Traçable jusqu’à une entreprise familiale au Maroc", b: "Souvent un mélange d’huiles de l’UE et d’ailleurs" },
        { label: "Circuit", a: "Court : de notre presse directement chez vous", b: "Long circuit avec plusieurs intermédiaires" },
        { label: "Pressage", a: "Pressée à froid dans notre propre moulin", b: "Variable selon la marque et le lot" },
        { label: "Contact", a: "Contact personnel avec l’importateur", b: "Rayon anonyme, aucun interlocuteur" }
      ]
    },
    process: {
      kicker: "De l’arbre à la bouteille",
      title: "Quatre étapes, une seule chaîne",
      steps: [
        { title: "Récolte", text: "Les olives sont récoltées à la main et transformées dans la même période.", image: "proces-04.jpg", icon: "olive" },
        { title: "Pressage", text: "Pressage à froid dans notre propre moulin — le cœur de trois générations de savoir-faire.", image: "proces-05.jpg", icon: "press" },
        { title: "Mise en bouteille", text: "L’huile est mise en bouteille à la source, en flacons de 500 ml, dans des conditions ISO 22000.", image: "proces-06.jpg", icon: "bottle" },
        { title: "Importation aux Pays-Bas", text: "Directement à Amsterdam, avec la documentation d’importation requise et la mention de l’importateur.", image: "proces-07.jpg", icon: "truck" }
      ]
    },
    certification: {
      kicker: "Qualité & certification",
      title: "Documenté, pas seulement promis",
      intro: "Pour un acheteur B2B, la qualité ne vaut que si elle est démontrable. C’est pourquoi nous ne travaillons qu’avec une certification documentée.",
      items: [
        {
          badge: "ISO 22000",
          title: "ISO 22000 — sécurité des aliments",
          text: "La production de ConservAjar SARL est certifiée ISO 22000, délivrée par SGS. Cela couvre toute la gestion de la sécurité des aliments : de la matière première à la bouteille, y compris la traçabilité par lot.",
          available: true
        },
        {
          badge: "EUR.1",
          title: "EUR.1 & documents d’importation",
          text: "La documentation EUR.1 (origine préférentielle UE–Maroc) et les autres documents d’importation sont en cours de préparation et apparaîtront ici dès qu’ils seront disponibles.",
          available: false,
          note: "À venir — en cours d’ajout."
        }
      ]
    },
    origin: {
      kicker: "Origine",
      title: "De Debdou à votre établissement",
      text: "Une chaîne courte et vérifiable : récoltée et pressée à froid dans notre propre usine à Taourirt, mise en bouteille à la source, et importée directement à Amsterdam.",
      from: { label: "Taourirt · Debdou", sub: "Nord-est du Maroc" },
      to: { label: "Amsterdam", sub: "Pays-Bas" },
      steps: [
        { title: "Récolte & pressage", text: "Région de Debdou — nos propres oliveraies, pressée à froid à Taourirt." },
        { title: "Mise en bouteille", text: "Mise en bouteille à la source, conditions ISO 22000." },
        { title: "Importation", text: "Directement à Amsterdam, avec documentation d’importation." },
        { title: "Livraison", text: "D’Amsterdam jusque chez vous." }
      ]
    },
    cta: {
      title: "Goûter par vous-même ?",
      text: "Demandez un échantillon gratuit et jugez l’huile dans votre propre cuisine ou établissement.",
      button: "Demander un échantillon gratuit",
      secondary: "Demander un devis"
    }
  },

  b2b: {
    hero: {
      kicker: "Professionnels",
      title: "Achetez directement à la source",
      sub: "AJAR livre uniquement en B2B — aux établissements qui savent ce qu’une bonne huile apporte à leur cuisine ou à leur rayon. Goûtez d’abord, on parle ensuite."
    },
    audiences: {
      kicker: "Pour qui",
      title: "Qui nous fournissons",
      items: [
        { title: "Restauration & traiteurs", text: "Restaurants et traiteurs qui veulent une huile reconnaissable et constante, sur la table et en cuisine — avec une histoire qui renforce la carte." },
        { title: "Épiceries fines", text: "Des enseignes spécialisées qui veulent offrir à leurs clients une huile à la provenance réelle, d’un seul producteur, avec le visage du producteur." },
        { title: "Petits détaillants", text: "Boutiques indépendantes et concepts food qui veulent se démarquer du rayon standard." }
      ]
    },
    how: {
      kicker: "Comment ça marche",
      title: "De la prise de contact à la livraison",
      steps: [
        { title: "Échantillon", text: "Vous demandez un échantillon gratuit ; nous faisons en sorte que vous puissiez goûter et juger l’huile vous-même." },
        { title: "Échange", text: "Nous discutons de votre volume, de votre fréquence et de votre usage — à table ou via WhatsApp, comme il vous convient." },
        { title: "Devis", text: "Vous recevez un devis sur mesure. Les prix dépendent du volume et sont toujours sur demande." }
      ]
    },
    formats: {
      kicker: "La gamme",
      title: "Ce que vous recevez & ce que cela coûte",
      items: [
        { size: "Flacon d’essai", name: "L’échantillon", text: "Une découverte gratuite : de quoi goûter, comparer et décider.", shape: "small", todo: true, todoNote: "format à venir" },
        { size: "500 ml", name: "La bouteille", text: "Le cœur de la gamme — pour la cuisine et la table, mise en bouteille à la source.", shape: "bottle" },
        { size: "12 × 500 ml", name: "Le carton", text: "L’unité B2B dans laquelle nous livrons et facturons.", shape: "box", todo: true, todoNote: "contenu définitif du carton à venir" }
      ],
      mockup: {
        badge: "Concept",
        caption: "Direction de conception — pas une photo produit. La bouteille et l’étiquette définitives suivront une fois l’emballage prêt."
      }
    },
    pricing: {
      title: "Prix sur demande",
      text: "Nous ne publions volontairement pas de tarif : les prix B2B dépendent du volume, de la fréquence et des modalités de livraison. Un court échange suffit à y voir clair.",
      fair: "Un principe reste ferme : des prix justes pour tous les maillons — la famille derrière l’huile, vous en tant qu’entrepreneur, et votre client.",
      packaging: "Livraison par carton de 12 × 500 ml (contenu définitif du carton à venir).",
      packagingTodo: true
    },
    assurance: {
      kicker: "Pourquoi vous lancer maintenant",
      title: "Parmi les premiers, avec une attention personnelle",
      items: [
        { title: "Contact direct, pas de centre d’appels", text: "Vous avez un interlocuteur fixe — l’importateur lui-même. Les questions sur un lot ou une livraison reçoivent une réponse immédiate." },
        { title: "Livraison convenue à l’avance", text: "Nous convenons du volume et de la fréquence à l’avance, pour que votre livraison soit assurée — sans surprises." },
        { title: "Grandir ensemble dès le départ", text: "En tant que l’un des premiers clients, vous bénéficiez d’une attention personnelle, et nous réfléchissons avec vous à ce qui convient le mieux à votre établissement." }
      ]
    },
    support: {
      kicker: "Pour la boutique",
      title: "Nous soutenons vos ventes — et plus encore",
      items: [
        { title: "Fiche de rayon avec l’histoire", text: "Une fiche près du rayon avec la famille, l’oliveraie et l’origine — une histoire fait vendre, surtout à côté de bouteilles anonymes." },
        { title: "Dégustation chez vous", text: "Pas de commercial avec une mallette de brochures — l’importateur lui-même passe, verse l’huile et raconte l’histoire. Pour votre équipe, ou comme moment de dégustation pour vos clients. Cela ne vous coûte qu’une demi-heure.", button: "Planifier une dégustation", buttonHref: "contact.html?aanvraag=proeverij", ga: "proeverij_cta_click" },
        { title: "Recommander en un message", text: "Pas de portail de commande, pas de seuils minimums en petits caractères — un message WhatsApp et le carton suivant arrive.", },
        { title: "AJAR en cadeau d’affaires", text: "Une bouteille avec une vraie histoire, pour les coffrets de fin d’année, les anniversaires ou un remerciement à des relations fidèles. Nous réfléchissons volontiers aux quantités et à la présentation.", button: "Renseignez-vous sur les possibilités", buttonHref: "contact.html?aanvraag=relatiegeschenk", ga: "gift_cta_click" }
      ]
    },
    ordering: {
      kicker: "Comment commander",
      title: "De la commande à la livraison",
      rows: [
        { label: "Commande minimale", value: "Dès un carton — idéal pour commencer", todo: false },
        { label: "Commander", value: "Par e-mail ou un message WhatsApp ; pas de portail de commande", todo: false },
        { label: "Délai de livraison", value: "Une date de livraison concrète convenue à la commande", todo: false },
        { label: "Livraison", value: "Par carton de 12 × 500 ml (contenu définitif à venir)", todo: true },
        { label: "Paiement", value: "Sur facture ; conditions convenues à l’avance, toujours sur le devis", todo: false },
        { label: "Prix", value: "Sur demande — selon le volume, clair en un court échange", todo: false }
      ],
      note: "Des questions sur un volume ou un rythme de livraison précis ? Indiquez-le dans votre demande et nous l’adaptons aussitôt."
    },
    dossier: {
      kicker: "Pour votre dossier d’achat",
      title: "Documents & certificats",
      intro: "Tout ce dont votre service achats ou votre dossier HACCP a besoin, au même endroit. Ce qui est disponible peut être demandé directement ; le reste est ajouté dès réception.",
      items: [
        { label: "Certificat ISO 22000 (SGS)", note: "Gestion de la sécurité des aliments, auditée en externe", available: true },
        { label: "Fiche technique produit (PDF)", note: "Toutes les informations techniques sur un A4", available: true },
        { label: "EUR.1 / certificat d’origine", note: "Origine préférentielle UE–Maroc", available: false },
        { label: "Fiche allergènes & HACCP", note: "En cours d’ajout", available: false },
        { label: "Conservation & DDM par lot", note: "À venir par lot sur la bouteille", available: false }
      ],
      requestLabel: "Demander le certificat",
      requestPrefill: "Bonjour, pourriez-vous m’envoyer le certificat ISO 22000 et la fiche technique AJAR pour mon dossier d’achat ?",
      availableTag: "Disponible",
      pendingTag: "Sur demande / à venir"
    },
    downloads: {
      kicker: "Pour votre dossier d’achat",
      title: "Documentation",
      specsheet: {
        title: "Fiche technique produit (PDF)",
        text: "Un A4 avec toutes les informations techniques — produit, origine, producteur, certification et importateur. Prêt à transmettre à vos achats ou à votre cuisine.",
        button: "Télécharger la fiche technique"
      },
      presentation: {
        title: "Présentation de l’entreprise AJAR",
        text: "Une présentation plus détaillée de l’entreprise, de la famille et de l’huile. Laissez vos coordonnées et téléchargez la présentation immédiatement.",
        nameLabel: "Nom",
        emailLabel: "Adresse e-mail",
        companyLabel: "Nom de l’entreprise",
        phoneLabel: "Numéro de téléphone",
        button: "Demander la présentation",
        success: "Merci — vous recevrez la présentation dès qu’elle sera prête.",
        successDownload: "Merci ! Vous pouvez télécharger la présentation maintenant :",
        downloadLabel: "Télécharger la présentation"
      }
    },
    faq: {
      kicker: "Questions fréquentes",
      title: "Le B2B en bref",
      items: [
        { q: "Quelle est la commande minimale ?", a: "Nous travaillons avec de petites comme de grandes commandes — d’un seul carton pour commencer à un volume mensuel fixe. Indiquez dans votre demande ce que vous recherchez à peu près, et nous l’adaptons aussitôt." },
        { q: "Quel est le délai de livraison ?", a: "Nous gardons des circuits courts et convenons d’une date de livraison concrète à la commande. Demandez le délai actuel pour votre volume dans votre demande." },
        { q: "Comment demander un échantillon ?", a: "Vous demandez un échantillon gratuit via le formulaire ou WhatsApp. Vous goûtez l’huile tranquillement dans votre cuisine ou votre établissement, puis nous discutons du volume et du prix. Sans engagement." },
        { q: "Quelles sont les conditions de paiement ?", a: "Nous convenons des conditions de paiement à l’avance ; elles figurent toujours clairement sur le devis — sans surprises." },
        { q: "Comment conserver l’huile et combien de temps se garde-t-elle ?", a: "À conserver au frais, à l’abri de la lumière et bien fermée — c’est ainsi que l’huile d’olive extra vierge garde le plus longtemps son goût. La date de conservation figure sur chaque bouteille." },
        { q: "Qui est l’importateur et pourquoi est-ce important ?", a: "AJAR est l’importateur officiel aux Pays-Bas (établi à Amsterdam) et figure comme tel sur la bouteille. Pour vous : un interlocuteur aux Pays-Bas, une responsabilité claire et une traçabilité par lot — exactement ce qu’exige votre dossier HACCP." }
      ]
    },
    cta: {
      title: "Prêt à goûter ?",
      text: "Demandez un échantillon gratuit aujourd’hui — ou un devis directement.",
      button: "Demander un échantillon gratuit",
      secondary: "Demander un devis"
    }
  },

  sample: {
    hero: {
      kicker: "Échantillon gratuit",
      title: "Goûtez AJAR d’abord — on parle ensuite",
      sub: "Demandez un flacon d’essai gratuit pour votre établissement. Vous goûtez tranquillement, comparez avec ce que vous utilisez, puis décidez. Sans engagement."
    },
    how: {
      kicker: "Comment ça marche",
      steps: [
        { title: "Demander", text: "Remplissez vos coordonnées ci-dessous — fait en une minute." },
        { title: "Goûter", text: "Vous recevez un flacon d’essai et goûtez à votre rythme, dans votre cuisine." },
        { title: "Décider", text: "L’huile vous plaît ? Alors nous discutons du volume et du prix. Sinon, cela reste un bon moment de dégustation." }
      ]
    },
    usps: [
      { title: "Vraiment gratuit", text: "Pas de petits caractères — le flacon d’essai ne vous coûte rien." },
      { title: "Personnel", text: "Vous recevez l’huile de l’importateur lui-même, pas d’un service commercial." },
      { title: "Traçable", text: "Une entreprise familiale au Maroc, certifiée ISO 22000." }
    ],
    form: {
      title: "Demandez votre flacon d’essai",
      companyLabel: "Nom de l’entreprise",
      nameLabel: "Personne de contact",
      emailLabel: "Adresse e-mail",
      phoneLabel: "Numéro de téléphone",
      addressLabel: "Adresse de livraison (rue + n°, code postal, ville)",
      messageLabel: "Remarque (facultatif)",
      tipLabel: "Recommandez un confrère (facultatif)",
      tipPlaceholder: "Nom de l’établissement + ville — nous lui offrirons aussi un flacon d’essai",
      submit: "Demander un échantillon gratuit",
      success: "Demande reçue — votre flacon d’essai arrive. À bientôt !",
      emailSubject: "Demande d’échantillon AJAR"
    }
  },

  contact: {
    hero: {
      kicker: "Contact",
      title: "Demandez un échantillon ou un devis",
      sub: "Dites-nous brièvement qui vous êtes et ce que vous cherchez — vous aurez bientôt de nos nouvelles."
    },
    form: {
      nameLabel: "Nom",
      companyLabel: "Nom de l’entreprise",
      emailLabel: "Adresse e-mail",
      phoneLabel: "Numéro de téléphone",
      typeLabel: "Type d’établissement",
      typeOptions: [
        { value: "", label: "Choisir…" },
        { value: "restaurant", label: "Restaurant" },
        { value: "cafe-bar", label: "Café / bar" },
        { value: "cateraar", label: "Traiteur" },
        { value: "delicatessen", label: "Épicerie fine" },
        { value: "speciaalzaak", label: "Magasin spécialisé / frais" },
        { value: "retail", label: "Commerce de détail" },
        { value: "anders", label: "Autre" }
      ],
      volumeLabel: "Volume souhaité",
      volumeOptions: [
        { value: "sample", label: "Échantillon gratuit / commande d’essai" },
        { value: "maandelijks-vast", label: "Volume mensuel fixe" },
        { value: "horeca-bulk", label: "Volume restauration" },
        { value: "relatiegeschenk", label: "Cadeau d’affaires" }
      ],
      frequencyLabel: "Fréquence de livraison souhaitée",
      frequencyOptions: [
        { value: "", label: "Choisir…" },
        { value: "eenmalig", label: "Ponctuel / essai" },
        { value: "wekelijks", label: "Hebdomadaire" },
        { value: "maandelijks", label: "Mensuel" },
        { value: "op-afroep", label: "Sur appel" }
      ],
      channelLabel: "Comment vous joindre au mieux ?",
      channelOptions: [
        { value: "email", label: "E-mail" },
        { value: "whatsapp", label: "WhatsApp" },
        { value: "bellen", label: "Rappelez-moi" }
      ],
      callTimeLabel: "Un moment qui vous convient ? (facultatif)",
      callTimePlaceholder: "Ex. en semaine après 15 h",
      messageLabel: "Message",
      messagePlaceholder: "Parlez-nous brièvement de votre établissement et de l’usage prévu de l’huile…",
      submit: "Envoyer la demande",
      submitWhatsApp: "Envoyer via WhatsApp",
      sending: "Envoi…",
      success: "Merci pour votre demande — vous aurez bientôt de nos nouvelles.",
      error: "L’envoi a échoué. Réessayez, ou envoyez directement un message WhatsApp.",
      privacyNote: "Vos données ne servent qu’à répondre à votre demande. Voir la déclaration de confidentialité.",
      emailSubject: "Demande huile d’olive AJAR"
    },
    direct: {
      title: "Vous préférez un contact direct ?",
      text: "Envoyez un message WhatsApp — c’est la voie la plus rapide.",
      whatsappLabel: "Ouvrir WhatsApp",
      whatsappPrefill: "Bonjour, je suis intéressé(e) par l’huile d’olive AJAR pour mon établissement.",
      phoneDisplay: "+31 6 40 29 35 67",
      phoneNote: "Vous pouvez aussi appeler :",
      topicsTitle: "Écrivez-nous directement à propos de…",
      topics: [
        { label: "Devis restauration", prefill: "Bonjour, je souhaiterais un devis pour l’huile d’olive AJAR pour mon établissement de restauration.", ga: "wa_topic_offerte" },
        { label: "Échantillon gratuit", prefill: "Bonjour, je souhaiterais demander un échantillon gratuit d’huile d’olive AJAR pour mon établissement.", ga: "wa_topic_sample" },
        { label: "Planifier une dégustation", prefill: "Bonjour, je souhaiterais planifier une dégustation d’huile d’olive AJAR dans mon établissement.", ga: "wa_topic_proeverij" },
        { label: "Cadeau d’affaires", prefill: "Bonjour, je suis intéressé(e) par l’huile d’olive AJAR comme cadeau d’affaires. Pouvez-vous m’en dire plus ?", ga: "wa_topic_gift" }
      ]
    },
    save: {
      title: "Enregistrez nos coordonnées",
      text: "Ajoutez AJAR à vos contacts ou partagez la page avec un confrère acheteur.",
      vcardLabel: "Enregistrer le contact",
      shareLabel: "Partager",
      shareText: "AJAR — huile d’olive extra vierge du Maroc, en direct pour la restauration et les épiceries fines néerlandaises.",
      qrLabel: "Scannez pour ouvrir cette page"
    }
  },

  knowledge: {
    hero: {
      kicker: "Bon à savoir",
      title: "L’huile d’olive, expliquée en bref",
      sub: "Qu’est-ce qui fait une bonne huile d’olive, et comment la reconnaître en tant qu’acheteur ? Les notions clés en un coup d’œil — un savoir général, sans discours commercial."
    },
    intro: "L’huile d’olive extra vierge est un produit naturel aux grandes différences de qualité. Ces notions vous aident à juger ce que vous achetez — chez nous ou ailleurs.",
    items: [
      { q: "Que signifie exactement « extra vierge » ?", a: "Extra vierge est la classe de qualité la plus élevée : l’huile est extraite purement de façon mécanique (pressée, non raffinée par la chaleur ou la chimie) et répond à des exigences strictes d’arôme, de goût et d’acidité. Aucun défaut de goût n’est toléré. Les classes inférieures — « vierge », « raffinée » ou simplement « huile d’olive » — sont transformées ou de moindre qualité." },
      { q: "Que dit l’acidité ?", a: "L’acidité mesure le pourcentage d’acides gras libres et témoigne de la fraîcheur et d’une transformation soignée. Plus elle est basse, mieux c’est. L’extra vierge est par définition sous 0,8 % ; les bonnes huiles sont souvent bien en dessous. Une acidité élevée indique des olives trop mûres ou abîmées, ou une attente trop longue entre récolte et pressage." },
      { q: "Que sont les polyphénols ?", a: "Les polyphénols sont des antioxydants naturels de l’olive. Ils donnent à l’huile son amertume légère et sa finale poivrée caractéristiques, contribuent à la conservation et sont associés à des bienfaits pour la santé. Davantage de polyphénols signifie en général une huile plus pleine et plus robuste." },
      { q: "Que signifient « pressée à froid » et « première pression » ?", a: "Pressée à froid signifie que les olives sont transformées à basse température (sous 27 °C), pour préserver goût, arôme et composés. « Première pression » signifie que l’huile est extraite en une fois, sans retravailler la pulpe. Ce sont deux marqueurs de qualité que l’on retrouve sur une bonne étiquette." },
      { q: "Pourquoi l’origine unique compte-t-elle ?", a: "L’origine unique signifie que l’huile provient d’une seule source et de préférence d’une seule variété d’olive, plutôt que d’un assemblage d’huiles de différents pays. Le goût est ainsi plus constant et l’origine traçable — vous savez exactement ce que vous servez. Beaucoup d’huiles de supermarché sont justement un assemblage anonyme de sources changeantes." },
      { q: "Comment conserver au mieux l’huile d’olive ?", a: "Au frais, à l’abri de la lumière et bien fermée. L’huile d’olive est sensible à la lumière, à la chaleur et à l’oxygène : ils accélèrent le vieillissement et altèrent le goût. Ne placez pas la bouteille près de la cuisinière ni au soleil, et refermez-la bien après usage. Ainsi l’huile garde le plus longtemps son goût." },
      { q: "Combien de temps l’huile d’olive se conserve-t-elle ?", a: "L’huile d’olive extra vierge est à son meilleur dans l’année suivant la récolte et reste bonne un bon moment ensuite, si elle est bien conservée. Contrairement au vin, l’huile d’olive ne s’améliore pas avec les années — plus fraîche vaut mieux. Regardez donc l’année de récolte ou la date de conservation, pas seulement le « à consommer de préférence avant »." },
      { q: "Comment déguster l’huile d’olive ?", a: "Les dégustateurs professionnels observent trois choses : le fruité (l’arôme d’olives fraîches ou d’herbe), l’amertume et une finale poivrée. Ces deux dernières ne sont pas des défauts mais le signe d’une huile fraîche et riche en polyphénols. Versez un peu dans un verre, réchauffez-le avec la main, sentez, puis prenez une petite gorgée." }
    ],
    cta: {
      title: "C’est la dégustation qui parle le mieux",
      text: "La théorie, c’est bien, mais le goût décide. Demandez un échantillon gratuit et jugez l’huile dans votre cuisine.",
      button: "Demander un échantillon gratuit",
      secondary: "Voir le produit"
    }
  },

  privacy: {
    hero: {
      kicker: "Confidentialité",
      title: "Déclaration de confidentialité",
      sub: "Court et clair : quelles données nous traitons et pourquoi."
    },
    updated: "Dernière mise à jour : juillet 2026",
    sections: [
      { title: "Qui est responsable ?", body: "Le responsable du traitement pour ce site est AJAR (importateur de l’huile d’olive AJAR), établi au Jephtastraat 28H, 1055 JV Amsterdam, inscrit à la Chambre de commerce néerlandaise sous le numéro 77755170. Le contact se fait par e-mail (sofyanghaddari@gmail.com) ou WhatsApp (+31 6 40 29 35 67)." },
      { title: "Quelles données collectons-nous ?", body: "Trois types. (1) Données de formulaire : lorsque vous demandez un échantillon, un devis ou une présentation, nous recevons les informations que vous saisissez vous-même — nom, nom de l’entreprise, adresse e-mail, numéro de téléphone, adresse de livraison et votre message. (2) Newsletter : si vous vous inscrivez, nous conservons uniquement votre adresse e-mail. (3) Statistiques de visite : uniquement si vous l’acceptez via l’avis de cookies, nous utilisons Google Analytics 4 pour voir de façon anonyme comment le site est utilisé (pages visitées, provenance de la visite). Les adresses IP sont anonymisées. Si vous refusez, rien n’est mesuré." },
      { title: "À quoi servent ces données ?", body: "Nous utilisons les données de formulaire uniquement pour répondre à votre demande et assurer le suivi d’une éventuelle relation commerciale. Votre adresse newsletter sert uniquement à vous informer sur AJAR (comme la disponibilité du produit) ; vous pouvez vous désinscrire à tout moment en nous le signalant par e-mail ou WhatsApp. Les statistiques servent à améliorer le site et à voir quels canaux amènent des visiteurs. Nous ne vendons ni ne partageons jamais vos données avec des tiers à des fins de marketing." },
      { title: "Combien de temps conservons-nous les données ?", body: "Nous conservons les demandes le temps nécessaire au contact et au maximum 2 ans après le dernier contact, sauf si une relation client se noue (les délais légaux de conservation s’appliquent alors, comme le délai fiscal de 7 ans pour les factures). Les adresses newsletter sont conservées jusqu’à la désinscription. Les données d’analyse sont conservées au maximum 14 mois." },
      { title: "Qui traite des données pour nous ?", body: "Les formulaires sont traités techniquement par Formspree ; les statistiques par Google (Google Analytics 4, uniquement après votre consentement). Des conditions de sous-traitance s’appliquent avec ces parties. Le site est hébergé sur GitHub Pages (GitHub, Inc.) ; comme pour tout serveur web, l’hébergeur peut traiter temporairement des données techniques comme les adresses IP. Les polices de caractères et tous les autres éléments du site sont chargés depuis notre propre hébergement — aucune donnée ne part vers des tiers pour cela. Si vous envoyez un message WhatsApp, les conditions de WhatsApp s’appliquent." },
      { title: "Vos droits", body: "Vous avez le droit d’accéder à vos données, de les corriger et de les supprimer, un droit à la portabilité de vos données, et vous pouvez vous opposer au traitement. Envoyez pour cela un message par e-mail ou WhatsApp — nous répondons aussi vite que possible, au plus tard dans un délai d’un mois. Vous pouvez également déposer une plainte auprès de l’autorité de protection des données compétente (autoriteitpersoonsgegevens.nl)." },
      { title: "Cookies", body: "Ce site ne place des cookies que pour Google Analytics, et uniquement après votre consentement via l’avis de cookies. Votre choix est stocké localement dans votre navigateur. Vous pouvez modifier votre choix à tout moment via le lien « Préférences cookies » en bas du site, ou en effaçant les données du site dans votre navigateur. Sans consentement, le site ne place aucun cookie." },
      { title: "Sécurité", body: "La connexion à ce site est chiffrée (HTTPS). Les demandes n’arrivent que chez l’importateur lui-même — il n’y a pas d’équipe commerciale externe ni de centre d’appels ayant accès à vos données." }
    ]
  },

  /* v7 : nouvelle page Conditions générales — traduite pour que les visiteurs EN/FR reçoivent
     les mêmes informations juridiques que la base NL. */
  terms: {
    hero: {
      kicker: "Conditions",
      title: "Conditions générales",
      sub: "Les accords qui s’appliquent aux commandes professionnelles — en langage clair."
    },
    updated: "Dernière mise à jour : 10 juillet 2026 · version 1.0",
    sections: [
      { title: "1. Qui est AJAR et à quoi s’appliquent ces conditions ?", body: "AJAR est importateur d’huile d’olive extra vierge, établi au Jephtastraat 28H, 1055 JV Amsterdam, inscrit à la Chambre de commerce néerlandaise sous le numéro 77755170. Ces conditions s’appliquent à tous les devis, commandes et livraisons d’AJAR. Nous ne livrons qu’à des clients professionnels (B2B), pas aux consommateurs. Les dérogations à ces conditions ne s’appliquent que si nous les avons convenues avec vous par écrit (y compris par e-mail ou WhatsApp). D’éventuelles conditions d’achat du client ne s’appliquent pas, sauf si nous les avons expressément acceptées par écrit." },
      { title: "2. Devis et prix", body: "Tous nos devis sont sans engagement et valables 30 jours, sauf indication contraire dans le devis. Les prix sont en euros et hors TVA ; ils dépendent du volume et sont fixés par devis. Les erreurs ou fautes de frappe manifestes dans un devis ne nous engagent pas — nous vous contacterons alors pour une version corrigée." },
      { title: "3. Comment une commande est-elle conclue ?", body: "Vous commandez en acceptant un devis, ou en transmettant une commande par e-mail ou WhatsApp. Le contrat est conclu dès qu’AJAR confirme votre commande par écrit. Cette confirmation indique le volume, le prix, la date de livraison et les modalités de paiement — vous savez ainsi exactement à quoi vous attendre." },
      { title: "4. Livraison", body: "Nous convenons d’une date de livraison concrète pour chaque commande. Les délais indiqués sont indicatifs et ne constituent pas un délai de rigueur ; si une livraison venait à prendre du retard, vous en seriez informé au plus vite et une nouvelle date serait convenue. La livraison a lieu à l’adresse que vous indiquez aux Pays-Bas, sauf accord contraire. Le risque des produits vous est transféré au moment de la livraison." },
      { title: "5. Paiement", body: "Vous recevez une facture à chaque livraison. Le délai de paiement figure sur le devis et la facture ; à défaut d’accord, un délai de 14 jours après la date de facture s’applique. Si le paiement reste dû après un rappel, nous pouvons facturer les intérêts commerciaux légaux et des frais de recouvrement raisonnables, et suspendre les livraisons suivantes jusqu’au règlement des factures impayées." },
      { title: "6. Réserve de propriété", body: "Les produits livrés restent la propriété d’AJAR jusqu’au paiement intégral de la facture correspondante. Jusque-là, vous pouvez utiliser ou revendre les produits dans le cadre normal de votre activité, mais pas les mettre en gage ni les donner en garantie." },
      { title: "7. Qualité, contrôle et réclamations", body: "Contrôlez la livraison à réception. Signalez les défauts visibles (dommages, quantités erronées) dans les 48 heures suivant la livraison ; signalez les autres défauts dès que possible après leur découverte. En cas de problème réel, nous remplaçons ou créditons les produits concernés — nous en discutons directement et sans détour, vous avez un seul interlocuteur. Attention : l’huile d’olive est un produit naturel. La couleur, l’arôme et le goût peuvent légèrement varier d’une récolte à l’autre ; ce n’est pas un défaut tant que l’huile respecte la norme extra vierge. Conservez l’huile au frais, à l’abri de la lumière et bien fermée ; la date de conservation figure sur chaque bouteille." },
      { title: "8. Échantillons gratuits", body: "Les échantillons sont gratuits et ne vous engagent à rien. Aucun droit pour des livraisons ultérieures ne peut être tiré d’un échantillon : celui-ci reflète l’huile du moment, et en tant que produit naturel, un lot ultérieur peut légèrement varier dans le cadre de la norme extra vierge. Les échantillons sont disponibles dans la limite des stocks, un par établissement." },
      { title: "9. Responsabilité", body: "Notre responsabilité par événement est limitée au montant de la facture de la livraison concernée par le dommage. Nous ne sommes pas responsables des dommages indirects, tels que la perte de chiffre d’affaires ou les dommages consécutifs. Ces limitations ne s’appliquent pas en cas de dol ou de négligence grave délibérée d’AJAR, ni là où la loi n’autorise pas de limitation." },
      { title: "10. Force majeure", body: "En cas de force majeure — circonstances hors de notre contrôle, telles que mauvaise récolte, problèmes de transport, restrictions d’import ou d’export, ou perturbations chez le producteur — nous pouvons suspendre la livraison. Si la force majeure dure plus de 60 jours, vous et nous pouvons annuler gratuitement la commande pour la partie non encore livrée. Les montants déjà payés pour des produits non livrés seront alors remboursés." },
      { title: "11. Droit applicable et litiges", body: "Le droit néerlandais s’applique à tous les contrats avec AJAR ; la Convention de Vienne sur la vente internationale de marchandises (CVIM) est exclue. Si nous ne parvenons pas à nous entendre — ce que nous essaierons bien sûr en premier lieu — le tribunal d’Amsterdam est compétent." },
      { title: "12. Modifications", body: "Nous pouvons modifier ces conditions. Pour les commandes en cours, la version en vigueur au moment de votre commande continue de s’appliquer. La version actuelle est toujours disponible sur cette page." }
    ]
  },

  notFound: {
    title: "Cette page n’existe pas",
    text: "Le lien n’est plus valable ou la page a été déplacée.",
    homeLabel: "Vers la page d’accueil",
    whatsappLabel: "Posez votre question via WhatsApp"
  },

  newsletter: {
    enabled: true,
    title: "Rester informé ?",
    text: "Laissez votre adresse e-mail — nous vous préviendrons dès qu’AJAR sera disponible.",
    placeholder: "Votre adresse e-mail",
    button: "S’inscrire",
    success: "Merci — vous aurez de nos nouvelles dès notre lancement.",
    privacyNote: "Uniquement pour les actualités AJAR — pas de spam, désinscription possible à tout moment.",
    emailSubject: "Inscription newsletter AJAR"
  },

  footer: {
    aboutLine: "AJAR — huile d’olive extra vierge du Maroc. Importée en direct pour la restauration, les épiceries fines et le commerce de détail néerlandais.",
    privacyLabel: "Déclaration de confidentialité",
    termsLabel: "Conditions générales",
    cookiePrefsLabel: "Préférences cookies"
  }
};
