import { DRINK_BY_ID } from './data.js';

export const STORE_KEY = 'kaffe-journal-v2';
export const HOUR = 3600000;
export const DEFAULT_SETTINGS = { theme: 'light', sound: false, bedtime: '23:00', halfLife: 5, pulse: 'on' };
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function dayKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function timeValue(time = Date.now()) {
  const d = new Date(time);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const fmtTime = time => new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export function nextBedtime(value, now = Date.now()) {
  const d = new Date(now);
  const [h, m] = value.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}
export function activeAt(entries, time, halfLife = 5) {
  return entries.reduce((sum, e) => e.kind === 'water' || e.time > time ? sum : sum + e.mg * 2 ** (-(time - e.time) / (halfLife * HOUR)), 0);
}
export function timeBelow(entries, threshold, now, halfLife = 5) {
  const active = activeAt(entries, now, halfLife);
  if (active < threshold) return now;
  return now + Math.ceil(halfLife * HOUR * Math.log2(active / threshold)) + 1;
}
export const onDay = (entries, day = dayKey()) => entries.filter(e => dayKey(e.time) === day);
export const sumMg = entries => entries.reduce((s, e) => s + e.mg, 0);
export const sumKcal = entries => entries.reduce((s, e) => s + e.kcal, 0);
export function historyDays(entries, count, now = Date.now()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - count + 1 + i);
    const key = dayKey(d);
    const rows = onDay(entries, key);
    return { key, time: d.getTime(), mg: sumMg(rows), drinks: rows.filter(e => e.kind === 'drink').length, water: rows.filter(e => e.kind === 'water').length };
  });
}
// Bonuses are derived from chronology, so editing/deleting a drink or water
// entry cannot leave stale reward points behind. No caffeine-consumption streaks.
export function waterBonuses(entries) {
  const result = new Set();
  let pending = false;
  let day = '';
  for (const e of [...entries].sort((a, b) => a.time - b.time || a.id.localeCompare(b.id))) {
    const currentDay = dayKey(e.time);
    if (day !== currentDay) { pending = false; day = currentDay; }
    if (e.kind === 'drink' && e.mg > 0) pending = true;
    if (e.kind === 'water') {
      if (pending) result.add(e.id);
      pending = false;
    }
  }
  return result;
}
function normalizeEntry(e, kind) {
  if (!e || !Number.isFinite(e.time) || e.time < 0 || Number.isNaN(new Date(e.time).getTime())) return null;
  const water = (kind || e.kind) === 'water';
  const catalog = DRINK_BY_ID[e.drink];
  if (!water && (!Number.isFinite(e.mg) || e.mg < 0 || !Number.isFinite(e.kcal) || e.kcal < 0 || (!catalog && !e.name))) return null;
  return {
    id: typeof e.id === 'string' ? e.id : uid(), kind: water ? 'water' : 'drink',
    drink: water ? null : e.drink || null,
    name: water ? 'Water' : String(e.name || catalog.name).slice(0, 100),
    cat: water ? 'water' : catalog?.cat || 'coffee',
    amount: Number.isFinite(e.amount) && e.amount > 0 ? e.amount : 1,
    mg: water ? 0 : e.mg, kcal: water ? 0 : e.kcal, time: e.time,
  };
}
export function normalizeState(raw) {
  if (!raw || raw.version !== 2 || !Array.isArray(raw.entries)) throw new Error('Unsupported journal data');
  const settings = { ...DEFAULT_SETTINGS };
  if (['light', 'dark'].includes(raw.settings?.theme)) settings.theme = raw.settings.theme;
  if (typeof raw.settings?.sound === 'boolean') settings.sound = raw.settings.sound;
  // 'off' | 'on' (heartbeat) | 'ultra'. Earlier builds stored a boolean switch.
  const pulse = raw.settings?.pulse;
  if (['off', 'on', 'ultra'].includes(pulse)) settings.pulse = pulse;
  else if (typeof pulse === 'boolean') settings.pulse = pulse ? 'on' : 'off';
  if (validTime(raw.settings?.bedtime)) settings.bedtime = raw.settings.bedtime;
  if (Number.isFinite(raw.settings?.halfLife) && raw.settings.halfLife >= 3 && raw.settings.halfLife <= 8) settings.halfLife = raw.settings.halfLife;
  const entries = raw.entries.map(e => normalizeEntry(e)).filter(Boolean);
  const ids = new Set();
  entries.forEach(e => { if (ids.has(e.id)) e.id = uid(); ids.add(e.id); });
  return { version: 2, entries, settings };
}
export function loadState(storage) {
  const empty = { version: 2, entries: [], settings: { ...DEFAULT_SETTINGS } };
  try {
    const saved = storage.getItem(STORE_KEY);
    if (saved !== null) {
      try { return { state: normalizeState(JSON.parse(saved)), warning: '' }; }
      catch { return { state: empty, warning: 'Saved journal could not be read. Existing data is untouched. Export a backup before making changes.', blocked: true }; }
    }
    // Keep legacy keys intact, and migrate every still-available record, even
    // if the old UTC date tag no longer equals today's local date.
    for (const [key, field, kind] of [['kaffe-log-v1', 'entries', 'drink'], ['kaffe-water-log-v1', 'waters', 'water']]) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed[field])) empty.entries.push(...parsed[field].map(e => normalizeEntry(e, kind)).filter(Boolean));
    }
    const theme = storage.getItem('kaffe-theme');
    if (['light', 'dark'].includes(theme)) empty.settings.theme = theme;
    const sound = storage.getItem('kaffe-sound');
    if (sound) empty.settings.sound = sound !== 'off';
    return { state: normalizeState(empty), warning: '' };
  } catch {
    return { state: empty, warning: 'Browser storage is unavailable or legacy data is unreadable. Changes may not survive a reload.' };
  }
}
export function makeDrink(drink, amount = 1, time = Date.now()) {
  return { id: uid(), kind: 'drink', drink: drink.id || null, name: drink.name, cat: drink.cat || 'coffee', amount, mg: Math.round(drink.mg * amount), kcal: Math.round(drink.kcal * amount), time };
}
// A rough personal starting point for the half-life setting, from average
// effects reported for groups of people. Individuals vary widely; the UI must
// present this as an estimate, never as a measurement or medical advice.
export const HALF_LIFE_BASE = 5;
export const HALF_LIFE_FACTORS = {
  smoke: { yes: [0.6, 'Smoking or nicotine', 'faster'] },
  hormonal: { yes: [1.8, 'Hormonal birth control', 'slower'] },
  pregnancy: { t1: [1.3, 'Pregnancy, 1st trimester', 'slower'], t2: [1.8, 'Pregnancy, 2nd trimester', 'slower'], t3: [2.5, 'Pregnancy, 3rd trimester', 'slower'] },
  meds: { yes: [2.5, 'A medication that slows caffeine clearance', 'much slower'] },
};
export function estimateHalfLife(answers = {}) {
  const factors = Object.entries(HALF_LIFE_FACTORS).flatMap(([key, options]) => options[answers[key]] ? [{ key, multiplier: options[answers[key]][0], label: options[answers[key]][1], effect: options[answers[key]][2] }] : []);
  const raw = factors.reduce((value, f) => value * f.multiplier, HALF_LIFE_BASE);
  const value = Math.min(8, Math.max(3, Math.round(raw * 2) / 2));
  return { value, raw, factors, capped: raw > 8 ? 'high' : raw < 3 ? 'low' : null };
}

// Cloud sync. SYNC_KEY remembers who this device last synced with, the
// server version it saw, and which entry IDs both sides shared at that point.
// That shared ID set is the base of a three-way merge, so an entry deleted on
// one device is not resurrected by another device's copy.
export const SYNC_KEY = 'kaffe-sync-v1';
export function loadSyncMeta(storage) {
  try {
    const meta = JSON.parse(storage.getItem(SYNC_KEY) || 'null');
    if (!meta || typeof meta.user !== 'string' || !Array.isArray(meta.base)) return null;
    return { user: meta.user, name: typeof meta.name === 'string' ? meta.name : '', base: meta.base.filter(id => typeof id === 'string'), updatedAt: Number(meta.updatedAt) || 0, syncedAt: Number(meta.syncedAt) || 0, dirty: meta.dirty === true };
  } catch { return null; }
}
export function mergeJournals(local, cloud, base = []) {
  const known = new Set(base), localIds = new Set(local.entries.map(e => e.id)), cloudById = new Map(cloud.entries.map(e => [e.id, e]));
  // Local edits win for entries on both sides; one-sided entries are kept only
  // when they are new since the last sync, not when the other side deleted them.
  const entries = [
    ...local.entries.filter(e => cloudById.has(e.id) || !known.has(e.id)),
    ...cloud.entries.filter(e => !localIds.has(e.id) && !known.has(e.id)),
  ].sort((a, b) => a.time - b.time);
  return normalizeState({ version: 2, entries, settings: local.settings });
}
// Decide what a sign-in does with the journal on this device:
// - another account synced here last: its copy lives in that account, start from ours;
// - nothing changed here since the last sync: take the account's journal;
// - otherwise merge, so nothing logged on this device is lost.
export function planSync({ local, cloud, meta, user }) {
  if (meta && meta.user !== user) return { state: cloud || normalizeState({ version: 2, entries: [], settings: local.settings }), upload: !cloud };
  if (!cloud) return { state: local, upload: true };
  if (meta && !meta.dirty) return { state: cloud, upload: false };
  const merged = mergeJournals(local, cloud, meta ? meta.base : []);
  const cloudTimes = new Map(cloud.entries.map(e => [e.id, e.time]));
  const same = merged.entries.length === cloud.entries.length && merged.entries.every(e => cloudTimes.get(e.id) === e.time) && JSON.stringify(merged.settings) === JSON.stringify(cloud.settings);
  return { state: same && meta ? cloud : merged, upload: !same || !meta };
}
export class CloudError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function cloudRequest(options) {
  let res;
  try { res = await fetch('/api/state', { credentials: 'same-origin', redirect: 'manual', ...options }); }
  catch { throw new CloudError(0, 'Offline'); }
  // An opaque redirect means the session ended and the platform wants a login.
  if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403) throw new CloudError(401, 'Signed out');
  return res;
}
export async function fetchCloudState() {
  const res = await cloudRequest({ headers: { Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new CloudError(res.status, 'Could not load cloud journal');
  const raw = await res.json();
  return { state: normalizeState(raw), updatedAt: Number(raw.updatedAt) || 0 };
}
export async function saveCloudState(state, baseUpdatedAt, keepalive = false) {
  const res = await cloudRequest({
    method: 'POST',
    keepalive,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: 2, entries: state.entries, settings: state.settings, baseUpdatedAt }),
  });
  if (!res.ok) throw new CloudError(res.status, 'Could not save to cloud');
  return Number((await res.json()).updatedAt) || 0;
}