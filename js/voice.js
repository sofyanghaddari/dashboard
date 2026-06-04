// Voice-input via Web Speech API. iOS/Safari ondersteuning beperkt — graceful fail.
export function voiceAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startVoice({ lang = 'nl-NL', onResult, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError && onError('Niet ondersteund'); return null; }
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    onResult(text);
  };
  rec.onerror = (e) => onError && onError(e.error);
  rec.start();
  return rec;
}

// Parse voice input voor taxi-rit: "Uber 25 euro" / "Bolt 18 50"
export function parseRide(text) {
  const lc = text.toLowerCase();
  let source = null;
  if (/\buber\b/.test(lc)) source = 'uber';
  else if (/\bbolt\b/.test(lc)) source = 'bolt';
  else if (/(whats\s?app|wapp)/.test(lc)) source = 'whatsapp';
  const m = lc.match(/(\d+([.,]\d+)?)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : null;
  return { source, amount };
}
