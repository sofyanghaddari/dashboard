// 60 hizbs met welke soera's (of delen) erin zitten
// parts: array van { n: soera-nummer, tl: naam, v: verzen of null (= heel de soera) }
export const HIZBS = [
  // Juz 1
  { n:1,  juz:1,  parts:[{n:1,tl:'Al-Fatiha',v:null},{n:2,tl:'Al-Baqara',v:'1–74'}] },
  { n:2,  juz:1,  parts:[{n:2,tl:'Al-Baqara',v:'75–141'}] },
  // Juz 2
  { n:3,  juz:2,  parts:[{n:2,tl:'Al-Baqara',v:'142–202'}] },
  { n:4,  juz:2,  parts:[{n:2,tl:'Al-Baqara',v:'203–252'}] },
  // Juz 3
  { n:5,  juz:3,  parts:[{n:2,tl:'Al-Baqara',v:'253–286'},{n:3,tl:'Al-Imran',v:'1–14'}] },
  { n:6,  juz:3,  parts:[{n:3,tl:'Al-Imran',v:'15–91'}] },
  // Juz 4
  { n:7,  juz:4,  parts:[{n:3,tl:'Al-Imran',v:'92–180'}] },
  { n:8,  juz:4,  parts:[{n:3,tl:'Al-Imran',v:'181–200'},{n:4,tl:'An-Nisa',v:'1–23'}] },
  // Juz 5
  { n:9,  juz:5,  parts:[{n:4,tl:'An-Nisa',v:'24–87'}] },
  { n:10, juz:5,  parts:[{n:4,tl:'An-Nisa',v:'88–147'}] },
  // Juz 6
  { n:11, juz:6,  parts:[{n:4,tl:'An-Nisa',v:'148–176'},{n:5,tl:'Al-Maida',v:'1–26'}] },
  { n:12, juz:6,  parts:[{n:5,tl:'Al-Maida',v:'27–81'}] },
  // Juz 7
  { n:13, juz:7,  parts:[{n:5,tl:'Al-Maida',v:'82–120'},{n:6,tl:'Al-Anam',v:'1–35'}] },
  { n:14, juz:7,  parts:[{n:6,tl:'Al-Anam',v:'36–110'}] },
  // Juz 8
  { n:15, juz:8,  parts:[{n:6,tl:'Al-Anam',v:'111–165'},{n:7,tl:'Al-Araf',v:'1–46'}] },
  { n:16, juz:8,  parts:[{n:7,tl:'Al-Araf',v:'47–131'}] },
  // Juz 9
  { n:17, juz:9,  parts:[{n:7,tl:'Al-Araf',v:'132–206'},{n:8,tl:'Al-Anfal',v:'1–40'}] },
  { n:18, juz:9,  parts:[{n:8,tl:'Al-Anfal',v:'41–75'},{n:9,tl:'At-Tawba',v:'1–37'}] },
  // Juz 10
  { n:19, juz:10, parts:[{n:9,tl:'At-Tawba',v:'38–92'}] },
  { n:20, juz:10, parts:[{n:9,tl:'At-Tawba',v:'93–129'},{n:10,tl:'Yunus',v:'1–25'}] },
  // Juz 11
  { n:21, juz:11, parts:[{n:10,tl:'Yunus',v:'26–109'},{n:11,tl:'Hud',v:'1–5'}] },
  { n:22, juz:11, parts:[{n:11,tl:'Hud',v:'6–83'}] },
  // Juz 12
  { n:23, juz:12, parts:[{n:11,tl:'Hud',v:'84–123'},{n:12,tl:'Yusuf',v:'1–52'}] },
  { n:24, juz:12, parts:[{n:12,tl:'Yusuf',v:'53–111'},{n:13,tl:"Ar-Ra'd",v:'1–18'}] },
  // Juz 13
  { n:25, juz:13, parts:[{n:13,tl:"Ar-Ra'd",v:'19–43'},{n:14,tl:'Ibrahim',v:null}] },
  { n:26, juz:13, parts:[{n:15,tl:'Al-Hijr',v:null},{n:16,tl:'An-Nahl',v:'1–50'}] },
  // Juz 14
  { n:27, juz:14, parts:[{n:16,tl:'An-Nahl',v:'51–128'}] },
  { n:28, juz:14, parts:[{n:17,tl:'Al-Isra',v:null},{n:18,tl:'Al-Kahf',v:'1–12'}] },
  // Juz 15
  { n:29, juz:15, parts:[{n:18,tl:'Al-Kahf',v:'13–74'}] },
  { n:30, juz:15, parts:[{n:18,tl:'Al-Kahf',v:'75–110'},{n:19,tl:'Maryam',v:null},{n:20,tl:'Ta-Ha',v:'1–40'}] },
  // Juz 16
  { n:31, juz:16, parts:[{n:20,tl:'Ta-Ha',v:'41–135'},{n:21,tl:'Al-Anbiya',v:'1–50'}] },
  { n:32, juz:16, parts:[{n:21,tl:'Al-Anbiya',v:'51–112'},{n:22,tl:'Al-Hajj',v:'1–30'}] },
  // Juz 17
  { n:33, juz:17, parts:[{n:22,tl:'Al-Hajj',v:'31–78'},{n:23,tl:"Al-Mu'minun",v:'1–74'}] },
  { n:34, juz:17, parts:[{n:23,tl:"Al-Mu'minun",v:'75–118'},{n:24,tl:'An-Nur',v:null},{n:25,tl:'Al-Furqan',v:'1–20'}] },
  // Juz 18
  { n:35, juz:18, parts:[{n:25,tl:'Al-Furqan',v:'21–77'},{n:26,tl:"Ash-Shu'ara",v:'1–110'}] },
  { n:36, juz:18, parts:[{n:26,tl:"Ash-Shu'ara",v:'111–227'},{n:27,tl:'An-Naml',v:'1–55'}] },
  // Juz 19
  { n:37, juz:19, parts:[{n:27,tl:'An-Naml',v:'56–93'},{n:28,tl:'Al-Qasas',v:'1–50'}] },
  { n:38, juz:19, parts:[{n:28,tl:'Al-Qasas',v:'51–88'},{n:29,tl:'Al-Ankabut',v:'1–44'}] },
  // Juz 20
  { n:39, juz:20, parts:[{n:29,tl:'Al-Ankabut',v:'45–69'},{n:30,tl:'Ar-Rum',v:null},{n:31,tl:'Luqman',v:null},{n:32,tl:'As-Sajda',v:null}] },
  { n:40, juz:20, parts:[{n:33,tl:'Al-Ahzab',v:'1–30'}] },
  // Juz 21
  { n:41, juz:21, parts:[{n:33,tl:'Al-Ahzab',v:'31–73'},{n:34,tl:'Saba',v:'1–23'}] },
  { n:42, juz:21, parts:[{n:34,tl:'Saba',v:'24–54'},{n:35,tl:'Fatir',v:null},{n:36,tl:'Ya-Sin',v:'1–27'}] },
  // Juz 22
  { n:43, juz:22, parts:[{n:36,tl:'Ya-Sin',v:'28–83'},{n:37,tl:'As-Saffat',v:'1–144'}] },
  { n:44, juz:22, parts:[{n:37,tl:'As-Saffat',v:'145–182'},{n:38,tl:'Sad',v:null},{n:39,tl:'Az-Zumar',v:'1–31'}] },
  // Juz 23
  { n:45, juz:23, parts:[{n:39,tl:'Az-Zumar',v:'32–75'},{n:40,tl:'Ghafir',v:'1–40'}] },
  { n:46, juz:23, parts:[{n:40,tl:'Ghafir',v:'41–85'},{n:41,tl:'Fussilat',v:'1–46'}] },
  // Juz 24
  { n:47, juz:24, parts:[{n:41,tl:'Fussilat',v:'47–54'},{n:42,tl:'Ash-Shura',v:null},{n:43,tl:'Az-Zukhruf',v:'1–35'}] },
  { n:48, juz:24, parts:[{n:43,tl:'Az-Zukhruf',v:'36–89'},{n:44,tl:'Ad-Dukhan',v:null},{n:45,tl:'Al-Jathiya',v:null}] },
  // Juz 25
  { n:49, juz:25, parts:[{n:46,tl:'Al-Ahqaf',v:null},{n:47,tl:'Muhammad',v:'1–30'}] },
  { n:50, juz:25, parts:[{n:47,tl:'Muhammad',v:'31–38'},{n:48,tl:'Al-Fath',v:null},{n:49,tl:'Al-Hujurat',v:null},{n:50,tl:'Qaf',v:'1–30'}] },
  // Juz 26
  { n:51, juz:26, parts:[{n:50,tl:'Qaf',v:'31–45'},{n:51,tl:'Adh-Dhariyat',v:'1–30'}] },
  { n:52, juz:26, parts:[{n:51,tl:'Adh-Dhariyat',v:'31–60'},{n:52,tl:'At-Tur',v:null},{n:53,tl:'An-Najm',v:null}] },
  // Juz 27
  { n:53, juz:27, parts:[{n:54,tl:'Al-Qamar',v:null},{n:55,tl:'Ar-Rahman',v:null},{n:56,tl:"Al-Waqi'a",v:null}] },
  { n:54, juz:27, parts:[{n:57,tl:'Al-Hadid',v:null},{n:58,tl:'Al-Mujadila',v:null},{n:59,tl:'Al-Hashr',v:null}] },
  // Juz 28
  { n:55, juz:28, parts:[{n:60,tl:'Al-Mumtahana',v:null},{n:61,tl:'As-Saff',v:null},{n:62,tl:"Al-Jumu'a",v:null},{n:63,tl:'Al-Munafiqun',v:null}] },
  { n:56, juz:28, parts:[{n:64,tl:'At-Taghabun',v:null},{n:65,tl:'At-Talaq',v:null},{n:66,tl:'At-Tahrim',v:null}] },
  // Juz 29
  { n:57, juz:29, parts:[{n:67,tl:'Al-Mulk',v:null},{n:68,tl:'Al-Qalam',v:null},{n:69,tl:"Al-Haqqa",v:null},{n:70,tl:"Al-Ma'arij",v:null}] },
  { n:58, juz:29, parts:[{n:71,tl:'Nuh',v:null},{n:72,tl:'Al-Jinn',v:null},{n:73,tl:'Al-Muzzammil',v:null},{n:74,tl:'Al-Muddaththir',v:null},{n:75,tl:'Al-Qiyama',v:null},{n:76,tl:'Al-Insan',v:null},{n:77,tl:'Al-Mursalat',v:null}] },
  // Juz 30
  { n:59, juz:30, parts:[{n:78,tl:"An-Naba",v:null},{n:79,tl:"An-Nazi'at",v:null},{n:80,tl:'Abasa',v:null},{n:81,tl:'At-Takwir',v:null},{n:82,tl:'Al-Infitar',v:null},{n:83,tl:'Al-Mutaffifin',v:null},{n:84,tl:'Al-Inshiqaq',v:null},{n:85,tl:'Al-Buruj',v:null},{n:86,tl:'At-Tariq',v:null},{n:87,tl:"Al-A'la",v:null},{n:88,tl:'Al-Ghashiya',v:null},{n:89,tl:'Al-Fajr',v:null}] },
  { n:60, juz:30, parts:[{n:90,tl:'Al-Balad',v:null},{n:91,tl:'Ash-Shams',v:null},{n:92,tl:'Al-Layl',v:null},{n:93,tl:'Ad-Duha',v:null},{n:94,tl:'Ash-Sharh',v:null},{n:95,tl:'At-Tin',v:null},{n:96,tl:"Al-Alaq",v:null},{n:97,tl:'Al-Qadr',v:null},{n:98,tl:'Al-Bayyina',v:null},{n:99,tl:'Az-Zalzala',v:null},{n:100,tl:"Al-Adiyat",v:null},{n:101,tl:"Al-Qari'a",v:null},{n:102,tl:'At-Takathur',v:null},{n:103,tl:"Al-'Asr",v:null},{n:104,tl:'Al-Humaza',v:null},{n:105,tl:'Al-Fil',v:null},{n:106,tl:'Quraysh',v:null},{n:107,tl:"Al-Ma'un",v:null},{n:108,tl:'Al-Kawthar',v:null},{n:109,tl:'Al-Kafirun',v:null},{n:110,tl:'An-Nasr',v:null},{n:111,tl:'Al-Masad',v:null},{n:112,tl:'Al-Ikhlas',v:null},{n:113,tl:'Al-Falaq',v:null},{n:114,tl:'An-Nas',v:null}] },
];
