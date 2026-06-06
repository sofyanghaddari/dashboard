// Open een print-vriendelijk venster met overzicht — gebruiker print → PDF
import { all } from './db.js';
import { fmtMoney, ymd, startOfMonth, monthKey } from './utils.js';

export async function exportMonthPDF(date = new Date()) {
  const [rides, expenses] = await Promise.all([all('rides'), all('expenses')]);
  const month = date.getMonth(), year = date.getFullYear();
  const inMonth = (d) => { const x = new Date(d); return x.getMonth() === month && x.getFullYear() === year; };

  const mRides = rides.filter(r => inMonth(r.date)).sort((a,b) => a.date.localeCompare(b.date));
  const mExp = expenses.filter(e => inMonth(e.date)).sort((a,b) => a.date.localeCompare(b.date));
  const totIn = mRides.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totOut = mExp.reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthName = date.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><title>Inkomen overzicht — ${monthName}</title>
  <style>
    @page { margin: 22mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.5; max-width: 720px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 1.8rem; margin: 0 0 4px; letter-spacing: -.02em; }
    .sub { color: #666; font-size: .9rem; margin-bottom: 24px; }
    .totals { display: flex; gap: 24px; padding: 16px 0; border-top: 2px solid #222; border-bottom: 2px solid #222; margin-bottom: 24px; }
    .totals .item { flex: 1; }
    .totals .label { font-size: .7rem; text-transform: uppercase; color: #666; letter-spacing: .1em; }
    .totals .value { font-size: 1.5rem; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: .85rem; }
    th { background: #f5f5f5; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .footer { margin-top: 40px; font-size: .75rem; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 12px; }
    @media print { body { padding: 0; } }
  </style></head><body>
    <h1>Inkomen overzicht</h1>
    <div class="sub">${monthName} · gegenereerd ${new Date().toLocaleDateString('nl-NL')}</div>
    <div class="totals">
      <div class="item"><div class="label">Bruto inkomen</div><div class="value">${fmtMoney(totIn)}</div></div>
      ${totOut > 0 ? `<div class="item"><div class="label">Uitgaven</div><div class="value">${fmtMoney(totOut)}</div></div>
      <div class="item"><div class="label">Netto</div><div class="value">${fmtMoney(totIn - totOut)}</div></div>` : ''}
    </div>
    <h2 style="font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:#555">Inkomen per dag</h2>
    <table>
      <thead><tr><th>Datum</th><th>Notitie</th><th class="num">Bedrag</th></tr></thead>
      <tbody>
        ${mRides.map(r => `<tr>
          <td>${new Date(r.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
          <td>${(r.note || '').replace(/</g,'&lt;')}</td>
          <td class="num">${fmtMoney(r.amount)}</td>
        </tr>`).join('')}
        <tr><td colspan="2" style="text-align:right;font-weight:600">Totaal</td><td class="num" style="font-weight:600">${fmtMoney(totIn)}</td></tr>
      </tbody>
    </table>
    ${mExp.length ? `
    <h2 style="font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:#555">Uitgaven</h2>
    <table>
      <thead><tr><th>Datum</th><th>Categorie</th><th>Notitie</th><th class="num">Bedrag</th></tr></thead>
      <tbody>
        ${mExp.map(e => `<tr>
          <td>${new Date(e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</td>
          <td>${e.category}</td>
          <td>${(e.note || '').replace(/</g,'&lt;')}</td>
          <td class="num">${fmtMoney(e.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}
    <div class="footer">Sofyan's First App · Sofyan Ghaddari</div>
    <script>setTimeout(() => window.print(), 400);</script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.open();
  w.document.write(html);
  w.document.close();
}
