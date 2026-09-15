import { CATEGORIES, DRINKS, DRINK_BY_ID, QUICK, INGREDIENTS, ING_BY_ID, RECIPES, MAX_LAYERS, blendKey, matchRecipe, blendTotals } from './data.js';
import { STORE_KEY, HOUR, uid, dayKey, timeValue, validTime, fmtTime, nextBedtime, activeAt, timeBelow, onDay, sumMg, sumKcal, historyDays, waterBonuses, loadState, makeDrink } from './model.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error('Storage unavailable'); } }; }
const loaded = loadState(storage);
const state = loaded.state;
let warning = loaded.warning;
let view = 'today', historyRange = 7, selectedDay = dayKey(), layers = [], ingredientCategory = 'All';
let undo = null, toastTimer, modalDrink = null, modalAmount = 1, modalCategory = 'all', modalQuery = '', audio;
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
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
  shuffle: '<path d="m3 5 4 0 10 14h4m-4-4 4 4-4 4M3 19h4L17 5h4m-4-4 4 4-4 4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.cup}</svg>`;
function cup(cat = 'coffee', large = false) {
  const colors = { coffee: '#df775e', tea: '#9db676', energy: '#b6a4d9', soda: '#eebf58', supp: '#9ebccc', sweets: '#c9967d', water: '#8ec3dc' };
  const color = colors[cat] || colors.coffee;
  return `<svg class="cup-art ${large ? 'large' : ''}" viewBox="0 0 150 140" aria-hidden="true"><ellipse cx="77" cy="123" rx="53" ry="7" fill="#342921" opacity=".09"/><g class="steam" fill="none" stroke="currentColor" stroke-width="3" opacity=".5"><path d="M55 32c-12-12 12-14 0-26M78 28c-12-12 12-14 0-26M100 32c-12-12 12-14 0-26"/></g><path d="M111 57h9c26 0 23 38-6 38h-8" fill="none" stroke="#342921" stroke-width="13"/><path d="M111 57h9c26 0 23 38-6 38h-8" fill="none" stroke="${color}" stroke-width="8"/><path d="M32 45h80l-5 51c-2 28-67 28-70 0Z" fill="${color}" stroke="#342921" stroke-width="3"/><ellipse cx="72" cy="45" rx="40" ry="9" fill="#fff0d8" stroke="#342921" stroke-width="3"/><ellipse cx="72" cy="46" rx="31" ry="5" fill="${cat === 'tea' ? '#6b813e' : cat === 'water' ? '#b6e1ed' : '#78442c'}"/><path d="M48 66v20" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/><circle cx="64" cy="81" r="2.5" fill="#342921"/><circle cx="86" cy="81" r="2.5" fill="#342921"/><path d="M69 92q6 7 12 0" fill="none" stroke="#342921" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
function persist() {
  if (loaded.blocked) { warning = 'Saving paused to protect unreadable data. Export your backup before resetting browser storage.'; return; }
  try { storage.setItem(STORE_KEY, JSON.stringify(state)); warning = ''; }
  catch { warning = 'Could not save to this browser. Export a backup to keep your journal.'; }
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
function notify(message, canUndo = false) {
  clearTimeout(toastTimer);
  $('#toast').innerHTML = `<span>${esc(message)}</span>${canUndo ? '<button data-action="undo">Undo</button>' : ''}`;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => { $('#toast').classList.remove('visible'); undo = null; }, 8000);
}
function commit(message) { persist(); tick(); render(); if (message) notify(message); }
function render() {
  const active = document.activeElement;
  const focusKey = active?.dataset?.focus;
  document.documentElement.dataset.theme = state.settings.theme;
  $('meta[name="theme-color"]').content = state.settings.theme === 'dark' ? '#242321' : '#f7f4ec';
  const titles = { today: ['A little ritual. A little balance.', 'Your daily brew.'], history: ['Every sip tells a story.', 'The pages so far.'], sleep: ['Make room for a softer evening.', 'Your wind-down.'], lab: ['A dash of this. A splash of that.', 'The Blend Lab.'] };
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a href="#today" class="brand" aria-label="Kaffe home">${icon('cup')}<span>kaffe<span class="brand-dot">.</span></span></a><p class="brand-note">a little coffee journal</p><nav aria-label="Main navigation">${[['today', 'Today'], ['history', 'History'], ['sleep', 'Sleep'], ['lab', 'Blend Lab']].map(([id, title]) => `<a class="nav-link ${view === id ? 'selected' : ''}" href="#${id}" aria-label="${title}" ${view === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${title}</span>${view === id ? '<span class="nav-dot"></span>' : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-doodle">${cup('tea')}<p>Good days are made<br>one small sip at a time.</p></div><div class="utility"><button class="icon-button" data-action="theme" data-focus="theme" aria-label="Switch to ${state.settings.theme === 'light' ? 'dark' : 'light'} theme" title="Change theme">${icon(state.settings.theme === 'light' ? 'sleep' : 'sun')}</button><button class="icon-button" data-action="sound" data-focus="sound" aria-label="${state.settings.sound ? 'Disable' : 'Enable'} sounds" aria-pressed="${state.settings.sound}" title="Toggle sounds">${icon(state.settings.sound ? 'sound' : 'mute')}</button><button class="icon-button" data-action="export" title="Export journal" aria-label="Export journal backup">${icon('download')}</button></div><p class="local-note">Just yours. Saved on this device.</p></div></aside><main id="main" tabindex="-1"><header class="page-header"><div><p class="eyebrow">${titles[view][0]}</p><h1>${titles[view][1]}</h1></div><div class="header-date"><span class="date-dot"></span>${new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div></header>${warning ? `<div class="warning" role="alert">${esc(warning)} <button class="text-button" data-action="export">Export backup</button></div>` : ''}${view === 'today' ? todayView() : view === 'history' ? historyView() : view === 'sleep' ? sleepView() : labView()}<footer class="page-footer"><span>Made for mindful sipping, not perfect numbers.</span><span>Caffeine values are estimates. ${state.settings.halfLife}h half-life model.</span></footer></main></div>`;
  if (focusKey) document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}
function stats(entries) {
  const drinks = entries.filter(e => e.kind === 'drink');
  return `<div class="mini-stats"><div><strong>${drinks.length}</strong><span>drinks logged</span></div><div><strong>${Math.round(sumKcal(entries))}<small> kcal</small></strong><span>from your drinks</span></div><div><strong>${drinks.length ? Math.round(sumMg(entries) / drinks.length) : 0}<small> mg</small></strong><span>average per drink</span></div></div>`;
}
function todayView() {
  const now = Date.now(), entries = onDay(state.entries), total = sumMg(entries), active = activeAt(state.entries, now, state.settings.halfLife);
  const waters = entries.filter(e => e.kind === 'water'), bonuses = waterBonuses(state.entries);
  const points = waters.length + waters.filter(e => bonuses.has(e.id)).length;
  const mood = total > 400 ? 'high' : total >= 300 ? 'medium' : 'low';
  const below = timeBelow(state.entries, 50, now, state.settings.halfLife);
  return `<section class="today-top"><article class="card daily-card ${mood}"><div class="daily-copy"><div class="section-kicker">TODAY’S CAFFEINE <span class="badge">${total > 400 ? 'Over reference' : total >= 300 ? 'Getting close' : 'Keeping track'}</span></div><div class="big-number">${Math.round(total)}<span>mg</span></div><p class="daily-caption">${total === 0 ? 'A fresh page. What’s in your cup?' : total > 400 ? 'A good moment to switch to caffeine-free.' : total >= 300 ? 'Maybe make the next one decaf.' : 'A little awareness goes a long way.'}</p><div class="intake-track" role="meter" aria-label="Daily caffeine against 400 milligram reference" aria-valuemin="0" aria-valuemax="400" aria-valuenow="${Math.min(400, total)}" aria-valuetext="${total} of 400 milligrams"><span style="width:${Math.min(100, total / 4)}%"></span></div><div class="meter-labels"><span>0 mg</span><span>400 mg daily reference</span></div></div><div class="hero-art">${cup('coffee', true)}<span class="art-caption">sip, log, repeat.</span></div>${stats(entries)}</article><article class="card active-card"><div class="section-kicker">IN YOUR SYSTEM ${icon('lab')}</div><div class="active-number">${Math.round(active)}<span>mg</span></div><p>estimated active caffeine</p><div class="active-foot">${icon('sleep')}<div><strong>${active < 50 ? 'Below 50 mg now' : `Below 50 mg around ${fmtTime(below)}`}</strong><span>${dayKey(below) !== dayKey(now) ? new Date(below).toLocaleDateString([], { weekday: 'short' }) + ' · ' : ''}assuming no more caffeine</span></div></div><button class="text-button" data-action="navigate" data-view="sleep">Plan your wind-down ${icon('arrow')}</button></article></section><section class="section quick-section"><div class="section-heading"><div><p class="eyebrow">THE USUAL SUSPECTS</p><h2>What are we sipping?</h2></div><button class="button primary" data-action="catalog">${icon('plus')}<span>All drinks</span></button></div><div class="quick-grid">${QUICK.map(id => { const d = DRINK_BY_ID[id]; return `<button class="drink-card ${d.cat}" data-action="choose" data-id="${id}" aria-label="Log ${d.name}"><span class="drink-plus">${icon('plus')}</span>${cup(d.cat)}<strong>${d.name}</strong><span>${d.mg} mg <i>·</i> ${d.serving}</span></button>`; }).join('')}</div></section><section class="today-bottom"><article class="card chart-card"><div class="section-heading"><div><p class="eyebrow">THE SLOW FADE</p><h2>Your caffeine curve</h2></div><span class="live-label"><span></span>Live estimate</span></div>${decayChart(now)}<p class="chart-note">Includes caffeine carried over from previous days. Dashed line: forecast with no more caffeine.</p></article><article class="card water-card"><div class="section-heading"><div><p class="eyebrow">A LITTLE RESET</p><h2>Water break?</h2></div>${icon('water')}</div><div class="water-visual"><div class="water-glass"><div class="water-fill" style="height:${Math.min(90, 10 + waters.length * 12)}%"></div><span>${waters.length}</span></div><div><strong>${waters.length} ${waters.length === 1 ? 'glass' : 'glasses'}</strong><p>${points} hydration ${points === 1 ? 'point' : 'points'}</p></div></div><button class="button water-button" data-action="water" data-focus="water">${icon('plus')}Log a glass</button><p class="small-note">1 point per glass. +1 for the first water after caffeine. Water does not clear caffeine faster.</p></article></section><section class="section"><div class="section-heading"><div><p class="eyebrow">LITTLE MOMENTS, LOGGED</p><h2>Today’s journal <span class="count">${entries.length}</span></h2></div><button class="text-button" data-action="catalog">Add a sip ${icon('plus')}</button></div>${entryList(entries)}</section><p class="health-note">400 mg/day is a general reference for many healthy adults, not a target or a personal safety limit. Pregnancy, medications, age, and individual sensitivity can mean lower limits.</p>`;
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
  return `<svg class="decay-chart" viewBox="0 0 710 220" role="img" aria-label="Estimated active caffeine across the day, currently ${Math.round(activeAt(state.entries, now, halfLife))} milligrams"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dc7960" stop-opacity=".3"/><stop offset="100%" stop-color="#dc7960" stop-opacity=".02"/></linearGradient></defs>${[0, .5, 1].map(f => `<line x1="44" x2="684" y1="${y(max * f)}" y2="${y(max * f)}" class="grid-line"/><text x="34" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}<text x="12" y="17">mg</text><path d="${path(past)} L${x(now)},178 L44,178 Z" fill="url(#chart-fill)"/><path d="${path(past)}" class="curve"/><path d="${path(future)}" class="curve forecast"/><line x1="${x(now)}" x2="${x(now)}" y1="24" y2="178" class="now-line"/><circle cx="${x(now)}" cy="${y(activeAt(state.entries, now, halfLife))}" r="5" class="now-dot"/><text x="${Math.min(660, Math.max(65, x(now)))}" y="17" text-anchor="middle">now</text>${state.entries.filter(e => e.kind === 'drink' && e.time >= begin && e.time <= now).map(e => `<circle cx="${x(e.time)}" cy="${y(activeAt(state.entries, e.time, halfLife))}" r="3" class="drink-marker"><title>${esc(e.name)} · ${e.mg} mg · ${fmtTime(e.time)}</title></circle>`).join('')}${[0, .25, .5, .75, 1].map(f => `<text x="${x(begin + duration * f)}" y="207" text-anchor="middle">${fmtTime(begin + duration * f)}</text>`).join('')}</svg>`;
}
function entryList(entries) {
  const bonuses = waterBonuses(state.entries);
  if (!entries.length) return `<div class="empty-state">${icon('cup')}<div><h3>No sips on this page. Yet.</h3><p>Log a drink or a glass of water and make yourself at home.</p></div></div>`;
  return `<div class="entry-list">${[...entries].sort((a, b) => b.time - a.time).map(e => `<article class="entry"><div class="entry-icon ${esc(e.cat)}">${icon(e.kind === 'water' ? 'water' : 'cup')}</div><div class="entry-name"><strong>${esc(e.name)}</strong><span>${e.kind === 'water' ? `1 glass · ${bonuses.has(e.id) ? '2 points · post-caffeine bonus' : '1 point'}` : `${e.amount}× serving · ${e.kcal} kcal`}</span></div><button class="entry-time" data-action="edit" data-id="${esc(e.id)}" aria-label="Edit time for ${esc(e.name)} at ${fmtTime(e.time)}">${fmtTime(e.time)}${icon('edit')}</button><strong class="entry-mg">${e.kind === 'water' ? '—' : `${e.mg}<small> mg</small>`}</strong><button class="icon-button delete-button" data-action="delete" data-id="${esc(e.id)}" aria-label="Delete ${esc(e.name)} at ${fmtTime(e.time)}">${icon('trash')}</button></article>`).join('')}</div>`;
}
function historyView() {
  const days = historyDays(state.entries, historyRange), total = days.reduce((s, d) => s + d.mg, 0), count = days.reduce((s, d) => s + d.drinks, 0);
  const included = new Set(days.map(d => d.key));
  const top = new Map();
  state.entries.filter(e => e.kind === 'drink' && included.has(dayKey(e.time))).forEach(e => top.set(e.name, (top.get(e.name) || 0) + 1));
  const favorites = [...top].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(400, ...days.map(d => d.mg));
  return `<section class="history-summary"><article class="card peach"><p class="eyebrow">DAILY AVERAGE</p><strong>${Math.round(total / historyRange)}<small> mg</small></strong><p>across the last ${historyRange} days</p></article><article class="card sage"><p class="eyebrow">SIPS REMEMBERED</p><strong>${count}<small> drinks</small></strong><p>${days.reduce((s, d) => s + d.water, 0)} glasses of water, too</p></article><article class="card lilac"><p class="eyebrow">UNDER THE REFERENCE</p><strong>${days.filter(d => d.mg <= 400).length}<small> / ${historyRange}</small></strong><p>days at or below 400 mg*</p></article></section><section class="card history-chart-card"><div class="section-heading"><div><p class="eyebrow">YOUR REAL LOGS. NO DEMO DATA.</p><h2>A bird’s-eye brew</h2></div><div class="segmented" role="group" aria-label="History range">${[7, 30].map(n => `<button data-action="range" data-value="${n}" data-focus="range-${n}" aria-pressed="${historyRange === n}" class="${historyRange === n ? 'selected' : ''}">${n === 7 ? 'Week' : 'Month'}</button>`).join('')}</div></div><div class="history-chart ${historyRange === 30 ? 'month' : ''}">${days.map(d => `<button class="history-bar ${selectedDay === d.key ? 'selected' : ''}" data-action="day" data-day="${d.key}" data-focus="day-${d.key}" aria-pressed="${selectedDay === d.key}" aria-label="${new Date(d.time).toLocaleDateString()}: ${d.mg} milligrams"><span class="bar-value">${d.mg}</span><span class="bar-track"><span style="height:${Math.max(2, d.mg / max * 100)}%" class="${d.mg > 400 ? 'over' : ''}"></span></span><span class="bar-label">${historyRange === 7 ? new Date(d.time).toLocaleDateString([], { weekday: 'short' }) : new Date(d.time).getDate()}</span></button>`).join('')}</div><p class="small-note">Select a day to turn the page. *Unlogged days count as zero; this is a log summary, not a health score.</p></section><section class="history-bottom"><div><div class="section-heading"><h2>The daily pages</h2><label class="date-picker"><span class="sr-only">Journal date</span><input type="date" id="history-date" value="${selectedDay}" max="${dayKey()}"></label></div><p class="eyebrow day-heading">${new Date(selectedDay + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>${entryList(onDay(state.entries, selectedDay))}</div><article class="card favorites"><p class="eyebrow">THE REGULARS</p><h2>Your favorites</h2>${favorites.length ? favorites.map(([name, n], i) => `<div class="favorite-row"><span class="rank">0${i + 1}</span><strong>${esc(name)}</strong><span>${n}×</span></div>`).join('') : '<p class="muted">Your most-logged drinks will find a home here.</p>'}<button class="text-button" data-action="export">${icon('download')}Export your journal</button></article></section>`;
}
function sleepView() {
  const now = Date.now(), bedtime = nextBedtime(state.settings.bedtime, now), estimated = activeAt(state.entries, bedtime, state.settings.halfLife);
  const below = timeBelow(state.entries, 50, now, state.settings.halfLife);
  return `<section class="sleep-layout"><article class="card bedtime-card"><div class="moon-art" aria-hidden="true"><span class="star one">+</span><span class="moon"></span><span class="star two">+</span><span class="star three">·</span></div><p class="eyebrow">LET’S CALL IT A NIGHT</p><h2>When’s bedtime?</h2><label class="bedtime-input"><span class="sr-only">Bedtime</span><input type="time" id="bedtime" value="${state.settings.bedtime}" required data-focus="bedtime"></label><p>${new Date(bedtime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} · in ${((bedtime - now) / HOUR).toFixed(1)} hours</p><div class="bedtime-estimate"><strong>${Math.round(estimated)}<small> mg</small></strong><span>estimated caffeine at bedtime</span></div><span class="badge">${estimated < 50 ? 'Lower estimated level' : 'Some caffeine may linger'}</span></article><div class="sleep-details"><article class="card"><p class="eyebrow">YOUR EVENING FORECAST</p><h2>${estimated < 50 ? 'A gentler landing.' : 'Give your last cup some space.'}</h2><p class="body-copy">${estimated < 50 ? 'Your log suggests relatively little caffeine will remain by bedtime. That’s just one part of the sleep picture.' : 'Your logged caffeine may still be noticeable at bedtime. Consider a caffeine-free drink for the rest of the day.'}</p><div class="forecast-facts"><div>${icon('lab')}<span>Active right now<strong>${Math.round(activeAt(state.entries, now, state.settings.halfLife))} mg</strong></span></div><div>${icon('sleep')}<span>Estimated below 50 mg<strong>${below <= now ? 'Already below' : `${fmtTime(below)}${dayKey(below) !== dayKey(now) ? ' · ' + new Date(below).toLocaleDateString([], { weekday: 'short' }) : ''}`}</strong></span></div></div><p class="small-note">Assumes no more caffeine. 50 mg is a visualization threshold, not a proven “sleep-safe” level.</p></article><article class="card half-life-card"><div class="section-heading"><div><p class="eyebrow">EVERY BODY IS DIFFERENT</p><h2>The half-life story</h2></div><strong class="half-life-value">${state.settings.halfLife}h</strong></div><p class="body-copy">Half-life is the time it takes your body to clear roughly half its caffeine. Try an estimate between 3 and 8 hours.</p><label for="half-life" class="sr-only">Estimated caffeine half-life in hours</label><input id="half-life" data-focus="half-life" type="range" min="3" max="8" step="0.5" value="${state.settings.halfLife}"><div class="meter-labels"><span>3h · faster</span><span>5h · default</span><span>8h · slower</span></div><div class="half-life-example"><span>100 mg</span>${icon('arrow')}<span>50 mg</span>${icon('arrow')}<span>25 mg</span></div><p class="small-note">After ${state.settings.halfLife} hours, then ${state.settings.halfLife * 2} hours. This setting changes estimates only, not your intake totals.</p></article></div></section><section class="card sleep-curve"><div class="section-heading"><h2>From now to lights out</h2><span class="badge">No more caffeine forecast</span></div>${decayChart(now, Math.max(bedtime, now + HOUR))}</section><p class="health-note">This is a simplified estimate, not medical advice or a guarantee of sleep quality. Metabolism varies with medications, pregnancy, genetics, and other factors. Talk to a clinician about personal limits or persistent sleep problems.</p>`;
}
function labView() {
  const recipe = matchRecipe(layers), totals = blendTotals(layers), categories = ['All', ...new Set(INGREDIENTS.map(i => i.cat))];
  return `<div class="lab-intro"><span class="badge">A tiny café. You’re the barista.</span><p>Tap or drag ingredients into your cup. Discover a classic, or make it your own.</p></div><section class="lab-layout"><article class="card pantry"><div class="section-heading"><h2>The pantry</h2><span class="muted">11 ingredients</span></div><div class="chips">${categories.map(cat => `<button class="chip ${ingredientCategory === cat ? 'selected' : ''}" data-action="ingredient-category" data-category="${cat}" data-focus="ingredient-cat-${cat}" aria-pressed="${ingredientCategory === cat}">${cat}</button>`).join('')}</div><div class="ingredient-grid">${INGREDIENTS.filter(i => ingredientCategory === 'All' || i.cat === ingredientCategory).map(i => `<button class="ingredient" draggable="true" data-ingredient="${i.id}" data-action="ingredient" data-id="${i.id}" data-focus="ingredient-${i.id}" ${layers.length >= MAX_LAYERS ? 'disabled' : ''}><span class="ingredient-swatch" style="--ingredient:${i.color}">${icon(i.cat === 'Base' || i.id === 'ice' ? 'water' : 'cup')}</span><strong>${i.name}</strong><span>${i.mg} mg · ${i.kcal} kcal</span></button>`).join('')}</div><p class="small-note">Each tap adds one recipe portion. Nutrition is estimated per ingredient, not by cup volume.</p></article><article class="card mixing-card"><div class="section-heading"><span class="eyebrow">YOUR LITTLE CREATION</span><button class="text-button" data-action="reset-blend" ${layers.length ? '' : 'disabled'}>Reset</button></div><div class="mixing-zone" id="mixing-zone" role="group" aria-label="Drop ingredients into your cup"><div class="blend-steam" aria-hidden="true">∿ ∿ ∿</div><div class="blend-cup"><div class="blend-layers">${layers.map((id, index) => `<button class="blend-layer" style="--ingredient:${ING_BY_ID[id].color}" data-action="remove-layer" data-index="${index}" aria-label="Remove layer ${index + 1}: ${ING_BY_ID[id].name}"><span>${ING_BY_ID[id].name}</span>${icon('close')}</button>`).join('')}${!layers.length ? '<span class="cup-placeholder">a little possibility<br>in an empty cup</span>' : ''}</div></div><div class="blend-saucer"></div></div><div class="layer-count" aria-live="polite">${layers.length} / ${MAX_LAYERS} layers ${layers.length ? '· tap a layer to remove' : '· start with an ingredient'}</div><h2>${recipe ? recipe.name : layers.length ? 'Your custom blend' : 'Something good is brewing.'}</h2><p class="blend-tagline">${recipe ? recipe.tagline : layers.length ? 'No rules. Just your very own recipe.' : 'Your next favorite is a few taps away.'}</p><div class="blend-totals"><span><strong>${totals.mg}</strong> mg caffeine</span><span><strong>${totals.kcal}</strong> kcal</span></div><button class="button primary log-blend" data-action="log-blend" ${layers.length ? '' : 'disabled'}>${icon('plus')}Log this blend</button><button class="text-button surprise" data-action="surprise" data-focus="surprise">${icon('shuffle')}Surprise me</button></article></section><section class="section recipe-section"><div class="section-heading"><div><p class="eyebrow">BORROW A LITTLE INSPIRATION</p><h2>The recipe book</h2></div><span class="muted">${RECIPES.length} ways to play</span></div><div class="recipe-grid">${RECIPES.map((r, index) => `<button class="recipe-card ${recipe === r ? 'selected' : ''}" data-action="recipe" data-index="${index}" data-focus="recipe-${index}" aria-pressed="${recipe === r}"><span class="recipe-number">${String(index + 1).padStart(2, '0')}</span><strong>${r.name}</strong><span>${r.ing.length} layers · ${blendTotals(r.ing).mg} mg</span>${icon('arrow')}</button>`).join('')}</div></section>`;
}
function catalogMarkup() {
  const results = DRINKS.filter(d => (modalCategory === 'all' || d.cat === modalCategory) && `${d.name} ${d.cat}`.toLowerCase().includes(modalQuery.toLowerCase()));
  return `<div class="catalog-results">${results.length ? results.map(d => `<button class="catalog-drink" data-action="choose" data-id="${d.id}"><span class="entry-icon ${d.cat}">${icon('cup')}</span><span><strong>${d.name}</strong><small>${d.serving} · ${d.kcal} kcal</small></span><b>${d.mg}<small> mg</small></b>${icon('plus')}</button>`).join('') : '<p class="empty-search">No matching drinks. Try another name or category.</p>'}</div>`;
}
function openCatalog() {
  modalQuery = ''; modalCategory = 'all';
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">FIND YOUR NEXT SIP</p><h2 id="picker-title">What’s in your cup?</h2></div><button class="icon-button" data-action="close" aria-label="Close drink picker">${icon('close')}</button></div><label class="search-label"><span class="sr-only">Search drinks</span><input id="drink-search" type="search" placeholder="Search coffee, tea, energy drinks…" autocomplete="off"></label><div class="chips catalog-chips">${CATEGORIES.map(([id, name]) => `<button class="chip ${id === 'all' ? 'selected' : ''}" data-action="catalog-category" data-category="${id}" aria-pressed="${id === 'all'}">${name}</button>`).join('')}</div><div id="catalog-list">${catalogMarkup()}</div><p class="small-note">Estimates per serving. Actual caffeine varies by brand and preparation.</p>`;
  showDialog(); $('#drink-search').focus();
}
function showDialog() { if (!picker.open) picker.showModal(); }
function chooseDrink(drink) {
  modalDrink = drink; modalAmount = 1;
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">MAKE IT YOURS</p><h2 id="picker-title">${esc(drink.name)}</h2></div><button class="icon-button" data-action="close" aria-label="Close amount picker">${icon('close')}</button></div><form id="log-form"><div class="amount-hero">${cup(drink.cat)}<div><strong id="amount-mg">${drink.mg}<small> mg</small></strong><p><span id="amount-kcal">${drink.kcal}</span> kcal · per <span id="amount-multiplier">1</span>× serving</p><span class="muted">Standard serving: ${esc(drink.serving || '1 blend')}</span></div></div><div class="section-heading"><label for="amount">Serving size</label><output id="amount-label" for="amount">1×</output></div><input type="range" id="amount" min="0.1" max="3" step="0.05" value="1"><div class="amount-presets">${[.25, .5, .75, 1, 1.5, 2].map(n => `<button type="button" data-action="amount-preset" data-value="${n}" class="chip ${n === 1 ? 'selected' : ''}" aria-pressed="${n === 1}">${n}×</button>`).join('')}</div><div class="form-grid"><label>Date<input type="date" id="log-date" value="${dayKey()}" max="${dayKey()}" required></label><label>Time<input type="time" id="log-time" value="${timeValue()}" required></label></div><p id="form-error" class="form-error" role="alert"></p><button class="button primary full-width" type="submit">${icon('plus')}Add to my journal</button><button type="button" class="text-button back-catalog" data-action="catalog">Back to all drinks</button></form>`;
  showDialog(); $('#amount').focus();
}
function updateAmount(n) {
  modalAmount = Math.max(.1, Math.min(3, n));
  $('#amount').value = modalAmount;
  $('#amount-mg').innerHTML = `${Math.round(modalDrink.mg * modalAmount)}<small> mg</small>`;
  $('#amount-kcal').textContent = Math.round(modalDrink.kcal * modalAmount);
  $('#amount-multiplier').textContent = modalAmount;
  $('#amount-label').textContent = `${modalAmount}×`;
  picker.querySelectorAll('[data-action="amount-preset"]').forEach(b => { const selected = +b.dataset.value === modalAmount; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
}
function editEntry(id) {
  const entry = state.entries.find(e => e.id === id); if (!entry) return;
  picker.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">A LITTLE CORRECTION</p><h2 id="picker-title">Edit ${esc(entry.name)}</h2></div><button class="icon-button" data-action="close" aria-label="Close time editor">${icon('close')}</button></div><form id="edit-form" data-id="${esc(id)}"><div class="form-grid"><label>Date<input type="date" id="log-date" value="${dayKey(entry.time)}" max="${dayKey()}" required></label><label>Time<input type="time" id="log-time" value="${timeValue(entry.time)}" required></label></div><p id="form-error" class="form-error" role="alert"></p><button class="button primary full-width" type="submit">Save changes</button></form>`;
  showDialog(); $('#log-time').focus();
}
function formTime() {
  const date = $('#log-date').value, time = $('#log-time').value;
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !validTime(time) || !Number.isFinite(timestamp) || dayKey(timestamp) !== date || timeValue(timestamp) !== time) {
    $('#form-error').textContent = 'Please choose a valid date and time.'; return null;
  }
  if (timestamp > Date.now()) { $('#form-error').textContent = 'Please log a time that has already happened.'; return null; }
  return timestamp;
}
function addIngredient(id) {
  if (!ING_BY_ID[id] || layers.length >= MAX_LAYERS) return;
  layers.push(id); tick(); render();
  $('#mixing-zone')?.classList.add('splashed');
}
function exportJournal() {
  let data = JSON.stringify(state, null, 2);
  if (loaded.blocked) {
    try { data = storage.getItem(STORE_KEY) || data; } catch { /* Export in-memory data if inaccessible. */ }
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `kaffe-journal-${dayKey()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Journal backup downloaded.');
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const d = button.dataset;
  switch (d.action) {
    case 'navigate': location.hash = d.view; break;
    case 'theme': state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light'; commit(); break;
    case 'sound': state.settings.sound = !state.settings.sound; commit(); notify(`Sounds ${state.settings.sound ? 'on' : 'off'}.`); break;
    case 'export': exportJournal(); break;
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
      state.entries.push(entry); commit(waterBonuses(state.entries).has(entry.id) ? 'Water logged. +2 hydration points!' : 'Water logged. A little reset.');
      $('.water-glass')?.classList.add('splashed'); break;
    }
    case 'delete': {
      const index = state.entries.findIndex(e => e.id === d.id); if (index < 0) break;
      undo = state.entries.splice(index, 1)[0]; persist(); render(); notify(`${undo.name} removed.`, true);
      if (!document.activeElement || document.activeElement === document.body) $('#main')?.focus({ preventScroll: true });
      break;
    }
    case 'undo': if (undo) { state.entries.push(undo); undo = null; commit('Sip restored.'); } break;
    case 'edit': editEntry(d.id); break;
    case 'range': historyRange = +d.value; render(); break;
    case 'day': selectedDay = d.day; render(); break;
    case 'ingredient-category': ingredientCategory = d.category; render(); break;
    case 'ingredient': addIngredient(d.id); break;
    case 'remove-layer': layers.splice(+d.index, 1); tick(); render(); $('#mixing-zone')?.closest('article')?.querySelector('[data-action="reset-blend"]')?.focus({ preventScroll: true }); break;
    case 'reset-blend': layers = []; render(); break;
    case 'recipe': layers = [...RECIPES[+d.index].ing]; tick(); render(); notify(`${RECIPES[+d.index].name} loaded into your cup.`); break;
    case 'surprise': {
      const options = RECIPES.filter(r => blendKey(r.ing) !== blendKey(layers));
      const recipe = options[Math.floor(Math.random() * options.length)]; layers = [...recipe.ing]; tick(); render(); notify(`Meet your ${recipe.name}.`); break;
    }
    case 'log-blend': {
      if (!layers.length) break;
      const recipe = matchRecipe(layers);
      chooseDrink({ id: recipe?.drinkId || null, name: recipe?.name || 'Custom blend', cat: layers.includes('matcha') ? 'tea' : 'coffee', ...blendTotals(layers), serving: '1 blend' }); break;
    }
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'drink-search') { modalQuery = event.target.value; $('#catalog-list').innerHTML = catalogMarkup(); }
  if (event.target.id === 'amount') updateAmount(+event.target.value);
});
document.addEventListener('change', event => {
  const { id, value } = event.target;
  if (id === 'history-date' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= dayKey()) { selectedDay = value; render(); $('#history-date')?.focus({ preventScroll: true }); }
  if (id === 'bedtime' && validTime(value)) { state.settings.bedtime = value; commit(); }
  if (id === 'half-life') { state.settings.halfLife = Math.max(3, Math.min(8, +value)); commit(); }
});
// Search inputs consume Escape in some browsers; close the dialog consistently.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && picker.open) { event.preventDefault(); picker.close(); }
}, true);
picker.addEventListener('submit', event => {
  event.preventDefault(); const time = formTime(); if (time === null) return;
  if (event.target.id === 'log-form') {
    state.entries.push(makeDrink(modalDrink, modalAmount, time));
    picker.close(); commit(`${modalDrink.name} logged. ${Math.round(modalDrink.mg * modalAmount)} mg, noted.`);
  } else if (event.target.id === 'edit-form') {
    const entry = state.entries.find(e => e.id === event.target.dataset.id);
    if (entry) entry.time = time;
    picker.close(); commit('Journal time updated.');
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
  render(); if (focus) { $('#main').focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
}
window.addEventListener('hashchange', () => route(true));
// Keep multiple open tabs in sync without clobbering a newer journal.
window.addEventListener('storage', event => {
  if (event.key === STORE_KEY) {
    const fresh = loadState(storage);
    if (!fresh.warning) { state.entries = fresh.state.entries; state.settings = fresh.state.settings; loaded.blocked = false; warning = ''; undo = null; render(); notify('Journal updated from another tab.'); }
  }
});
setInterval(() => {
  // Preserve the focused control during live updates and local-midnight rollover.
  if (!picker.open && document.activeElement?.tagName !== 'INPUT' && view !== 'lab') {
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
if (!warning) persist();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => notify('Offline setup unavailable. The journal still works online.'));
}
