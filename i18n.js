import { DRINKS, RECIPES } from './data.js';

// Interface text in Norwegian (default) and English. Keys are shared; values
// are strings or functions of their arguments. Catalog data (drinks, recipes,
// ingredients) keeps its English names in data.js and is translated here by id.
export const LANGS = [['no', 'Norsk'], ['en', 'English']];
export const DEFAULT_LANG = 'no';
let lang = DEFAULT_LANG;
export const setLang = value => { lang = STRINGS[value] ? value : DEFAULT_LANG; };
export const getLang = () => lang;
// en-GB keeps 24-hour time and day-month dates, like Norwegian.
export const locale = () => (lang === 'no' ? 'nb-NO' : 'en-GB');
export function t(key, ...args) {
  const value = STRINGS[lang][key] ?? STRINGS.en[key];
  if (value === undefined) return key;
  return typeof value === 'function' ? value(...args) : value;
}
const half = n => ({ 0.5: '½', 1.5: '1½' })[n] || n;

const en = {
  appTitle: 'Kaffe — a little coffee journal', skipLink: 'Skip to journal', brandNote: 'a little coffee journal', home: 'Kaffe home', mainNav: 'Main navigation',
  'nav.today': 'Today', 'nav.history': 'History', 'nav.sleep': 'Sleep', 'nav.lab': 'Blend Lab',
  'title.today': ['A little ritual. A little balance.', 'Your daily brew.'], 'title.history': ['Every sip tells a story.', 'The pages so far.'],
  'title.sleep': ['Make room for a softer evening.', 'Your wind-down.'], 'title.lab': ['A dash of this. A splash of that.', 'The Blend Lab.'],
  doodle: 'Good days are made<br>one small sip at a time.',
  themeTo: dark => `Switch to ${dark ? 'dark' : 'light'} theme`, themeTitle: 'Change theme',
  soundLabel: on => `${on ? 'Disable' : 'Enable'} sounds`, soundTitle: 'Toggle sounds', soundToast: on => `Sounds ${on ? 'on' : 'off'}.`,
  settings: 'Settings', exportJournal: 'Export journal', exportBackup: 'Export backup',
  footer1: 'Made for mindful sipping, not perfect numbers.', footer2: h => `Caffeine values are estimates. ${h}h half-life model.`,
  'warn.blocked': 'Saving paused to protect unreadable data. Export your backup before resetting browser storage.',
  'warn.save': 'Could not save to this browser. Export a backup to keep your journal.',
  'warn.unreadable': 'Saved journal could not be read. Existing data is untouched. Export a backup before making changes.',
  'warn.storage': 'Browser storage is unavailable or legacy data is unreadable. Changes may not survive a reload.',
  undo: 'Undo', hourUnit: 'h',
  'fx.off': 'Off', 'fx.on': 'Heartbeat', 'fx.ultra': 'Ultra',
  'fxNote.off': 'No effects. The caffeine meter still changes colour.', 'fxNote.on': 'The screen edges pulse faster as you near 400 mg today.',
  'fxNote.ultra': 'Heartbeat, plus trembling cards, jittery mugs and glitching headlines as you near 400 mg.',
  fxStill: ' Your device asks for reduced motion, so effects stay still.',
  statDrinks: 'drinks logged', statKcal: 'from your drinks', statAvg: 'average per drink',
  todayKicker: 'TODAY’S CAFFEINE', 'badge.high': 'Over reference', 'badge.medium': 'Getting close', 'badge.low': 'Keeping track',
  'caption.empty': 'A fresh page. What’s in your cup?', 'caption.high': 'A good moment to switch to caffeine-free.', 'caption.medium': 'Maybe make the next one decaf.', 'caption.low': 'A little awareness goes a long way.',
  meterLabel: 'Daily caffeine against 400 milligram reference', meterText: n => `${n} of 400 milligrams`, meterRef: '400 mg daily reference', artCaption: 'sip, log, repeat.',
  inSystem: 'IN YOUR SYSTEM', activeLabel: 'estimated active caffeine', belowNow: 'Below 50 mg now', belowAround: time => `Below 50 mg around ${time}`, noMore: 'assuming no more caffeine', planWindDown: 'Plan your wind-down',
  usualEyebrow: 'THE USUAL SUSPECTS', usualTitle: 'What are we sipping?', allDrinks: 'All drinks', logDrink: name => `Log ${name}`,
  fadeEyebrow: 'THE SLOW FADE', fadeTitle: 'Your caffeine curve', liveEstimate: 'Live estimate', chartNote: 'Includes caffeine carried over from previous days. Dashed line: forecast with no more caffeine.',
  waterEyebrow: 'A LITTLE RESET', waterTitle: 'Water break?', glasses: n => `${n} ${n === 1 ? 'glass' : 'glasses'}`, hydration: n => `${n} hydration ${n === 1 ? 'point' : 'points'}`,
  logGlass: 'Log a glass', waterNote: '1 point per glass. +1 for the first water after caffeine. Water does not clear caffeine faster.',
  journalEyebrow: 'LITTLE MOMENTS, LOGGED', journalTitle: 'Today’s journal', addSip: 'Add a sip',
  healthNote: '400 mg/day is a general reference for many healthy adults, not a target or a personal safety limit. Pregnancy, medications, age, and individual sensitivity can mean lower limits.',
  chartLabel: n => `Estimated active caffeine across the day, currently ${n} milligrams`, now: 'now',
  emptyTitle: 'No sips on this page. Yet.', emptyText: 'Log a drink or a glass of water and make yourself at home.',
  water: 'Water', waterLine: bonus => `1 glass · ${bonus ? '2 points · post-caffeine bonus' : '1 point'}`,
  portion: (n, cat) => `${half(n)} ${['energy', 'soda'].includes(cat) ? 'can' : 'cup'}${n === 1 ? '' : 's'}`,
  editTime: (name, time) => `Edit time for ${name} at ${time}`, deleteEntry: (name, time) => `Delete ${name} at ${time}`,
  today: 'Today', yesterday: 'Yesterday', dailyAverage: 'Daily average', acrossDays: n => `across the last ${n} days`, drinksLogged: 'Drinks logged',
  plusWater: n => `plus ${n} glasses of water`, underRef: 'At or under 400 mg*', ofDays: n => `of ${n} days`, lastDays: n => `Last ${n} days`, historyRange: 'History range',
  week: 'Week', month: 'Month', barLabel: (date, mg) => `${date}: ${mg} milligrams`, historyNote: 'Tap a day to open its page. *Unlogged days count as zero. A log summary, not a health score.',
  daySummary: (drinks, mg, water) => `${drinks} ${drinks === 1 ? 'drink' : 'drinks'} · ${mg} mg · ${water} water`, journalDate: 'Journal date',
  regulars: 'Your regulars', regularsEmpty: 'Your most-logged drinks will show up here.',
  'verdict.clear': ['A clear evening.', 'Nothing in your log is still active.'], 'verdict.calm': ['A gentler landing.', 'Little of today’s caffeine should remain by bedtime.'],
  'verdict.linger': ['Give your last cup some space.', 'Some caffeine may still be noticeable at bedtime. Caffeine-free from here is a good call.'],
  bedtime: 'Bedtime', inHours: h => `in ${h} h`, atBedLabel: 'estimated caffeine still active at bedtime',
  nightChart: (from, to) => `Estimated active caffeine from now until bedtime, from ${from} to ${to} milligrams`, under50: 'under 50 mg', bedtimeLower: 'bedtime',
  activeNow: 'Active right now', under50Title: 'Under 50 mg', already: 'Already', halfLife: 'Half-life', halfLifeNote: h => `100 mg becomes 50 mg after ${h} h, 25 mg after ${h * 2} h.`,
  sleepNote: 'Assumes no more caffeine. 50 mg is a visualization threshold, not a proven “sleep-safe” level. This is a simplified estimate, not medical advice or a guarantee of sleep quality. Metabolism varies with medications, pregnancy, genetics, and other factors. Talk to a clinician about personal limits or persistent sleep problems. Bedtime and half-life are in Settings',
  strongVery: mg => `Very strong: ${mg} mg is close to the full 400 mg daily reference.`, strong: (mg, big) => `A strong one: ${mg} mg is ${big ? 'about half' : 'over a third'} of the 400 mg daily reference.`,
  customBlend: 'Your custom blend', customBlendShort: 'Custom blend',
  layerCountEmpty: max => `0 of ${max} layers · start with any ingredient`, layerFull: 'Your cup is full. Tap a layer to make room.', layerCount: (n, max) => `${n} of ${max} layers · tap a layer to remove it`,
  tagOwn: 'Your very own recipe.', tagNoRules: 'No rules. Just your very own recipe.', tagEmpty: 'Your next favorite is a few taps away.',
  layers: n => `${n} ${n === 1 ? 'layer' : 'layers'}`, showCup: (name, mg) => `Show your cup: ${name}, ${mg} milligrams`, log: 'Log', logName: name => `Log ${name}`,
  labBadge: 'A tiny café. You’re the barista.', labIntro: 'Tap or drag ingredients into your cup, in any order. Match a classic, or make it your own.',
  pantry: 'The pantry', ingredients: n => `${n} ingredients`, all: 'All', pantryNote: 'Each tap adds one recipe portion. Nutrition is estimated per ingredient, not by cup volume.',
  creation: 'YOUR LITTLE CREATION', reset: 'Reset', yourCup: 'Your cup', removeLayer: (i, name) => `Remove layer ${i}: ${name}`, cupPlaceholder: 'a little possibility<br>in an empty cup',
  brewing: 'Something good is brewing.', caffeine: 'caffeine', logBlend: 'Log this blend', surprise: 'Surprise me',
  recipeEyebrow: 'BORROW A LITTLE INSPIRATION', recipeTitle: 'The recipe book', waysToPlay: n => `${n} ways to play`,
  catalogEyebrow: 'FIND YOUR NEXT SIP', catalogTitle: 'What’s in your cup?', closePicker: 'Close drink picker', searchDrinks: 'Search drinks', searchPlaceholder: 'Search coffee, tea, energy drinks…',
  noMatch: 'No matching drinks. Try another name or category.', catalogNote: 'Estimates per serving. Actual caffeine varies by brand and preparation.',
  'q.smoke': 'Do you smoke or use nicotine?', 'q.hormonal': 'Do you use hormonal birth control?', 'q.hormonalHint': 'Pill, patch, ring or similar.', 'q.pregnancy': 'Are you pregnant?',
  'q.meds': 'Do you take a medication that slows caffeine clearance?', 'q.medsHint': 'For example fluvoxamine or ciprofloxacin.',
  no: 'No', yes: 'Yes', t1: '1st trimester', t2: '2nd', t3: '3rd', unsure: 'Not sure',
  closeSettings: 'Close settings', languageNote: 'Språk / Language', languageToast: 'Language: English.',
  bedtimeNote: 'Your forecast runs from now until this time.', effects: 'Caffeine effects', halfLifeTitle: 'Caffeine half-life', halfLifeHint: 'Time to clear about half your caffeine. Usually 3–8 h.',
  faster: '3 h · faster', defaultHl: '5 h · default', slower: '8 h · slower', estimatesOnly: 'Changes estimates only, not your intake totals.',
  estimateSummary: 'Not sure? Estimate your half-life', suggested: 'Suggested half-life',
  estimateNote: 'A rough starting point from average effects seen in studies. Your own half-life can be quite different. Not medical advice. Your answers aren’t saved.',
  startingPoint: h => `Starting point: ${h} h, a typical adult average.`, factor: (label, effect, x) => `${label}: ${effect}, about ×${x}.`,
  cappedHigh: 'Your answers point past 8 h, the longest this app models, so 8 h is used.', cappedLow: 'Your answers point below 3 h, the shortest this app models, so 3 h is used.',
  pharmacist: 'A pharmacist can tell you whether your medications affect caffeine.', alreadySet: h => `Your setting is already ${h} h`, useHl: h => `Use ${h} h`,
  'hlf.smoke.yes': 'Smoking or nicotine', 'hlf.hormonal.yes': 'Hormonal birth control', 'hlf.pregnancy.t1': 'Pregnancy, 1st trimester', 'hlf.pregnancy.t2': 'Pregnancy, 2nd trimester',
  'hlf.pregnancy.t3': 'Pregnancy, 3rd trimester', 'hlf.meds.yes': 'A medication that slows caffeine clearance', 'eff.faster': 'faster', 'eff.slower': 'slower', 'eff.much slower': 'much slower',
  makeEyebrow: 'MAKE IT YOURS', closeAmount: 'Close amount picker', per: s => `per ${s}`, howMuch: 'HOW MUCH?', date: 'Date', time: 'Time', addToJournal: 'Add to my journal', backToAll: 'Back to all drinks',
  editEyebrow: 'A LITTLE CORRECTION', editTitle: name => `Edit ${name}`, closeEditor: 'Close time editor', saveChanges: 'Save changes',
  invalidTime: 'Please choose a valid date and time.', futureTime: 'Please log a time that has already happened.',
  backupDownloaded: 'Journal backup downloaded.', reportDownloaded: 'Caffeine report downloaded.', reportFrom: name => `Report made from ${name}.`, notBackup: 'That file does not look like a Kaffe journal backup.',
  justNow: 'just now', minAgo: n => `${n} min ago`, synced: ago => `Synced ${ago}`,
  'sync.local': 'Saved on this device', 'sync.checking': 'Connecting…', 'sync.syncing': 'Syncing…', 'sync.offline': 'Offline · will sync later', 'sync.expired': 'Session ended · sign in again', 'sync.error': 'Couldn’t sync right now',
  syncJournal: 'Sync your journal', signInBackup: 'Sign in to back it up', signInSync: 'Sign in to sync your journal', accountLabel: (name, text) => `Account ${name}: ${text}`,
  closeAccount: 'Close account', yourAccount: 'YOUR ACCOUNT', everywhere: 'Your journal, everywhere.', signedInGithub: 'Signed in with GitHub', syncNow: 'Sync now',
  entryCount: n => `${n} ${n === 1 ? 'entry' : 'entries'} in your journal, on this device and in your account.`,
  notBackedUp: 'Your latest changes couldn’t be backed up, so they’re still only on this device.', signOutAnyway: 'Sign out anyway', signOut: 'Sign out',
  signOutNote: 'Signing out clears the journal from this device. It stays safe in your account for next time.',
  perks: [['Backed up as you go', 'Each sip is saved to your account a moment after you log it.'], ['On your phone and laptop', 'Sign in anywhere and pick up where you left off.'], ['Still works offline', 'Log without a connection. It catches up when you’re back.']],
  welcomeBack: 'WELCOME BACK', everywhereCaps: 'YOUR JOURNAL, EVERYWHERE', signInKeep: 'Sign in to keep syncing.', keepSafe: 'Keep every sip safe.',
  expiredLead: 'Your session ended. Anything you log now stays on this device and syncs as soon as you’re signed in again.',
  mergeNote: n => `The ${n} ${n === 1 ? 'entry' : 'entries'} on this device will be added to your account.`, signInAgain: 'Sign in again with GitHub', continueGithub: 'Continue with GitHub',
  githubNote: 'Your journal is stored under your GitHub account ID, and Kaffe shows your username. Nothing is posted to GitHub.', ratherNot: 'Rather not? Everything keeps working on this device.',
  signedInAs: name => `Signed in as ${name}. Your journal is backed up.`,
  exportEyebrow: 'TAKE IT WITH YOU', exportTitle: 'Export your journal', closeExport: 'Close export', pdfTitle: 'Caffeine report (PDF)', pdfText: 'Today, this week, this month and all time, with charts and every sip.',
  jsonTitle: 'Journal backup (JSON)', jsonText: 'Every entry and setting, for safekeeping.', backupFile: 'Have a backup file? Turn it into a report.', madeHere: 'Made on this device. Nothing is uploaded.',
  hlSet: h => `Half-life set to ${h} h.`, waterBonus: 'Water logged. +2 hydration points!', waterLogged: 'Water logged. A little reset.', removed: name => `${name} removed.`, restored: 'Sip restored.',
  loaded: name => `${name} loaded into your cup.`, meet: name => `Meet your ${name}.`, effectsToast: label => `Caffeine effects: ${label}.`,
  logged: (name, mg, portion) => `${name} logged. ${mg} mg · ${portion}, noted.`, timeUpdated: 'Journal time updated.', otherTab: 'Journal updated from another tab.', offlineSetup: 'Offline setup unavailable. The journal still works online.',
  // PDF report
  'r.today': 'Today', 'r.week': 'Last 7 days', 'r.month': 'Last 30 days', 'r.all': 'All time', 'r.reference': n => `${n} mg reference`, 'r.perDay': mg => `${mg} per day`,
  'r.drinks': n => `${n.toLocaleString()} ${n === 1 ? 'drink' : 'drinks'}`, 'r.water': n => `${n.toLocaleString()} water`, 'r.days': n => `${n.toLocaleString()} ${n === 1 ? 'day' : 'days'}`,
  'r.entries': n => `${n.toLocaleString()} ${n === 1 ? 'entry' : 'entries'}`, 'r.glasses': n => `${n.toLocaleString()} ${n === 1 ? 'glass' : 'glasses'}`,
  'r.overRef': 'Over the 400 mg reference', 'r.underRef': mg => `${mg} under reference`, 'r.daysOver': (days, n) => `${days} over ${n} mg`,
  'r.report': 'CAFFEINE REPORT', 'r.generated': (time, entries) => `Generated at ${time} · ${entries} in this journal`, 'r.glanceEyebrow': 'TODAY · WEEK · MONTH · ALL TIME', 'r.glance': 'Your caffeine, at a glance',
  'r.stillActive': mg => `${mg} still active now`, 'r.last30': 'THE LAST 30 DAYS', 'r.birdseye': 'A bird’s-eye brew',
  'r.monthNote': (avg, peak) => `Average ${avg} a day · peak ${peak} · unlogged days count as zero.`, 'r.peakOn': (mg, date) => `${mg} on ${date}`, 'r.none': 'none yet',
  'r.weekTitle': 'THIS WEEK, DAY BY DAY', 'r.cups': 'WHAT’S IN YOUR CUPS · ALL TIME', 'r.colDrinks': 'drinks', 'r.colWater': 'water', 'r.colCaffeine': 'caffeine', 'r.total': 'Total',
  'r.noCaffeine': 'No caffeine logged yet.', 'r.regulars': 'THE REGULARS', 'r.regularsEmpty': 'Your most-logged drinks will find a home here.',
  'r.since': date => `ALL TIME · SINCE ${date}`, 'r.longView': 'The long view', 'r.totalCaffeine': 'Total caffeine', 'r.logged': s => `${s} logged`, 'r.dailyAvg': 'Daily average', 'r.over': s => `over ${s}`,
  'r.highest': 'Highest day', 'r.nothing': 'nothing logged yet', 'r.withEntries': 'Days with entries', 'r.of': s => `of ${s}`, 'r.overTheRef': 'Over the reference', 'r.above': n => `above ${n} mg`,
  'r.waterTile': 'Water', 'r.kcal': n => `${n} kcal from drinks`, 'r.monthly24': 'MONTH BY MONTH · LAST 24 MONTHS', 'r.monthly': 'MONTH BY MONTH', 'r.avgPerMonth': 'Average per day, each month',
  'r.lands': 'WHEN THE CAFFEINE LANDS', 'r.byHour': 'Caffeine by time of day', 'r.bedtime': time => `bedtime ${time}`,
  'r.late': (pct, time, h) => `${pct}% of your logged caffeine came after ${time}. With a ${h} h half-life, half of any cup is still active ${h} hours later.`,
  'r.lateEmpty': 'Once you log a few sips, this shows when in the day your caffeine lands.', 'r.continued': 'The daily pages, continued', 'r.everySip': 'EVERY SIP, LOGGED', 'r.dailyPages': 'The daily pages',
  'r.noSips': 'No sips in this journal. Yet.', 'r.overReference': 'over reference', 'r.dayContinued': date => `${date}, continued`,
  'r.footer': h => `Caffeine values are catalog estimates; active caffeine uses a ${h} h half-life model. 400 mg/day is a general reference for many healthy adults, not a target or a personal safety limit. Not medical advice.`,
  'r.title': day => `Kaffe caffeine report · ${day}`, 'r.file': 'kaffe-report',
};

const no = {
  appTitle: 'Kaffe — en liten kaffedagbok', skipLink: 'Hopp til dagboken', brandNote: 'en liten kaffedagbok', home: 'Kaffe, forsiden', mainNav: 'Hovedmeny',
  'nav.today': 'I dag', 'nav.history': 'Historikk', 'nav.sleep': 'Søvn', 'nav.lab': 'Blandelabben',
  'title.today': ['Et lite ritual. Litt balanse.', 'Dagens brygg.'], 'title.history': ['Hver slurk forteller noe.', 'Sidene så langt.'],
  'title.sleep': ['Gi plass til en roligere kveld.', 'Nedtrapping til natten.'], 'title.lab': ['Litt av dette. En skvett av det.', 'Blandelabben.'],
  doodle: 'Gode dager lages<br>én liten slurk om gangen.',
  themeTo: dark => `Bytt til ${dark ? 'mørkt' : 'lyst'} tema`, themeTitle: 'Bytt tema',
  soundLabel: on => `${on ? 'Slå av' : 'Slå på'} lyder`, soundTitle: 'Lyder av/på', soundToast: on => `Lyder ${on ? 'på' : 'av'}.`,
  settings: 'Innstillinger', exportJournal: 'Eksporter dagboken', exportBackup: 'Eksporter sikkerhetskopi',
  footer1: 'Laget for bevisst nytelse, ikke perfekte tall.', footer2: h => `Koffeinverdiene er anslag. Modell med ${String(h).replace('.', ',')} t halveringstid.`,
  'warn.blocked': 'Lagring er satt på pause for å beskytte data som ikke kunne leses. Eksporter sikkerhetskopien før du tømmer nettleserlagringen.',
  'warn.save': 'Kunne ikke lagre i denne nettleseren. Eksporter en sikkerhetskopi for å beholde dagboken.',
  'warn.unreadable': 'Den lagrede dagboken kunne ikke leses. Eksisterende data er urørt. Eksporter en sikkerhetskopi før du gjør endringer.',
  'warn.storage': 'Nettleserlagring er utilgjengelig, eller eldre data kunne ikke leses. Endringer blir kanskje ikke med etter en ny innlasting.',
  undo: 'Angre', hourUnit: 't',
  'fx.off': 'Av', 'fx.on': 'Hjerteslag', 'fx.ultra': 'Ultra',
  'fxNote.off': 'Ingen effekter. Koffeinmåleren skifter fortsatt farge.', 'fxNote.on': 'Skjermkantene pulserer raskere jo nærmere du kommer 400 mg i dag.',
  'fxNote.ultra': 'Hjerteslag, pluss skjelvende kort, nervøse krus og glitchende overskrifter når du nærmer deg 400 mg.',
  fxStill: ' Enheten din ber om redusert bevegelse, så effektene står stille.',
  statDrinks: 'drikker logget', statKcal: 'fra drikkene dine', statAvg: 'snitt per drikk',
  todayKicker: 'DAGENS KOFFEIN', 'badge.high': 'Over referansen', 'badge.medium': 'Nærmer seg', 'badge.low': 'Holder oversikt',
  'caption.empty': 'En blank side. Hva er i koppen din?', 'caption.high': 'Et godt tidspunkt å bytte til koffeinfritt.', 'caption.medium': 'Kanskje den neste kan være koffeinfri.', 'caption.low': 'Litt bevissthet kommer langt.',
  meterLabel: 'Dagens koffein mot referansen på 400 milligram', meterText: n => `${n} av 400 milligram`, meterRef: '400 mg daglig referanse', artCaption: 'slurk, logg, gjenta.',
  inSystem: 'I KROPPEN NÅ', activeLabel: 'anslått aktiv koffein', belowNow: 'Under 50 mg nå', belowAround: time => `Under 50 mg rundt ${time}`, noMore: 'forutsatt at du ikke drikker mer koffein', planWindDown: 'Planlegg kvelden',
  usualEyebrow: 'DE VANLIGE MISTENKTE', usualTitle: 'Hva skal vi drikke?', allDrinks: 'Alle drikker', logDrink: name => `Logg ${name}`,
  fadeEyebrow: 'DEN LANGSOMME NEDGANGEN', fadeTitle: 'Koffeinkurven din', liveEstimate: 'Anslag i sanntid', chartNote: 'Inkluderer koffein som henger igjen fra tidligere dager. Stiplet linje: prognose uten mer koffein.',
  waterEyebrow: 'EN LITEN PAUSE', waterTitle: 'Vannpause?', glasses: n => `${n} glass`, hydration: n => `${n} vannpoeng`,
  logGlass: 'Logg et glass', waterNote: '1 poeng per glass. +1 for første vann etter koffein. Vann fjerner ikke koffein raskere.',
  journalEyebrow: 'SMÅ ØYEBLIKK, LOGGET', journalTitle: 'Dagens dagbok', addSip: 'Legg til en slurk',
  healthNote: '400 mg/dag er en generell referanse for mange friske voksne, ikke et mål eller en personlig sikkerhetsgrense. Graviditet, medisiner, alder og individuell følsomhet kan gi lavere grenser.',
  chartLabel: n => `Anslått aktiv koffein gjennom dagen, nå ${n} milligram`, now: 'nå',
  emptyTitle: 'Ingen slurker på denne siden. Ennå.', emptyText: 'Logg en drikk eller et glass vann og kjenn deg hjemme.',
  water: 'Vann', waterLine: bonus => `1 glass · ${bonus ? '2 poeng · bonus etter koffein' : '1 poeng'}`,
  portion: (n, cat) => { const can = ['energy', 'soda'].includes(cat); return `${half(n)} ${can ? (n > 1 ? 'bokser' : 'boks') : (n > 1 ? 'kopper' : 'kopp')}`; },
  editTime: (name, time) => `Endre tid for ${name} kl. ${time}`, deleteEntry: (name, time) => `Slett ${name} kl. ${time}`,
  today: 'I dag', yesterday: 'I går', dailyAverage: 'Daglig snitt', acrossDays: n => `de siste ${n} dagene`, drinksLogged: 'Drikker logget',
  plusWater: n => `pluss ${n} glass vann`, underRef: 'På eller under 400 mg*', ofDays: n => `av ${n} dager`, lastDays: n => `Siste ${n} dager`, historyRange: 'Tidsrom',
  week: 'Uke', month: 'Måned', barLabel: (date, mg) => `${date}: ${mg} milligram`, historyNote: 'Trykk på en dag for å åpne siden. *Dager uten logg teller som null. Et loggsammendrag, ikke en helsescore.',
  daySummary: (drinks, mg, water) => `${drinks} ${drinks === 1 ? 'drikk' : 'drikker'} · ${mg} mg · ${water} vann`, journalDate: 'Dato i dagboken',
  regulars: 'Faste favoritter', regularsEmpty: 'Drikkene du logger oftest dukker opp her.',
  'verdict.clear': ['En klar kveld.', 'Ingenting i loggen din er fortsatt aktivt.'], 'verdict.calm': ['En mykere landing.', 'Lite av dagens koffein bør være igjen ved leggetid.'],
  'verdict.linger': ['Gi den siste koppen litt avstand.', 'Noe koffein kan fortsatt merkes ved leggetid. Koffeinfritt herfra er et godt valg.'],
  bedtime: 'Leggetid', inHours: h => `om ${String(h).replace('.', ',')} t`, atBedLabel: 'anslått koffein som fortsatt er aktiv ved leggetid',
  nightChart: (from, to) => `Anslått aktiv koffein fra nå til leggetid, fra ${from} til ${to} milligram`, under50: 'under 50 mg', bedtimeLower: 'leggetid',
  activeNow: 'Aktiv akkurat nå', under50Title: 'Under 50 mg', already: 'Allerede', halfLife: 'Halveringstid', halfLifeNote: h => `100 mg blir 50 mg etter ${h} t, og 25 mg etter ${h * 2} t.`,
  sleepNote: 'Forutsetter at du ikke drikker mer koffein. 50 mg er en terskel for visualisering, ikke et bevist «søvntrygt» nivå. Dette er et forenklet anslag, ikke medisinske råd eller en garanti for god søvn. Forbrenningen varierer med medisiner, graviditet, gener og andre faktorer. Snakk med helsepersonell om personlige grenser eller vedvarende søvnproblemer. Leggetid og halveringstid finner du i Innstillinger',
  strongVery: mg => `Veldig sterk: ${mg} mg er nær hele den daglige referansen på 400 mg.`, strong: (mg, big) => `En sterk en: ${mg} mg er ${big ? 'omtrent halvparten' : 'over en tredjedel'} av den daglige referansen på 400 mg.`,
  customBlend: 'Din egen blanding', customBlendShort: 'Egen blanding',
  layerCountEmpty: max => `0 av ${max} lag · start med hvilken som helst ingrediens`, layerFull: 'Koppen er full. Trykk på et lag for å gjøre plass.', layerCount: (n, max) => `${n} av ${max} lag · trykk på et lag for å fjerne det`,
  tagOwn: 'Din helt egen oppskrift.', tagNoRules: 'Ingen regler. Bare din helt egen oppskrift.', tagEmpty: 'Din neste favoritt er noen få trykk unna.',
  layers: n => `${n} lag`, showCup: (name, mg) => `Vis koppen: ${name}, ${mg} milligram`, log: 'Logg', logName: name => `Logg ${name}`,
  labBadge: 'En bitte liten kafé. Du er baristaen.', labIntro: 'Trykk eller dra ingredienser inn i koppen, i hvilken som helst rekkefølge. Treff en klassiker, eller lag din egen.',
  pantry: 'Spiskammeret', ingredients: n => `${n} ingredienser`, all: 'Alle', pantryNote: 'Hvert trykk legger til én porsjon. Næringsinnholdet anslås per ingrediens, ikke etter koppens volum.',
  creation: 'DIN LILLE KREASJON', reset: 'Nullstill', yourCup: 'Koppen din', removeLayer: (i, name) => `Fjern lag ${i}: ${name}`, cupPlaceholder: 'en liten mulighet<br>i en tom kopp',
  brewing: 'Noe godt er på gang.', caffeine: 'koffein', logBlend: 'Logg denne blandingen', surprise: 'Overrask meg',
  recipeEyebrow: 'LÅN LITT INSPIRASJON', recipeTitle: 'Oppskriftsboken', waysToPlay: n => `${n} måter å leke på`,
  catalogEyebrow: 'FINN NESTE SLURK', catalogTitle: 'Hva er i koppen din?', closePicker: 'Lukk drikkevelgeren', searchDrinks: 'Søk etter drikke', searchPlaceholder: 'Søk etter kaffe, te, energidrikk…',
  noMatch: 'Ingen drikker passet. Prøv et annet navn eller en annen kategori.', catalogNote: 'Anslag per porsjon. Faktisk koffein varierer med merke og tilberedning.',
  'q.smoke': 'Røyker du eller bruker nikotin?', 'q.hormonal': 'Bruker du hormonell prevensjon?', 'q.hormonalHint': 'P-piller, plaster, ring eller lignende.', 'q.pregnancy': 'Er du gravid?',
  'q.meds': 'Bruker du en medisin som bremser utskillelsen av koffein?', 'q.medsHint': 'For eksempel fluvoksamin eller ciprofloksacin.',
  no: 'Nei', yes: 'Ja', t1: '1. trimester', t2: '2.', t3: '3.', unsure: 'Usikker',
  closeSettings: 'Lukk innstillinger', languageNote: 'Språk / Language', languageToast: 'Språk: norsk.',
  bedtimeNote: 'Prognosen går fra nå og frem til dette tidspunktet.', effects: 'Koffeineffekter', halfLifeTitle: 'Halveringstid for koffein', halfLifeHint: 'Tiden det tar å bli kvitt omtrent halvparten av koffeinen. Vanligvis 3–8 t.',
  faster: '3 t · raskere', defaultHl: '5 t · standard', slower: '8 t · tregere', estimatesOnly: 'Endrer bare anslagene, ikke det du har logget.',
  estimateSummary: 'Usikker? Anslå halveringstiden din', suggested: 'Foreslått halveringstid',
  estimateNote: 'Et grovt utgangspunkt basert på gjennomsnittlige effekter i studier. Din egen halveringstid kan være ganske annerledes. Ikke medisinske råd. Svarene dine lagres ikke.',
  startingPoint: h => `Utgangspunkt: ${h} t, et typisk snitt for voksne.`, factor: (label, effect, x) => `${label}: ${effect}, omtrent ×${x}.`,
  cappedHigh: 'Svarene dine peker mot mer enn 8 t, det lengste appen regner med, så 8 t brukes.', cappedLow: 'Svarene dine peker mot under 3 t, det korteste appen regner med, så 3 t brukes.',
  pharmacist: 'Apoteket kan fortelle deg om medisinene dine påvirker koffein.', alreadySet: h => `Innstillingen er allerede ${h} t`, useHl: h => `Bruk ${h} t`,
  'hlf.smoke.yes': 'Røyking eller nikotin', 'hlf.hormonal.yes': 'Hormonell prevensjon', 'hlf.pregnancy.t1': 'Graviditet, 1. trimester', 'hlf.pregnancy.t2': 'Graviditet, 2. trimester',
  'hlf.pregnancy.t3': 'Graviditet, 3. trimester', 'hlf.meds.yes': 'En medisin som bremser utskillelsen av koffein', 'eff.faster': 'raskere', 'eff.slower': 'tregere', 'eff.much slower': 'mye tregere',
  makeEyebrow: 'GJØR DEN TIL DIN', closeAmount: 'Lukk mengdevelgeren', per: s => `per ${s}`, howMuch: 'HVOR MYE?', date: 'Dato', time: 'Tid', addToJournal: 'Legg til i dagboken', backToAll: 'Tilbake til alle drikker',
  editEyebrow: 'EN LITEN RETTELSE', editTitle: name => `Endre ${name}`, closeEditor: 'Lukk tidsredigering', saveChanges: 'Lagre endringer',
  invalidTime: 'Velg en gyldig dato og tid.', futureTime: 'Logg et tidspunkt som allerede har vært.',
  backupDownloaded: 'Sikkerhetskopien er lastet ned.', reportDownloaded: 'Koffeinrapporten er lastet ned.', reportFrom: name => `Rapport laget fra ${name}.`, notBackup: 'Den filen ser ikke ut som en sikkerhetskopi fra Kaffe.',
  justNow: 'akkurat nå', minAgo: n => `for ${n} min siden`, synced: ago => `Synkronisert ${ago}`,
  'sync.local': 'Lagret på denne enheten', 'sync.checking': 'Kobler til…', 'sync.syncing': 'Synkroniserer…', 'sync.offline': 'Frakoblet · synkroniserer senere', 'sync.expired': 'Økten er avsluttet · logg inn igjen', 'sync.error': 'Kunne ikke synkronisere akkurat nå',
  syncJournal: 'Synkroniser dagboken', signInBackup: 'Logg inn for å ta sikkerhetskopi', signInSync: 'Logg inn for å synkronisere dagboken', accountLabel: (name, text) => `Konto ${name}: ${text}`,
  closeAccount: 'Lukk konto', yourAccount: 'KONTOEN DIN', everywhere: 'Dagboken din, overalt.', signedInGithub: 'Logget inn med GitHub', syncNow: 'Synkroniser nå',
  entryCount: n => `${n} ${n === 1 ? 'oppføring' : 'oppføringer'} i dagboken, på denne enheten og i kontoen din.`,
  notBackedUp: 'De siste endringene dine kunne ikke sikkerhetskopieres, så de finnes fortsatt bare på denne enheten.', signOutAnyway: 'Logg ut likevel', signOut: 'Logg ut',
  signOutNote: 'Når du logger ut, fjernes dagboken fra denne enheten. Den ligger trygt i kontoen din til neste gang.',
  perks: [['Sikkerhetskopiert underveis', 'Hver slurk lagres i kontoen din et øyeblikk etter at du logger den.'], ['På mobilen og PC-en', 'Logg inn hvor som helst og fortsett der du slapp.'], ['Virker fortsatt uten nett', 'Logg uten tilkobling. Den tar igjen når du er på nett igjen.']],
  welcomeBack: 'VELKOMMEN TILBAKE', everywhereCaps: 'DAGBOKEN DIN, OVERALT', signInKeep: 'Logg inn for å fortsette synkroniseringen.', keepSafe: 'Ta vare på hver slurk.',
  expiredLead: 'Økten din er avsluttet. Alt du logger nå blir på denne enheten og synkroniseres så snart du er logget inn igjen.',
  mergeNote: n => `${n === 1 ? 'Den ene oppføringen' : `De ${n} oppføringene`} på denne enheten legges til i kontoen din.`, signInAgain: 'Logg inn igjen med GitHub', continueGithub: 'Fortsett med GitHub',
  githubNote: 'Dagboken lagres under GitHub-konto-ID-en din, og Kaffe viser brukernavnet ditt. Ingenting publiseres på GitHub.', ratherNot: 'Vil du heller la være? Alt fungerer fortsatt på denne enheten.',
  signedInAs: name => `Logget inn som ${name}. Dagboken er sikkerhetskopiert.`,
  exportEyebrow: 'TA DEN MED DEG', exportTitle: 'Eksporter dagboken', closeExport: 'Lukk eksport', pdfTitle: 'Koffeinrapport (PDF)', pdfText: 'I dag, denne uken, denne måneden og totalt, med diagrammer og hver eneste slurk.',
  jsonTitle: 'Sikkerhetskopi (JSON)', jsonText: 'Alle oppføringer og innstillinger, for sikker oppbevaring.', backupFile: 'Har du en sikkerhetskopi? Gjør den om til en rapport.', madeHere: 'Lages på denne enheten. Ingenting lastes opp.',
  hlSet: h => `Halveringstid satt til ${h} t.`, waterBonus: 'Vann logget. +2 vannpoeng!', waterLogged: 'Vann logget. En liten pause.', removed: name => `${name} fjernet.`, restored: 'Slurken er tilbake.',
  loaded: name => `${name} er lagt i koppen.`, meet: name => `Møt din ${name}.`, effectsToast: label => `Koffeineffekter: ${label}.`,
  logged: (name, mg, portion) => `${name} logget. ${mg} mg · ${portion}, notert.`, timeUpdated: 'Tiden i dagboken er oppdatert.', otherTab: 'Dagboken ble oppdatert fra en annen fane.', offlineSetup: 'Frakoblet modus er ikke tilgjengelig. Dagboken fungerer fortsatt på nett.',
  'r.today': 'I dag', 'r.week': 'Siste 7 dager', 'r.month': 'Siste 30 dager', 'r.all': 'Totalt', 'r.reference': n => `${n} mg referanse`, 'r.perDay': mg => `${mg} per dag`,
  'r.drinks': n => `${n.toLocaleString('nb-NO')} ${n === 1 ? 'drikk' : 'drikker'}`, 'r.water': n => `${n.toLocaleString('nb-NO')} vann`, 'r.days': n => `${n.toLocaleString('nb-NO')} ${n === 1 ? 'dag' : 'dager'}`,
  'r.entries': n => `${n.toLocaleString('nb-NO')} ${n === 1 ? 'oppføring' : 'oppføringer'}`, 'r.glasses': n => `${n.toLocaleString('nb-NO')} glass`,
  'r.overRef': 'Over referansen på 400 mg', 'r.underRef': mg => `${mg} under referansen`, 'r.daysOver': (days, n) => `${days} over ${n} mg`,
  'r.report': 'KOFFEINRAPPORT', 'r.generated': (time, entries) => `Laget kl. ${time} · ${entries} i dagboken`, 'r.glanceEyebrow': 'I DAG · UKE · MÅNED · TOTALT', 'r.glance': 'Koffeinen din, med ett blikk',
  'r.stillActive': mg => `${mg} fortsatt aktivt nå`, 'r.last30': 'DE SISTE 30 DAGENE', 'r.birdseye': 'Brygget i fugleperspektiv',
  'r.monthNote': (avg, peak) => `Snitt ${avg} per dag · topp ${peak} · dager uten logg teller som null.`, 'r.peakOn': (mg, date) => `${mg} ${date}`, 'r.none': 'ingen ennå',
  'r.weekTitle': 'DENNE UKEN, DAG FOR DAG', 'r.cups': 'HVA SOM ER I KOPPENE · TOTALT', 'r.colDrinks': 'drikker', 'r.colWater': 'vann', 'r.colCaffeine': 'koffein', 'r.total': 'Totalt',
  'r.noCaffeine': 'Ingen koffein logget ennå.', 'r.regulars': 'FASTE FAVORITTER', 'r.regularsEmpty': 'Drikkene du logger oftest får plass her.',
  'r.since': date => `TOTALT · SIDEN ${date}`, 'r.longView': 'Det lange perspektivet', 'r.totalCaffeine': 'Total koffein', 'r.logged': s => `${s} logget`, 'r.dailyAvg': 'Daglig snitt', 'r.over': s => `over ${s}`,
  'r.highest': 'Høyeste dag', 'r.nothing': 'ingenting logget ennå', 'r.withEntries': 'Dager med logg', 'r.of': s => `av ${s}`, 'r.overTheRef': 'Over referansen', 'r.above': n => `over ${n} mg`,
  'r.waterTile': 'Vann', 'r.kcal': n => `${n} kcal fra drikker`, 'r.monthly24': 'MÅNED FOR MÅNED · SISTE 24 MÅNEDER', 'r.monthly': 'MÅNED FOR MÅNED', 'r.avgPerMonth': 'Snitt per dag, hver måned',
  'r.lands': 'NÅR KOFFEINEN KOMMER', 'r.byHour': 'Koffein etter tid på døgnet', 'r.bedtime': time => `leggetid ${time}`,
  'r.late': (pct, time, h) => `${pct} % av koffeinen du har logget kom etter kl. ${time}. Med ${h} t halveringstid er halvparten av hver kopp fortsatt aktiv ${h} timer senere.`,
  'r.lateEmpty': 'Når du har logget noen slurker, viser dette når på dagen koffeinen kommer.', 'r.continued': 'Dagbokssidene, fortsatt', 'r.everySip': 'HVER SLURK, LOGGET', 'r.dailyPages': 'Dagbokssidene',
  'r.noSips': 'Ingen slurker i denne dagboken. Ennå.', 'r.overReference': 'over referansen', 'r.dayContinued': date => `${date}, fortsatt`,
  'r.footer': h => `Koffeinverdiene er anslag fra katalogen; aktiv koffein bruker en modell med ${h} t halveringstid. 400 mg/dag er en generell referanse for mange friske voksne, ikke et mål eller en personlig sikkerhetsgrense. Ikke medisinske råd.`,
  'r.title': day => `Kaffe koffeinrapport · ${day}`, 'r.file': 'kaffe-rapport',
};

// Norwegian catalog names, keyed like data.js. Anything missing keeps its English name.
const NO_DRINKS = {
  'dbl-espresso': 'Dobbel espresso', drip: 'Traktekaffe', mocha: 'Mokka', decaf: 'Koffeinfri kaffe', 'green-tea': 'Grønn te', 'black-tea': 'Svart te',
  'rb-sugarfree': 'Red Bull sukkerfri', preworkout: 'Pre-workout (1 skje)', 'caf-pill': 'Koffeintablett 200', 'caf-pill-100': 'Koffeintablett 100',
  'dark-choc': 'Mørk sjokolade', 'mocha-icecream': 'Kaffeis', espresso: 'Espressoshot',
};
const NO_SERVINGS = { '1 scoop': '1 skje', '1 tablet': '1 tablett', '1 blend': '1 blanding' };
const NO_CATEGORIES = { all: 'Alt', coffee: 'Kaffe', tea: 'Te', energy: 'Energi', soda: 'Brus', supp: 'Kosttilskudd', sweets: 'Søtt' };
const NO_INGREDIENTS = { 'hot-water': 'Varmt vann', 'cold-water': 'Kaldt vann', 'steamed-milk': 'Dampet melk', 'milk-foam': 'Melkeskum', 'cold-milk': 'Kald melk', ice: 'Is', chocolate: 'Sjokolade', vanilla: 'Vanilje', whipped: 'Krem' };
const NO_INGREDIENT_CATS = { All: 'Alle', Coffee: 'Kaffe', Milk: 'Melk', Extra: 'Ekstra', Syrup: 'Sirup', Tea: 'Te' };
const NO_RECIPES = {
  'Espresso': ['Espresso', 'Ren shot. Ingen dikkedarer.'], 'Double Espresso': ['Dobbel espresso', 'Dobbelt så mye karakter.'], 'Americano': ['Americano', 'Litt mer rom til å bli sittende.'],
  'Iced Americano': ['Iskald americano', 'Espresso on the rocks.'], 'Cappuccino': ['Cappuccino', 'Kaffe, melk og en luftig hatt.'], 'Latte': ['Latte', 'En melkeaktig klem i et krus.'],
  'Flat White': ['Flat white', 'Dobbel shot, fløyelsmyk avslutning.'], 'Mocha': ['Mokka', 'Der kaffe møter dessert.'], 'Iced Latte': ['Iskald latte', 'Kjølig, kremet, klassisk.'],
  'Vanilla Latte': ['Vaniljelatte', 'En søt liten vri.'], 'Mocha Deluxe': ['Mokka deluxe', 'Den med en sky på toppen.'], 'Matcha Latte': ['Matcha latte', 'En grønnere ettermiddag.'],
  'Matcha Tea': ['Matcha-te', 'Grønt og enkelt.'], 'Cold-Brew Style': ['Cold brew-stil', 'En iskald espressovariant, ikke ekte cold brew.'], 'Iced Double Latte': ['Iskald dobbel latte', 'Stor avkjøling, dobbel shot.'],
  'Macchiato': ['Macchiato', 'Bare et lite merke av skum.'], 'Cortado': ['Cortado', 'Liten kopp, balansert karakter.'], 'Triple Shot': ['Trippel shot', 'Tre shots, én liten kopp.'],
  'Wet Cappuccino': ['Våt cappuccino', 'Cappuccino, litt mer melk.'], 'Vanilla Cappuccino': ['Vaniljecappuccino', 'En søt hvisking under skummet.'], 'Vanilla Americano': ['Vaniljeamericano', 'En klassiker, pyntet opp.'],
  'Iced Mocha': ['Iskald mokka', 'Sjokolade med en kjølig side.'], 'Iced Matcha': ['Iskald matcha', 'Grønn, kald og kremet.'], 'Vanilla Matcha': ['Vaniljematcha', 'Jordaktig møter søtt.'],
  'Mocha Whip': ['Mokka med krem', 'Espresso, sjokolade, sky.'], 'Espresso Con Panna': ['Espresso con panna', 'En shot med en klatt krem.'], 'Mocha Macchiato': ['Mokka macchiato', 'En liten sjokoladeflukt.'],
};
const STRINGS = { en, no };

const pick = (map, key, fallback) => (lang === 'no' && map[key]) || fallback;
export const drinkName = d => pick(NO_DRINKS, d.id, d.name);
export const servingName = s => pick(NO_SERVINGS, s, s);
export const categoryName = (id, fallback) => pick(NO_CATEGORIES, id, fallback);
export const ingredientName = i => pick(NO_INGREDIENTS, i.id, i.name);
export const ingredientCategory = cat => pick(NO_INGREDIENT_CATS, cat, cat);
export const recipeName = r => (lang === 'no' && NO_RECIPES[r.name]?.[0]) || r.name;
export const recipeTagline = r => (lang === 'no' && NO_RECIPES[r.name]?.[1]) || r.tagline;

// Entries keep the name they were logged with. Known catalog, recipe and blend
// names show in the current language; anything else is shown as written.
const entryNames = new Map();
{
  for (const d of DRINKS) [d.name, NO_DRINKS[d.id]].filter(Boolean).forEach(n => entryNames.set(n, { drink: d }));
  for (const r of RECIPES) [r.name, NO_RECIPES[r.name]?.[0]].filter(Boolean).forEach(n => entryNames.set(n, { recipe: r }));
  [en.customBlendShort, no.customBlendShort].forEach(n => entryNames.set(n, { blend: true }));
}
export function entryName(e) {
  if (e.kind === 'water') return t('water');
  const known = entryNames.get(e.name);
  if (!known) return e.name;
  return known.drink ? drinkName(known.drink) : known.recipe ? recipeName(known.recipe) : t('customBlendShort');
}
