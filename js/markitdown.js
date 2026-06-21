// markitdown.js — document-naar-Markdown converter voor de browser
// Ondersteunt: .txt, .md, .html, .csv, .pdf, .docx, afbeeldingen (OCR)

// ── Lazy loaders ──────────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src     = src;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Kon ${src} niet laden`));
    document.head.appendChild(s);
  });
}

async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function loadMammoth() {
  if (window.mammoth) return;
  await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
}

async function loadTesseract() {
  if (window.Tesseract) return;
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
}

// ── Bestandslezers ────────────────────────────────────────────────────────

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = () => reject(new Error('Bestand kon niet worden gelezen'));
    r.readAsText(file, 'UTF-8');
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = () => reject(new Error('Bestand kon niet worden gelezen'));
    r.readAsArrayBuffer(file);
  });
}

// ── HTML → Markdown ───────────────────────────────────────────────────────

function tableNodeToMd(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  const getCells = row => Array.from(row.querySelectorAll('th,td'))
    .map(c => c.textContent.replace(/\s+/g, ' ').trim());
  const data = rows.map(getCells);
  const cols = Math.max(...data.map(r => r.length));
  data.forEach(r => { while (r.length < cols) r.push(''); });
  const fmtRow = r => `| ${r.join(' | ')} |`;
  const sep    = data[0].map(() => '---');
  return '\n' + [fmtRow(data[0]), fmtRow(sep), ...data.slice(1).map(fmtRow)].join('\n') + '\n';
}

function nodeToMd(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, ' ');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const tag      = node.tagName.toLowerCase();
  const children = () => Array.from(node.childNodes).map(nodeToMd).join('');
  switch (tag) {
    case 'h1': return `\n# ${children().trim()}\n`;
    case 'h2': return `\n## ${children().trim()}\n`;
    case 'h3': return `\n### ${children().trim()}\n`;
    case 'h4': return `\n#### ${children().trim()}\n`;
    case 'h5': return `\n##### ${children().trim()}\n`;
    case 'h6': return `\n###### ${children().trim()}\n`;
    case 'p':  return `\n${children().trim()}\n`;
    case 'br': return '\n';
    case 'strong': case 'b': return `**${children()}**`;
    case 'em':     case 'i': return `*${children()}*`;
    case 'code': return `\`${children()}\``;
    case 'pre':  return `\n\`\`\`\n${node.textContent}\n\`\`\`\n`;
    case 'a': {
      const href = node.getAttribute('href') || '';
      return `[${children()}](${href})`;
    }
    case 'img': {
      const alt = node.getAttribute('alt') || '';
      return alt ? `![${alt}]` : '';
    }
    case 'ul': return '\n' + Array.from(node.children)
      .map(li => `- ${nodeToMd(li).trim()}`).join('\n') + '\n';
    case 'ol': return '\n' + Array.from(node.children)
      .map((li, i) => `${i + 1}. ${nodeToMd(li).trim()}`).join('\n') + '\n';
    case 'li': return children().trim();
    case 'blockquote': return `\n> ${children().trim()}\n`;
    case 'hr': return '\n---\n';
    case 'table': return tableNodeToMd(node);
    case 'script': case 'style': case 'head': return '';
    default: return children();
  }
}

function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return nodeToMd(doc.body).replace(/\n{3,}/g, '\n\n').trim();
}

// ── CSV → Markdown tabel ──────────────────────────────────────────────────

function csvToMarkdown(csv) {
  const lines = csv.trim().split('\n');
  if (!lines.length) return '';
  const firstLine = lines[0];
  const delim     = (firstLine.match(/;/g) || []).length >
                    (firstLine.match(/,/g) || []).length ? ';' : ',';

  const parseRow = line => {
    const cells = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if      (ch === '"')  inQ = !inQ;
      else if (ch === delim && !inQ) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  };

  const rows = lines.map(parseRow);
  const cols = Math.max(...rows.map(r => r.length));
  rows.forEach(r => { while (r.length < cols) r.push(''); });
  const fmtRow = r => `| ${r.join(' | ')} |`;
  const sep    = rows[0].map(() => '---');
  return [fmtRow(rows[0]), fmtRow(sep), ...rows.slice(1).map(fmtRow)].join('\n');
}

// ── PDF → Markdown ────────────────────────────────────────────────────────

async function pdfToMarkdown(file, onProgress) {
  await loadPdfJs();
  onProgress?.('PDF laden…', 0.05);
  const ab  = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const n   = pdf.numPages;
  let md    = `# ${file.name.replace(/\.pdf$/i, '')}\n\n`;

  for (let i = 1; i <= n; i++) {
    onProgress?.(`Pagina ${i}/${n} verwerken…`, 0.05 + (i / n) * 0.9);
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Groepeer items op Y-positie om regeleinden te detecteren
    const byY = {};
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!byY[y]) byY[y] = [];
      byY[y].push(item.str);
    }
    const lines = Object.keys(byY)
      .sort((a, b) => b - a)
      .map(y => byY[y].join(' ').trim())
      .filter(Boolean);

    if (lines.length) {
      if (n > 1) md += `## Pagina ${i}\n\n`;
      md += lines.join('\n') + '\n\n';
    }
  }
  return md.trim();
}

// ── Word (.docx) → Markdown ───────────────────────────────────────────────

async function docxToMarkdown(file, onProgress) {
  await loadMammoth();
  onProgress?.('Word-document verwerken…', 0.2);
  const ab     = await readAsArrayBuffer(file);
  const result = await mammoth.convertToMarkdown({ arrayBuffer: ab });
  onProgress?.('Klaar', 1);
  const title = file.name.replace(/\.docx$/i, '');
  return `# ${title}\n\n${result.value.trim()}`;
}

// ── Afbeelding → Markdown (OCR) ───────────────────────────────────────────

async function imageToMarkdown(file, onProgress) {
  await loadTesseract();
  onProgress?.('OCR starten…', 0.05);
  const worker = await Tesseract.createWorker('nld+eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text')
        onProgress?.('Tekst herkennen…', 0.15 + (m.progress || 0) * 0.8);
    },
  });
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  onProgress?.('Klaar', 1);
  return `# ${file.name}\n\n${text.trim()}`;
}

// ── Hoofd-API ─────────────────────────────────────────────────────────────

export const SUPPORTED_EXTENSIONS =
  '.txt,.md,.html,.htm,.csv,.pdf,.docx,.jpg,.jpeg,.png,.gif,.webp,.bmp';

/**
 * Converteert een bestand naar Markdown.
 * @param {File} file
 * @param {(status: string, progress: number) => void} [onProgress]
 * @returns {Promise<{ markdown: string, title: string }>}
 */
export async function convertToMarkdown(file, onProgress) {
  const name = file.name || 'document';
  const ext  = name.split('.').pop().toLowerCase();
  const mime = file.type || '';

  onProgress?.('Bestand herkennen…', 0);

  let markdown;

  if (ext === 'md' || ext === 'markdown') {
    markdown = await readAsText(file);
  } else if (ext === 'txt') {
    const text = await readAsText(file);
    markdown   = `# ${name.replace(/\.txt$/i, '')}\n\n${text}`;
  } else if (ext === 'html' || ext === 'htm' || mime === 'text/html') {
    const html = await readAsText(file);
    markdown   = htmlToMarkdown(html);
  } else if (ext === 'csv' || mime === 'text/csv' || mime === 'application/csv') {
    const csv  = await readAsText(file);
    const title = name.replace(/\.csv$/i, '');
    markdown   = `# ${title}\n\n${csvToMarkdown(csv)}`;
  } else if (ext === 'pdf' || mime === 'application/pdf') {
    markdown = await pdfToMarkdown(file, onProgress);
  } else if (
    ext === 'docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    markdown = await docxToMarkdown(file, onProgress);
  } else if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    markdown = await imageToMarkdown(file, onProgress);
  } else {
    try {
      const text = await readAsText(file);
      markdown   = `# ${name}\n\n${text}`;
    } catch {
      throw new Error(`Bestandstype .${ext} wordt niet ondersteund`);
    }
  }

  const title = name.replace(/\.[^.]+$/, '');
  onProgress?.('Gereed', 1);
  return { markdown: markdown.trim(), title };
}
