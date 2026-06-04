// Rotating quote/vers boven dashboard. Mix Islamic + motivatie.
const QUOTES = [
  { t: 'Voorwaar, met de moeilijkheid komt verlichting.', s: 'Qur\'an 94:6' },
  { t: 'Allah belast geen ziel boven haar vermogen.', s: 'Qur\'an 2:286' },
  { t: 'En wie Allah vreest — Hij maakt voor hem een uitweg.', s: 'Qur\'an 65:2' },
  { t: 'De beste van jullie zijn degenen die de Qur\'an leren en onderwijzen.', s: 'Hadith' },
  { t: 'Doe het werk dat verdwijnt voor het bestaat.', s: '' },
  { t: 'Discipline is vrijheid.', s: '' },
  { t: 'Klein consistent beats groot inconsistent.', s: '' },
  { t: 'De man die een berg verzet begon met kleine stenen.', s: 'Spreekwoord' },
  { t: 'Niemand komt eraan zonder doorzettingsvermogen.', s: '' },
  { t: 'Je gisteren is voorbij. Je morgen is niet gegarandeerd. Vandaag is alles.', s: '' },
  { t: 'Vertrouw op Allah, maar bind eerst je kameel vast.', s: 'Hadith' },
  { t: 'De beste rijkdom is innerlijke tevredenheid.', s: 'Hadith' },
];

export function quoteOfDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
