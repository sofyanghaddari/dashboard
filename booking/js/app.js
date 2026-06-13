/* GH Taxi Amsterdam — App JS */

const PHONE = '31600000000';

// ── i18n ──
const LANGS = {
  nl:{nav_book:'Boek',nav_tours:'Tours',nav_fleet:'Vloot',nav_prices:'Tarieven',nav_contact:'Contact',form_title:'Uw rit boeken',form_sub:'Vaste prijs · Geen taxameter · Direct bevestigd',svc_transfer:'Transfer',svc_airport:'Luchthaven',svc_business:'Zakelijk',trip_single:'Enkele reis',trip_return:'Retour',pickup_label:'Ophaaladres',pickup_ph:'Hotel, station of adres…',dropoff_label:'Bestemming',dropoff_ph:'Hotel, station of adres…',date_label:'Datum',time_label:'Tijdstip',ret_date:'Retour datum',ret_time:'Retour tijd',pass_label:'Passagiers',veh_label:'Voertuig',price_label:'Vaste prijs',price_on_req:'Op aanvraag',book_btn:'Boek via WhatsApp',call_direct:'direct bellen',use_my_loc:'Gebruik mijn huidige locatie',map_hint_pickup:'Klik op de kaart om uw ophaallocatie te pinnen',map_hint_dropoff:'Klik op de kaart om uw bestemming te pinnen',map_show:'Toon route op kaart',map_hide:'Verberg kaart',confirm_title:'Controleer uw rit',confirm_send:'Bevestig via WhatsApp',est_distance:'Afstand',lbl_when:'Wanneer',filter_all:'Alle tours',filter_day:'Daguitjes',filter_airport:'Luchthaven',filter_city:'Stad',filter_biz:'Zakelijk',tours_title:'Ontdek Nederland in stijl',tours_sub:'Privévervoer voor daguitstappen en city tours. Vaste all-in prijzen.',fleet_title:'De juiste auto voor elke rit',fleet_sub:'Goed onderhouden voertuigen voor maximaal reiscomfort.',fleet_most:'Meest gekozen',prices_title:'Transparante tarieven',prices_sub:'Geen meter, geen verrassingen. U betaalt exact wat is afgesproken.',contact_title:'Klaar voor uw rit?',contact_sub:'Stuur een WhatsApp of bel direct. Bevestigd binnen 10 minuten.',wa_book:'WhatsApp Boeken',call_btn:'Bel Direct',incl_title:'Altijd inbegrepen',surcharge_title:'Toeslagen',route_label:'Traject',comfort_label:'Comfort',biz_label:'Business',bus_label:'Minibus',from_label:'Vanaf',price_footnote:'Traject niet gevonden? WhatsApp ons voor een offerte op maat.',price_quote:'Vraag prijs op',footer_desc:'Premium taxivervoer in Amsterdam en heel Nederland.',or:'of'},
  en:{nav_book:'Book',nav_tours:'Tours',nav_fleet:'Fleet',nav_prices:'Prices',nav_contact:'Contact',form_title:'Book your ride',form_sub:'Fixed price · No meter · Instant confirmation',svc_transfer:'Transfer',svc_airport:'Airport',svc_business:'Business',trip_single:'One way',trip_return:'Return',pickup_label:'Pickup address',pickup_ph:'Hotel, station or address…',dropoff_label:'Destination',dropoff_ph:'Hotel, station or address…',date_label:'Date',time_label:'Time',ret_date:'Return date',ret_time:'Return time',pass_label:'Passengers',veh_label:'Vehicle',price_label:'Fixed price',price_on_req:'On request',book_btn:'Book via WhatsApp',call_direct:'call directly',use_my_loc:'Use my current location',map_hint_pickup:'Tap the map to pin your pickup location',map_hint_dropoff:'Tap the map to pin your destination',map_show:'Show route on map',map_hide:'Hide map',confirm_title:'Review your ride',confirm_send:'Confirm via WhatsApp',est_distance:'Distance',lbl_when:'When',filter_all:'All tours',filter_day:'Day trips',filter_airport:'Airport',filter_city:'City',filter_biz:'Business',tours_title:'Discover the Netherlands in style',tours_sub:'Private transport for day trips and city tours. Fixed all-in prices.',fleet_title:'The right car for every ride',fleet_sub:'Well-maintained vehicles for maximum travel comfort.',fleet_most:'Most popular',prices_title:'Transparent pricing',prices_sub:'No meter, no surprises. You pay exactly what we agree.',contact_title:'Ready for your next ride?',contact_sub:'Send a WhatsApp or call directly. Confirmed within 10 minutes.',wa_book:'Book via WhatsApp',call_btn:'Call Now',incl_title:'Always included',surcharge_title:'Surcharges',route_label:'Route',comfort_label:'Comfort',biz_label:'Business',bus_label:'Minibus',from_label:'From',price_footnote:'Route not listed? WhatsApp us for a custom quote.',price_quote:'Request quote',footer_desc:'Premium taxi service in Amsterdam and across the Netherlands.',or:'or'},
  fr:{nav_book:'Réserver',nav_tours:'Tours',nav_fleet:'Flotte',nav_prices:'Tarifs',nav_contact:'Contact',form_title:'Réservez votre trajet',form_sub:'Prix fixe · Sans compteur · Confirmation immédiate',svc_transfer:'Transfer',svc_airport:'Aéroport',svc_business:'Affaires',trip_single:'Aller simple',trip_return:'Aller-retour',pickup_label:'Adresse de départ',pickup_ph:'Hôtel, gare ou adresse…',dropoff_label:'Destination',dropoff_ph:'Hôtel, gare ou adresse…',date_label:'Date',time_label:'Heure',ret_date:'Date retour',ret_time:'Heure retour',pass_label:'Passagers',veh_label:'Véhicule',price_label:'Prix fixe',price_on_req:'Sur demande',book_btn:'Réserver via WhatsApp',call_direct:'appeler directement',use_my_loc:'Utiliser ma position actuelle',map_hint_pickup:'Touchez la carte pour épingler le départ',map_hint_dropoff:'Touchez la carte pour épingler la destination',map_show:'Voir le trajet sur la carte',map_hide:'Masquer la carte',confirm_title:'Vérifiez votre trajet',confirm_send:'Confirmer via WhatsApp',est_distance:'Distance',lbl_when:'Quand',filter_all:'Tous les tours',filter_day:'Excursions',filter_airport:'Aéroport',filter_city:'Ville',filter_biz:'Affaires',tours_title:'Découvrez les Pays-Bas avec style',tours_sub:'Transport privé pour excursions et visites urbaines. Prix tout compris.',fleet_title:'Le bon véhicule pour chaque trajet',fleet_sub:'Véhicules bien entretenus pour un confort maximal.',fleet_most:'Le plus choisi',prices_title:'Tarifs transparents',prices_sub:'Sans compteur, sans surprises. Vous payez exactement ce qui est convenu.',contact_title:'Prêt pour votre prochain trajet?',contact_sub:'Envoyez un WhatsApp ou appelez-nous. Confirmé en 10 minutes.',wa_book:'Réserver via WhatsApp',call_btn:'Appeler',incl_title:'Toujours inclus',surcharge_title:'Suppléments',route_label:'Trajet',comfort_label:'Confort',biz_label:'Business',bus_label:'Minibus',from_label:'À partir de',price_footnote:'Trajet non trouvé? Envoyez un WhatsApp pour un devis.',price_quote:'Demander un tarif',footer_desc:'Service de taxi premium à Amsterdam et dans toute la Hollande.',or:'ou'},
  de:{nav_book:'Buchen',nav_tours:'Touren',nav_fleet:'Flotte',nav_prices:'Preise',nav_contact:'Kontakt',form_title:'Ihre Fahrt buchen',form_sub:'Festpreis · Kein Taxameter · Sofort bestätigt',svc_transfer:'Transfer',svc_airport:'Flughafen',svc_business:'Business',trip_single:'Einfache Fahrt',trip_return:'Hin & Zurück',pickup_label:'Abholadresse',pickup_ph:'Hotel, Bahnhof oder Adresse…',dropoff_label:'Zielort',dropoff_ph:'Hotel, Bahnhof oder Adresse…',date_label:'Datum',time_label:'Uhrzeit',ret_date:'Rückfahrt Datum',ret_time:'Rückfahrt Uhrzeit',pass_label:'Passagiere',veh_label:'Fahrzeug',price_label:'Festpreis',price_on_req:'Auf Anfrage',book_btn:'Per WhatsApp buchen',call_direct:'direkt anrufen',use_my_loc:'Meinen aktuellen Standort verwenden',map_hint_pickup:'Tippen Sie auf die Karte, um den Abholort zu markieren',map_hint_dropoff:'Tippen Sie auf die Karte, um das Ziel zu markieren',map_show:'Route auf Karte anzeigen',map_hide:'Karte ausblenden',confirm_title:'Überprüfen Sie Ihre Fahrt',confirm_send:'Per WhatsApp bestätigen',est_distance:'Entfernung',lbl_when:'Wann',filter_all:'Alle Touren',filter_day:'Tagesausflüge',filter_airport:'Flughafen',filter_city:'Stadt',filter_biz:'Business',tours_title:'Die Niederlande stilvoll entdecken',tours_sub:'Privater Transport für Tagesausflüge und Stadtrundfahrten.',fleet_title:'Das richtige Auto für jede Fahrt',fleet_sub:'Gepflegte Fahrzeuge für maximalen Reisekomfort.',fleet_most:'Meistgewählt',prices_title:'Transparente Preise',prices_sub:'Kein Taxameter, keine Überraschungen. Sie zahlen genau das Vereinbarte.',contact_title:'Bereit für Ihre nächste Fahrt?',contact_sub:'WhatsApp oder direkt anrufen. Bestätigung in 10 Minuten.',wa_book:'Per WhatsApp buchen',call_btn:'Anrufen',incl_title:'Immer inklusive',surcharge_title:'Zuschläge',route_label:'Strecke',comfort_label:'Komfort',biz_label:'Business',bus_label:'Minibus',from_label:'Ab',price_footnote:'Strecke nicht gefunden? WhatsApp für ein individuelles Angebot.',price_quote:'Preis anfragen',footer_desc:'Premium-Taxiservice in Amsterdam und den gesamten Niederlanden.',or:'oder'},
  es:{nav_book:'Reservar',nav_tours:'Tours',nav_fleet:'Flota',nav_prices:'Tarifas',nav_contact:'Contacto',form_title:'Reserve su viaje',form_sub:'Precio fijo · Sin taxímetro · Confirmación inmediata',svc_transfer:'Transfer',svc_airport:'Aeropuerto',svc_business:'Negocios',trip_single:'Solo ida',trip_return:'Ida y vuelta',pickup_label:'Dirección de recogida',pickup_ph:'Hotel, estación o dirección…',dropoff_label:'Destino',dropoff_ph:'Hotel, estación o dirección…',date_label:'Fecha',time_label:'Hora',ret_date:'Fecha de regreso',ret_time:'Hora de regreso',pass_label:'Pasajeros',veh_label:'Vehículo',price_label:'Precio fijo',price_on_req:'A consultar',book_btn:'Reservar por WhatsApp',call_direct:'llamar directamente',use_my_loc:'Usar mi ubicación actual',map_hint_pickup:'Toque el mapa para marcar la recogida',map_hint_dropoff:'Toque el mapa para marcar el destino',map_show:'Ver ruta en el mapa',map_hide:'Ocultar mapa',confirm_title:'Revise su viaje',confirm_send:'Confirmar por WhatsApp',est_distance:'Distancia',lbl_when:'Cuándo',filter_all:'Todos los tours',filter_day:'Excursiones',filter_airport:'Aeropuerto',filter_city:'Ciudad',filter_biz:'Negocios',tours_title:'Descubra los Países Bajos con estilo',tours_sub:'Transporte privado para excursiones y tours urbanos.',fleet_title:'El vehículo perfecto para cada viaje',fleet_sub:'Vehículos bien mantenidos para el máximo confort.',fleet_most:'Más elegido',prices_title:'Tarifas transparentes',prices_sub:'Sin taxímetro, sin sorpresas. Paga exactamente lo acordado.',contact_title:'¿Listo para su próximo viaje?',contact_sub:'Envíe un WhatsApp o llame directamente. Confirmado en 10 minutos.',wa_book:'Reservar por WhatsApp',call_btn:'Llamar',incl_title:'Siempre incluido',surcharge_title:'Recargos',route_label:'Ruta',comfort_label:'Confort',biz_label:'Business',bus_label:'Minibús',from_label:'Desde',price_footnote:'¿No encuentra su ruta? WhatsApp para un presupuesto.',price_quote:'Solicitar tarifa',footer_desc:'Servicio de taxi premium en Ámsterdam y toda Holanda.',or:'o'},
  ar:{nav_book:'احجز',nav_tours:'جولات',nav_fleet:'الأسطول',nav_prices:'الأسعار',nav_contact:'اتصل',form_title:'احجز رحلتك',form_sub:'سعر ثابت · بدون عداد · تأكيد فوري',svc_transfer:'نقل',svc_airport:'المطار',svc_business:'أعمال',trip_single:'ذهاب فقط',trip_return:'ذهاب وإياب',pickup_label:'عنوان الاستلام',pickup_ph:'فندق، محطة أو عنوان…',dropoff_label:'الوجهة',dropoff_ph:'فندق، محطة أو عنوان…',date_label:'التاريخ',time_label:'الوقت',ret_date:'تاريخ العودة',ret_time:'وقت العودة',pass_label:'المسافرون',veh_label:'المركبة',price_label:'سعر ثابت',price_on_req:'عند الطلب',book_btn:'احجز عبر واتساب',call_direct:'اتصل مباشرة',use_my_loc:'استخدم موقعي الحالي',map_hint_pickup:'انقر على الخريطة لتحديد موقع الاستلام',map_hint_dropoff:'انقر على الخريطة لتحديد الوجهة',map_show:'عرض المسار على الخريطة',map_hide:'إخفاء الخريطة',confirm_title:'راجع رحلتك',confirm_send:'أكّد عبر واتساب',est_distance:'المسافة',lbl_when:'متى',filter_all:'كل الجولات',filter_day:'رحلات يومية',filter_airport:'المطار',filter_city:'المدينة',filter_biz:'أعمال',tours_title:'اكتشف هولندا بأسلوب راقٍ',tours_sub:'نقل خاص للرحلات اليومية وجولات المدينة. أسعار شاملة ثابتة.',fleet_title:'السيارة المناسبة لكل رحلة',fleet_sub:'مركبات مُصانة ونظيفة لأقصى راحة.',fleet_most:'الأكثر اختياراً',prices_title:'أسعار شفافة',prices_sub:'بدون عداد، بدون مفاجآت. تدفع بالضبط ما تم الاتفاق عليه.',contact_title:'هل أنت مستعد لرحلتك؟',contact_sub:'أرسل رسالة واتساب أو اتصل مباشرة. تأكيد خلال 10 دقائق.',wa_book:'احجز عبر واتساب',call_btn:'اتصل الآن',incl_title:'مشمول دائماً',surcharge_title:'رسوم إضافية',route_label:'المسار',comfort_label:'مريح',biz_label:'أعمال',bus_label:'ميني باص',from_label:'من',price_footnote:'لم تجد مسارك؟ أرسل واتساب للحصول على عرض سعر.',price_quote:'اطلب سعراً',footer_desc:'خدمة تاكسي متميزة في أمستردام وعموم هولندا.',or:'أو'},
  tr:{nav_book:'Rezervasyon',nav_tours:'Turlar',nav_fleet:'Filo',nav_prices:'Fiyatlar',nav_contact:'İletişim',form_title:'Yolculuğunuzu Rezerve Edin',form_sub:'Sabit fiyat · Sayaç yok · Anında onay',svc_transfer:'Transfer',svc_airport:'Havalimanı',svc_business:'İş',trip_single:'Tek yön',trip_return:'Gidiş-dönüş',pickup_label:'Alış adresi',pickup_ph:'Otel, istasyon veya adres…',dropoff_label:'Varış noktası',dropoff_ph:'Otel, istasyon veya adres…',date_label:'Tarih',time_label:'Saat',ret_date:'Dönüş tarihi',ret_time:'Dönüş saati',pass_label:'Yolcular',veh_label:'Araç',price_label:'Sabit fiyat',price_on_req:'İstek üzerine',book_btn:"WhatsApp'tan Rezervasyon",call_direct:'doğrudan arayın',use_my_loc:'Mevcut konumumu kullan',map_hint_pickup:'Alış noktasını işaretlemek için haritaya dokunun',map_hint_dropoff:'Varış noktasını işaretlemek için haritaya dokunun',map_show:'Rotayı haritada göster',map_hide:'Haritayı gizle',confirm_title:'Yolculuğunuzu kontrol edin',confirm_send:'WhatsApp ile onayla',est_distance:'Mesafe',lbl_when:'Ne zaman',filter_all:'Tüm turlar',filter_day:'Günlük turlar',filter_airport:'Havalimanı',filter_city:'Şehir',filter_biz:'İş',tours_title:"Hollanda'yı Şıkça Keşfedin",tours_sub:'Günlük turlar ve şehir gezileri için özel ulaşım.',fleet_title:'Her yolculuk için doğru araç',fleet_sub:'Maksimum konfor için bakımlı, temiz araçlar.',fleet_most:'En çok tercih edilen',prices_title:'Şeffaf fiyatlar',prices_sub:'Sayaç yok, sürpriz yok. Tam olarak anlaştığınızı ödersiniz.',contact_title:'Bir sonraki yolculuğunuza hazır mısınız?',contact_sub:"WhatsApp gönderin veya doğrudan arayın. 10 dakika içinde onaylanır.",wa_book:"WhatsApp'tan Rezervasyon",call_btn:'Ara',incl_title:'Her zaman dahil',surcharge_title:'Ek ücretler',route_label:'Güzergah',comfort_label:'Konfor',biz_label:'Business',bus_label:'Minibüs',from_label:'İtibaren',price_footnote:'Güzergahınızı bulamadınız mı? WhatsApp gönderin.',price_quote:'Fiyat sor',footer_desc:"Amsterdam ve Hollanda'nın tamamında premium taksi hizmeti.",or:'veya'},
};

let currentLang = localStorage.getItem('gh_lang') || 'nl';
function T(key) { return (LANGS[currentLang]||LANGS.nl)[key] || (LANGS.nl[key]||key); }

function applyLang() {
  const isRTL = currentLang === 'ar';
  document.documentElement.lang = currentLang;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const v=T(el.dataset.i18n); if(v) el.textContent=v; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ const v=T(el.dataset.i18nPh); if(v) el.placeholder=v; });
  const lbl=document.getElementById('lang-label'); if(lbl) lbl.textContent=currentLang.toUpperCase();
  document.querySelectorAll('.lang-opt').forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));
  renderTours(document.querySelector('.filter-btn.active')?.dataset.filter||'all');
  updateMapHint(mapMode==='pickup'?T('map_hint_pickup'):T('map_hint_dropoff'));
}

function initLang() {
  applyLang();
  const btn=document.getElementById('lang-btn');
  const dd=document.getElementById('lang-dd');
  btn?.addEventListener('click',e=>{ e.stopPropagation(); dd?.classList.toggle('open'); });
  document.addEventListener('click',()=>dd?.classList.remove('open'));
  document.querySelectorAll('.lang-opt').forEach(b=>{
    b.addEventListener('click',()=>{ currentLang=b.dataset.lang; localStorage.setItem('gh_lang',currentLang); applyLang(); dd?.classList.remove('open'); });
  });
}

// ── Tours data ──
const TOURS = [
  {id:'airport',cat:'luchthaven',photo:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=70',name:'Schiphol Airport Transfer',tagline:'Stressvrij van deur tot gate',duration:'30–60 min',priceFrom:52,priceUnit:'p/a',badge:'Meest geboekt',badgeClass:'badge-popular',highlights:['Vluchtmonitoring inbegrepen','45 min. gratis wachttijd','Bagagehulp inbegrepen']},
  {id:'keukenhof',cat:'daguitje',photo:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=70',name:'Keukenhof Dag Tour',tagline:'De mooiste bloementuin ter wereld',duration:'6–8 uur',priceFrom:235,priceUnit:'p/a',badge:'Apr – Mei',badgeClass:'badge-seasonal',highlights:['Ophalen bij u thuis','Vrije tijd in de tuinen','Chauffeur wacht ter plaatse']},
  {id:'zaanse',cat:'daguitje',photo:'https://images.unsplash.com/photo-1509842216049-2f3a76dbe2f0?auto=format&fit=crop&w=600&q=70',name:'Zaanse Schans',tagline:'Authentiek Hollands erfgoed',duration:'3–4 uur',priceFrom:155,priceUnit:'p/a',highlights:['Werkende historische molens','Ambachten & museumwinkels','Retour inbegrepen']},
  {id:'volendam',cat:'daguitje',photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=70',name:'Volendam & Marken',tagline:'Twee pittoreske vissersdorpen',duration:'4–5 uur',priceFrom:175,priceUnit:'p/a',highlights:['Volendam & Marken combinatie','Typisch Hollandse sfeer','Eventueel overtocht per boot']},
  {id:'rotterdam',cat:'daguitje',photo:'https://images.unsplash.com/photo-1558618047-3c8d77df3c7c?auto=format&fit=crop&w=600&q=70',name:'Rotterdam & Kinderdijk',tagline:'Moderne architectuur & UNESCO-molens',duration:'7–9 uur',priceFrom:275,priceUnit:'p/a',highlights:['Kubuswonigen & Markthal','19 UNESCO-erfgoed molens','Flexibel programma']},
  {id:'city',cat:'stad',photo:'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=600&q=70',name:'Amsterdam City Tour',tagline:'De highlights van de hoofdstad',duration:'2–3 uur',priceFrom:105,priceUnit:'p/a',highlights:['Grachten & Jordaan','Rijksmuseum & Vondelpark','Volledig aanpasbaar']},
  {id:'business',cat:'zakelijk',photo:'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=70',name:'Zakelijk Dagpakket',tagline:'Uw persoonlijke chauffeur voor een dag',duration:'8 uur',priceFrom:445,priceUnit:'p/dag',badge:'Premium',badgeClass:'badge-popular',highlights:['Chauffeur 8 uur standby','Factuur met BTW','Representatief voertuig']},
  {id:'haarlem',cat:'stad',photo:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=70',name:'Haarlem City Tour',tagline:'Historische havenstad vlakbij Amsterdam',duration:'3 uur',priceFrom:125,priceUnit:'p/a',highlights:['Grote Markt & Bavokerk','Stijlvolle shoppingstraten','Retour inbegrepen']},
];

// ── Prijstabel ──
const PRICES = {
  'centrum-schiphol':{comfort:52,business:65,bus:88},'centrum-rai':{comfort:22,business:30,bus:45},'centrum-haarlem':{comfort:42,business:52,bus:72},'centrum-utrecht':{comfort:75,business:92,bus:128},'centrum-denhaag':{comfort:110,business:135,bus:188},'centrum-rotterdam':{comfort:118,business:145,bus:202},'centrum-almere':{comfort:52,business:65,bus:90},'centrum-zaandam':{comfort:35,business:44,bus:62},'centrum-amstelveen':{comfort:28,business:36,bus:52},'centrum-diemen':{comfort:24,business:32,bus:48},'centrum-lisse':{comfort:55,business:68,bus:92},'centrum-volendam':{comfort:42,business:52,bus:72},'centrum-zaanse':{comfort:38,business:48,bus:65},'noord-schiphol':{comfort:55,business:68,bus:92},'noord-centrum':{comfort:20,business:27,bus:40},'noord-rai':{comfort:30,business:40,bus:56},'noord-haarlem':{comfort:48,business:60,bus:82},'noord-utrecht':{comfort:82,business:100,bus:140},'oost-schiphol':{comfort:58,business:72,bus:98},'oost-centrum':{comfort:18,business:25,bus:38},'oost-rai':{comfort:18,business:24,bus:36},'oost-haarlem':{comfort:55,business:68,bus:92},'oost-utrecht':{comfort:72,business:88,bus:122},'zuidoost-schiphol':{comfort:55,business:68,bus:92},'zuidoost-centrum':{comfort:24,business:32,bus:48},'zuidoost-rai':{comfort:14,business:20,bus:32},'west-schiphol':{comfort:48,business:60,bus:82},'west-centrum':{comfort:16,business:22,bus:34},'west-haarlem':{comfort:40,business:50,bus:70},'nieuwwest-schiphol':{comfort:44,business:55,bus:76},'nieuwwest-centrum':{comfort:20,business:26,bus:40},'zuid-schiphol':{comfort:48,business:60,bus:82},'zuid-centrum':{comfort:18,business:24,bus:36},'zuid-rai':{comfort:14,business:20,bus:30},'schiphol-haarlem':{comfort:35,business:44,bus:62},'schiphol-utrecht':{comfort:80,business:98,bus:138},'schiphol-denhaag':{comfort:82,business:100,bus:140},'schiphol-rotterdam':{comfort:95,business:118,bus:165},'schiphol-almere':{comfort:62,business:76,bus:108},'rai-haarlem':{comfort:48,business:60,bus:82},'rai-utrecht':{comfort:68,business:82,bus:115},
};

// ── Locaties: hotels, stations, metro, wijken (met coördinaten) ──
const LOCAL_LOCS = [
  // Luchthaven
  {label:'Schiphol Airport',icon:'plane',zone:'schiphol',lat:52.3105,lon:4.7683},
  // Treinstations
  {label:'Amsterdam Centraal Station',icon:'train',zone:'centrum',lat:52.3791,lon:4.9003},
  {label:'Amsterdam Zuid Station',icon:'train',zone:'zuid',lat:52.3390,lon:4.8730},
  {label:'Amsterdam Sloterdijk Station',icon:'train',zone:'west',lat:52.3890,lon:4.8380},
  {label:'Amsterdam Amstel Station',icon:'train',zone:'oost',lat:52.3465,lon:4.9175},
  {label:'Amsterdam Bijlmer ArenA Station',icon:'train',zone:'zuidoost',lat:52.3120,lon:4.9470},
  {label:'Amsterdam Lelylaan Station',icon:'train',zone:'nieuwwest',lat:52.3570,lon:4.8330},
  {label:'Amsterdam RAI Station',icon:'train',zone:'rai',lat:52.3370,lon:4.8900},
  {label:'Amsterdam Muiderpoort Station',icon:'train',zone:'oost',lat:52.3600,lon:4.9300},
  // Metro
  {label:'Metro Nieuwmarkt',icon:'metro',zone:'centrum',lat:52.3722,lon:4.9008},
  {label:'Metro Waterlooplein',icon:'metro',zone:'centrum',lat:52.3680,lon:4.9030},
  {label:'Metro Weesperplein',icon:'metro',zone:'centrum',lat:52.3620,lon:4.9080},
  {label:'Metro De Pijp',icon:'metro',zone:'zuid',lat:52.3550,lon:4.8910},
  {label:'Metro Vijzelgracht',icon:'metro',zone:'centrum',lat:52.3590,lon:4.8910},
  // Hotels
  {label:'Hotel Okura Amsterdam',icon:'hotel',zone:'zuid',lat:52.3490,lon:4.8920},
  {label:'Waldorf Astoria Amsterdam',icon:'hotel',zone:'centrum',lat:52.3640,lon:4.8930},
  {label:'Conservatorium Hotel',icon:'hotel',zone:'zuid',lat:52.3585,lon:4.8795},
  {label:'InterContinental Amstel Amsterdam',icon:'hotel',zone:'centrum',lat:52.3590,lon:4.9050},
  {label:'Hilton Amsterdam',icon:'hotel',zone:'zuid',lat:52.3460,lon:4.8730},
  {label:'NH Collection Grand Hotel Krasnapolsky',icon:'hotel',zone:'centrum',lat:52.3725,lon:4.8930},
  {label:'Mövenpick Hotel Amsterdam City Centre',icon:'hotel',zone:'centrum',lat:52.3790,lon:4.9100},
  {label:'DoubleTree by Hilton Amsterdam Centraal',icon:'hotel',zone:'centrum',lat:52.3780,lon:4.9010},
  {label:'Pulitzer Amsterdam',icon:'hotel',zone:'centrum',lat:52.3720,lon:4.8840},
  {label:'Amsterdam Marriott Hotel',icon:'hotel',zone:'centrum',lat:52.3630,lon:4.8810},
  {label:'The Dylan Amsterdam',icon:'hotel',zone:'centrum',lat:52.3690,lon:4.8850},
  {label:'W Amsterdam',icon:'hotel',zone:'centrum',lat:52.3730,lon:4.8910},
  {label:'Kimpton De Witt Amsterdam',icon:'hotel',zone:'centrum',lat:52.3770,lon:4.8990},
  {label:'Andaz Amsterdam Prinsengracht',icon:'hotel',zone:'centrum',lat:52.3640,lon:4.8830},
  {label:'Park Hotel Amsterdam',icon:'hotel',zone:'centrum',lat:52.3620,lon:4.8820},
  {label:'citizenM Amsterdam Amstel',icon:'hotel',zone:'zuid',lat:52.3360,lon:4.8900},
  {label:'Sheraton Amsterdam Airport Hotel',icon:'hotel',zone:'schiphol',lat:52.3090,lon:4.7600},
  // Wijken & venues
  {label:'Dam / Amsterdam Centrum',icon:'pin',zone:'centrum',lat:52.3730,lon:4.8930},
  {label:'Amsterdam Noord (NDSM-Werf)',icon:'pin',zone:'noord',lat:52.4014,lon:4.8919},
  {label:'Amsterdam Oost (Watergraafsmeer)',icon:'pin',zone:'oost',lat:52.3500,lon:4.9300},
  {label:'Amsterdam West (Jordaan)',icon:'pin',zone:'west',lat:52.3740,lon:4.8810},
  {label:'Amsterdam Zuidoost (Bijlmer)',icon:'pin',zone:'zuidoost',lat:52.3120,lon:4.9470},
  {label:'Johan Cruyff ArenA',icon:'building',zone:'zuidoost',lat:52.3143,lon:4.9419},
  {label:'Ziggo Dome',icon:'building',zone:'zuidoost',lat:52.3140,lon:4.9370},
  {label:'Amsterdam RAI',icon:'building',zone:'rai',lat:52.3410,lon:4.8880},
  {label:'Rijksmuseum',icon:'building',zone:'zuid',lat:52.3600,lon:4.8852},
  {label:'Amsterdam UMC (AMC)',icon:'hospital',zone:'zuidoost',lat:52.2940,lon:4.9570},
  // Andere steden
  {label:'Haarlem Centrum',icon:'city',zone:'haarlem',lat:52.3810,lon:4.6360},
  {label:'Utrecht Centraal',icon:'train',zone:'utrecht',lat:52.0894,lon:5.1100},
  {label:'Den Haag Centraal',icon:'train',zone:'denhaag',lat:52.0805,lon:4.3250},
  {label:'Rotterdam Centraal',icon:'train',zone:'rotterdam',lat:51.9244,lon:4.4690},
  {label:'Almere Centrum',icon:'city',zone:'almere',lat:52.3750,lon:5.2210},
  {label:'Zaanse Schans',icon:'pin',zone:'zaandam',lat:52.4744,lon:4.8170},
  {label:'Amstelveen Centrum',icon:'city',zone:'amstelveen',lat:52.3010,lon:4.8630},
  {label:'Keukenhof, Lisse',icon:'pin',zone:'lisse',lat:52.2697,lon:4.5469},
  {label:'Volendam Haven',icon:'pin',zone:'volendam',lat:52.4940,lon:5.0730},
];

function detectZone(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes('schiphol')||t.includes('airport')||t.includes('luchthaven')) return 'schiphol';
  if ((t.includes('centraal')&&!t.includes('haag')&&!t.includes('utrecht')&&!t.includes('rotterdam'))||t.includes('amsterdam cs')) return 'centrum';
  if (t.includes('ndsm')||(t.includes('noord')&&t.includes('amsterdam'))) return 'noord';
  if (t.includes('zuidoost')||t.includes('bijlmer')||t.includes('arena')||t.includes('rai')||t.includes('ziggo')||t.includes('afas')||t.includes('amc')||t.includes('umc')) return 'zuidoost';
  if (t.includes('nieuw-west')||t.includes('nieuwwest')||t.includes('slotervaart')||t.includes('lelylaan')) return 'nieuwwest';
  if (t.includes('buitenveldert')||t.includes('rivierenbuurt')||t.includes('okura')||t.includes('hilton')||t.includes('conservatorium')||t.includes('de pijp')) return 'zuid';
  if (t.includes('jordaan')||t.includes('westerpark')||t.includes('sloterdijk')||(t.includes('west')&&t.includes('amsterdam'))) return 'west';
  if ((t.includes('oost')&&t.includes('amsterdam'))||t.includes('watergraafsmeer')||t.includes('olvg')||t.includes('amstel station')||t.includes('muiderpoort')) return 'oost';
  if (t.includes('dam')||t.includes('leidseplein')||t.includes('rembrandtplein')||t.includes('centrum')||t.includes('hotel')||t.includes('nieuwmarkt')||t.includes('waterlooplein')) return 'centrum';
  if (t.includes('haarlem')) return 'haarlem';
  if (t.includes('utrecht')) return 'utrecht';
  if (t.includes('den haag')||t.includes('haag')) return 'denhaag';
  if (t.includes('rotterdam')) return 'rotterdam';
  if (t.includes('almere')) return 'almere';
  if (t.includes('zaanse')||t.includes('zaandam')) return 'zaandam';
  if (t.includes('amstelveen')) return 'amstelveen';
  if (t.includes('lisse')||t.includes('keukenhof')) return 'lisse';
  if (t.includes('volendam')) return 'volendam';
  if (t.includes('diemen')) return 'diemen';
  if (t.includes('rai')) return 'rai';
  if (t.includes('amsterdam')) return 'centrum';
  return null;
}

function lookupPrice(from, to, vehicle) {
  if (!from||!to||from===to) return null;
  const e = PRICES[`${from}-${to}`]||PRICES[`${to}-${from}`];
  return e ? (e[vehicle]||null) : null;
}

// ── Tabs ──
function initTabs() {
  document.querySelectorAll('[data-tab-btn]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      const target=btn.dataset.tabBtn;
      document.querySelectorAll('[data-tab-btn]').forEach(b=>b.classList.toggle('active',b.dataset.tabBtn===target));
      document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active',p.id===`tab-${target}`));
      if (target==='boek') setTimeout(()=>map?.invalidateSize(),60);
      window.scrollTo(0,0);
      document.getElementById('nav-mobile')?.classList.remove('open');
    });
  });
}

// ── Map ──
let map, pickupMarker, dropoffMarker, routeLine;
let pickupCoords=null, dropoffCoords=null;
let mapMode='pickup';

function initMap() {
  if (typeof L==='undefined') return;
  map=L.map('map',{center:[52.3676,4.9041],zoom:12,zoomControl:false,attributionControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',maxZoom:19,subdomains:'abcd'}).addTo(map);
  map.on('click', async e=>{
    const {lat,lng}=e.latlng;
    setMarker(mapMode,lat,lng);
    const addr=await reverseGeocode(lat,lng);
    if (addr) { document.getElementById(mapMode).value=addr; updatePrice(); }
    if (mapMode==='pickup'&&!dropoffMarker) switchMapMode('dropoff');
  });
  document.getElementById('zoom-in')?.addEventListener('click',()=>map.zoomIn());
  document.getElementById('zoom-out')?.addEventListener('click',()=>map.zoomOut());
  document.getElementById('myloc-btn')?.addEventListener('click',()=>locateUser());
  document.getElementById('map-toggle')?.addEventListener('click',()=>{
    const panel=document.getElementById('map-panel');
    const lbl=document.getElementById('map-toggle-label');
    const open=panel.classList.toggle('map-open');
    lbl.textContent=open?T('map_hide'):T('map_show');
    if (open) setTimeout(()=>map.invalidateSize(),50);
  });
}

function locateUser() {
  if (!navigator.geolocation) return;
  const btn=document.getElementById('use-my-loc');
  btn?.classList.add('locating');
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat,longitude:lng}=pos.coords;
    map?.flyTo([lat,lng],15,{duration:1});
    setMarker('pickup',lat,lng);
    const addr=await reverseGeocode(lat,lng);
    if (addr) { document.getElementById('pickup').value=addr; updatePrice(); }
    btn?.classList.remove('locating');
    switchMapMode('dropoff');
    maybeOpenMobileMap();
  }, ()=>{ btn?.classList.remove('locating'); },{enableHighAccuracy:true,timeout:8000});
}

function makeMarkerIcon(type) {
  const isPickup=type==='pickup';
  const fill=isPickup?'#C8A84C':'#FFFFFF';
  const shadow=isPickup?'rgba(200,168,76,0.35)':'rgba(255,255,255,0.2)';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadow}"/></filter><path d="M15 0C8.373 0 3 5.373 3 12c0 9 12 26 12 26s12-17 12-26C27 5.373 21.627 0 15 0z" fill="${fill}" filter="url(#sh)"/><circle cx="15" cy="12" r="4.5" fill="white" opacity="0.9"/></svg>`;
  return L.divIcon({html:svg,className:'custom-pin',iconSize:[30,38],iconAnchor:[15,38],popupAnchor:[0,-38]});
}

function setMarker(type,lat,lng) {
  if (type==='pickup') pickupCoords={lat,lng}; else dropoffCoords={lat,lng};
  const icon=makeMarkerIcon(type);
  if (type==='pickup') {
    if (pickupMarker) pickupMarker.setLatLng([lat,lng]);
    else {
      pickupMarker=L.marker([lat,lng],{icon,draggable:true,zIndexOffset:10}).addTo(map);
      pickupMarker.on('dragend', async ()=>{
        const {lat,lng}=pickupMarker.getLatLng();
        pickupCoords={lat,lng};
        const addr=await reverseGeocode(lat,lng);
        if (addr) { document.getElementById('pickup').value=addr; updatePrice(); }
        drawRouteLine();
      });
    }
    animateMarker(pickupMarker);
  } else {
    if (dropoffMarker) dropoffMarker.setLatLng([lat,lng]);
    else {
      dropoffMarker=L.marker([lat,lng],{icon,draggable:true,zIndexOffset:5}).addTo(map);
      dropoffMarker.on('dragend', async ()=>{
        const {lat,lng}=dropoffMarker.getLatLng();
        dropoffCoords={lat,lng};
        const addr=await reverseGeocode(lat,lng);
        if (addr) { document.getElementById('dropoff').value=addr; updatePrice(); }
        drawRouteLine();
      });
    }
    animateMarker(dropoffMarker);
  }
  drawRouteLine();
  fitMarkers();
  if (pickupMarker&&dropoffMarker) maybeOpenMobileMap();
}

function animateMarker(marker) {
  const el=marker.getElement();
  if (!el) return;
  el.style.transition='none';
  el.style.transform+=' translateY(-12px)';
  el.style.opacity='0';
  requestAnimationFrame(()=>{
    el.style.transition='transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease';
    el.style.transform=el.style.transform.replace(' translateY(-12px)','');
    el.style.opacity='1';
  });
}

function drawRouteLine() {
  if (!pickupMarker||!dropoffMarker) return;
  if (routeLine) map.removeLayer(routeLine);
  routeLine=L.polyline([pickupMarker.getLatLng(),dropoffMarker.getLatLng()],{color:'#E5484D',weight:3,opacity:.9,className:'route-line'}).addTo(map);
}

function fitMarkers() {
  if (!map) return;
  if (pickupMarker&&dropoffMarker) map.fitBounds([pickupMarker.getLatLng(),dropoffMarker.getLatLng()],{padding:[60,60],maxZoom:14,animate:true});
  else if (pickupMarker) map.flyTo(pickupMarker.getLatLng(),14,{duration:.8});
  else if (dropoffMarker) map.flyTo(dropoffMarker.getLatLng(),14,{duration:.8});
}

function maybeOpenMobileMap() {
  const panel=document.getElementById('map-panel');
  if (panel&&window.innerWidth<768&&!panel.classList.contains('map-open')) {
    panel.classList.add('map-open');
    const lbl=document.getElementById('map-toggle-label'); if(lbl) lbl.textContent=T('map_hide');
    setTimeout(()=>map?.invalidateSize(),60);
  }
}

function switchMapMode(mode) {
  mapMode=mode;
  document.querySelectorAll('.pin-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  updateMapHint(mode==='pickup'?T('map_hint_pickup'):T('map_hint_dropoff'));
}

function updateMapHint(msg) {
  const el=document.getElementById('map-hint-text');
  if (el) el.textContent=msg;
  const hint=document.getElementById('map-hint');
  if (hint) { hint.classList.remove('hidden-hint'); clearTimeout(hint._hide); hint._hide=setTimeout(()=>hint.classList.add('hidden-hint'),3500); }
}

// ── Afstand (haversine + wegfactor) ──
function estDistanceKm(a,b) {
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  const d=2*R*Math.asin(Math.sqrt(s))*1.35;
  return d<10?d.toFixed(1):Math.round(d);
}

// ── Geocoding ──
const geocodeCache=new Map();
async function geocode(query) {
  if (geocodeCache.has(query)) return geocodeCache.get(query);
  try {
    const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=nl&accept-language=nl`,{headers:{'User-Agent':'GHTaxiAmsterdam/1.0'}});
    if (!res.ok) return [];
    const data=await res.json();
    geocodeCache.set(query,data);
    return data;
  } catch { return []; }
}
async function reverseGeocode(lat,lng) {
  try {
    const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=nl`,{headers:{'User-Agent':'GHTaxiAmsterdam/1.0'}});
    if (!res.ok) return null;
    const d=await res.json();
    if (!d.address) return d.display_name||null;
    const {road,house_number,city,town,municipality}=d.address;
    const street=[road,house_number].filter(Boolean).join(' ');
    const place=city||town||municipality||'';
    return [street,place].filter(Boolean).join(', ')||d.display_name;
  } catch { return null; }
}

// ── Autocomplete ──
function setupAutocomplete(inputId,suggestId) {
  const inp=document.getElementById(inputId);
  const box=document.getElementById(suggestId);
  if (!inp||!box) return;
  let timer, lastQuery='', activeIdx=-1;

  const filterLocal=q=>{ const t=q.toLowerCase(); return LOCAL_LOCS.filter(l=>l.label.toLowerCase().includes(t)).slice(0,6); };

  function renderSuggestions(local,api) {
    const all=[...local];
    if (api) api.forEach(r=>{ const label=shortAddress(r); if (label&&!all.find(l=>l.label.toLowerCase()===label.toLowerCase())) all.push({label,icon:'pin',lat:parseFloat(r.lat),lon:parseFloat(r.lon)}); });
    if (!all.length) { hideSuggest(); return; }
    box.innerHTML=all.slice(0,8).map((l,i)=>`<div class="suggest-item" data-idx="${i}" data-label="${escHtml(l.label)}" ${l.lat?`data-lat="${l.lat}" data-lon="${l.lon}"`:''}><div class="suggest-icon">${iconSvg(l.icon)}</div><span>${l.label}</span></div>`).join('');
    box.classList.add('open');
    activeIdx=-1;
    box.querySelectorAll('.suggest-item').forEach(el=>{
      el.addEventListener('mousedown',ev=>{
        ev.preventDefault();
        inp.value=el.dataset.label;
        hideSuggest();
        if (el.dataset.lat&&map) setMarker(inputId==='pickup'?'pickup':'dropoff',parseFloat(el.dataset.lat),parseFloat(el.dataset.lon));
        updatePrice();
        if (inputId==='pickup') switchMapMode('dropoff');
      });
    });
  }
  function hideSuggest() { box.classList.remove('open'); box.innerHTML=''; activeIdx=-1; }

  inp.addEventListener('input',()=>{
    const q=inp.value.trim();
    if (inputId==='pickup') pickupCoords=null; else dropoffCoords=null;
    if (!q||q.length<2) { hideSuggest(); return; }
    renderSuggestions(filterLocal(q),null);
    if (q===lastQuery) return;
    lastQuery=q;
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      box.innerHTML='<div class="suggest-loading">…</div>';
      box.classList.add('open');
      const api=await geocode(q);
      renderSuggestions(filterLocal(q),api);
    },450);
  });
  inp.addEventListener('blur',()=>setTimeout(hideSuggest,160));
  inp.addEventListener('focus',()=>{ if (inp.value.length>=2) renderSuggestions(filterLocal(inp.value.trim()),null); });
  inp.addEventListener('keydown',e=>{
    const items=box.querySelectorAll('.suggest-item');
    if (e.key==='ArrowDown') { e.preventDefault(); activeIdx=Math.min(activeIdx+1,items.length-1); highlightItem(items); }
    else if (e.key==='ArrowUp') { e.preventDefault(); activeIdx=Math.max(activeIdx-1,-1); highlightItem(items); }
    else if (e.key==='Enter'&&activeIdx>=0) { e.preventDefault(); items[activeIdx]?.dispatchEvent(new MouseEvent('mousedown')); }
    else if (e.key==='Escape') hideSuggest();
  });
  inp.addEventListener('change',updatePrice);
  function highlightItem(items) { items.forEach((el,i)=>el.classList.toggle('active',i===activeIdx)); items[activeIdx]?.scrollIntoView({block:'nearest'}); }
}

function shortAddress(r) { return (r?.display_name||'').split(',').slice(0,3).join(',').trim(); }
function escHtml(s) { return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function iconSvg(type) {
  const m={
    pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>',
    train:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 4.96.48 5.57 1H6.43C7.04 4.48 8.49 4 12 4zm6 10H6v-4h12v4zm-8.5 3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>',
    metro:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2h3.54l2 2H18v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 16A1.5 1.5 0 119 14.5 1.5 1.5 0 017.5 16zm9 0a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5zM18 11H6V6h12z"/></svg>',
    plane:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    hotel:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 13a3 3 0 100-6 3 3 0 000 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 00-4-4z"/></svg>',
    building:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
    hospital:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>',
    city:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>',
  };
  return m[type]||m.pin;
}

// ── Price ──
function updatePrice() {
  const pu=(document.getElementById('pickup')?.value||'').trim();
  const dr=(document.getElementById('dropoff')?.value||'').trim();
  const vehicle=document.getElementById('vehicle')?.value||'business';
  const box=document.getElementById('price-box');
  const amtEl=document.getElementById('price-amount');
  if (!box||!amtEl) return;
  if (pu.length<3||dr.length<3) { box.classList.remove('visible'); return; }
  const price=lookupPrice(detectZone(pu),detectZone(dr),vehicle);
  box.classList.add('visible');
  if (price) { amtEl.textContent=`€ ${price}`; amtEl.style.fontSize=''; }
  else { amtEl.textContent=T('price_on_req'); amtEl.style.fontSize='1.2rem'; }
}

// ── WhatsApp bericht ──
function buildMsg(f) {
  const vn={comfort:'Comfort (sedan)',business:'Business (E-klasse/SUV)',bus:'Minibus (max 8 pers.)'};
  let m='Hallo, ik wil graag een taxi boeken bij GH Taxi Amsterdam.\n\n';
  if (f.pickup)   m+=`Ophaaladres: ${f.pickup}\n`;
  if (f.dropoff)  m+=`Bestemming: ${f.dropoff}\n`;
  if (f.date)     m+=`Datum: ${fmtDate(f.date)}\n`;
  if (f.time)     m+=`Tijdstip: ${f.time}\n`;
  if (f.retDate)  m+=`Retour: ${fmtDate(f.retDate)} om ${f.retTime||'...'}\n`;
  if (f.pax)      m+=`Passagiers: ${f.pax}\n`;
  if (f.vehicle)  m+=`Voertuig: ${vn[f.vehicle]||f.vehicle}\n`;
  if (f.dist)     m+=`Afstand: ± ${f.dist} km\n`;
  if (f.price)    m+=`Vaste prijs: € ${f.price}\n`;
  m+='\nKunt u de rit bevestigen?';
  return encodeURIComponent(m);
}
function fmtDate(s) { if (!s) return ''; const [y,m,d]=s.split('-'); return `${parseInt(d)}-${parseInt(m)}-${y}`; }

function collectFields() {
  const pu=document.getElementById('pickup')?.value.trim();
  const dr=document.getElementById('dropoff')?.value.trim();
  const vehicle=document.getElementById('vehicle')?.value;
  const price=lookupPrice(detectZone(pu),detectZone(dr),vehicle);
  let dist=null;
  if (pickupCoords&&dropoffCoords) dist=estDistanceKm(pickupCoords,dropoffCoords);
  return {pickup:pu,dropoff:dr,date:document.getElementById('date')?.value,time:document.getElementById('time')?.value,retDate:document.getElementById('return-date')?.value,retTime:document.getElementById('return-time')?.value,pax:document.getElementById('passengers')?.value,vehicle,price,dist};
}

// ── Confirm modal (route preview) ──
let confirmMap, cPickM, cDropM, cLine;
function initConfirmMap() {
  if (confirmMap||typeof L==='undefined') return;
  confirmMap=L.map('confirm-map',{zoomControl:false,attributionControl:false,scrollWheelZoom:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd'}).addTo(confirmMap);
  confirmMap.setView([52.3676,4.9041],11);
}

async function openConfirm() {
  const puEl=document.getElementById('pickup'), drEl=document.getElementById('dropoff');
  const pu=(puEl?.value||'').trim(), dr=(drEl?.value||'').trim();
  if (pu.length<3) { shake(puEl); puEl?.focus(); return; }
  if (dr.length<3) { shake(drEl); drEl?.focus(); return; }
  const f=collectFields();
  document.getElementById('confirm-pickup').textContent=pu;
  document.getElementById('confirm-dropoff').textContent=dr;
  document.getElementById('confirm-when').textContent=(f.date?fmtDate(f.date):'—')+(f.time?' · '+f.time:'');
  document.getElementById('confirm-price').textContent=f.price?`€ ${f.price}`:T('price_on_req');
  document.getElementById('confirm-dist').textContent=f.dist?`± ${f.dist} km`:'—';

  const modal=document.getElementById('confirm-modal');
  modal.classList.add('open');
  document.body.style.overflow='hidden';
  initConfirmMap();
  setTimeout(()=>confirmMap?.invalidateSize(),60);

  let pc=pickupCoords, dc=dropoffCoords;
  if (!pc) { const g=await geocode(pu); if (g&&g[0]) pc={lat:+g[0].lat,lng:+g[0].lon}; }
  if (!dc) { const g=await geocode(dr); if (g&&g[0]) dc={lat:+g[0].lat,lng:+g[0].lon}; }

  const wrap=document.getElementById('confirm-map-wrap');
  if (pc&&dc&&confirmMap) {
    wrap.style.display='';
    if (cPickM) confirmMap.removeLayer(cPickM);
    if (cDropM) confirmMap.removeLayer(cDropM);
    if (cLine) confirmMap.removeLayer(cLine);
    cPickM=L.marker([pc.lat,pc.lng],{icon:makeMarkerIcon('pickup')}).addTo(confirmMap);
    cDropM=L.marker([dc.lat,dc.lng],{icon:makeMarkerIcon('dropoff')}).addTo(confirmMap);
    cLine=L.polyline([[pc.lat,pc.lng],[dc.lat,dc.lng]],{color:'#E5484D',weight:3,opacity:.9,className:'route-line'}).addTo(confirmMap);
    setTimeout(()=>{ confirmMap.invalidateSize(); confirmMap.fitBounds(cLine.getBounds(),{padding:[36,36],maxZoom:13}); },80);
    if (!f.dist) document.getElementById('confirm-dist').textContent=`± ${estDistanceKm(pc,dc)} km`;
  } else {
    wrap.style.display='none';
  }
}

function closeConfirm() {
  document.getElementById('confirm-modal')?.classList.remove('open');
  document.body.style.overflow='';
}

function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

function initConfirm() {
  document.getElementById('confirm-close')?.addEventListener('click',closeConfirm);
  document.getElementById('confirm-backdrop')?.addEventListener('click',closeConfirm);
  document.addEventListener('keydown',e=>{ if (e.key==='Escape') closeConfirm(); });
  document.getElementById('confirm-send')?.addEventListener('click',()=>{
    const f=collectFields();
    window.open(`https://wa.me/${PHONE}?text=${buildMsg(f)}`,'_blank','noopener');
    closeConfirm();
  });
}

// ── Tours ──
function renderTours(filter) {
  const grid=document.getElementById('tours-grid');
  if (!grid) return;
  const list=filter==='all'?TOURS:TOURS.filter(t=>t.cat===filter);
  grid.innerHTML=list.map((t,i)=>`
    <article class="tour-card" data-cat="${t.cat}" style="animation-delay:${i*60}ms">
      <div class="tour-art">
        <img class="tour-img" src="${t.photo}" alt="${t.name}" loading="lazy">
        ${t.badge?`<div class="tour-art-badge ${t.badgeClass||''}">${t.badge}</div>`:''}
      </div>
      <div class="tour-body">
        <h3 class="tour-name">${t.name}</h3>
        <p class="tour-tagline">${t.tagline}</p>
        <div class="tour-meta"><div class="tour-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>${t.duration}</div></div>
        <div style="margin-bottom:.75rem"><div class="tour-price-from">${T('from_label')}</div><div><span class="tour-price money">€ ${t.priceFrom}</span> <span class="tour-price-unit">${t.priceUnit}</span></div></div>
        <ul class="tour-highlights">${t.highlights.map(h=>`<li class="tour-highlight"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>${h}</li>`).join('')}</ul>
        <button class="tour-book-btn" onclick="bookTour('${escHtml(t.name)}',${t.priceFrom})"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.16c-.17.2-.35.22-.64.07a8.1 8.1 0 01-2.39-1.47 8.97 8.97 0 01-1.65-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.14-.17.19-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37C7.06 7.1 6.3 7.83 6.3 9.29c0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12 0C5.37 0 0 5.37 0 12a11.94 11.94 0 001.52 5.85L0 24l6.34-1.5A11.96 11.96 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.82a9.81 9.81 0 01-5.02-1.38l-.36-.21-3.76.89.94-3.67-.23-.37A9.82 9.82 0 012.18 12 9.82 9.82 0 0112 2.18 9.82 9.82 0 0121.82 12 9.82 9.82 0 0112 21.82z"/></svg>${T('wa_book')}</button>
      </div>
    </article>`).join('');
}

window.bookTour=function(name,price) {
  const msg=encodeURIComponent(`Hallo, ik wil graag de volgende tour boeken:\n\nTour: ${name}\nVanaf: € ${price}\n\nKunt u beschikbaarheid en datum bevestigen?`);
  window.open(`https://wa.me/${PHONE}?text=${msg}`,'_blank','noopener');
};

// ── Nav ──
function initNav() {
  const nav=document.getElementById('nav');
  const burger=document.getElementById('hamburger');
  const mob=document.getElementById('nav-mobile');
  const update=()=>nav.classList.toggle('solid',window.scrollY>30);
  window.addEventListener('scroll',update,{passive:true});
  update();
  burger?.addEventListener('click',()=>{ const open=mob.classList.toggle('open'); burger.setAttribute('aria-expanded',open); });
}

// ── Form ──
function initForm() {
  document.getElementById('svc-tabs')?.querySelectorAll('.svc-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.svc-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.svc==='airport') { const d=document.getElementById('dropoff'); if (d&&!d.value) { d.value='Schiphol Airport'; const loc=LOCAL_LOCS.find(l=>l.zone==='schiphol'); if (loc&&map) setMarker('dropoff',loc.lat,loc.lon); updatePrice(); } }
    });
  });
  document.querySelectorAll('.trip-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.trip-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('return-row')?.classList.toggle('hidden',btn.dataset.trip!=='return');
    });
  });
  document.querySelectorAll('.pin-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{ switchMapMode(btn.dataset.mode); maybeOpenMobileMap(); });
  });
  document.getElementById('use-my-loc')?.addEventListener('click',locateUser);
  document.getElementById('swap-btn')?.addEventListener('click',()=>{
    const pu=document.getElementById('pickup');
    const dr=document.getElementById('dropoff');
    if (!pu||!dr) return;
    [pu.value,dr.value]=[dr.value,pu.value];
    [pickupCoords,dropoffCoords]=[dropoffCoords,pickupCoords];
    if (pickupMarker&&dropoffMarker) { const p1=pickupMarker.getLatLng(),p2=dropoffMarker.getLatLng(); pickupMarker.setLatLng(p2); dropoffMarker.setLatLng(p1); drawRouteLine(); }
    updatePrice();
  });
  ['pickup','dropoff','vehicle'].forEach(id=>{ document.getElementById(id)?.addEventListener('input',updatePrice); document.getElementById(id)?.addEventListener('change',updatePrice); });
  document.getElementById('book-btn')?.addEventListener('click',openConfirm);
  const today=new Date().toISOString().split('T')[0];
  ['date','return-date'].forEach(id=>{ const el=document.getElementById(id); if (el) { el.min=today; if (!el.value) el.value=today; } });
}

// ── Tour filters ──
function initTourFilters() {
  renderTours('all');
  document.getElementById('tour-filters')?.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderTours(btn.dataset.filter);
    });
  });
}

// ── Animaties ──
function initReveal() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

function initScrollProgress() {
  const bar=document.getElementById('scroll-progress');
  if (!bar) return;
  const upd=()=>{ const h=document.documentElement.scrollHeight-window.innerHeight; bar.style.width=h>0?(window.scrollY/h*100)+'%':'0'; };
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  upd();
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]:not([data-tab-btn])').forEach(a=>{
    a.addEventListener('click',e=>{
      const target=document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset=(document.getElementById('nav')?.offsetHeight||62)+8;
      window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-offset,behavior:'smooth'});
    });
  });
}

function initFab() {
  const fab=document.getElementById('fab');
  if (!fab) return;
  window.addEventListener('scroll',()=>fab.classList.toggle('visible',window.scrollY>400),{passive:true});
}

// ── Boot ──
document.addEventListener('DOMContentLoaded',()=>{
  initLang();
  initTabs();
  initNav();
  initMap();
  setupAutocomplete('pickup','pickup-suggest');
  setupAutocomplete('dropoff','dropoff-suggest');
  initForm();
  initConfirm();
  initTourFilters();
  initReveal();
  initScrollProgress();
  initSmoothScroll();
  initFab();
  switchMapMode('pickup');
});
