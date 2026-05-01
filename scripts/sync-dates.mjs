// Pulls upcoming events from the public Google Sheet and re-renders the
// `<!-- DATES:START -->` / `<!-- DATES:END -->` blocks in date.html and
// index.html. Past dates are dropped. Run by .github/workflows/sync-dates.yml.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHEET_ID = '12hsYdCyQoU_O9azfzkSB8xLeQIxC7hUQET75aKkH22I';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

const MONTHS_LONG = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre',
];
const MONTHS_SHORT = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];

const HEADER_ALIASES = {
  data: ['data'],
  ora: ['ora'],
  locale: ['locale'],
  indirizzo: ['indirizzo', 'indirzzo'], // tolerate the sheet's typo
  biglietti: ['biglietti'],
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IG_URL = 'https://instagram.com/collettivo_variega';

// --- CSV parser (RFC 4180 subset; handles quoted fields and embedded commas/newlines) ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function findColumn(header, key) {
  const aliases = HEADER_ALIASES[key];
  for (const alias of aliases) {
    const idx = header.findIndex(h => h.trim().toLowerCase() === alias);
    if (idx !== -1) return idx;
  }
  throw new Error(`Column "${key}" not found in sheet header: [${header.join(', ')}]`);
}

function parseItalianDate(s) {
  s = (s || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function renderShow(e) {
  const day = String(e.date.getDate()).padStart(2, '0');
  const month = MONTHS_LONG[e.date.getMonth()];
  const year = e.date.getFullYear();
  const meta = [e.ora, e.indirizzo].filter(Boolean).join(' · ');
  const cta = e.biglietti
    ? `<a href="${escapeHtml(e.biglietti)}" target="_blank" rel="noopener" class="show__cta">Biglietti →</a>`
    : `<a href="${IG_URL}" target="_blank" rel="noopener" class="show__cta">Info →</a>`;
  return `  <div class="show">
    <div class="show__date">
      <span class="day">${day}</span>
      <span class="month">${escapeHtml(month)}</span>
      <span class="year">${year}</span>
    </div>
    <div>
      <div class="show__where">${escapeHtml(e.locale)}
        ${meta ? `<small>${escapeHtml(meta)}</small>` : ''}
      </div>
    </div>
    ${cta}
  </div>`;
}

function renderShowsBlock(events) {
  if (events.length === 0) {
    return `  <p style="font-family: var(--font-mono); text-align: center; padding: 2rem 0; color: var(--ink-soft);">
    Nessuna data in calendario al momento — segui <a href="${IG_URL}" target="_blank" rel="noopener" style="color: var(--brand-orange-deep);">@collettivo_variega</a> per gli aggiornamenti.
  </p>`;
  }
  return events.map(renderShow).join('\n\n');
}

function renderRow(e) {
  const day = String(e.date.getDate()).padStart(2, '0');
  const monShort = MONTHS_SHORT[e.date.getMonth()];
  const year = e.date.getFullYear();
  const sub = [e.ora, e.indirizzo].filter(Boolean).join(' · ');
  const badge = e.biglietti
    ? `<a href="${escapeHtml(e.biglietti)}" target="_blank" rel="noopener" class="date-row__badge" style="text-decoration: none; background: var(--brand-orange-deep);">Biglietti →</a>`
    : `<div class="date-row__badge">Ingresso libero</div>`;
  return `      <div class="date-row">
        <div class="date-row__day">${day}<small>${monShort} · ${year}</small></div>
        <div>
          <div class="date-row__where">${escapeHtml(e.locale)}</div>
          <div class="date-row__city">${escapeHtml(sub)}</div>
        </div>
        ${badge}
      </div>`;
}

function renderStripBlock(events) {
  if (events.length === 0) {
    return `      <p style="font-family: var(--font-mono); color: var(--ink); opacity: 0.7;">
        Nessuna data in calendario. Segui <a href="${IG_URL}" target="_blank" rel="noopener">@collettivo_variega</a>.
      </p>`;
  }
  // Cap the home strip at 4 rows to keep it tight.
  return events.slice(0, 4).map(renderRow).join('\n');
}

async function patchFile(relPath, replacement) {
  const path = join(ROOT, relPath);
  const content = await readFile(path, 'utf8');
  const re = /<!-- DATES:START -->[\s\S]*?<!-- DATES:END -->/;
  if (!re.test(content)) {
    throw new Error(`Marker pair "DATES:START/END" not found in ${relPath}`);
  }
  const next = content.replace(re, `<!-- DATES:START -->\n${replacement}\n      <!-- DATES:END -->`);
  if (next === content) return false;
  await writeFile(path, next);
  return true;
}

async function main() {
  console.log(`Fetching ${CSV_URL}`);
  const res = await fetch(CSV_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const csv = await res.text();

  const rows = parseCSV(csv).filter(r => r.some(c => c && c.trim()));
  if (rows.length === 0) throw new Error('Empty sheet');

  const header = rows[0];
  const cols = {
    data: findColumn(header, 'data'),
    ora: findColumn(header, 'ora'),
    locale: findColumn(header, 'locale'),
    indirizzo: findColumn(header, 'indirizzo'),
    biglietti: findColumn(header, 'biglietti'),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = rows.slice(1)
    .map(r => ({
      date: parseItalianDate(r[cols.data]),
      ora: (r[cols.ora] || '').trim(),
      locale: (r[cols.locale] || '').trim(),
      indirizzo: (r[cols.indirizzo] || '').trim(),
      biglietti: (r[cols.biglietti] || '').trim(),
    }))
    .filter(e => e.date && !Number.isNaN(e.date.getTime()) && e.locale)
    .filter(e => e.date >= today)
    .sort((a, b) => a.date - b.date);

  console.log(`Upcoming events: ${events.length}`);
  for (const e of events) console.log(`  - ${e.date.toISOString().slice(0, 10)} ${e.locale}`);

  const dateChanged = await patchFile('date.html', renderShowsBlock(events));
  const indexChanged = await patchFile('index.html', renderStripBlock(events));

  if (dateChanged || indexChanged) {
    console.log(`Updated: ${[dateChanged && 'date.html', indexChanged && 'index.html'].filter(Boolean).join(', ')}`);
  } else {
    console.log('No changes.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
