// A dependency-free PDF report of the journal. Uses the built-in Helvetica
// fonts, so the output stays small and works offline.
import { CATEGORIES } from './data.js';
import { dayKey, fmtTime, activeAt } from './model.js';
import { t, locale, categoryName, entryName } from './i18n.js';

const W = 595.28, H = 841.89, M = 44, CW = W - 2 * M, BOTTOM = H - 64;
const REFERENCE = 400;
const C = {
  ink: '#342e29', muted: '#665e55', line: '#e6e0d5', accent: '#a4432e', bar: '#cb8068', over: '#bc543e', soft: '#eeebe2',
  paper: '#fffdf8', peach: '#f3dfcf', sage: '#e5ead8', lilac: '#e9e3f1', blue: '#e0edf2', accentSoft: '#f4d9c9',
};
const CAT_NAMES = Object.fromEntries(CATEGORIES);
const CAT_COLORS = { coffee: '#a4432e', tea: '#90aa69', energy: '#e7bb63', soda: '#78442c', supp: '#9c88b8', sweets: '#cb8068' };

// Helvetica and Helvetica-Bold advance widths for ASCII 32–126 (per 1000 em).
export const WIDTHS = {
  regular: [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584],
  bold: [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584],
};
// WinAnsiEncoding: Latin-1 maps directly; a few typographic marks live in 128–159.
const WIN = { 0x20ac: 128, 0x2026: 133, 0x2018: 145, 0x2019: 146, 0x201c: 147, 0x201d: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151, 0x2122: 153 };
export function encode(text) {
  const codes = [];
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if ((c >= 32 && c < 127) || (c >= 161 && c <= 255)) codes.push(c);
    else if (WIN[c]) codes.push(WIN[c]);
    else codes.push(c === 0xa0 || c === 0x202f || c === 0x2009 || c === 9 || c === 10 ? 32 : 63);
  }
  return codes;
}
const textWidth = (text, size, bold = false, spacing = 0) => encode(text).reduce((sum, c) => sum + (c >= 32 && c <= 126 ? WIDTHS[bold ? 'bold' : 'regular'][c - 32] : 556) * size / 1000 + spacing, 0);
const pdfString = text => `(${encode(text).map(c => c === 40 || c === 41 || c === 92 ? `\\${String.fromCharCode(c)}` : c < 127 ? String.fromCharCode(c) : `\\${c.toString(8).padStart(3, '0')}`).join('')})`;
const num = v => String(Math.round(v * 100) / 100);
const rgb = hex => [1, 3, 5].map(i => num(parseInt(hex.slice(i, i + 2), 16) / 255)).join(' ');
const mg = v => `${Math.round(v).toLocaleString(locale())} mg`;
const localDate = (key, options) => new Date(`${key}T12:00:00`).toLocaleDateString(locale(), options);
function fit(text, size, bold, max) {
  text = String(text);
  if (textWidth(text, size, bold) <= max) return text;
  while (text && textWidth(`${text}…`, size, bold) > max) text = text.slice(0, -1);
  return `${text.trimEnd()}…`;
}
function wrap(text, size, bold, max) {
  const lines = [];
  let current = '';
  for (const word of String(text).split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && textWidth(next, size, bold) > max) { lines.push(current); current = word; } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

// Drawing works in top-left coordinates (points); PDF space is flipped on output.
class Canvas {
  constructor() { this.pages = []; this.newPage(); }
  newPage() { this.ops = []; this.pages.push(this.ops); }
  rect(x, y, w, h, fill, r = 0) {
    if (w <= 0 || h <= 0) return;
    const by = H - y - h;
    r = Math.min(r, w / 2, h / 2);
    const k = r * 0.4477;
    const path = r ? [
      `${num(x + r)} ${num(by)} m`, `${num(x + w - r)} ${num(by)} l`, `${num(x + w - k)} ${num(by)} ${num(x + w)} ${num(by + k)} ${num(x + w)} ${num(by + r)} c`,
      `${num(x + w)} ${num(by + h - r)} l`, `${num(x + w)} ${num(by + h - k)} ${num(x + w - k)} ${num(by + h)} ${num(x + w - r)} ${num(by + h)} c`,
      `${num(x + r)} ${num(by + h)} l`, `${num(x + k)} ${num(by + h)} ${num(x)} ${num(by + h - k)} ${num(x)} ${num(by + h - r)} c`,
      `${num(x)} ${num(by + r)} l`, `${num(x)} ${num(by + k)} ${num(x + k)} ${num(by)} ${num(x + r)} ${num(by)} c`, 'h',
    ].join(' ') : `${num(x)} ${num(by)} ${num(w)} ${num(h)} re`;
    this.ops.push(`${rgb(fill)} rg ${path} f`);
  }
  // A bar with rounded top corners only.
  bar(x, y, w, h, fill) {
    if (h <= 0) return;
    const r = Math.min(2.5, w / 2, h);
    this.rect(x, y, w, h, fill, r);
    if (h > r) this.rect(x, y + h - r, w, r, fill);
  }
  line(x1, y1, x2, y2, color = C.line, width = 0.75, dash = '') {
    this.ops.push(`q ${rgb(color)} RG ${num(width)} w ${dash ? `[${dash}] 0 d ` : ''}1 J ${num(x1)} ${num(H - y1)} m ${num(x2)} ${num(H - y2)} l S Q`);
  }
  text(x, y, value, { size = 9, bold = false, color = C.ink, align = 'left', max, spacing = 0 } = {}) {
    let text = String(value);
    if (max) text = fit(text, size, bold, max);
    const width = textWidth(text, size, bold, spacing);
    const left = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
    this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${num(size)} Tf ${num(spacing)} Tc ${rgb(color)} rg 1 0 0 1 ${num(left)} ${num(H - y)} Tm ${pdfString(text)} Tj ET`);
    return width;
  }
  paragraph(x, y, value, max, options = {}) {
    const size = options.size || 9, leading = options.leading || size * 1.45;
    wrap(value, size, options.bold, max).forEach((line, i) => this.text(x, y + i * leading, line, options));
    return wrap(value, size, options.bold, max).length * leading;
  }
}
function writePdf(pages, title) {
  const objects = [];
  const add = body => objects.push(body);
  const catalog = add(''), pagesRef = add('');
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = pages.map(ops => {
    const stream = ops.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const info = add(`<< /Title ${pdfString(title)} /Producer (Kaffe) /Creator (Kaffe - a little coffee journal) >>`);
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = objects.map((body, i) => { const at = out.length; out += `${i + 1} 0 obj\n${body}\nendobj\n`; return at; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Every character is a single byte (content strings use octal escapes).
  return Uint8Array.from(out, ch => ch.charCodeAt(0));
}

function shiftDay(key, delta) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}
function daysBetween(fromKey, toKey) {
  return Math.round((new Date(`${toKey}T12:00:00`) - new Date(`${fromKey}T12:00:00`)) / 86400000);
}
export function reportData(entries, now = Date.now(), halfLife = 5) {
  const today = dayKey(now), byDay = new Map();
  const sorted = [...entries].sort((a, b) => a.time - b.time);
  for (const e of sorted) {
    const key = dayKey(e.time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(e);
  }
  const dayInfo = key => {
    const rows = byDay.get(key) || [], drinks = rows.filter(e => e.kind === 'drink');
    return { key, rows, mg: drinks.reduce((s, e) => s + e.mg, 0), kcal: drinks.reduce((s, e) => s + e.kcal, 0), drinks: drinks.length, water: rows.length - drinks.length };
  };
  const firstKey = sorted.length ? [dayKey(sorted[0].time), today].sort()[0] : today;
  const spanDays = daysBetween(firstKey, today) + 1;
  const period = (key, count) => {
    const days = Array.from({ length: count }, (_, i) => dayInfo(shiftDay(today, i - count + 1)));
    const total = days.reduce((s, d) => s + d.mg, 0);
    const peak = days.reduce((best, d) => d.mg > best.mg ? d : best, days[0]);
    return {
      label: t(`r.${key}`), count, single: key === 'today', from: days[0].key, to: today, days, total, avg: total / count, peak,
      drinks: days.reduce((s, d) => s + d.drinks, 0), water: days.reduce((s, d) => s + d.water, 0),
      kcal: days.reduce((s, d) => s + d.kcal, 0), over: days.filter(d => d.mg > REFERENCE).length,
      logged: days.filter(d => d.rows.length).length,
    };
  };
  const all = period('all', spanDays);
  const months = [];
  for (const d of all.days) {
    const key = d.key.slice(0, 7);
    if (months.at(-1)?.key !== key) months.push({ key, total: 0, days: 0, over: 0 });
    const month = months.at(-1);
    month.total += d.mg; month.days += 1; if (d.mg > REFERENCE) month.over += 1;
  }
  months.forEach(m => { m.avg = m.total / m.days; });
  const hours = Array(24).fill(0), cats = {}, drinks = {};
  for (const e of sorted) {
    if (e.kind !== 'drink') continue;
    hours[new Date(e.time).getHours()] += e.mg;
    cats[e.cat] ||= { cat: e.cat, mg: 0, count: 0 };
    cats[e.cat].mg += e.mg; cats[e.cat].count += 1;
    const name = entryName(e);
    drinks[name] ||= { name, mg: 0, count: 0 };
    drinks[name].mg += e.mg; drinks[name].count += 1;
  }
  return {
    now, today, halfLife, entries: sorted.length, active: activeAt(entries, now, halfLife),
    periods: { today: period('today', 1), week: period('week', 7), month: period('month', 30), all },
    months, hours,
    categories: Object.values(cats).sort((a, b) => b.mg - a.mg),
    favorites: Object.values(drinks).sort((a, b) => b.count - a.count || b.mg - a.mg).slice(0, 5),
    pages: [...byDay.keys()].sort().reverse().map(dayInfo),
  };
}

function header(c, y, eyebrow, title) {
  c.text(M, y, eyebrow, { size: 7.5, bold: true, color: C.accent, spacing: 1.1 });
  c.text(M, y + 22, title, { size: 19, bold: true });
  return y + 36;
}
function barChart(c, { x, y, w, h, values, labels, highlight = () => false, valueLabels = true, reference = REFERENCE }) {
  const max = Math.max(reference * 1.15, ...values.map(v => v * 1.12), 1);
  const slot = w / values.length, bw = Math.min(slot * 0.68, 34), base = y + h;
  c.line(x, base, x + w, base, C.line, 0.75);
  values.forEach((v, i) => {
    const bx = x + i * slot + (slot - bw) / 2, bh = v > 0 ? Math.max(1.5, v / max * h) : 0;
    c.bar(bx, base - bh, bw, bh, v > reference ? C.over : highlight(i) ? C.accent : C.bar);
    if (v === 0) c.rect(bx, base - 1, bw, 1, C.accentSoft);
    if (valueLabels && v > 0) c.text(bx + bw / 2, base - bh - 3.5, Math.round(v), { size: values.length > 20 ? 5.6 : 7, color: C.muted, align: 'center' });
    if (labels[i]) c.text(x + i * slot + slot / 2, base + 10, labels[i], { size: values.length > 20 ? 6 : 7, color: C.muted, align: 'center', bold: highlight(i) });
  });
  if (reference) {
    const ry = base - reference / max * h;
    c.line(x, ry, x + w, ry, C.accent, 0.6, '2.5 2');
    const label = t('r.reference', reference);
    c.rect(x + w - textWidth(label, 6.5, true) - 6, ry - 5, textWidth(label, 6.5, true) + 6, 10, C.paper);
    c.text(x + w - 3, ry + 2.3, label, { size: 6.5, bold: true, color: C.accent, align: 'right' });
  }
}
function periodCard(c, x, y, w, h, period, fill, extra) {
  c.rect(x, y, w, h, fill, 10);
  const pad = 11;
  c.text(x + pad, y + 18, period.label.toUpperCase(), { size: 7, bold: true, color: C.muted, spacing: 0.8 });
  const range = period.single ? localDate(period.to, { weekday: 'short', day: 'numeric', month: 'short' })
    : `${localDate(period.from, { day: 'numeric', month: 'short', ...(period.from.slice(0, 4) !== period.to.slice(0, 4) ? { year: 'numeric' } : {}) })} – ${localDate(period.to, { day: 'numeric', month: 'short' })}`;
  c.text(x + pad, y + 29, range, { size: 7, color: C.muted, max: w - 2 * pad });
  const big = Math.round(period.total).toLocaleString(locale());
  const bigSize = textWidth(big, 25, true) > w - 2 * pad - 20 ? 19 : 25;
  const bw = c.text(x + pad, y + 59, big, { size: bigSize, bold: true });
  c.text(x + pad + bw + 3, y + 59, 'mg', { size: 9, color: C.muted });
  const value = period.single ? period.total : period.avg;
  const track = w - 2 * pad;
  c.rect(x + pad, y + 68, track, 4, C.paper, 2);
  c.rect(x + pad, y + 68, Math.max(value > 0 ? 4 : 0, Math.min(1, value / REFERENCE) * track), 4, value > REFERENCE ? C.over : C.accent, 2);
  const lines = [
    period.single ? extra : t('r.perDay', mg(period.avg)),
    `${t('r.drinks', period.drinks)} · ${t('r.water', period.water)}`,
    period.single ? (period.total > REFERENCE ? t('r.overRef') : t('r.underRef', mg(Math.max(0, REFERENCE - period.total)))) : t('r.daysOver', t('r.days', period.over), REFERENCE),
  ];
  lines.forEach((line, i) => c.text(x + pad, y + 86 + i * 11.5, line, { size: 7.6, color: i === 2 && (period.over || period.total > REFERENCE) ? C.accent : C.ink, bold: i === 0, max: track }));
}

export function buildReport(state, now = Date.now()) {
  const data = reportData(state.entries, now, state.settings?.halfLife || 5);
  const { periods } = data, c = new Canvas();
  const generated = new Date(now).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Page 1: today, week, month, forever at a glance.
  const markWidth = c.text(M, 66, 'kaffe', { size: 26, bold: true });
  c.text(M + markWidth, 66, '.', { size: 26, bold: true, color: C.accent });
  c.text(M, 80, t('brandNote'), { size: 8.5, color: C.muted });
  c.text(W - M, 52, t('r.report'), { size: 7.5, bold: true, color: C.accent, align: 'right', spacing: 1.1 });
  c.text(W - M, 66, generated, { size: 10.5, bold: true, align: 'right' });
  c.text(W - M, 80, t('r.generated', fmtTime(now), t('r.entries', data.entries)), { size: 7.5, color: C.muted, align: 'right' });
  c.line(M, 94, W - M, 94);
  let y = header(c, 120, t('r.glanceEyebrow'), t('r.glance'));
  const gap = 9, cardW = (CW - 3 * gap) / 4;
  [[periods.today, C.peach], [periods.week, C.sage], [periods.month, C.lilac], [periods.all, C.blue]].forEach(([p, fill], i) =>
    periodCard(c, M + i * (cardW + gap), y, cardW, 124, p, fill, t('r.stillActive', mg(data.active))));
  y += 150;

  y = header(c, y, t('r.last30'), t('r.birdseye'));
  const month = periods.month.days;
  barChart(c, {
    x: M, y: y + 6, w: CW, h: 132, values: month.map(d => d.mg),
    labels: month.map(d => new Date(`${d.key}T12:00:00`).getDate()), highlight: i => i === month.length - 1,
  });
  y += 160;
  c.text(M, y, t('r.monthNote', mg(periods.month.avg), periods.month.peak.mg ? t('r.peakOn', mg(periods.month.peak.mg), localDate(periods.month.peak.key, { weekday: 'short', day: 'numeric', month: 'short' })) : t('r.none')), { size: 7.5, color: C.muted });
  y += 24;

  // Week table (left) and what's in the cups (right).
  const colW = (CW - 24) / 2, right = M + colW + 24;
  c.text(M, y, t('r.weekTitle'), { size: 7.5, bold: true, color: C.accent, spacing: 1.1 });
  c.text(right, y, t('r.cups'), { size: 7.5, bold: true, color: C.accent, spacing: 1.1 });
  let wy = y + 16;
  c.text(M + 88, wy, t('r.colDrinks'), { size: 6.8, color: C.muted, align: 'right' });
  c.text(M + 120, wy, t('r.colWater'), { size: 6.8, color: C.muted, align: 'right' });
  c.text(M + colW, wy, t('r.colCaffeine'), { size: 6.8, color: C.muted, align: 'right' });
  wy += 6;
  const weekMax = Math.max(REFERENCE, ...periods.week.days.map(d => d.mg));
  for (const d of [...periods.week.days].reverse()) {
    c.line(M, wy, M + colW, wy, C.line, 0.5);
    wy += 14;
    const isToday = d.key === data.today;
    c.text(M, wy, isToday ? t('r.today') : localDate(d.key, { weekday: 'short', day: 'numeric', month: 'short' }), { size: 8.2, bold: isToday });
    c.text(M + 88, wy, d.drinks, { size: 8.2, align: 'right' });
    c.text(M + 120, wy, d.water, { size: 8.2, align: 'right' });
    c.rect(M + 132, wy - 6.5, (colW - 186) * d.mg / weekMax, 7, d.mg > REFERENCE ? C.over : C.bar, 2);
    c.text(M + colW, wy, mg(d.mg), { size: 8.2, bold: true, align: 'right', color: d.mg > REFERENCE ? C.accent : C.ink });
    wy += 6;
  }
  c.line(M, wy, M + colW, wy, C.line, 0.5);
  c.text(M, wy + 14, t('r.total'), { size: 8.2, bold: true });
  c.text(M + 88, wy + 14, periods.week.drinks, { size: 8.2, bold: true, align: 'right' });
  c.text(M + 120, wy + 14, periods.week.water, { size: 8.2, bold: true, align: 'right' });
  c.text(M + colW, wy + 14, mg(periods.week.total), { size: 8.2, bold: true, align: 'right' });

  let ry = y + 18;
  const allMg = periods.all.total;
  if (!data.categories.length) { c.text(right, ry + 6, t('r.noCaffeine'), { size: 8.5, color: C.muted }); ry += 22; }
  for (const cat of data.categories.slice(0, 5)) {
    const share = allMg ? cat.mg / allMg : 0;
    c.text(right, ry + 6, categoryName(cat.cat, CAT_NAMES[cat.cat] || cat.cat), { size: 8.2, bold: true });
    c.text(right + colW, ry + 6, `${Math.round(share * 100)}% · ${mg(cat.mg)}`, { size: 7.5, color: C.muted, align: 'right' });
    c.rect(right, ry + 10, colW, 4, C.soft, 2);
    c.rect(right, ry + 10, Math.max(4, share * colW), 4, CAT_COLORS[cat.cat] || C.bar, 2);
    ry += 22;
  }
  ry += 8;
  c.text(right, ry, t('r.regulars'), { size: 7.5, bold: true, color: C.accent, spacing: 1.1 });
  ry += 4;
  if (!data.favorites.length) c.text(right, ry + 14, t('r.regularsEmpty'), { size: 8.5, color: C.muted });
  data.favorites.forEach((f, i) => {
    ry += 14;
    c.text(right, ry, `0${i + 1}`, { size: 7.5, bold: true, color: C.accent });
    c.text(right + 18, ry, f.name, { size: 8.2, max: colW - 90 });
    c.text(right + colW, ry, `${f.count}× · ${mg(f.mg)}`, { size: 7.5, color: C.muted, align: 'right' });
  });

  // Page 2: the long view.
  c.newPage();
  y = header(c, 70, t('r.since', localDate(periods.all.from, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()), t('r.longView'));
  const tiles = [
    [t('r.totalCaffeine'), mg(periods.all.total), t('r.logged', t('r.drinks', periods.all.drinks))],
    [t('r.dailyAvg'), mg(periods.all.avg), t('r.over', t('r.days', periods.all.count))],
    [t('r.highest'), periods.all.peak.mg ? mg(periods.all.peak.mg) : '—', periods.all.peak.mg ? localDate(periods.all.peak.key, { day: 'numeric', month: 'short', year: 'numeric' }) : t('r.nothing')],
    [t('r.withEntries'), periods.all.logged.toLocaleString(locale()), t('r.of', t('r.days', periods.all.count))],
    [t('r.overTheRef'), t('r.days', periods.all.over), t('r.above', REFERENCE)],
    [t('r.waterTile'), t('r.glasses', periods.all.water), t('r.kcal', Math.round(periods.all.kcal).toLocaleString(locale()))],
  ];
  const tileW = (CW - 2 * gap) / 3;
  tiles.forEach(([label, value, note], i) => {
    const tx = M + (i % 3) * (tileW + gap), ty = y + Math.floor(i / 3) * 66;
    c.rect(tx, ty, tileW, 57, [C.peach, C.sage, C.lilac, C.blue, C.accentSoft, C.soft][i], 10);
    c.text(tx + 11, ty + 16, label.toUpperCase(), { size: 6.8, bold: true, color: C.muted, spacing: 0.7 });
    c.text(tx + 11, ty + 36, value, { size: 15, bold: true, max: tileW - 22 });
    c.text(tx + 11, ty + 48, note, { size: 7.2, color: C.muted, max: tileW - 22 });
  });
  y += 150;

  const months = data.months.slice(-24);
  y = header(c, y, t(months.length < data.months.length ? 'r.monthly24' : 'r.monthly'), t('r.avgPerMonth'));
  barChart(c, {
    x: M, y: y + 6, w: CW, h: 120, values: months.map(m => m.avg),
    labels: months.map((m, i) => {
      const d = new Date(`${m.key}-15T12:00:00`);
      return d.toLocaleDateString(locale(), { month: 'short', ...(i === 0 || m.key.endsWith('-01') ? { year: 'numeric' } : {}) });
    }),
    highlight: i => i === months.length - 1,
  });
  y += 168;

  y = header(c, y, t('r.lands'), t('r.byHour'));
  const hourMax = Math.max(...data.hours, 1), slot = CW / 24, base = y + 100;
  c.line(M, base, W - M, base, C.line, 0.75);
  const [bedHour, bedMinute] = (state.settings?.bedtime || '23:00').split(':').map(Number);
  data.hours.forEach((v, h) => {
    const bh = v ? Math.max(1.5, v / hourMax * 88) : 0;
    c.bar(M + h * slot + slot * 0.16, base - bh, slot * 0.68, bh, h >= 14 ? C.accent : C.bar);
    if (h % 3 === 0) c.text(M + h * slot + slot / 2, base + 10, new Date(2000, 0, 1, h).toLocaleTimeString(locale(), { hour: 'numeric' }), { size: 6.5, color: C.muted, align: 'center' });
  });
  const bedX = M + (bedHour + bedMinute / 60) * slot;
  c.line(bedX, y + 4, bedX, base, C.ink, 0.6, '1.5 2');
  c.text(bedX + (bedHour >= 21 ? -3 : 3), y + 8, t('r.bedtime', fmtTime(new Date(2000, 0, 1, bedHour, bedMinute))), { size: 6.5, bold: true, align: bedHour >= 21 ? 'right' : 'left' });
  const late = data.hours.slice(14).reduce((s, v) => s + v, 0), total = data.hours.reduce((s, v) => s + v, 0);
  y = base + 26;
  c.text(M, y, total ? t('r.late', Math.round(late / total * 100), fmtTime(new Date(2000, 0, 1, 14)), data.halfLife) : t('r.lateEmpty'), { size: 7.5, color: C.muted });
  y += 26;

  // The daily pages: every entry, newest day first.
  const pageHead = () => {
    c.newPage();
    c.text(M, 52, 'kaffe', { size: 11, bold: true });
    c.text(M + textWidth('kaffe', 11, true), 52, '.', { size: 11, bold: true, color: C.accent });
    c.text(W - M, 52, t('r.continued'), { size: 7.5, color: C.muted, align: 'right' });
    c.line(M, 60, W - M, 60);
    return 82;
  };
  if (y > BOTTOM - 120) y = pageHead();
  else { c.line(M, y - 8, W - M, y - 8); y += 14; }
  y = header(c, y, t('r.everySip'), t('r.dailyPages'));
  if (!data.pages.length) c.text(M, y + 4, t('r.noSips'), { size: 9.5, color: C.muted });
  for (const day of data.pages) {
    if (y + 44 > BOTTOM) y = pageHead();
    c.rect(M, y, CW, 20, day.mg > REFERENCE ? C.accentSoft : C.soft, 6);
    c.text(M + 9, y + 13.5, localDate(day.key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), { size: 8.6, bold: true });
    const summary = `${t('r.drinks', day.drinks)} · ${t('r.water', day.water)} · ${Math.round(day.kcal)} kcal`;
    const total = c.text(W - M - 9, y + 13.5, mg(day.mg), { size: 8.6, bold: true, align: 'right', color: day.mg > REFERENCE ? C.accent : C.ink });
    c.text(W - M - 18 - total, y + 13.5, day.mg > REFERENCE ? `${summary} · ${t('r.overReference')}` : summary, { size: 7.4, color: C.muted, align: 'right' });
    y += 20;
    for (const e of day.rows) {
      if (y + 15 > BOTTOM) { y = pageHead(); c.text(M, y - 4, t('r.dayContinued', localDate(day.key, { weekday: 'long', day: 'numeric', month: 'long' })), { size: 7.4, bold: true, color: C.muted }); y += 4; }
      y += 14;
      const water = e.kind === 'water';
      c.text(M + 9, y, fmtTime(e.time), { size: 8, color: C.muted });
      c.rect(M + 66, y - 6, 6, 6, water ? '#a9d8ed' : CAT_COLORS[e.cat] || C.bar, 3);
      c.text(M + 79, y, entryName(e), { size: 8.2, color: water ? C.muted : C.ink, max: 236 });
      if (!water) {
        c.text(M + 350, y, `${e.amount}×`, { size: 7.6, color: C.muted, align: 'right' });
        c.text(M + 420, y, `${Math.round(e.kcal)} kcal`, { size: 7.6, color: C.muted, align: 'right' });
      }
      c.text(W - M - 9, y, water ? '—' : mg(e.mg), { size: 8.2, bold: !water, color: water ? C.muted : C.ink, align: 'right' });
      y += 3;
      c.line(M + 9, y, W - M - 9, y, C.line, 0.4);
    }
    y += 12;
  }

  // Footer with the honest caveats on every page.
  const note = t('r.footer', data.halfLife);
  c.pages.forEach((ops, i) => {
    c.ops = ops;
    c.line(M, H - 50, W - M, H - 50, C.line, 0.5);
    c.paragraph(M, H - 37, note, CW - 70, { size: 6.6, color: C.muted, leading: 9 });
    c.text(W - M, H - 37, `${i + 1} / ${c.pages.length}`, { size: 7, bold: true, color: C.muted, align: 'right' });
  });
  return writePdf(c.pages, t('r.title', data.today));
}
