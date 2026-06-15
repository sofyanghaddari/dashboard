let _worker = null;
let _workerLoading = null;

function loadTesseractScript() {
  if (window.Tesseract) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload  = resolve;
    s.onerror = () => reject(new Error('OCR-bibliotheek kon niet laden — controleer internetverbinding'));
    document.head.appendChild(s);
  });
}

async function getWorker(onProgress) {
  if (_worker) return _worker;
  if (_workerLoading) return _workerLoading;
  _workerLoading = (async () => {
    await loadTesseractScript();
    onProgress?.('OCR laden…', 0.05);
    const w = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if      (m.status === 'loading language traineddata') onProgress?.('Taalmodel laden…', 0.1 + (m.progress || 0) * 0.15);
        else if (m.status === 'initializing tesseract')       onProgress?.('Initialiseren…', 0.25);
        else if (m.status === 'recognizing text')             onProgress?.('Tekst herkennen…', 0.3 + (m.progress || 0) * 0.65);
      },
    });
    _workerLoading = null;
    _worker = w;
    return w;
  })();
  return _workerLoading;
}

export async function ocrReceipt(imageFile, onProgress) {
  onProgress?.('OCR starten…', 0);
  const worker = await getWorker(onProgress);
  const { data: { text } } = await worker.recognize(imageFile);
  onProgress?.('Klaar', 1);
  return text;
}

export function parseReceiptText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // --- Datum DD-MM-YYYY of DD/MM/YY ---
  let date = null;
  const dateM = rawText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dateM) {
    const [, d, m, y] = dateM;
    const year = y.length === 2 ? '20' + y : y;
    const iso  = `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    // Sanity check
    if (iso >= '2010-01-01' && iso <= '2035-12-31') date = iso;
  }

  // --- Bedragen ---
  let totalAmount   = null;
  let vatRate       = null;
  let vatAmount     = null;
  let subtotal      = null;

  const amtEnd = /(\d{1,4}[,\.]\d{2})\s*[€]?\s*$/;  // amount at end of line

  for (const line of lines) {
    const ll  = line.toLowerCase();
    const amM = line.match(amtEnd);
    const amt = amM ? parseFloat(amM[1].replace(',', '.')) : null;

    // Totaal (not subtotaal/BTW lines)
    if (/\b(totaal|total|te betalen|amount due|subtotal incl)\b/.test(ll)
        && !/sub.?totaal|sub.?total|btw|incl\.|excl\./.test(ll)
        && amt !== null) {
      if (!totalAmount || amt > totalAmount) totalAmount = amt;
    }

    // Subtotaal
    if (/sub.?totaal|sub.?total/.test(ll) && amt !== null) {
      subtotal = amt;
    }

    // BTW: "BTW 21% 7,89" or "21% BTW 7,89" or "BTW 9%: 1,23"
    if (/\b(btw|b\.t\.w\.?|vat)\b/.test(ll) && amt !== null) {
      const rM = ll.match(/(\d+)\s*%/);
      const r  = rM ? parseInt(rM[1]) : null;
      if (r !== null && [0, 9, 21].includes(r)) {
        // Take highest-rate BTW if multiple
        if (!vatRate || r > vatRate) { vatRate = r; vatAmount = amt; }
      } else if (!vatAmount && amt > 0 && amt < 500) {
        vatAmount = amt; // Store without rate as candidate
      }
    }
  }

  // Derive total from subtotal + vat if not found
  if (!totalAmount && subtotal !== null && vatAmount !== null) {
    totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  }
  // Derive vat from total if vatRate known but vatAmount not
  if (totalAmount && vatRate && !vatAmount) {
    vatAmount = Math.round(totalAmount / (1 + vatRate / 100) * (vatRate / 100) * 100) / 100;
  }
  // Default vatRate 21% (most common) when we have a vat amount but no rate
  if (vatAmount && !vatRate) vatRate = 21;

  // --- Leverancier: eerste alfanumerieke, niet-adres-achtige regel ---
  const skipRe = /^(btw|b\.t\.w|kvk|k\.v\.k|iban|bic|fax|tel|www\.|http|@|datum|bon |kassa|uw |kasticket|\d{4}\s*[a-z]{2}|\+31)/i;
  const numOnlyRe = /^\d[\d\s,\.]*$/;
  let vendor = null;
  for (const line of lines) {
    if (line.length < 3)          continue;
    if (numOnlyRe.test(line))     continue;
    if (skipRe.test(line))        continue;
    if (!/[a-zA-Z]{2,}/.test(line)) continue;
    vendor = line.replace(/[^\w\s&\-\.]/g, '').trim().slice(0, 50);
    if (vendor.length >= 2) break;
    vendor = null;
  }

  // --- Categorie gokken ---
  let category = 'overig';
  const rt = rawText.toLowerCase();
  if      (/shell|bp|total energie|esso|texaco|tinq|brandstof|diesel|benzine|lpg/i.test(rt))      category = 'brandstof';
  else if (/vodafone|kpn|t-mobile|ziggo|simyo|hollandsnieuwe|tele2|belsimpel/i.test(rt))          category = 'telefoon';
  else if (/verzekerring|verzekering|allianz|achmea|nationale.?nederlanden|aegon|centraal.?beheer/i.test(rt)) category = 'verzekering';
  else if (/accountant|boekhouder|administratie|belastingdienst|fisc/i.test(rt))                    category = 'accountant';
  else if (/garage|reparatie|onderhoud|apk|banden|remmen|motor|kwartsmonteur/i.test(rt))            category = 'onderhoud';
  else if (/lease|private.?lease|financiering|autobedrijf/i.test(rt))                               category = 'lease';
  else if (/microsoft|adobe|google|apple|app store|play store|software|saas/i.test(rt))             category = 'software';

  return { vendor, date, totalAmount, vatRate, vatAmount, category };
}
