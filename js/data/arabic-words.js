// Arabische woordenlijst — Madinah/Noor Al-Bayaan methode (Khalid Dafiri)
// 85 authentieke woorden met volledige harakat (diacrieten)

export const ARABIC_WORDS = [
  // ── Werkwoorden (الأفعال) ─────────────────────────────────
  { id: 'w001', arabic: 'كَتَبَ', transliteration: 'kataba', dutch: 'hij schreef', english: 'he wrote', type: 'verb', lesson: 1, tags: ['werkwoord'] },
  { id: 'w002', arabic: 'قَرَأَ', transliteration: "qara'a", dutch: 'hij las', english: 'he read', type: 'verb', lesson: 1, tags: ['werkwoord'] },
  { id: 'w003', arabic: 'ذَهَبَ', transliteration: 'dhahaba', dutch: 'hij ging', english: 'he went', type: 'verb', lesson: 1, tags: ['werkwoord'] },
  { id: 'w004', arabic: 'جَاءَ', transliteration: "jā'a", dutch: 'hij kwam', english: 'he came', type: 'verb', lesson: 1, tags: ['werkwoord'] },
  { id: 'w005', arabic: 'أَكَلَ', transliteration: 'akala', dutch: 'hij at', english: 'he ate', type: 'verb', lesson: 2, tags: ['werkwoord'] },
  { id: 'w006', arabic: 'شَرِبَ', transliteration: 'shariba', dutch: 'hij dronk', english: 'he drank', type: 'verb', lesson: 2, tags: ['werkwoord'] },
  { id: 'w007', arabic: 'نَامَ', transliteration: 'nāma', dutch: 'hij sliep', english: 'he slept', type: 'verb', lesson: 2, tags: ['werkwoord'] },
  { id: 'w008', arabic: 'قَامَ', transliteration: 'qāma', dutch: 'hij stond op', english: 'he stood up', type: 'verb', lesson: 2, tags: ['werkwoord'] },
  { id: 'w009', arabic: 'جَلَسَ', transliteration: 'jalasa', dutch: 'hij zat', english: 'he sat', type: 'verb', lesson: 2, tags: ['werkwoord'] },
  { id: 'w010', arabic: 'فَتَحَ', transliteration: 'fataha', dutch: 'hij opende', english: 'he opened', type: 'verb', lesson: 3, tags: ['werkwoord'] },
  { id: 'w011', arabic: 'دَخَلَ', transliteration: 'dakhala', dutch: 'hij ging naar binnen', english: 'he entered', type: 'verb', lesson: 3, tags: ['werkwoord'] },
  { id: 'w012', arabic: 'خَرَجَ', transliteration: 'kharaja', dutch: 'hij ging naar buiten', english: 'he went out', type: 'verb', lesson: 3, tags: ['werkwoord'] },
  { id: 'w013', arabic: 'عَرَفَ', transliteration: "'arafa", dutch: 'hij wist/kende', english: 'he knew', type: 'verb', lesson: 3, tags: ['werkwoord'] },
  { id: 'w014', arabic: 'سَمِعَ', transliteration: "sami'a", dutch: 'hij hoorde', english: 'he heard', type: 'verb', lesson: 4, tags: ['werkwoord'] },
  { id: 'w015', arabic: 'رَأَى', transliteration: "ra'ā", dutch: 'hij zag', english: 'he saw', type: 'verb', lesson: 4, tags: ['werkwoord'] },
  { id: 'w016', arabic: 'عَمِلَ', transliteration: "'amila", dutch: 'hij werkte', english: 'he worked', type: 'verb', lesson: 4, tags: ['werkwoord'] },
  { id: 'w017', arabic: 'رَجَعَ', transliteration: "raja'a", dutch: 'hij keerde terug', english: 'he returned', type: 'verb', lesson: 4, tags: ['werkwoord'] },
  { id: 'w018', arabic: 'قَالَ', transliteration: 'qāla', dutch: 'hij zei', english: 'he said', type: 'verb', lesson: 5, tags: ['werkwoord'] },
  { id: 'w019', arabic: 'فَعَلَ', transliteration: "fa'ala", dutch: 'hij deed', english: 'he did', type: 'verb', lesson: 5, tags: ['werkwoord'] },
  { id: 'w020', arabic: 'نَظَرَ', transliteration: 'naẓara', dutch: 'hij keek', english: 'he looked', type: 'verb', lesson: 5, tags: ['werkwoord'] },

  // ── Zelfstandige naamwoorden mannelijk (الأسماء المذكرة) ──
  { id: 'w021', arabic: 'كِتَابٌ', transliteration: 'kitāb', dutch: 'boek', english: 'book', type: 'noun-m', lesson: 1, tags: ['zelfstandig naamwoord'] },
  { id: 'w022', arabic: 'بَيْتٌ', transliteration: 'bayt', dutch: 'huis', english: 'house', type: 'noun-m', lesson: 1, tags: ['zelfstandig naamwoord'] },
  { id: 'w023', arabic: 'مَسْجِدٌ', transliteration: 'masjid', dutch: 'moskee', english: 'mosque', type: 'noun-m', lesson: 1, tags: ['zelfstandig naamwoord', 'religie'] },
  { id: 'w024', arabic: 'رَجُلٌ', transliteration: 'rajul', dutch: 'man', english: 'man', type: 'noun-m', lesson: 2, tags: ['zelfstandig naamwoord', 'mensen'] },
  { id: 'w025', arabic: 'وَلَدٌ', transliteration: 'walad', dutch: 'jongen/kind', english: 'boy/child', type: 'noun-m', lesson: 2, tags: ['zelfstandig naamwoord', 'mensen'] },
  { id: 'w026', arabic: 'قَلَمٌ', transliteration: 'qalam', dutch: 'pen', english: 'pen', type: 'noun-m', lesson: 1, tags: ['zelfstandig naamwoord'] },
  { id: 'w027', arabic: 'بَابٌ', transliteration: 'bāb', dutch: 'deur', english: 'door', type: 'noun-m', lesson: 2, tags: ['zelfstandig naamwoord'] },
  { id: 'w028', arabic: 'كُرْسِيٌّ', transliteration: 'kursiyy', dutch: 'stoel', english: 'chair', type: 'noun-m', lesson: 2, tags: ['zelfstandig naamwoord'] },
  { id: 'w029', arabic: 'مَكْتَبٌ', transliteration: 'maktab', dutch: 'bureau', english: 'desk/office', type: 'noun-m', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w030', arabic: 'طَعَامٌ', transliteration: "ṭa'ām", dutch: 'eten/maaltijd', english: 'food', type: 'noun-m', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w031', arabic: 'مَاءٌ', transliteration: "mā'", dutch: 'water', english: 'water', type: 'noun-m', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w032', arabic: 'يَوْمٌ', transliteration: 'yawm', dutch: 'dag', english: 'day', type: 'noun-m', lesson: 3, tags: ['zelfstandig naamwoord', 'tijd'] },
  { id: 'w033', arabic: 'لَيْلٌ', transliteration: 'layl', dutch: 'nacht', english: 'night', type: 'noun-m', lesson: 3, tags: ['zelfstandig naamwoord', 'tijd'] },
  { id: 'w034', arabic: 'وَقْتٌ', transliteration: 'waqt', dutch: 'tijd', english: 'time', type: 'noun-m', lesson: 4, tags: ['zelfstandig naamwoord', 'tijd'] },
  { id: 'w035', arabic: 'طَرِيقٌ', transliteration: 'ṭarīq', dutch: 'weg/pad', english: 'road/path', type: 'noun-m', lesson: 4, tags: ['zelfstandig naamwoord'] },
  { id: 'w036', arabic: 'قُرْآنٌ', transliteration: "qur'ān", dutch: 'Koran', english: 'Quran', type: 'noun-m', lesson: 4, tags: ['zelfstandig naamwoord', 'religie'] },
  { id: 'w037', arabic: 'عِلْمٌ', transliteration: "'ilm", dutch: 'kennis', english: 'knowledge', type: 'noun-m', lesson: 5, tags: ['zelfstandig naamwoord'] },
  { id: 'w038', arabic: 'دِينٌ', transliteration: 'dīn', dutch: 'religie/godsdienst', english: 'religion', type: 'noun-m', lesson: 5, tags: ['zelfstandig naamwoord', 'religie'] },
  { id: 'w039', arabic: 'اِسْمٌ', transliteration: 'ism', dutch: 'naam', english: 'name', type: 'noun-m', lesson: 1, tags: ['zelfstandig naamwoord'] },
  { id: 'w040', arabic: 'أُسْتَاذٌ', transliteration: 'ustādh', dutch: 'leraar', english: 'teacher', type: 'noun-m', lesson: 5, tags: ['zelfstandig naamwoord', 'mensen'] },

  // ── Zelfstandige naamwoorden vrouwelijk (الأسماء المؤنثة) ─
  { id: 'w041', arabic: 'مَدِينَةٌ', transliteration: 'madīna', dutch: 'stad', english: 'city', type: 'noun-f', lesson: 4, tags: ['zelfstandig naamwoord'] },
  { id: 'w042', arabic: 'بِنْتٌ', transliteration: 'bint', dutch: 'meisje/dochter', english: 'girl/daughter', type: 'noun-f', lesson: 2, tags: ['zelfstandig naamwoord', 'mensen'] },
  { id: 'w043', arabic: 'أُمٌّ', transliteration: 'umm', dutch: 'moeder', english: 'mother', type: 'noun-f', lesson: 2, tags: ['zelfstandig naamwoord', 'familie'] },
  { id: 'w044', arabic: 'غُرْفَةٌ', transliteration: 'ghurfa', dutch: 'kamer', english: 'room', type: 'noun-f', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w045', arabic: 'شَجَرَةٌ', transliteration: 'shajara', dutch: 'boom', english: 'tree', type: 'noun-f', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w046', arabic: 'صَلَاةٌ', transliteration: 'ṣalāh', dutch: 'gebed', english: 'prayer', type: 'noun-f', lesson: 4, tags: ['zelfstandig naamwoord', 'religie'] },
  { id: 'w047', arabic: 'مَدْرَسَةٌ', transliteration: 'madrasa', dutch: 'school', english: 'school', type: 'noun-f', lesson: 3, tags: ['zelfstandig naamwoord'] },
  { id: 'w048', arabic: 'سَيَّارَةٌ', transliteration: 'sayyāra', dutch: 'auto', english: 'car', type: 'noun-f', lesson: 4, tags: ['zelfstandig naamwoord'] },
  { id: 'w049', arabic: 'لُغَةٌ', transliteration: 'lugha', dutch: 'taal', english: 'language', type: 'noun-f', lesson: 5, tags: ['zelfstandig naamwoord'] },
  { id: 'w050', arabic: 'سَاعَةٌ', transliteration: "sā'a", dutch: 'uur/horloge', english: 'hour/watch', type: 'noun-f', lesson: 4, tags: ['zelfstandig naamwoord', 'tijd'] },

  // ── Bijvoeglijke naamwoorden (الصفات) ───────────────────
  { id: 'w051', arabic: 'كَبِيرٌ', transliteration: 'kabīr', dutch: 'groot', english: 'big', type: 'adj', lesson: 6, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w052', arabic: 'صَغِيرٌ', transliteration: 'ṣaghīr', dutch: 'klein', english: 'small', type: 'adj', lesson: 6, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w053', arabic: 'جَدِيدٌ', transliteration: 'jadīd', dutch: 'nieuw', english: 'new', type: 'adj', lesson: 6, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w054', arabic: 'قَدِيمٌ', transliteration: 'qadīm', dutch: 'oud', english: 'old', type: 'adj', lesson: 6, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w055', arabic: 'جَمِيلٌ', transliteration: 'jamīl', dutch: 'mooi', english: 'beautiful', type: 'adj', lesson: 7, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w056', arabic: 'طَوِيلٌ', transliteration: 'ṭawīl', dutch: 'lang', english: 'tall/long', type: 'adj', lesson: 7, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w057', arabic: 'قَصِيرٌ', transliteration: 'qaṣīr', dutch: 'kort/klein van stuk', english: 'short', type: 'adj', lesson: 7, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w058', arabic: 'سَهْلٌ', transliteration: 'sahl', dutch: 'makkelijk', english: 'easy', type: 'adj', lesson: 7, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w059', arabic: 'صَعْبٌ', transliteration: "ṣa'b", dutch: 'moeilijk', english: 'difficult', type: 'adj', lesson: 7, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w060', arabic: 'كَثِيرٌ', transliteration: 'kathīr', dutch: 'veel', english: 'many/much', type: 'adj', lesson: 8, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w061', arabic: 'قَلِيلٌ', transliteration: 'qalīl', dutch: 'weinig', english: 'few/little', type: 'adj', lesson: 8, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w062', arabic: 'حَسَنٌ', transliteration: 'ḥasan', dutch: 'goed/mooi', english: 'good/fine', type: 'adj', lesson: 8, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w063', arabic: 'كَرِيمٌ', transliteration: 'karīm', dutch: 'edelmoedig', english: 'generous', type: 'adj', lesson: 8, tags: ['bijvoeglijk naamwoord'] },
  { id: 'w064', arabic: 'عَظِيمٌ', transliteration: "'aẓīm", dutch: 'geweldig/groots', english: 'great/mighty', type: 'adj', lesson: 9, tags: ['bijvoeglijk naamwoord'] },

  // ── Voorzetsels (حروف الجر) ───────────────────────────────
  { id: 'w065', arabic: 'فِي', transliteration: 'fī', dutch: 'in', english: 'in', type: 'particle', lesson: 1, tags: ['voorzetsel'] },
  { id: 'w066', arabic: 'مِنْ', transliteration: 'min', dutch: 'van/uit', english: 'from/of', type: 'particle', lesson: 1, tags: ['voorzetsel'] },
  { id: 'w067', arabic: 'إِلَى', transliteration: 'ilā', dutch: 'naar/tot', english: 'to/towards', type: 'particle', lesson: 1, tags: ['voorzetsel'] },
  { id: 'w068', arabic: 'عَلَى', transliteration: "'alā", dutch: 'op', english: 'on/upon', type: 'particle', lesson: 2, tags: ['voorzetsel'] },
  { id: 'w069', arabic: 'عَنْ', transliteration: "'an", dutch: 'over/van', english: 'about/from', type: 'particle', lesson: 2, tags: ['voorzetsel'] },
  { id: 'w070', arabic: 'مَعَ', transliteration: "ma'a", dutch: 'met', english: 'with', type: 'particle', lesson: 2, tags: ['voorzetsel'] },

  // ── Bijwoorden en aanwijzende woorden ─────────────────────
  { id: 'w071', arabic: 'هُنَا', transliteration: 'hunā', dutch: 'hier', english: 'here', type: 'adverb', lesson: 1, tags: ['bijwoord'] },
  { id: 'w072', arabic: 'هُنَاكَ', transliteration: 'hunāka', dutch: 'daar', english: 'there', type: 'adverb', lesson: 1, tags: ['bijwoord'] },
  { id: 'w073', arabic: 'الْآنَ', transliteration: 'al-āna', dutch: 'nu', english: 'now', type: 'adverb', lesson: 3, tags: ['bijwoord'] },
  { id: 'w074', arabic: 'أَيْضًا', transliteration: 'ayḍan', dutch: 'ook', english: 'also', type: 'adverb', lesson: 3, tags: ['bijwoord'] },
  { id: 'w075', arabic: 'هَذَا', transliteration: 'hādhā', dutch: 'dit/deze (m.)', english: 'this (m)', type: 'pronoun', lesson: 1, tags: ['aanwijzend voornaamwoord'] },
  { id: 'w076', arabic: 'هَذِهِ', transliteration: 'hādhihi', dutch: 'dit/deze (v.)', english: 'this (f)', type: 'pronoun', lesson: 1, tags: ['aanwijzend voornaamwoord'] },
  { id: 'w077', arabic: 'ذَلِكَ', transliteration: 'dhālika', dutch: 'dat/die (m.)', english: 'that (m)', type: 'pronoun', lesson: 2, tags: ['aanwijzend voornaamwoord'] },

  // ── Persoonlijke voornaamwoorden (الضمائر) ────────────────
  { id: 'w078', arabic: 'أَنَا', transliteration: 'anā', dutch: 'ik', english: 'I', type: 'pronoun', lesson: 1, tags: ['persoonlijk voornaamwoord'] },
  { id: 'w079', arabic: 'أَنْتَ', transliteration: 'anta', dutch: 'jij (mannelijk)', english: 'you (m)', type: 'pronoun', lesson: 1, tags: ['persoonlijk voornaamwoord'] },
  { id: 'w080', arabic: 'أَنْتِ', transliteration: 'anti', dutch: 'jij (vrouwelijk)', english: 'you (f)', type: 'pronoun', lesson: 1, tags: ['persoonlijk voornaamwoord'] },
  { id: 'w081', arabic: 'هُوَ', transliteration: 'huwa', dutch: 'hij', english: 'he', type: 'pronoun', lesson: 1, tags: ['persoonlijk voornaamwoord'] },
  { id: 'w082', arabic: 'هِيَ', transliteration: 'hiya', dutch: 'zij', english: 'she', type: 'pronoun', lesson: 1, tags: ['persoonlijk voornaamwoord'] },
  { id: 'w083', arabic: 'نَحْنُ', transliteration: 'naḥnu', dutch: 'wij', english: 'we', type: 'pronoun', lesson: 2, tags: ['persoonlijk voornaamwoord'] },

  // ── Basiswoorden (كلمات أساسية) ───────────────────────────
  { id: 'w084', arabic: 'نَعَمْ', transliteration: "na'am", dutch: 'ja', english: 'yes', type: 'particle', lesson: 1, tags: ['basiswoord'] },
  { id: 'w085', arabic: 'لَا', transliteration: 'lā', dutch: 'nee/niet', english: 'no/not', type: 'particle', lesson: 1, tags: ['basiswoord'] },
];

// Type labels in het Nederlands
export const TYPE_LABELS = {
  'verb':    'Werkwoord',
  'noun-m':  'Zelfst. naamw. (m.)',
  'noun-f':  'Zelfst. naamw. (v.)',
  'adj':     'Bijvoeglijk naamw.',
  'particle': 'Partikel/Voorzetsel',
  'adverb':  'Bijwoord',
  'pronoun': 'Voornaamwoord',
};

export const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Alle typen' },
  { value: 'verb', label: 'Werkwoorden' },
  { value: 'noun-m', label: 'Naamwoorden (m.)' },
  { value: 'noun-f', label: 'Naamwoorden (v.)' },
  { value: 'adj', label: 'Bijvoeglijke naamwoorden' },
  { value: 'particle', label: 'Partikels/Voorzetsels' },
  { value: 'pronoun', label: 'Voornaamwoorden' },
];
