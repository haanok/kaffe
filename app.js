import { CATEGORIES, DRINKS, DRINK_BY_ID, QUICK, INGREDIENTS, ING_BY_ID, RECIPES, MAX_LAYERS, blendKey, matchRecipe, blendTotals } from './data.js';
import { pourDrink, pourWater, isPouring, rollTo } from './pour.js';
import { STORE_KEY, HOUR, uid, dayKey, timeValue, validTime, fmtTime, nextBedtime, activeAt, timeBelow, onDay, sumMg, sumKcal, historyDays, waterBonuses, loadState, normalizeState, makeDrink, estimateHalfLife, HALF_LIFE_BASE, SYNC_KEY, loadSyncMeta, mergeJournals, planSync, fetchCloudState, saveCloudState } from './model.js';
import { buildReport } from './report.js';
import { t, setLang, locale, LANGS, drinkName, servingName, categoryName, ingredientName, ingredientCategory as ingredientCategoryName, recipeName, recipeTagline, entryName } from './i18n.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); } }; }
const loaded = loadState(storage);
const state = loaded.state;
setLang(state.settings.lang);
// Account sync: authUser is the signed-in GitHub principal (or null), and
// syncMeta is this device's record of its last sync (see SYNC_KEY in model.js).
let authUser = null, syncMeta = loadSyncMeta(storage), revision = 0;
let syncStatus = syncMeta ? 'checking' : 'local', syncTimer = null, syncRun = null, syncAgain = false, signOutError = false;
let warning = loaded.warning;
let view = 'today', historyRange = 7, selectedDay = dayKey(), layers = [], ingredientCategory = 'All';
let sleepEntrance = false, historyMotion = '', historyFigures = null, undo = null, toastTimer, modalDrink = null, modalAmount = 1, modalCategory = 'all', modalQuery = '', audio;
const app = $('#app'), picker = $('#picker');
const icons = {
  cup: '<path d="M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M8 3v2m4-2v2m4-2v2"/>',
  today: '<rect x="4" y="5" width="16" height="16" rx="4"/><path d="M8 3v4m8-4v4M4 11h16m-11 5h2"/>',
  history: '<path d="M4 11a8 8 0 1 1 2 7M4 5v6h6m2-4v6l4 2"/>',
  sleep: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
  lab: '<path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  water: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m-6 0 6-6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  energy: '<path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
  shuffle: '<path d="m3 5 4 0 10 14h4m-4-4 4 4-4 4M3 19h4L17 5h4m-4-4 4 4-4 4"/>',
  settings: '<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  cloud: '<path d="M7 19h10.5a4.5 4.5 0 0 0 .4-9A6.5 6.5 0 0 0 5.5 9.6 4.7 4.7 0 0 0 7 19Z"/>',
  devices: '<rect x="2" y="4" width="14" height="10" rx="2"/><path d="M5 18h8"/><rect x="17" y="8" width="5" height="12" rx="1.5"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8m0-5v5h5M4 13a8 8 0 0 0 14.5 4.5L20 16m0 5v-5h-5"/>',
  signout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.cup}</svg>`;
function cup(cat = 'coffee', large = false) {
  const colors = { coffee: '#df775e', tea: '#9db676', energy: '#b6a4d9', soda: '#eebf58', supp: '#9ebccc', sweets: '#c9967d', water: '#8ec3dc' };
  const color = colors[cat] || colors.coffee;
  const art = cat === 'energy'
    ? `<path d="M46 50h60v50c0 20-12 23-30 23s-30-3-30-23Z" fill="${color}" stroke="#342921" stroke-width="3"/><ellipse cx="76" cy="50" rx="30" ry="6" fill="#e6d9f4" stroke="#342921" stroke-width="3"/><g transform="translate(60 61) scale(1.45)"><path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" fill="#fff" stroke="#342921" stroke-width="1.7" stroke-linejoin="round"/></g><path d="M55 66v26" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`
    : `<g class="steam" fill="none" stroke="currentColor" stroke-width="3" opacity=".5"><path d="M55 32c-12-12 12-14 0-26M78 28c-12-12 12-14 0-26M100 32c-12-12 12-14 0-26"/></g><path d="M111 57h9c26 0 23 38-6 38h-8" fill="none" stroke="#342921" stroke-width="13"/><path d="M111 57h9c26 0 23 38-6 38h-8" fill="none" stroke="${color}" stroke-width="8"/><path d="M32 45h80l-5 51c-2 28-67 28-70 0Z" fill="${color}" stroke="#342921" stroke-width="3"/><ellipse cx="72" cy="45" rx="40" ry="9" fill="#fff0d8" stroke="#342921" stroke-width="3"/><ellipse cx="72" cy="46" rx="31" ry="5" fill="${cat === 'tea' ? '#6b813e' : cat === 'water' ? '#b6e1ed' : '#78442c'}"/><path d="M48 66v20" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/><circle cx="64" cy="81" r="2.5" fill="#342921"/><circle cx="86" cy="81" r="2.5" fill="#342921"/><path d="M69 92q6 7 12 0" fill="none" stroke="#342921" stroke-width="2.5" stroke-linecap="round"/>`;
  return `<svg class="cup-art ${large ? 'large' : ''}" viewBox="0 0 150 140" aria-hidden="true"><ellipse cx="77" cy="123" rx="53" ry="7" fill="#342921" opacity=".09"/>${art}</svg>`;
}

function saveLocal() {
  if (loaded.blocked) { warning = 'warn.blocked'; return false; }
  try { storage.setItem(STORE_KEY, JSON.stringify(state)); warning = ''; return true; }
  catch { warning = 'warn.save'; return false; }
}
// Every user change goes through here: save locally, then mark it for the account.
function persist() {
  if (!saveLocal()) return;
  revision++;
  if (syncMeta && !syncMeta.dirty) writeSyncMeta({ ...syncMeta, dirty: true });
  queueCloudSync();
}

function tick() {
  if (!state.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(620, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(360, audio.currentTime + .1);
    gain.gain.setValueAtTime(.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .13);
  } catch { /* Sound is optional. */ }
}
// On by default (toggle in the sidebar): soft bubble "glugs" for a pour, a single plink for water.
function glug(kind) {
  if (!state.settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const notes = kind === 'water' ? [[0, 760, 1250]] : [[0, 230, 480], [.09, 260, 540], [.2, 210, 450]];
    notes.forEach(([at, low, high]) => {
      const t = audio.currentTime + at, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(low * (.94 + Math.random() * .12), t);
      oscillator.frequency.exponentialRampToValueAtTime(high, t + .07);
      gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.05, t + .012); gain.gain.exponentialRampToValueAtTime(.0001, t + .1);
      oscillator.connect(gain).connect(audio.destination); oscillator.start(t); oscillator.stop(t + .11);
    });
  } catch { /* Sound is optional. */ }
}
// The whole app feels today's caffeine. From 150 mg a warm pulse appears at
// the screen edges and quickens toward the 400 mg reference; past it the pulse
// turns red. It mirrors the day's total, never rewards it, and holds still
// (as a tint) under reduced motion.
function heartbeat(total) {
  const root = document.documentElement;
  const mode = state.settings.pulse;
  if (mode === 'off') total = 0;
  root.dataset.fx = mode;
  const buzz = Math.min(1, Math.max(0, (total - 150) / 250)), over = Math.min(1, Math.max(0, (total - 400) / 200));
  root.style.setProperty('--buzz', buzz.toFixed(3));
  root.style.setProperty('--over', over.toFixed(3));
  root.style.setProperty('--beat', `${(60 / (56 + buzz * 44 + over * 32)).toFixed(3)}s`);
  root.dataset.pulse = total > 400 ? 'over' : buzz > 0 ? 'on' : 'off';
}
const EFFECT_MODES = ['off', 'on', 'ultra'];
function effectsNote(mode) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches ? t('fxStill') : '';
  return t(`fxNote.${mode}`) + still;
}
const todayFigures = () => ({ total: sumMg(onDay(state.entries)), active: activeAt(state.entries, Date.now(), state.settings.halfLife) });
function notify(message, canUndo = false) {
  clearTimeout(toastTimer);
  $('#toast').innerHTML = `<span>${esc(message)}</span>${canUndo ? `<button data-action="undo">${t('undo')}</button>` : ''}`;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => { $('#toast').classList.remove('visible'); undo = null; }, 8000);
}
function commit(message) { persist(); tick(); render(); if (message) notify(message); }
function render() {
  const active = document.activeElement;
  const focusKey = active?.dataset?.focus;
  document.documentElement.dataset.theme = state.settings.theme;
  if (!isPouring()) heartbeat(sumMg(onDay(state.entries)));
  $('meta[name="theme-color"]').content = state.settings.theme === 'dark' ? '#242321' : '#f7f4ec';
  setLang(state.settings.lang);
  document.documentElement.lang = state.settings.lang === 'en' ? 'en' : 'nb';
  document.title = t('appTitle');
  const skip = $('.skip-link'); if (skip) skip.textContent = t('skipLink');
  const [eyebrow, heading] = t(`title.${view}`);
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a href="#today" class="brand" aria-label="${t('home')}">${icon('cup')}<span>kaffe<span class="brand-dot">.</span></span></a><p class="brand-note">${t('brandNote')}</p><nav aria-label="${t('mainNav')}">${['today', 'history', 'sleep', 'lab'].map(id => [id, t(`nav.${id}`)]).map(([id, title]) => `<a class="nav-link ${view === id ? 'selected' : ''}" href="#${id}" aria-label="${title}" ${view === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${title}</span>${view === id ? '<span class="nav-dot"></span>' : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-doodle">${cup('tea')}<p>${t('doodle')}</p></div><div class="utility"><button class="icon-button" data-action="theme" data-focus="theme" aria-label="${t('themeTo', state.settings.theme === 'light')}" title="${t('themeTitle')}">${icon(state.settings.theme === 'light' ? 'sleep' : 'sun')}</button><button class="icon-button" data-action="sound" data-focus="sound" aria-label="${t('soundLabel', state.settings.sound)}" aria-pressed="${state.settings.sound}" title="${t('soundTitle')}">${icon(state.settings.sound ? 'sound' : 'mute')}</button><button class="icon-button" data-action="settings" title="${t('settings')}" aria-label="${t('settings')}">${icon('settings')}</button><button class="icon-button" data-action="export" title="${t('exportJournal')}" aria-label="${t('exportJournal')}">${icon('download')}</button></div>${accountChip()}</div></aside><main id="main" tabindex="-1"><header class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1></div></header>${warning ? `<div class="warning" role="alert">${esc(t(warning))} <button class="text-button" data-action="export-json">${t('exportBackup')}</button></div>` : ''}${view === 'today' ? todayView() : view === 'history' ? historyView() : view === 'sleep' ? sleepView() : labView()}<footer class="page-footer"><span>${t('footer1')}</span><span>${t('footer2', state.settings.halfLife)}</span></footer></main></div>`;
  if (focusKey) document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
  watchBlendDock();
}
function stats(entries) {
  const drinks = entries.filter(e => e.kind === 'drink');
  return `<div class="mini-stats"><div><strong>${drinks.length}</strong><span>${t('statDrinks')}</span></div><div><strong>${Math.round(sumKcal(entries))}<small> kcal</small></strong><span>${t('statKcal')}</span></div><div><strong>${drinks.length ? Math.round(sumMg(entries) / drinks.length) : 0}<small> mg</small></strong><span>${t('statAvg')}</span></div></div>`;
}
function todayView() {
  const now = Date.now(), entries = onDay(state.entries), total = sumMg(entries), active = activeAt(state.entries, now, state.settings.halfLife);
  const waters = entries.filter(e => e.kind === 'water'), bonuses = waterBonuses(state.entries);
  const points = waters.length + waters.filter(e => bonuses.has(e.id)).length;
  const mood = total > 400 ? 'high' : total >= 300 ? 'medium' : 'low';
  const below = timeBelow(state.entries, 50, now, state.settings.halfLife);
  return `<section class="today-top"><article class="card daily-card ${mood}"><div class="daily-copy"><div class="section-kicker">${t('todayKicker')} <span class="badge">${t(`badge.${mood}`)}</span></div><div class="big-number">${Math.round(total)}<span>mg</span></div><p class="daily-caption">${t(total === 0 ? 'caption.empty' : `caption.${mood}`)}</p><div class="intake-track" role="meter" aria-label="${t('meterLabel')}" aria-valuemin="0" aria-valuemax="400" aria-valuenow="${Math.min(400, total)}" aria-valuetext="${t('meterText', total)}"><span style="width:${Math.min(100, total / 4)}%"></span></div><div class="meter-labels"><span>0 mg</span><span>${t('meterRef')}</span></div></div><div class="hero-art">${cup('coffee', true)}<span class="art-caption">${t('artCaption')}</span></div>${stats(entries)}</article><article class="card active-card"><div class="section-kicker">${t('inSystem')} ${icon('lab')}</div><div class="active-number">${Math.round(active)}<span>mg</span></div><p>${t('activeLabel')}</p><div class="active-foot">${icon('sleep')}<div><strong>${active < 50 ? t('belowNow') : t('belowAround', fmtTime(below))}</strong><span>${dayKey(below) !== dayKey(now) ? new Date(below).toLocaleDateString(locale(), { weekday: 'short' }) + ' · ' : ''}${t('noMore')}</span></div></div><button class="text-button" data-action="navigate" data-view="sleep">${t('planWindDown')} ${icon('arrow')}</button></article></section><section class="section quick-section"><div class="section-heading"><div><p class="eyebrow">${t('usualEyebrow')}</p><h2>${t('usualTitle')}</h2></div><button class="button primary" data-action="catalog">${icon('plus')}<span>${t('allDrinks')}</span></button></div><div class="quick-grid">${QUICK.map(id => { const d = DRINK_BY_ID[id]; return `<button class="drink-card ${d.cat}" data-action="choose" data-id="${id}" aria-label="${esc(t('logDrink', drinkName(d)))}"><span class="drink-plus">${icon('plus')}</span>${cup(d.cat)}<strong>${drinkName(d)}</strong><span>${d.mg} mg <i>·</i> ${servingName(d.serving)}</span></button>`; }).join('')}</div></section><section class="today-bottom"><article class="card chart-card"><div class="section-heading"><div><p class="eyebrow">${t('fadeEyebrow')}</p><h2>${t('fadeTitle')}</h2></div><span class="live-label"><span></span>${t('liveEstimate')}</span></div>${decayChart(now)}<p class="chart-note">${t('chartNote')}</p></article><article class="card water-card"><div class="section-heading"><div><p class="eyebrow">${t('waterEyebrow')}</p><h2>${t('waterTitle')}</h2></div>${icon('water')}</div><div class="water-visual"><div class="water-glass"><div class="water-fill" style="height:${Math.min(90, 10 + waters.length * 12)}%"></div><span>${waters.length}</span></div><div><strong>${t('glasses', waters.length)}</strong><p>${t('hydration', points)}</p></div></div><button class="button water-button" data-action="water" data-focus="water">${icon('plus')}${t('logGlass')}</button><p class="small-note">${t('waterNote')}</p></article></section><section class="section"><div class="section-heading"><div><p class="eyebrow">${t('journalEyebrow')}</p><h2>${t('journalTitle')} <span class="count">${entries.length}</span></h2></div><button class="text-button" data-action="catalog">${t('addSip')} ${icon('plus')}</button></div>${entryList(entries)}</section><p class="health-note">${t('healthNote')}</p>`;
}
function decayChart(now, endTime) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const finish = endTime || new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime();
  const begin = start.getTime(), duration = finish - begin, halfLife = state.settings.halfLife;
  const times = new Set(Array.from({ length: 145 }, (_, i) => begin + duration * i / 144));
  times.add(now);
  state.entries.filter(e => e.kind === 'drink' && e.time >= begin && e.time <= finish).forEach(e => { times.add(Math.max(begin, e.time - 1)); times.add(e.time); });
  const points = [...times].sort((a, b) => a - b).map(time => ({ time, mg: activeAt(state.entries, time, halfLife) }));
  const max = Math.max(100, Math.ceil(Math.max(...points.map(p => p.mg)) / 100) * 100);
  const x = t => 44 + (t - begin) / duration * 640, y = mg => 178 - mg / max * 144;
  const path = list => list.map((p, i) => `${i ? 'L' : 'M'}${x(p.time).toFixed(2)},${y(p.mg).toFixed(2)}`).join(' ');
  const past = points.filter(p => p.time <= now), future = points.filter(p => p.time >= now);
  return `<svg class="decay-chart" viewBox="0 0 710 220" role="img" aria-label="${t('chartLabel', Math.round(activeAt(state.entries, now, halfLife)))}"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dc7960" stop-opacity=".3"/><stop offset="100%" stop-color="#dc7960" stop-opacity=".02"/></linearGradient></defs>${[0, .5, 1].map(f => `<line x1="44" x2="684" y1="${y(max * f)}" y2="${y(max * f)}" class="grid-line"/><text x="34" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}<text x="12" y="17">mg</text><path d="${path(past)} L${x(now)},178 L44,178 Z" fill="url(#chart-fill)"/><path d="${path(past)}" class="curve"/><path d="${path(future)}" class="curve forecast"/><line x1="${x(now)}" x2="${x(now)}" y1="24" y2="178" class="now-line"/><circle cx="${x(now)}" cy="${y(activeAt(state.entries, now, halfLife))}" r="5" class="now-dot"/><text x="${Math.min(660, Math.max(65, x(now)))}" y="17" text-anchor="middle">${t('now')}</text>${state.entries.filter(e => e.kind === 'drink' && e.time >= begin && e.time <= now).map(e => `<circle cx="${x(e.time)}" cy="${y(activeAt(state.entries, e.time, halfLife))}" r="3" class="drink-marker"><title>${esc(entryName(e))} · ${e.mg} mg · ${fmtTime(e.time)}</title></circle>`).join('')}${[0, .25, .5, .75, 1].map(f => `<text x="${x(begin + duration * f)}" y="207" text-anchor="middle">${fmtTime(begin + duration * f)}</text>`).join('')}</svg>`;
}
function entryList(entries) {
  const bonuses = waterBonuses(state.entries);
  if (!entries.length) return `<div class="empty-state">${icon('cup')}<div><h3>${t('emptyTitle')}</h3><p>${t('emptyText')}</p></div></div>`;
  return `<div class="entry-list">${[...entries].sort((a, b) => b.time - a.time).map(e => `<article class="entry"><div class="entry-icon ${esc(e.cat)}">${icon(e.kind === 'water' ? 'water' : e.cat === 'energy' ? 'energy' : 'cup')}</div><div class="entry-name"><strong>${esc(entryName(e))}</strong><span>${e.kind === 'water' ? t('waterLine', bonuses.has(e.id)) : `${t('portion', e.amount, e.cat)} · ${e.kcal} kcal`}</span></div><button class="entry-time" data-action="edit" data-id="${esc(e.id)}" aria-label="${esc(t('editTime', entryName(e), fmtTime(e.time)))}">${fmtTime(e.time)}${icon('edit')}</button><strong class="entry-mg">${e.kind === 'water' ? '—' : `${e.mg}<small> mg</small>`}</strong><button class="icon-button delete-button" data-action="delete" data-id="${esc(e.id)}" aria-label="${esc(t('deleteEntry', entryName(e), fmtTime(e.time)))}">${icon('trash')}</button></article>`).join('')}</div>`;
}
function historyView() {
  const days = historyDays(state.entries, historyRange), total = days.reduce((s, d) => s + d.mg, 0), count = days.reduce((s, d) => s + d.drinks, 0);
  const included = new Set(days.map(d => d.key));
  const top = new Map();
  state.entries.filter(e => e.kind === 'drink' && included.has(dayKey(e.time))).forEach(e => top.set(entryName(e), (top.get(entryName(e)) || 0) + 1));
  const favorites = [...top].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(450, ...days.map(d => d.mg)) * 1.08;
  const month = historyRange === 30, under = days.filter(d => d.mg <= 400).length;
  const page = onDay(state.entries, selectedDay), pageDrinks = page.filter(e => e.kind === 'drink'), pageWater = page.length - pageDrinks.length;
  const today = dayKey(), yesterday = dayKey(Date.now() - 864e5);
  const pageTitle = selectedDay === today ? t('today') : selectedDay === yesterday ? t('yesterday') : new Date(`${selectedDay}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', month: 'long', day: 'numeric' });
  const motion = historyMotion; historyMotion = '';
  historyFigures = { average: Math.round(total / historyRange), count, under };
  const step = Math.round(360 / days.length);
  return `<dl class="facts history-facts"><div><dt>${t('dailyAverage')}</dt><dd data-figure="average">${Math.round(total / historyRange)}<small> mg</small></dd><dd class="facts-note">${t('acrossDays', historyRange)}</dd></div><div><dt>${t('drinksLogged')}</dt><dd data-figure="count">${count}</dd><dd class="facts-note">${t('plusWater', days.reduce((s, d) => s + d.water, 0))}</dd></div><div><dt>${t('underRef')}</dt><dd data-figure="under">${under}<small> ${t('ofDays', historyRange)}</small></dd></div></dl><section class="card history-chart-card ${motion === 'grow' ? 'grow' : ''}"><div class="section-heading"><h2>${t('lastDays', historyRange)}</h2><div class="segmented" role="group" aria-label="${t('historyRange')}">${[7, 30].map(n => `<button data-action="range" data-value="${n}" data-focus="range-${n}" aria-pressed="${historyRange === n}" class="${historyRange === n ? 'selected' : ''}">${t(n === 7 ? 'week' : 'month')}</button>`).join('')}</div></div><div class="history-plot"><div class="reference-line" style="--at:${(400 / max).toFixed(4)}" aria-hidden="true"><span>400 mg</span></div><div class="history-chart ${month ? 'month' : ''}" style="--step:${step}ms">${days.map((d, i) => `<button class="history-bar ${selectedDay === d.key ? 'selected' : ''}" style="--i:${i}" data-action="day" data-day="${d.key}" data-focus="day-${d.key}" aria-pressed="${selectedDay === d.key}" aria-label="${t('barLabel', new Date(d.time).toLocaleDateString(locale()), d.mg)}"><span class="bar-track"><span style="height:${d.mg ? Math.max(1.5, d.mg / max * 100) : 0}%" class="${d.mg > 400 ? 'over' : ''}"><span class="bar-value">${d.mg || ''}</span></span></span><span class="bar-label">${month ? new Date(d.time).getDate() : new Date(d.time).toLocaleDateString(locale(), { weekday: 'short' })}</span></button>`).join('')}</div></div><p class="small-note">${t('historyNote')}</p></section><section class="history-bottom"><div class="day-column"><div class="section-heading day-heading"><div><h2>${esc(pageTitle)}</h2><p class="day-summary">${t('daySummary', pageDrinks.length, sumMg(page), pageWater)}</p></div><label class="date-picker"><span class="sr-only">${t('journalDate')}</span><input type="date" id="history-date" value="${selectedDay}" max="${today}"></label></div><div class="day-page ${motion.startsWith('turn') ? motion : ''}">${entryList(page)}</div></div><section class="regulars ${motion === 'grow' ? 'grow' : ''}" aria-labelledby="regulars-title"><h2 id="regulars-title">${t('regulars')}</h2>${favorites.length ? `<ol>${favorites.map(([name, n], i) => `<li style="--i:${i}"><span class="regular-name">${esc(name)}</span><span class="regular-count">${n}×</span><span class="regular-bar" aria-hidden="true"><span style="width:${n / favorites[0][1] * 100}%"></span></span></li>`).join('')}</ol>` : `<p class="muted">${t('regularsEmpty')}</p>`}</section></section>`;
}
// Animate history changes: bars grow on arrival and range switches, the day
// page turns in the direction of time, and the summary figures roll.
function turnTo(day) {
  historyMotion = day < selectedDay ? 'turn-back' : day > selectedDay ? 'turn-forward' : '';
  selectedDay = day;
}
function rollHistoryFigures(before) {
  if (!before) return;
  document.querySelectorAll('[data-figure]').forEach(el => rollTo(el, before[el.dataset.figure], historyFigures[el.dataset.figure]));
}
function sleepView() {
  const now = Date.now(), { bedtime: bedValue, halfLife } = state.settings;
  const bedtime = nextBedtime(bedValue, now), finish = Math.max(bedtime, now + HOUR);
  const atBed = activeAt(state.entries, bedtime, halfLife), current = activeAt(state.entries, now, halfLife);
  const below = timeBelow(state.entries, 50, now, halfLife);
  const points = Array.from({ length: 121 }, (_, i) => { const time = now + (finish - now) * i / 120; return { time, mg: activeAt(state.entries, time, halfLife) }; });
  const max = Math.max(100, ...points.map(p => p.mg)) * 1.15;
  const x = t => (t - now) / (finish - now) * 100, y = mg => 100 - mg / max * 100;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.time).toFixed(2)},${y(p.mg).toFixed(2)}`).join(' ');
  const crossing = below > now && below < finish ? x(below) : null;
  const weekday = time => dayKey(time) !== dayKey(now) ? ` ${new Date(time).toLocaleDateString(locale(), { weekday: 'short' })}` : '';
  const [verdict, detail] = t(current < 1 ? 'verdict.clear' : atBed < 50 ? 'verdict.calm' : 'verdict.linger');
  const entering = sleepEntrance; sleepEntrance = false;
  return `<section class="night ${entering ? 'entering' : ''} ${atBed < 50 ? 'calm' : 'linger'}" aria-labelledby="night-verdict"><div class="night-moon" aria-hidden="true"></div><div class="night-head"><p class="night-when">${t('bedtime')} <strong>${fmtTime(bedtime)}</strong>${weekday(bedtime)} · ${t('inHours', ((bedtime - now) / HOUR).toFixed(1))}</p><p class="night-figure"><span class="night-mg">${Math.round(atBed)}</span><span class="night-unit">mg</span></p><p class="night-label">${t('atBedLabel')}</p><h2 id="night-verdict">${verdict}</h2><p class="night-detail">${detail}</p></div><figure class="night-chart"><div class="night-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="${t('nightChart', Math.round(current), Math.round(atBed))}"><defs><linearGradient id="night-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b860" stop-opacity=".5"/><stop offset="1" stop-color="#f4b860" stop-opacity="0"/></linearGradient></defs><path class="night-area" d="${line} L100,100 L0,100 Z"/><line class="night-threshold" x1="0" x2="100" y1="${y(50)}" y2="${y(50)}"/><path class="night-line" d="${line}"/></svg><span class="night-threshold-label" style="top:${y(50)}%">50 mg</span><span class="night-pin now" style="left:0%;top:${y(current)}%"><span><b>${Math.round(current)} mg</b>${t('now')}</span></span>${crossing === null ? '' : `<span class="night-pin cross${crossing > 70 || crossing < 22 ? ' below' : ''}" style="left:${crossing}%;top:${y(50)}%"><span><b>${fmtTime(below)}</b>${t('under50')}</span></span>`}<span class="night-pin bed" style="left:100%;top:${y(atBed)}%"><span><b>${Math.round(atBed)} mg</b>${t('bedtimeLower')}</span></span></div><figcaption class="night-axis"><span>${fmtTime(now)}</span><span>${fmtTime(finish)}${weekday(finish)}</span></figcaption></figure></section><dl class="facts night-facts"><div><dt>${t('activeNow')}</dt><dd>${Math.round(current)}<small> mg</small></dd></div><div><dt>${t('under50Title')}</dt><dd>${below <= now ? t('already') : `${fmtTime(below)}<small>${weekday(below)}</small>`}</dd></div><div><dt>${t('halfLife')}</dt><dd>${halfLife}<small> ${t('hourUnit')}</small></dd><dd class="facts-note">${t('halfLifeNote', halfLife)}</dd></div></dl><p class="health-note">${t('sleepNote')} ${icon('settings')}.</p>`;
}
const STRONG_MG = 150, HIGH_MG = 300;
const layerInk = hex => { const n = parseInt(hex.slice(1), 16); return .299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255) < 140 ? '#fff4de' : '#30261f'; };
function strengthNote(mg) {
  if (mg >= HIGH_MG) return t('strongVery', mg);
  if (mg >= STRONG_MG) return t('strong', mg, mg >= 180);
  return '';
}
function labView() {
  const recipe = matchRecipe(layers), totals = blendTotals(layers), categories = ['All', ...new Set(INGREDIENTS.map(i => i.cat))];
  const full = layers.length >= MAX_LAYERS, strength = totals.mg >= HIGH_MG ? 'high' : totals.mg >= STRONG_MG ? 'strong' : '';
  const name = recipe ? recipeName(recipe) : t('customBlend');
  const count = !layers.length ? t('layerCountEmpty', MAX_LAYERS) : full ? t('layerFull') : t('layerCount', layers.length, MAX_LAYERS);
  const tagline = recipe ? recipeTagline(recipe) : t(layers.length ? (strength ? 'tagOwn' : 'tagNoRules') : 'tagEmpty');
  const dock = `<div class="blend-dock ${dockAway && layers.length ? 'away' : ''}" ${layers.length ? '' : 'hidden'}><button class="dock-peek" data-action="show-cup" aria-label="${esc(t('showCup', name, totals.mg))}"><span class="dock-cup" aria-hidden="true">${layers.map(id => `<i style="--ingredient:${ING_BY_ID[id].color}"></i>`).join('')}</span><span class="dock-text"><strong>${esc(name)}</strong><span>${t('layers', layers.length)} · ${totals.mg} mg</span></span></button><button class="dock-log" data-action="log-blend" aria-label="${esc(t('logName', name))}">${icon('plus')}${t('log')}</button></div>`;
  return `<div class="lab-intro"><span class="badge">${t('labBadge')}</span><p>${t('labIntro')}</p></div><section class="lab-layout"><article class="card pantry"><div class="section-heading"><h2>${t('pantry')}</h2><span class="muted">${t('ingredients', INGREDIENTS.length)}</span></div><div class="chips">${categories.map(cat => `<button class="chip ${ingredientCategory === cat ? 'selected' : ''}" data-action="ingredient-category" data-category="${cat}" data-focus="ingredient-cat-${cat}" aria-pressed="${ingredientCategory === cat}">${ingredientCategoryName(cat)}</button>`).join('')}</div><div class="ingredient-grid">${INGREDIENTS.filter(i => ingredientCategory === 'All' || i.cat === ingredientCategory).map(i => `<button class="ingredient" ${full ? 'disabled' : 'draggable="true"'} data-ingredient="${i.id}" data-action="ingredient" data-id="${i.id}" data-focus="ingredient-${i.id}"><span class="ingredient-swatch" style="--ingredient:${i.color}">${icon(i.cat === 'Base' || i.id === 'ice' ? 'water' : 'cup')}</span><strong>${ingredientName(i)}</strong><span class="ing-meta"><b>${i.mg} mg</b>${i.kcal} kcal</span></button>`).join('')}</div><p class="small-note">${t('pantryNote')}</p></article><article class="card mixing-card"><div class="section-heading"><span class="eyebrow">${t('creation')}</span><button class="text-button" data-action="reset-blend" ${layers.length ? '' : 'disabled'}>${t('reset')}</button></div><div class="mixing-zone" id="mixing-zone" role="group" aria-label="${t('yourCup')}"><div class="blend-steam" aria-hidden="true">∿ ∿ ∿</div><div class="blend-cup"><div class="blend-layers">${layers.map((id, index) => `<button class="blend-layer" style="--ingredient:${ING_BY_ID[id].color};--layer-ink:${layerInk(ING_BY_ID[id].color)}" data-action="remove-layer" data-index="${index}" aria-label="${t('removeLayer', index + 1, ingredientName(ING_BY_ID[id]))}"><span>${ingredientName(ING_BY_ID[id])}</span>${icon('close')}</button>`).join('')}${!layers.length ? `<span class="cup-placeholder">${t('cupPlaceholder')}</span>` : ''}</div></div><div class="blend-saucer"></div></div><div class="layer-count ${full ? 'full' : ''}" aria-live="polite">${count}</div><h2>${esc(layers.length ? name : t('brewing'))}</h2><p class="blend-tagline">${tagline}</p>${strength ? `<p class="blend-note ${strength}">${strengthNote(totals.mg)}</p>` : ''}<div class="blend-totals ${strength}"><span class="mg"><strong>${totals.mg}</strong> mg ${t('caffeine')}</span><span class="kcal"><strong>${totals.kcal}</strong> kcal</span></div><button class="button primary log-blend" data-action="log-blend" ${layers.length ? '' : 'disabled'}>${icon('plus')}${t('logBlend')}</button><button class="text-button surprise" data-action="surprise" data-focus="surprise">${icon('shuffle')}${t('surprise')}</button></article></section><section class="section recipe-section"><div class="section-heading"><div><p class="eyebrow">${t('recipeEyebrow')}</p><h2>${t('recipeTitle')}</h2></div><span class="muted">${t('waysToPlay', RECIPES.length)}</span></div><div class="recipe-grid">${RECIPES.map((r, index) => `<button class="recipe-card ${recipe === r ? 'selected' : ''}" data-action="recipe" data-index="${index}" data-focus="recipe-${index}" aria-pressed="${recipe === r}"><span class="recipe-number">${String(index + 1).padStart(2, '0')}</span><strong>${recipeName(r)}</strong><span>${t('layers', r.ing.length)} · ${blendTotals(r.ing).mg} mg</span>${icon('arrow')}</button>`).join('')}</div></section>${dock}`;
}
let dockAway = false, dockObserver = null;
function setDock(away) {
  dockAway = away; const on = away && view === 'lab' && layers.length > 0;
  $('.blend-dock')?.classList.toggle('away', on); document.documentElement.classList.toggle('lab-docked', on);
}
function watchBlendDock() {
  dockObserver?.disconnect(); dockObserver = null;
  const cup = $('.blend-cup');
  if (view !== 'lab' || !cup || !('IntersectionObserver' in window)) { setDock(false); return; }
  dockObserver = new IntersectionObserver(([e]) => setDock(!e.isIntersecting), { rootMargin: '0px 0px -150px 0px', threshold: .4 });
  dockObserver.observe(cup);
}
function catalogMarkup() {
  const results = DRINKS.filter(d => (modalCategory === 'all' || d.cat === modalCategory) && `${d.name} ${drinkName(d)} ${d.cat} ${categoryName(d.cat, '')}`.toLowerCase().includes(modalQuery.toLowerCase()));
  return `<div class="catalog-results">${results.length ? results.map(d => `<button class="catalog-drink" data-action="choose" data-id="${d.id}"><span class="entry-icon ${d.cat}">${icon(d.cat === 'energy' ? 'energy' : 'cup')}</span><span><strong>${drinkName(d)}</strong><small>${servingName(d.serving)} · ${d.kcal} kcal</small></span><b>${d.mg}<small> mg</small></b>${icon('plus')}</button>`).join('') : `<p class="empty-search">${t('noMatch')}</p>`}</div>`;
}
function openCatalog() {
  modalQuery = ''; modalCategory = 'all';
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t('catalogEyebrow')}</p><h2 id="picker-title">${t('catalogTitle')}</h2></div><button class="icon-button" data-action="close" aria-label="${t('closePicker')}">${icon('close')}</button></div><label class="search-label"><span class="sr-only">${t('searchDrinks')}</span><input id="drink-search" type="search" placeholder="${t('searchPlaceholder')}" autocomplete="off"></label><div class="chips catalog-chips">${CATEGORIES.map(([id, name]) => `<button class="chip ${id === 'all' ? 'selected' : ''}" data-action="catalog-category" data-category="${id}" aria-pressed="${id === 'all'}">${categoryName(id, name)}</button>`).join('')}</div><div id="catalog-list">${catalogMarkup()}</div><p class="small-note">${t('catalogNote')}</p>`;
  showDialog(); $('#drink-search').focus();
}
// Answers stay in memory only: pregnancy and medication are nobody's business
// but the user's, and the estimate is only useful while choosing a value.
const ESTIMATE_QUESTIONS = [['smoke', ['no', 'yes']], ['hormonal', ['no', 'yes'], true], ['pregnancy', ['no', 't1', 't2', 't3']], ['meds', ['no', 'yes', 'unsure'], true]];
let estimateAnswers = {};
function openSettings() {
  const { bedtime, halfLife } = state.settings;
  estimateAnswers = {};
  picker.innerHTML = `<div class="dialog-heading"><h2 id="picker-title">${t('settings')}</h2><button class="icon-button" data-action="close" aria-label="${t('closeSettings')}">${icon('close')}</button></div><div class="settings-form"><fieldset class="settings-row effects-setting"><legend>${t('languageNote')}</legend><div class="chips">${LANGS.map(([value, label]) => `<label class="chip choice" lang="${value === 'en' ? 'en' : 'nb'}"><input class="sr-only" type="radio" name="lang" value="${value}" ${state.settings.lang === value ? 'checked' : ''}>${label}</label>`).join('')}</div></fieldset><label class="settings-row" for="bedtime"><span>${t('bedtime')}<small>${t('bedtimeNote')}</small></span><input type="time" id="bedtime" value="${bedtime}" required></label><fieldset class="settings-row effects-setting"><legend>${t('effects')}<small id="effects-note">${effectsNote(state.settings.pulse)}</small></legend><div class="chips">${EFFECT_MODES.map(value => `<label class="chip choice"><input class="sr-only" type="radio" name="pulse-mode" value="${value}" ${state.settings.pulse === value ? 'checked' : ''}>${t(`fx.${value}`)}</label>`).join('')}</div></fieldset><div class="settings-row"><label for="half-life">${t('halfLifeTitle')}<small>${t('halfLifeHint')}</small></label><output id="half-life-value" for="half-life">${halfLife} ${t('hourUnit')}</output></div><input id="half-life" type="range" min="3" max="8" step="0.5" value="${halfLife}"><div class="meter-labels"><span>${t('faster')}</span><span>${t('defaultHl')}</span><span>${t('slower')}</span></div><p class="small-note">${t('estimatesOnly')}</p><details class="estimator"><summary>${t('estimateSummary')}</summary><form id="estimate-form" class="estimate-form">${ESTIMATE_QUESTIONS.map(([key, options, hint]) => `<fieldset><legend>${t(`q.${key}`)}${hint ? `<small>${t(`q.${key}Hint`)}</small>` : ''}</legend><div class="chips">${options.map(value => `<label class="chip choice"><input class="sr-only" type="radio" name="hl-${key}" value="${value}">${t(value)}</label>`).join('')}</div></fieldset>`).join('')}<div class="estimate-result"><div class="estimate-figure"><span>${t('suggested')}</span><strong id="estimate-value" aria-live="polite"></strong></div><div class="estimate-ladder" aria-hidden="true"><span class="ladder-track"></span>${[1, 2, 3].map(n => `<span class="ladder-step" data-step="${n}"><b>${100 / 2 ** n} mg</b><i></i></span>`).join('')}</div><ul class="estimate-factors" id="estimate-factors"></ul><button type="button" class="button primary full-width" data-action="apply-half-life" id="estimate-apply"></button><p class="small-note">${t('estimateNote')}</p></div></form></details></div>`;
  updateEstimate();
  showDialog();
}
function updateEstimate() {
  const figure = $('#estimate-value'); if (!figure) return;
  const { value, factors, capped } = estimateHalfLife(estimateAnswers);
  figure.textContent = `${value} ${t('hourUnit')}`;
  picker.querySelectorAll('.ladder-step').forEach(step => { step.style.left = `${Math.min(100, value * step.dataset.step / 24 * 100)}%`; step.querySelector('i').textContent = `${value * step.dataset.step} ${t('hourUnit')}`; });
  const notes = [t('startingPoint', HALF_LIFE_BASE), ...factors.map(f => t('factor', t(`hlf.${f.key}.${f.answer}`), t(`eff.${f.effect}`), f.multiplier))];
  if (capped === 'high') notes.push(t('cappedHigh'));
  if (capped === 'low') notes.push(t('cappedLow'));
  if (estimateAnswers.meds && estimateAnswers.meds !== 'no') notes.push(t('pharmacist'));
  $('#estimate-factors').innerHTML = notes.map(note => `<li>${note}</li>`).join('');
  const apply = $('#estimate-apply'), current = state.settings.halfLife === value;
  apply.dataset.value = value; apply.disabled = current;
  apply.textContent = current ? t('alreadySet', value) : t('useHl', value);
}
function showDialog() { if (!picker.open) picker.showModal(); }
// Portions are discrete: whole cups (or cans for canned drinks), in halves.
const portionLabel = n => `${({ 0.5: '½', 1.5: '1½' })[n] || n}×`;
function chooseDrink(drink) {
  modalDrink = drink; modalAmount = 1;
  const name = entryName(drink);
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t('makeEyebrow')}</p><h2 id="picker-title">${esc(name)}</h2></div><button class="icon-button" data-action="close" aria-label="${t('closeAmount')}">${icon('close')}</button></div><form id="log-form"><div class="amount-hero">${cup(drink.cat)}<div><strong id="amount-mg">${drink.mg}<small> mg</small></strong><p><span id="amount-kcal">${drink.kcal}</span> kcal · ${esc(t('per', servingName(drink.serving || '1 blend')))}</p><span class="muted" id="amount-label">${t('portion', 1, drink.cat)} · ${drink.mg} mg</span></div></div><div class="section-heading"><span class="eyebrow">${t('howMuch')}</span></div><div class="amount-presets">${[.5, 1, 1.5, 2].map(n => `<button type="button" data-action="amount-preset" data-value="${n}" class="chip ${n === 1 ? 'selected' : ''}" aria-pressed="${n === 1}">${portionLabel(n)}</button>`).join('')}</div><div class="form-grid"><label>${t('date')}<input type="date" id="log-date" value="${dayKey()}" max="${dayKey()}" required></label><label>${t('time')}<input type="time" id="log-time" value="${timeValue()}" required></label></div><p id="form-error" class="form-error" role="alert"></p><button class="button primary full-width" type="submit">${icon('plus')}${t('addToJournal')}</button><button type="button" class="text-button back-catalog" data-action="catalog">${t('backToAll')}</button></form>`;
  showDialog(); $('#log-date').focus();
}
function updateAmount(n) {
  modalAmount = [0.5, 1, 1.5, 2].includes(n) ? n : 1;
  const summary = t('portion', modalAmount, modalDrink.cat);
  $('#amount-mg').innerHTML = `${Math.round(modalDrink.mg * modalAmount)}<small> mg</small>`;
  $('#amount-kcal').textContent = Math.round(modalDrink.kcal * modalAmount);
  $('#amount-label').textContent = `${summary} · ${Math.round(modalDrink.mg * modalAmount)} mg`;
  picker.querySelectorAll('[data-action="amount-preset"]').forEach(b => { const selected = +b.dataset.value === modalAmount; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
}
function editEntry(id) {
  const entry = state.entries.find(e => e.id === id); if (!entry) return;
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t('editEyebrow')}</p><h2 id="picker-title">${esc(t('editTitle', entryName(entry)))}</h2></div><button class="icon-button" data-action="close" aria-label="${t('closeEditor')}">${icon('close')}</button></div><form id="edit-form" data-id="${esc(id)}"><div class="form-grid"><label>${t('date')}<input type="date" id="log-date" value="${dayKey(entry.time)}" max="${dayKey()}" required></label><label>${t('time')}<input type="time" id="log-time" value="${timeValue(entry.time)}" required></label></div><p id="form-error" class="form-error" role="alert"></p><button class="button primary full-width" type="submit">${t('saveChanges')}</button></form>`;
  showDialog(); $('#log-time').focus();
}
function formTime() {
  const date = $('#log-date').value, time = $('#log-time').value;
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !validTime(time) || !Number.isFinite(timestamp) || dayKey(timestamp) !== date || timeValue(timestamp) !== time) {
    $('#form-error').textContent = t('invalidTime'); return null;
  }
  if (timestamp > Date.now()) { $('#form-error').textContent = t('futureTime'); return null; }
  return timestamp;
}
function addIngredient(id) {
  if (!ING_BY_ID[id] || layers.length >= MAX_LAYERS) return;
  layers.push(id); tick(); render();
  $('#mixing-zone')?.classList.add('splashed'); $('.dock-cup')?.classList.add('splashed');
  if (layers.length >= MAX_LAYERS && (!document.activeElement || document.activeElement === document.body)) $('.log-blend')?.focus({ preventScroll: true });
}
function download(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportJournal() {
  let data = JSON.stringify(state, null, 2);
  if (loaded.blocked) {
    try { data = storage.getItem(STORE_KEY) || data; } catch { /* Export in-memory data if inaccessible. */ }
  }
  download(data, 'application/json', `kaffe-journal-${dayKey()}.json`);
  notify(t('backupDownloaded'));
}

function writeSyncMeta(meta) {
  syncMeta = meta;
  try { meta ? storage.setItem(SYNC_KEY, JSON.stringify(meta)) : storage.removeItem(SYNC_KEY); } catch { /* Sync still works for this session. */ }
}
const loginUrl = () => `/.auth/login/github?post_login_redirect_uri=${encodeURIComponent(location.pathname + location.hash)}`;
const accountName = () => authUser?.userDetails || syncMeta?.name || '';
function avatar(size = 'small') {
  const name = accountName();
  // userDetails is the GitHub login, which GitHub serves an avatar for.
  return `<span class="avatar ${size}" data-initial="${esc((name[0] || '?').toUpperCase())}" aria-hidden="true">${name && navigator.onLine ? `<img src="https://github.com/${encodeURIComponent(name)}.png?size=96" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</span>`;
}
function syncedAgo() {
  const at = syncMeta?.syncedAt || Date.now(), minutes = Math.round((Date.now() - at) / 60000);
  return minutes < 1 ? t('justNow') : minutes < 60 ? t('minAgo', minutes) : new Date(at).toLocaleString(locale(), { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}
function syncText() {
  if (syncStatus === 'synced') return t('synced', syncedAgo());
  return t(`sync.${syncStatus}`);
}
function accountChipInner() {
  const signedOut = syncStatus === 'local';
  return `${signedOut ? `<span class="avatar small cloud">${icon('cloud')}</span>` : avatar()}<span class="account-text"><strong>${signedOut ? t('syncJournal') : esc(accountName())}</strong><span class="sync-line"><i class="sync-dot"></i>${esc(signedOut ? t('signInBackup') : syncText())}</span></span>`;
}
function accountLabel() { return syncStatus === 'local' ? t('signInSync') : t('accountLabel', accountName(), syncText()); }
function accountChip() {
  return `<button class="account-chip" id="account-chip" data-action="account" data-status="${syncStatus}" aria-label="${esc(accountLabel())}" title="${esc(accountLabel())}">${accountChipInner()}</button>`;
}
function updateAccountUI() {
  const chip = $('#account-chip');
  if (chip) { chip.innerHTML = accountChipInner(); chip.dataset.status = syncStatus; chip.setAttribute('aria-label', accountLabel()); chip.title = accountLabel(); }
  const line = $('#account-sync');
  if (line) { line.dataset.status = syncStatus; line.querySelector('span').textContent = syncText(); }
  if (picker.open && picker.dataset.view === 'account' && (!!authUser) !== (picker.dataset.signedIn === 'true')) openAccount();
}
function setSyncStatus(status) { syncStatus = status; updateAccountUI(); }

function openAccount() {
  picker.dataset.view = 'account';
  picker.dataset.signedIn = !!authUser;
  const close = `<button class="icon-button" data-action="close" aria-label="${t('closeAccount')}">${icon('close')}</button>`;
  if (authUser) {
    const count = state.entries.length;
    picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t('yourAccount')}</p><h2 id="picker-title">${t('everywhere')}</h2></div>${close}</div><div class="account-card">${avatar('large')}<div><strong>${esc(accountName())}</strong><span>${t('signedInGithub')}</span></div></div><div class="account-sync" id="account-sync" data-status="${syncStatus}" role="status"><i class="sync-dot"></i><span>${esc(syncText())}</span><button class="text-button" data-action="sync-now">${icon('sync')}${t('syncNow')}</button></div><p class="account-count">${t('entryCount', count)}</p>${signOutError ? `<div class="warning" role="alert">${t('notBackedUp')} <button class="text-button" data-action="sign-out" data-force="true">${t('signOutAnyway')}</button></div>` : ''}<button class="button subtle full-width" data-action="sign-out">${icon('signout')}${t('signOut')}</button><p class="small-note">${t('signOutNote')}</p>`;
  } else {
    const expired = syncStatus === 'expired', count = state.entries.length;
    const perks = ['cloud', 'devices', 'cup'].map((name, i) => [name, ...t('perks')[i]]);
    picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t(expired ? 'welcomeBack' : 'everywhereCaps')}</p><h2 id="picker-title">${t(expired ? 'signInKeep' : 'keepSafe')}</h2></div>${close}</div><div class="account-hero" aria-hidden="true">${cup('coffee')}<span class="hero-cloud">${icon('cloud')}</span>${cup('tea')}</div>${expired ? `<p class="account-lead">${t('expiredLead')}</p>` : `<ul class="account-perks">${perks.map(([name, title, text]) => `<li><span class="perk-icon">${icon(name)}</span><div><strong>${title}</strong><span>${text}</span></div></li>`).join('')}</ul>`}${!expired && count ? `<p class="account-merge">${icon('plus')}<span>${t('mergeNote', count)}</span></p>` : ''}<a class="button github-button full-width" href="${esc(loginUrl())}"><svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>${t(expired ? 'signInAgain' : 'continueGithub')}</a><p class="small-note">${t('githubNote')} ${expired ? '' : t('ratherNot')}</p>`;
  }
  showDialog();
}
picker.addEventListener('close', () => { delete picker.dataset.view; signOutError = false; });
// A missing avatar falls back to the initial behind it.
document.addEventListener('error', event => { if (event.target.matches?.('.avatar img')) event.target.remove(); }, true);

async function initAuth() {
  let principal;
  try {
    const res = await fetch('/.auth/me', { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) throw new Error('Auth unavailable');
    principal = (await res.json()).clientPrincipal;
  } catch {
    // Offline, or no auth endpoint (local development). The journal works as before.
    setSyncStatus(syncMeta ? 'offline' : 'local'); return;
  }
  if (!principal || principal.identityProvider !== 'github') {
    authUser = null; setSyncStatus(syncMeta ? 'expired' : 'local'); return;
  }
  authUser = principal;
  const firstLink = syncMeta?.user !== principal.userId;
  await syncNow(true);
  if (firstLink && syncStatus === 'synced') notify(t('signedInAs', principal.userDetails));
}

function queueCloudSync() {
  if (!authUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 1500);
}
// Runs one sync at a time; calls made meanwhile join the running one and
// trigger one more round. "full" fetches the account's copy and merges it;
// otherwise this device's changes are pushed on top of the version it last saw.
function syncNow(full = false) {
  clearTimeout(syncTimer);
  if (syncRun) { syncAgain = true; return syncRun; }
  syncRun = (async () => {
    let round = full;
    do { syncAgain = false; await syncRound(round); round = false; } while (syncAgain && authUser);
  })().finally(() => { syncRun = null; });
  return syncRun;
}
async function syncRound(full) {
  if (!authUser) return;
  const user = authUser.userId, name = authUser.userDetails;
  setSyncStatus('syncing');
  try {
    for (let attempt = 0; ; attempt++) {
      let cloud = null, base;
      const fetchFirst = full || syncMeta?.user !== user;
      if (fetchFirst) { cloud = await fetchCloudState(); base = cloud?.updatedAt; }
      else base = syncMeta.updatedAt;
      // From here to the save request nothing awaits, so this is the exact snapshot sent.
      const startRevision = revision, startIds = state.entries.map(e => e.id);
      const plan = fetchFirst ? planSync({ local: state, cloud: cloud?.state, meta: syncMeta, user }) : { state, upload: true };
      const sentIds = plan.state.entries.map(e => e.id);
      let updatedAt = base || 0;
      if (plan.upload) {
        try { updatedAt = await saveCloudState(plan.state, base); }
        catch (err) { if (err.status === 409 && attempt < 2) { full = true; continue; } throw err; }
      }
      if (authUser?.userId !== user) return;
      // Keep anything logged or deleted while the request was in flight.
      const changedMeanwhile = revision !== startRevision;
      const next = changedMeanwhile ? mergeJournals(state, plan.state, startIds) : plan.state;
      if (next !== state) { state.entries = next.entries; state.settings = next.settings; undo = null; saveLocal(); render(); }
      writeSyncMeta({ user, name, base: sentIds, updatedAt, syncedAt: Date.now(), dirty: changedMeanwhile });
      if (changedMeanwhile) syncAgain = true;
      setSyncStatus('synced');
      return;
    }
  } catch (err) {
    if (err.status === 401) { authUser = null; setSyncStatus('expired'); }
    else setSyncStatus(err.status === 0 ? 'offline' : 'error');
  }
}
// Last chance to save a change made just before the tab closes.
function flushOnHide() {
  if (!authUser || !syncMeta?.dirty || syncMeta.user !== authUser.userId || syncRun) return;
  saveCloudState(state, syncMeta.updatedAt, true).then(updatedAt => writeSyncMeta({ ...syncMeta, base: state.entries.map(e => e.id), updatedAt, syncedAt: Date.now(), dirty: false })).catch(() => {});
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushOnHide();
  // Coming back to the tab: pick up what other devices logged meanwhile.
  else if (authUser && Date.now() - (syncMeta?.syncedAt || 0) > 60000) syncNow(true);
});
window.addEventListener('online', () => { if (authUser) syncNow(true); else if (syncMeta) initAuth(); });

async function signOut(force) {
  if (!force && syncMeta?.dirty && authUser) {
    await syncNow();
    if (syncMeta?.dirty) { signOutError = true; openAccount(); return; }
  }
  if (!force) {
    // The account has everything, so this device keeps nothing behind.
    try { storage.removeItem(STORE_KEY); } catch {}
    writeSyncMeta(null);
  }
  location.href = '/.auth/logout?post_logout_redirect_uri=%2F';
}

function exportReport(journal = state, message = t('reportDownloaded')) {
  download(buildReport(journal), 'application/pdf', `${t('r.file')}-${dayKey()}.pdf`);
  notify(message);
}
function openExport() {
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${t('exportEyebrow')}</p><h2 id="picker-title">${t('exportTitle')}</h2></div><button class="icon-button" data-action="close" aria-label="${t('closeExport')}">${icon('close')}</button></div><div class="export-options"><button class="export-option peach" data-action="export-pdf">${icon('history')}<span><strong>${t('pdfTitle')}</strong><small>${t('pdfText')}</small></span></button><button class="export-option sage" data-action="export-json">${icon('download')}<span><strong>${t('jsonTitle')}</strong><small>${t('jsonText')}</small></span></button></div><label class="export-file"><span>${t('backupFile')}</span><input type="file" id="backup-file" accept="application/json,.json"></label><p id="form-error" class="form-error" role="alert"></p><p class="small-note">${t('madeHere')}</p>`;
  showDialog();
}
async function reportFromFile(file) {
  try {
    exportReport(normalizeState(JSON.parse(await file.text())), t('reportFrom', file.name));
    picker.close();
  } catch {
    $('#form-error').textContent = t('notBackup');
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const d = button.dataset;
  switch (d.action) {
    case 'navigate': location.hash = d.view; break;
    case 'theme': state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light'; commit(); break;
    case 'sound': state.settings.sound = !state.settings.sound; commit(); notify(t('soundToast', state.settings.sound)); break;
    case 'export': openExport(); break;
    case 'export-json': exportJournal(); if (picker.open) picker.close(); break;
    case 'export-pdf': exportReport(); picker.close(); break;
    case 'settings': openSettings(); break;
    case 'account': openAccount(); break;
    case 'sync-now': syncNow(true); break;
    case 'sign-out': signOut(d.force === 'true'); break;
    case 'apply-half-life': {
      state.settings.halfLife = +d.value; commit(t('hlSet', d.value));
      $('#half-life').value = d.value; $('#half-life-value').textContent = `${d.value} ${t('hourUnit')}`; updateEstimate(); break;
    }
    case 'catalog': openCatalog(); break;
    case 'close': picker.close(); break;
    case 'choose': chooseDrink(DRINK_BY_ID[d.id]); break;
    case 'catalog-category':
      modalCategory = d.category;
      picker.querySelectorAll('[data-action="catalog-category"]').forEach(b => { const selected = b.dataset.category === modalCategory; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
      $('#catalog-list').innerHTML = catalogMarkup(); break;
    case 'amount-preset': updateAmount(+d.value); break;
    case 'water': {
      const entry = { id: uid(), kind: 'water', drink: null, name: 'Water', cat: 'water', amount: 1, mg: 0, kcal: 0, time: Date.now() };
      const from = button.getBoundingClientRect(), before = onDay(state.entries).filter(e => e.kind === 'water').length;
      state.entries.push(entry); commit(t(waterBonuses(state.entries).has(entry.id) ? 'waterBonus' : 'waterLogged'));
      pourWater({ from, before, sound: glug }); break;
    }
    case 'delete': {
      const index = state.entries.findIndex(e => e.id === d.id); if (index < 0) break;
      undo = state.entries.splice(index, 1)[0]; persist(); render(); notify(t('removed', entryName(undo)), true);
      if (!document.activeElement || document.activeElement === document.body) $('#main')?.focus({ preventScroll: true });
      break;
    }
    case 'undo': if (undo) { state.entries.push(undo); undo = null; commit(t('restored')); } break;
    case 'edit': editEntry(d.id); break;
    case 'range': { if (+d.value === historyRange) break; const before = historyFigures; historyRange = +d.value; historyMotion = 'grow'; render(); rollHistoryFigures(before); break; }
    case 'day': turnTo(d.day); render(); break;
    case 'ingredient-category': ingredientCategory = d.category; render(); break;
    case 'ingredient': addIngredient(d.id); break;
    case 'remove-layer': layers.splice(+d.index, 1); tick(); render(); $('#mixing-zone')?.closest('article')?.querySelector('[data-action="reset-blend"]')?.focus({ preventScroll: true }); break;
    case 'show-cup': $('.mixing-card')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); break;
    case 'reset-blend': layers = []; render(); break;
    case 'recipe': layers = [...RECIPES[+d.index].ing]; tick(); render(); notify(t('loaded', recipeName(RECIPES[+d.index]))); break;
    case 'surprise': {
      const options = RECIPES.filter(r => blendKey(r.ing) !== blendKey(layers) && blendTotals(r.ing).mg < STRONG_MG);
      const recipe = options[Math.floor(Math.random() * options.length)]; layers = [...recipe.ing]; tick(); render(); notify(t('meet', recipeName(recipe))); break;
    }
    case 'log-blend': {
      if (!layers.length) break;
      const recipe = matchRecipe(layers);
      chooseDrink({ id: recipe?.drinkId || null, name: recipe?.name || t('customBlendShort'), cat: layers.includes('matcha') ? 'tea' : 'coffee', ...blendTotals(layers), serving: '1 blend' }); break;
    }
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'half-life') $('#half-life-value').textContent = `${event.target.value} ${t('hourUnit')}`;
  if (event.target.id === 'drink-search') { modalQuery = event.target.value; $('#catalog-list').innerHTML = catalogMarkup(); }
});
document.addEventListener('change', event => {
  const { id, value } = event.target;
  if (id === 'history-date' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= dayKey()) { turnTo(value); render(); $('#history-date')?.focus({ preventScroll: true }); }
  if (id === 'bedtime' && validTime(value)) { state.settings.bedtime = value; commit(); }
  if (id === 'backup-file' && event.target.files[0]) reportFromFile(event.target.files[0]);
  if (event.target.name === 'pulse-mode') {
    state.settings.pulse = value; commit(t('effectsToast', t(`fx.${value}`)));
    $('#effects-note').textContent = effectsNote(value);
  }
  if (event.target.name === 'lang') {
    state.settings.lang = value; setLang(value); commit(t('languageToast'));
    openSettings(); picker.querySelector(`input[name="lang"][value="${value}"]`)?.focus();
  }
  if (id === 'half-life') { state.settings.halfLife = Math.max(3, Math.min(8, +value)); commit(); updateEstimate(); }
  if (event.target.name?.startsWith('hl-')) { estimateAnswers[event.target.name.slice(3)] = value; updateEstimate(); }
});
// Search inputs consume Escape in some browsers; close the dialog consistently.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && picker.open) { event.preventDefault(); picker.close(); }
}, true);
picker.addEventListener('submit', event => {
  event.preventDefault(); if (event.target.id === 'estimate-form') return; const time = formTime(); if (time === null) return;
  if (event.target.id === 'log-form') {
    const cupArt = picker.querySelector('.amount-hero .cup-art');
    const fromLab = view === 'lab';
    const flight = (view === 'today' || fromLab) && cupArt ? { from: cupArt.getBoundingClientRect(), svg: cupArt.outerHTML, cat: modalDrink.cat, before: todayFigures() } : null;
    state.entries.push(makeDrink(modalDrink, modalAmount, time));
    picker.close();
    // A finished blend lands on Today, so the pour shows where it counts. Back returns to the Lab.
    if (fromLab) { history.pushState(null, '', '#today'); view = 'today'; window.scrollTo({ top: 0 }); }
    commit(t('logged', entryName(modalDrink), Math.round(modalDrink.mg * modalAmount), t('portion', modalAmount, modalDrink.cat)));
    if (flight) pourDrink({ ...flight, after: todayFigures(), sound: glug, pulse: heartbeat });
  } else if (event.target.id === 'edit-form') {
    const entry = state.entries.find(e => e.id === event.target.dataset.id);
    if (entry) entry.time = time;
    picker.close(); commit(t('timeUpdated'));
  }
});
picker.addEventListener('click', event => { if (event.target === picker) { const r = picker.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) picker.close(); } });
document.addEventListener('dragstart', event => {
  const ingredient = event.target.closest('[data-ingredient]'); if (!ingredient || ingredient.disabled) return;
  event.dataTransfer.setData('text/plain', ingredient.dataset.ingredient); event.dataTransfer.effectAllowed = 'copy';
});
document.addEventListener('dragover', event => { if (event.target.closest('#mixing-zone')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; $('#mixing-zone').classList.add('drag-over'); } });
document.addEventListener('dragleave', event => { const zone = event.target.closest('#mixing-zone'); if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('drag-over'); });
document.addEventListener('drop', event => { if (event.target.closest('#mixing-zone')) { event.preventDefault(); $('#mixing-zone').classList.remove('drag-over'); addIngredient(event.dataTransfer.getData('text/plain')); } });
function route(focus = false) {
  const hash = location.hash.slice(1); view = ['today', 'history', 'sleep', 'lab'].includes(hash) ? hash : 'today';
  sleepEntrance = view === 'sleep';
  if (view === 'history') historyMotion = 'grow';
  render(); if (focus) { $('#main').focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
}
window.addEventListener('hashchange', () => route(true));
// Keep multiple open tabs in sync without clobbering a newer journal.
window.addEventListener('storage', event => {
  if (event.key === SYNC_KEY) { syncMeta = loadSyncMeta(storage); if (!syncMeta && authUser) { authUser = null; syncStatus = 'local'; } updateAccountUI(); }
  if (event.key === STORE_KEY) {
    const fresh = loadState(storage);
    if (!fresh.warning) { state.entries = fresh.state.entries; state.settings = fresh.state.settings; loaded.blocked = false; warning = ''; undo = null; render(); notify(t('otherTab')); }
  }
});
setInterval(() => {
  // Preserve the focused control during live updates and local-midnight rollover.
  if (!picker.open && !isPouring() && document.activeElement?.tagName !== 'INPUT' && view !== 'lab') {
    const focused = document.activeElement;
    const action = focused?.dataset?.action, id = focused?.dataset?.id;
    render();
    if (action && !focused.dataset.focus) {
      document.querySelector(`[data-action="${CSS.escape(action)}"]${id ? `[data-id="${CSS.escape(id)}"]` : ''}`)?.focus({ preventScroll: true });
    }
  }
}, 60000);
window.addEventListener('pageshow', () => { if (!picker.open) render(); });
route();
if (!warning) saveLocal();
initAuth();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => notify(t('offlineSetup')));
}
