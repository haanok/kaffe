// The Pour: a logged drink lifts out of the portion dialog, arcs into today's
// card, tips, and pours into the caffeine meter. Purely presentational: the
// journal is already saved and rendered with final values before this runs,
// so interrupting it (or skipping it under reduced motion) loses nothing.

const LIQUID = { coffee: '#7b4b30', tea: '#8fa962', energy: '#9c86cf', soda: '#c48a2c', supp: '#7fa2b4', sweets: '#93603f', water: '#6fb0d2' };
const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const done = animation => animation.finished.catch(() => {});
let running = 0;
export const isPouring = () => running > 0;
export const moodFor = total => total > 400 ? 'high' : total >= 300 ? 'medium' : 'low';

// A damped spring sampled into a CSS linear() easing, so overshoot and settle
// come from physics rather than a hand-tuned bezier.
function spring(stiffness = 180, damping = 13) {
  if (!CSS.supports('animation-timing-function', 'linear(0, 1)')) return { easing: 'cubic-bezier(.16,1,.3,1)', duration: 700 };
  let x = 0, v = 0, t = 0;
  const dt = 1 / 240, samples = [0];
  while (t < 3 && (Math.abs(1 - x) > .0008 || Math.abs(v) > .0008)) {
    v += (stiffness * (1 - x) - damping * v) * dt; x += v * dt; t += dt;
    if (Math.round(t / dt) % 6 === 0) samples.push(x);
  }
  samples.push(1);
  return { easing: `linear(${samples.map(s => +s.toFixed(4)).join(', ')})`, duration: Math.round(t * 1000) };
}
const SETTLE = spring(170, 14), SNAP = spring(320, 19);

// Odometer: each digit column rolls to its target, staggered right to left.
function roll(el, from, to, delay = 0) {
  const node = el && [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  if (!node) return Promise.resolve();
  const target = String(Math.round(to)), start = String(Math.round(from)).padStart(target.length, ' ');
  if (start.length > target.length || start === target) { node.textContent = target; return Promise.resolve(); }
  const odo = document.createElement('span');
  odo.className = 'odo'; odo.setAttribute('aria-hidden', 'true');
  odo.innerHTML = [...target].map(() => `<span class="odo-col"><span class="odo-strip">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}<span></span></span></span>`).join('');
  const label = document.createElement('span');
  label.className = 'sr-only'; label.textContent = target;
  node.replaceWith(odo, label);
  const rowHeight = odo.firstElementChild.getBoundingClientRect().height;
  const rolls = [...odo.children].map((col, i) => {
    const a = start[i] === ' ' ? 10 : +start[i], b = +target[i];
    const strip = col.firstElementChild;
    strip.style.transform = `translateY(${-b * rowHeight}px)`;
    if (a === b) return Promise.resolve();
    return done(strip.animate([{ transform: `translateY(${-a * rowHeight}px)` }, { transform: `translateY(${-b * rowHeight}px)` }],
      { duration: SETTLE.duration, easing: SETTLE.easing, delay: delay + (target.length - 1 - i) * 55, fill: 'backwards' }));
  });
  return Promise.all(rolls).then(() => { if (odo.isConnected) { odo.replaceWith(document.createTextNode(target)); label.remove(); } });
}

function droplets(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('span');
    const size = 4 + Math.random() * 4, dx = (Math.random() - .5) * 70, lift = 14 + Math.random() * 26;
    drop.className = 'pour-drop';
    Object.assign(drop.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px`, background: color });
    document.body.append(drop);
    drop.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .55}px, ${-lift}px) scale(1)`, opacity: 1, offset: .4 },
      { transform: `translate(${dx}px, 12px) scale(.4)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 160, easing: 'cubic-bezier(.2,.6,.4,1)' }).finished.finally(() => drop.remove());
  }
}

async function bringIntoView(el) {
  const r = el.getBoundingClientRect(), top = 80, bottom = innerHeight - 120;
  if (r.top >= top && r.bottom <= bottom) return;
  const ended = new Promise(resolve => addEventListener('scrollend', resolve, { once: true }));
  scrollBy({ top: r.top - innerHeight * .3, behavior: 'smooth' });
  await Promise.race([ended, wait(700)]);
}

// Where a point on the cup lands after rotating the cup about its center.
function rotated(dx, dy, degrees) {
  const a = degrees * Math.PI / 180;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
}

export async function pourDrink({ from, svg, cat, before, after, sound }) {
  const card = document.querySelector('.daily-card');
  const track = card?.querySelector('.intake-track'), fill = track?.firstElementChild;
  if (!card || !fill || !from || prefersReduced() || (before.total === after.total && Math.round(before.active) === Math.round(after.active))) return;
  running++;
  const liquid = LIQUID[cat] || LIQUID.coffee;
  const pct = total => Math.min(100, total / 4);
  const big = card.querySelector('.big-number'), activeNumber = document.querySelector('.active-number');
  const forecast = document.querySelector('.decay-chart .forecast'), nowDot = document.querySelector('.decay-chart .now-dot');
  // Rewind the freshly rendered card to its pre-log state.
  card.classList.remove('low', 'medium', 'high'); card.classList.add(moodFor(before.total));
  fill.style.transition = 'none';
  fill.style.width = `${pct(before.total)}%`;
  const bigNode = big && [...big.childNodes].find(n => n.nodeType === 3), activeNode = activeNumber && [...activeNumber.childNodes].find(n => n.nodeType === 3);
  if (bigNode) bigNode.textContent = Math.round(before.total);
  if (activeNode) activeNode.textContent = Math.round(before.active);
  forecast?.style.setProperty('opacity', '0'); nowDot?.style.setProperty('opacity', '0');

  const size = Math.min(72, Math.max(54, track.getBoundingClientRect().width * .16));
  const height = size * 140 / 150;
  const flyer = document.createElement('div');
  flyer.className = 'pour-flyer'; flyer.innerHTML = svg; flyer.querySelector('.steam')?.remove();
  Object.assign(flyer.style, { width: `${size}px`, height: `${height}px` });
  const place = (x, y, rotate = 0, scale = 1) => `translate(${x - size / 2}px, ${y - height / 2}px) rotate(${rotate}deg) scale(${scale})`;
  const startX = from.left + from.width / 2, startY = from.top + from.height / 2, startScale = from.width / size;
  flyer.style.transform = place(startX, startY, 0, startScale);
  document.body.append(flyer);
  try {
    const lift = flyer.animate([{ transform: place(startX, startY, 0, startScale) }, { transform: place(startX, startY - 10, -4, startScale * 1.04) }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    await Promise.all([bringIntoView(track), done(lift)]);

    // Aim the cup so its left rim sits above the meter's current edge.
    const r = track.getBoundingClientRect();
    const landX = Math.min(r.right - 10, Math.max(r.left + 10, r.left + r.width * pct(before.total) / 100 + 6)), landY = r.top + r.height / 2;
    const tilt = -58, streamLength = Math.max(34, Math.min(54, size * .7));
    const [lipX, lipY] = rotated((.25 - .5) * size, (.37 - .5) * height, tilt);
    const cx = landX - lipX, cy = landY - streamLength - lipY;
    const x0 = startX, y0 = startY - 10, ctrlX = (x0 + cx) / 2, ctrlY = Math.min(y0, cy) - Math.min(160, Math.abs(x0 - cx) * .35 + 70);
    const arc = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * ctrlX + t * t * cx, y = u * u * y0 + 2 * u * t * ctrlY + t * t * cy;
      return { transform: place(x, y, -4 + Math.sin(t * Math.PI) * 16, startScale * 1.04 + (1 - startScale * 1.04) * t) };
    });
    lift.cancel();
    await done(flyer.animate(arc, { duration: 640, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }));
    await done(flyer.animate([{ transform: place(cx, cy, 0) }, { transform: place(cx, cy, tilt) }], { duration: SNAP.duration * .8, easing: SNAP.easing, fill: 'forwards' }));

    // The stream falls, lands, and the meter takes the drink.
    const stream = document.createElement('div');
    stream.className = 'pour-stream';
    Object.assign(stream.style, { left: `${landX - 2.5}px`, top: `${landY - streamLength}px`, height: `${streamLength}px`, background: liquid });
    document.body.append(stream);
    await done(stream.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 170, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' }));
    sound?.('pour');
    droplets(landX, landY, liquid);
    card.classList.remove('low', 'medium', 'high'); card.classList.add(moodFor(after.total));
    fill.style.width = `${pct(after.total)}%`;
    const filling = done(fill.animate([{ width: `${pct(before.total)}%` }, { width: `${pct(after.total)}%` }], { duration: SETTLE.duration, easing: SETTLE.easing }));
    const counting = Promise.all([roll(big, before.total, after.total, 60), roll(activeNumber, before.active, after.active, 220)]);
    card.querySelector('.hero-art .cup-art')?.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-6deg) scale(1.06)' }, { transform: 'rotate(0) scale(1)' }], { duration: SNAP.duration, delay: 160, easing: SNAP.easing });
    await wait(420);
    stream.style.transformOrigin = 'bottom';
    const ending = done(stream.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 150, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' })).then(() => stream.remove());
    const leaving = done(flyer.animate([
      { transform: place(cx, cy, tilt), opacity: 1 },
      { transform: place(cx, cy - 4, 6), opacity: 1, offset: .45 },
      { transform: place(cx + 8, cy - 26, 0, .55), opacity: 0 },
    ], { duration: 460, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }));

    // The forecast redraws from now with the new drink in it.
    if (forecast) { forecast.style.opacity = ''; forecast.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 900, delay: 120, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }); }
    if (nowDot) { nowDot.style.opacity = ''; nowDot.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: SNAP.duration, easing: SNAP.easing, fill: 'backwards' }); }
    await Promise.all([filling, counting, ending, leaving]);
  } finally {
    flyer.remove(); fill.style.transition = '';
    forecast?.style.removeProperty('opacity'); nowDot?.style.removeProperty('opacity');
    running--;
  }
}

// Water gets its own small moment: a drop falls into the glass and the level
// springs up. Same contract: final values are already rendered.
export async function pourWater({ from, before, sound }) {
  const glass = document.querySelector('.water-glass'), fill = glass?.querySelector('.water-fill'), count = glass?.querySelector('span');
  if (!glass || !fill || !from || prefersReduced()) return;
  running++;
  const level = n => Math.min(90, 10 + n * 12);
  fill.style.transition = 'none';
  fill.style.height = `${level(before)}%`;
  if (count) count.textContent = before;
  const g = glass.getBoundingClientRect();
  const drop = document.createElement('span');
  drop.className = 'pour-drop water';
  const x = g.left + g.width / 2, startY = g.top - 34, endY = g.top + g.height * (1 - level(before) / 100) - 4;
  Object.assign(drop.style, { left: `${x - 6}px`, top: `${startY}px`, width: '12px', height: '16px', background: LIQUID.water });
  document.body.append(drop);
  try {
    await done(drop.animate([{ transform: 'translateY(0) scale(.6)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1, offset: .15 }, { transform: `translateY(${endY - startY}px) scale(.9, 1.15)`, opacity: 1 }],
      { duration: 420, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' }));
    drop.remove();
    sound?.('water');
    droplets(x, endY + 4, LIQUID.water, 4);
    fill.style.height = `${level(before + 1)}%`;
    glass.animate([{ transform: 'rotate(-5deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(-5deg)' }], { duration: 520, easing: 'ease-out' });
    await Promise.all([done(fill.animate([{ height: `${level(before)}%` }, { height: `${level(before + 1)}%` }], { duration: SETTLE.duration, easing: SETTLE.easing })), roll(count, before, before + 1)]);
  } finally {
    drop.remove(); fill.style.transition = '';
    running--;
  }
}
