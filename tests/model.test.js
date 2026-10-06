import test from 'node:test';
import assert from 'node:assert/strict';
import { DRINKS, DRINK_BY_ID, INGREDIENTS, RECIPES, matchRecipe, blendTotals } from '../data.js';
import { STORE_KEY, HOUR, dayKey, validTime, nextBedtime, activeAt, timeBelow, onDay, historyDays, waterBonuses, normalizeState, loadState, makeDrink, estimateHalfLife, SYNC_KEY, loadSyncMeta, mergeJournals, planSync } from '../model.js';
const at = new Date(2026, 8, 15, 12).getTime();
const coffee = (mg = 100, time = at, id = 'coffee') => ({ id, kind: 'drink', drink: 'drip', name: 'Drip coffee', mg, kcal: 5, amount: 1, time });
const water = (time, id) => ({ id, kind: 'water', time, mg: 0, kcal: 0 });
const storage = values => ({ getItem(key) { return values[key] ?? null; } });

test('full catalog and all recipes are valid and uniquely recognizable', () => {
  assert.equal(DRINKS.length, 30); assert.equal(INGREDIENTS.length, 11); assert.equal(RECIPES.length, 27);
  for (const r of RECIPES) { assert.ok(r.ing.length <= 6); assert.equal(matchRecipe([...r.ing].reverse()), r); assert.ok(blendTotals(r.ing).mg >= 0); }
});
test('decay halves, ignores future entries and water, and carries across midnight', () => {
  const entries = [coffee(), water(at, 'water'), coffee(200, at + HOUR, 'future')];
  assert.equal(activeAt(entries, at), 100);
  assert.equal(activeAt([coffee()], at + 5 * HOUR), 50);
  assert.equal(activeAt([coffee()], at + 10 * HOUR), 25);
  assert.ok(activeAt([coffee()], at + 24 * HOUR) > 0);
  assert.equal(activeAt([coffee()], at + 3 * HOUR, 3), 50);
});
test('below-threshold estimate is strictly below, including equality', () => {
  const time = timeBelow([coffee()], 50, at);
  assert.ok(activeAt([coffee()], time) < 50); assert.ok(time > at + 5 * HOUR);
  assert.equal(timeBelow([], 50, at), at);
});
test('local dates, history, and rollover retain original entries', () => {
  const late = new Date(2026, 8, 14, 23, 59).getTime();
  const entries = [coffee(100, late), coffee(75, at, 'today')];
  assert.equal(dayKey(late), '2026-09-14');
  assert.equal(onDay(entries, '2026-09-15').length, 1);
  const days = historyDays(entries, 7, at);
  assert.equal(days.length, 7); assert.equal(days[5].mg, 100); assert.equal(days[6].mg, 75);
  assert.equal(entries.length, 2);
});
test('next bedtime crosses dates correctly', () => {
  const late = new Date(2026, 8, 15, 23, 30).getTime();
  assert.equal(dayKey(nextBedtime('23:00', late)), '2026-09-16');
  assert.equal(dayKey(nextBedtime('23:00', at)), '2026-09-15');
  assert.ok(validTime('00:00')); assert.ok(validTime('23:59'));
  for (const bad of ['', '24:00', '8:00', '12:60', undefined]) assert.equal(validTime(bad), false);
});
test('scaled drinks and blends retain exact ingredient nutrition', () => {
  const latte = RECIPES.find(r => r.name === 'Latte'), totals = blendTotals(latte.ing);
  assert.deepEqual(totals, { mg: 64, kcal: 163 });
  const entry = makeDrink({ id: 'latte', name: 'Latte', ...totals }, 1.5, at);
  assert.equal(entry.mg, 96); assert.equal(entry.kcal, 245);
  assert.equal(makeDrink(DRINK_BY_ID.drip, .25, at).mg, 24);
});
test('water bonus follows chronology and is recalculated after edits/deletions', () => {
  const entries = [water(at + 2, 'w2'), coffee(), water(at + 1, 'w1'), coffee(0, at + 3, 'decaf'), water(at + 4, 'w3')];
  assert.deepEqual([...waterBonuses(entries)], ['w1']);
  assert.deepEqual([...waterBonuses(entries.filter(e => e.id !== 'w1'))], ['w2']);
  assert.deepEqual([...waterBonuses(entries.filter(e => e.id !== 'coffee'))], []);
  assert.equal(waterBonuses([coffee(100, new Date(2026, 8, 14, 23).getTime()), water(at, 'w')]).size, 0);
});
test('legacy migration keeps past dates, custom names, water and preferences', () => {
  const values = {
    'kaffe-log-v1': JSON.stringify({ date: '2026-09-14', entries: [{ ...coffee(), name: 'My old blend', mg: 192, kcal: 9 }] }),
    'kaffe-water-log-v1': JSON.stringify({ date: '2026-09-14', waters: [{ id: 'w', time: at, bonus: true }] }),
    'kaffe-theme': 'dark', 'kaffe-sound': 'off',
  };
  const result = loadState(storage(values));
  assert.equal(result.warning, ''); assert.equal(result.state.entries.length, 2);
  assert.equal(result.state.entries[0].name, 'My old blend'); assert.equal(result.state.entries[0].mg, 192);
  assert.equal(result.state.entries[1].kind, 'water'); assert.equal(result.state.settings.theme, 'dark'); assert.equal(result.state.settings.sound, false);
  assert.ok(values['kaffe-log-v1']);
});
test('v2 takes precedence over legacy data; reload does not duplicate migration', () => {
  const migrated = loadState(storage({ 'kaffe-log-v1': JSON.stringify({ entries: [coffee()] }) })).state;
  const result = loadState(storage({ [STORE_KEY]: JSON.stringify(migrated), 'kaffe-log-v1': JSON.stringify({ entries: [coffee()] }) }));
  assert.equal(result.state.entries.length, 1);
});
test('normalization rejects invalid records/settings and deduplicates IDs', () => {
  const result = normalizeState({ version: 2, entries: [coffee(), coffee(), { ...coffee(), mg: -1 }, { ...coffee(), time: 'bad' }], settings: { halfLife: 0, bedtime: '25:00', theme: 'evil', sound: true } });
  assert.equal(result.entries.length, 2); assert.notEqual(result.entries[0].id, result.entries[1].id);
  assert.equal(result.settings.halfLife, 5); assert.equal(result.settings.bedtime, '23:00'); assert.equal(result.settings.theme, 'light');
  assert.equal(result.settings.lang, 'no');
  assert.equal(normalizeState({ version: 2, entries: [], settings: { lang: 'en' } }).settings.lang, 'en');
  assert.equal(normalizeState({ version: 2, entries: [], settings: { lang: 'de' } }).settings.lang, 'no');
  assert.equal(normalizeState({ version: 2, entries: [] }).settings.sound, true);
});
test('unreadable v2 is protected and unavailable storage does not crash', () => {
  const corrupt = loadState(storage({ [STORE_KEY]: '{broken' }));
  assert.equal(corrupt.blocked, true); assert.ok(corrupt.warning);
  assert.ok(loadState({ getItem() { throw new Error('denied'); } }).warning);
});

test('half-life estimate combines factors, rounds to the slider, and flags clamping', () => {
  assert.equal(estimateHalfLife().value, 5);
  assert.equal(estimateHalfLife({ smoke: 'yes' }).value, 3);
  assert.equal(estimateHalfLife({ hormonal: 'yes' }).value, 8);
  assert.equal(estimateHalfLife({ smoke: 'yes', hormonal: 'yes' }).value, 5.5);
  assert.equal(estimateHalfLife({ pregnancy: 't1' }).value, 6.5);
  assert.equal(estimateHalfLife({ pregnancy: 't3' }).capped, 'high');
  assert.equal(estimateHalfLife({ meds: 'unsure', pregnancy: 'no' }).factors.length, 0);
});

test('caffeine effects default to heartbeat, persist all three modes, and migrate the old switch', () => {
  const pulse = settings => normalizeState({ version: 2, entries: [], settings }).settings.pulse;
  assert.equal(pulse({}), 'on');
  for (const mode of ['off', 'on', 'ultra']) assert.equal(pulse({ pulse: mode }), mode);
  assert.equal(pulse({ pulse: false }), 'off');
  assert.equal(pulse({ pulse: true }), 'on');
  assert.equal(pulse({ pulse: 'max' }), 'on');
});

test('sync merge keeps new entries from both sides and respects deletions since the last sync', () => {
  const journal = (...entries) => normalizeState({ version: 2, entries, settings: {} });
  const a = coffee(100, at, 'a'), b = coffee(80, at + HOUR, 'b'), c = coffee(60, at + 2 * HOUR, 'c'), d = coffee(40, at + 3 * HOUR, 'd');
  // Base had a and b. Locally b was deleted and c added; the account added d.
  const merged = mergeJournals(journal(a, c), journal(a, b, d), ['a', 'b']);
  assert.deepEqual(merged.entries.map(e => e.id), ['a', 'c', 'd']);
  // With no shared history (a guest journal meets an account), nothing is dropped.
  assert.deepEqual(mergeJournals(journal(c), journal(a, b), []).entries.map(e => e.id), ['a', 'b', 'c']);
  // An entry edited locally keeps the local time.
  assert.equal(mergeJournals(journal({ ...a, time: at + 5 * HOUR }), journal(a), ['a']).entries[0].time, at + 5 * HOUR);
});
test('sign-in plan never leaks one account’s journal into another or drops local entries', () => {
  const journal = (...entries) => normalizeState({ version: 2, entries, settings: {} });
  const local = journal(coffee(100, at, 'mine')), cloud = journal(coffee(90, at, 'theirs'));
  // Another account synced on this device last: start from this account's copy only.
  assert.deepEqual(planSync({ local, cloud, meta: { user: 'other', base: ['mine'], dirty: true }, user: 'me' }).state.entries.map(e => e.id), ['theirs']);
  assert.deepEqual(planSync({ local, cloud: null, meta: { user: 'other', base: [], dirty: false }, user: 'me' }).state.entries, []);
  // Guest data on first sign-in is merged and uploaded.
  const guest = planSync({ local, cloud, meta: null, user: 'me' });
  assert.equal(guest.upload, true); assert.equal(guest.state.entries.length, 2);
  // Nothing changed locally: the account's copy wins as is.
  const clean = planSync({ local, cloud, meta: { user: 'me', base: ['mine'], dirty: false }, user: 'me' });
  assert.equal(clean.state, cloud); assert.equal(clean.upload, false);
  // No account copy yet: upload this device's journal.
  assert.deepEqual(planSync({ local, cloud: null, meta: null, user: 'me' }), { state: local, upload: true });
});
test('sync metadata is read defensively', () => {
  assert.equal(loadSyncMeta(storage({ [SYNC_KEY]: '{broken' })), null);
  assert.equal(loadSyncMeta(storage({ [SYNC_KEY]: '{"user":1}' })), null);
  assert.deepEqual(loadSyncMeta(storage({ [SYNC_KEY]: JSON.stringify({ user: 'u', name: 'jf', base: ['a', 2], updatedAt: 5, dirty: true }) })), { user: 'u', name: 'jf', base: ['a'], updatedAt: 5, syncedAt: 0, dirty: true });
});
test('PDF report is a well-formed document covering every period and entry', async () => {
  const { buildReport, reportData, WIDTHS, encode } = await import('../report.js');
  assert.equal(WIDTHS.regular.length, 95); assert.equal(WIDTHS.bold.length, 95);
  assert.deepEqual(encode('æøå – ’ ★'), [230, 248, 229, 32, 150, 32, 146, 32, 63]);
  const entries = [coffee(500, at - 40 * 24 * HOUR, 'old'), coffee(100, at - 2 * 24 * HOUR, 'week'), coffee(150, at - HOUR, 'today'), water(at, 'water')];
  const data = reportData(entries, at, 5);
  assert.deepEqual([data.periods.today.total, data.periods.week.total, data.periods.month.total, data.periods.all.total], [150, 250, 250, 750]);
  assert.equal(data.periods.all.count, 41); assert.equal(data.periods.all.over, 1); assert.equal(data.periods.today.water, 1);
  assert.equal(data.pages.length, 3); assert.equal(data.pages[0].key, dayKey(at));
  const many = Array.from({ length: 400 }, (_, i) => coffee(50, at - i * 6 * HOUR, `c${i}`));
  for (const pdf of [buildReport({ entries, settings: { halfLife: 5 } }, at), buildReport({ entries: [], settings: {} }, at), buildReport({ entries: many, settings: { halfLife: 5, bedtime: '22:00' } }, at)]) {
    const text = Buffer.from(pdf).toString('latin1');
    assert.ok(text.startsWith('%PDF-1.4') && text.endsWith('%%EOF\n'));
    const xref = +text.match(/startxref\n(\d+)/)[1];
    assert.ok(text.startsWith('xref', xref));
    const offsets = [...text.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(m => +m[1]);
    offsets.forEach((offset, i) => assert.ok(text.startsWith(`${i + 1} 0 obj`, offset), `object ${i + 1} offset`));
    for (const m of text.matchAll(/<< \/Length (\d+) >>\nstream\n/g)) assert.ok(text.startsWith('\nendstream', m.index + m[0].length + +m[1]));
    assert.ok(+text.match(/\/Type \/Pages .*\/Count (\d+)/)[1] >= 2);
  }
});
