export function parseInvoiceText(raw) {
  const text = (raw || '').trim();
  if (!text) return null;

  // Email
  const emailM = text.match(/[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i);
  const clientEmail = emailM ? emailM[0] : null;

  // KvK (8 digits)
  const kvkM = text.match(/kv[ck](?:[- ]?(?:nummer|nr\.?))?\s*:?\s*(\d{8})/i);
  const clientKvk = kvkM ? kvkM[1] : null;

  // BTW rate
  const vatM = text.match(/(\d+)\s*%\s*btw/i) || text.match(/btw\s*[:\s]*(\d+)\s*%/i);
  const vatRate = vatM ? parseInt(vatM[1]) : null;

  // incl/excl — only flag explicitly when mentioned
  const _inclExplicit = /\b(incl|excl)\b/i.test(text);
  const isIncl = /excl/i.test(text) ? false : true;

  // Amount: €320, €320,50, €1.234,56
  let amount = null;
  const euroM = text.match(/€\s*(\d[\d,\.]*)/);
  if (euroM) {
    // Strip Dutch thousand-separator dots, then convert decimal comma to dot
    const cleaned = euroM[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(cleaned);
  } else {
    const numM = text.match(/(\d[\d,\.]*)\s*(?:euro|eur)\b/i);
    if (numM) {
      const cleaned = numM[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(cleaned);
    }
  }

  // Description hint from "voor ..."
  let description = null;
  const descM = text.match(/voor\s+([^\n€\d]+?)(?:\s*[€\n]|$)/i);
  if (descM) description = descM[1].trim().replace(/[\.,;]$/, '');

  // Address lines: filter out special lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const isSpecial = (l) =>
    l.match(/[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i) || // email address
    l.match(/\bkv[ck]\b/i) ||                       // kvk label
    l.match(/^email\s*:/i) ||                        // "Email:"
    l.match(/€|\bbtw\b|\bexcl\b|\bincl\b/i) ||     // amount/btw line
    l.match(/\d+\s*(?:euro|eur)\b/i);               // "320 euro"

  const addrLines = lines.filter(l => !isSpecial(l));

  return {
    clientName:    addrLines[0] || null,
    clientAddress: addrLines[1] || null,
    clientCity:    addrLines[2] || null,
    clientEmail,
    clientKvk,
    vatRate,
    isIncl,
    _inclExplicit,
    amount,
    description,
  };
}
