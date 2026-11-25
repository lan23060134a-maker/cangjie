'use strict';
/* 落字雨：字從上方落下，打對碼就消除，落地扣一條命。支援倉頡與速成。 */

const RAD = { a:'日', b:'月', c:'金', d:'木', e:'水', f:'火', g:'土', h:'竹', i:'戈', j:'十', k:'大', l:'中', m:'一',
  n:'弓', o:'人', p:'心', q:'手', r:'口', s:'尸', t:'廿', u:'山', v:'女', w:'田', x:'難', y:'卜', z:'重' };
const RAD_CHARS = '日月金木水火土竹戈十大中一弓人心手口尸廿山女田卜';
const PAGE = 9;
const quickOf = c => c.length <= 2 ? c : c[0] + c[c.length - 1];
const $ = s => document.querySelector(s);

/* ---------- 字表 ---------- */
const DICT = new Map(), LV1 = [], LV2 = [];
function load(s, arr) {
  if (!s) return;
  for (const tok of s.split(' ')) {
    const ch = String.fromCodePoint(tok.codePointAt(0));
    DICT.set(ch, tok.slice(ch.length).split('|'));
    if (arr) arr.push(ch);
  }
}
load(window.CJ_LV1, LV1);
load(window.CJ_LV2, LV2);
load(window.CJ_HK, null);

// 速成：與練習頁相同的「微軟速成」候選次序（quick-classic 字表；字表沒有的字按 Big5 次序排在後面）
const QDICT = new Map(), QREV = new Map();
(function buildQuick() {
  const b5m = new Map(); let i = 0;
  for (const ch of (window.CJ_B5ORDER || '')) b5m.set(ch, i++);
  const b5 = ch => b5m.has(ch) ? b5m.get(ch) : 1e9;
  for (const tok of (window.CJ_QC || '').split(' ')) {
    const m = /^[a-z]+/.exec(tok);
    if (!m || m[0][0] === 'z') continue;
    const chars = [...tok.slice(m[0].length)];
    QREV.set(m[0], chars);
    for (const ch of chars) { if (!QDICT.has(ch)) QDICT.set(ch, []); QDICT.get(ch).push(m[0]); }
  }
  const extra = new Map();
  for (const [ch, cs] of DICT) {
    if (QDICT.has(ch)) continue;
    const qs = [...new Set(cs.map(quickOf))];
    QDICT.set(ch, qs);
    for (const q of qs) { if (!extra.has(q)) extra.set(q, []); extra.get(q).push(ch); }
  }
  for (const [q, list] of extra) QREV.set(q, (QREV.get(q) || []).concat(list.sort((a, b) => b5(a) - b5(b))));
})();
const RAD_CODE = {};
for (const ch of RAD_CHARS) { const one = (DICT.get(ch) || []).find(c => c.length === 1); if (one) RAD_CODE[ch] = one; }

/* ---------- 設定 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('game-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('game-' + k, JSON.stringify(v)); } catch {} },
};
function oldDark() { try { const c = JSON.parse(localStorage.getItem('cj-cfg') || localStorage.getItem('qk-cfg') || '{}'); return c.dark; } catch { return undefined; } }
const urlIme = new URLSearchParams(location.search).get('ime');
const cfg = Object.assign({ ime: 'cj', range: '300', speed: 'mid', hint: false, sound: true,
  dark: oldDark() ?? !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) }, store.get('cfg', {}));
if (urlIme === 'cj' || urlIme === 'qk' || urlIme === 'en') cfg.ime = urlIme;
if (!cfg.enRange) cfg.enRange = 'short';
const saveCfg = () => store.set('cfg', cfg);
const EN = () => cfg.ime === 'en';
const EN_WORDS = window.EN_WORDS || [];
const EN_RANGES = [['short', '短字（4 個字母或以下）'], ['200', '最常用 200 字'], ['all', '全部常用字（約 600 字）']];

const RANGES = [['rad', '字根（24 個單碼字）'], ['300', '最常用 300 字'], ['1000', '常用 1000 字'], ['lv1', '常用字（約 5400 字）'], ['all', '常用＋次常用字']];
const SPEEDS = { slow: [22, 2.8], mid: [34, 2.2], fast: [50, 1.7] };   // [起始速度 px/秒, 起始出字間隔 秒]

function pool() {
  if (EN()) return cfg.enRange === 'short' ? EN_WORDS.filter(w => w.length <= 4) : cfg.enRange === '200' ? EN_WORDS.slice(0, 200) : EN_WORDS;
  const r = cfg.range;
  const base = r === 'rad' ? Object.keys(RAD_CODE) : r === '300' ? LV1.slice(0, 300) : r === '1000' ? LV1.slice(0, 1000)
    : r === 'lv1' ? LV1 : LV1.concat(LV2);
  return cfg.ime === 'qk' ? base.filter(ch => QDICT.has(ch) || RAD_CODE[ch]) : base;
}
const cjCodes = ch => cfg.range === 'rad' && RAD_CODE[ch] ? [RAD_CODE[ch]] : (DICT.get(ch) || []);
const qkCodes = ch => cfg.range === 'rad' && RAD_CODE[ch] ? [RAD_CODE[ch]] : (QDICT.get(ch) || []);
const candList = code => QREV.get(code) || [];

/* ---------- 音效 ---------- */
let actx = null;
function beep(freq, dur = 0.08, type = 'sine', vol = 0.06) {
  if (!cfg.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur);
  } catch {}
}

/* ---------- 遊戲狀態 ---------- */
const LIVES = 5;
let G = null;
const field = $('#field');

function newGame() {
  for (const d of field.querySelectorAll('.drop, .pts')) d.remove();
  const [v0, gap0] = SPEEDS[cfg.speed] || SPEEDS.mid;
  G = { drops: [], score: 0, hits: 0, wrong: 0, lives: LIVES, combo: 0, maxCombo: 0, level: 1,
    v0: cfg.ime === 'qk' ? v0 * 0.85 : EN() ? v0 * 0.8 : v0, gap0: cfg.ime === 'qk' ? gap0 * 1.15 : EN() ? gap0 * 1.2 : gap0,
    next: 0.3, t: 0, last: 0, running: true, paused: false, over: false, buf: '', open: false, page: 0, missed: new Map(),
    pool: pool() };
  $('#overlay').hidden = true;
  $('#pauseBtn').hidden = false;
  showBuf(); hud();
  G.last = performance.now();
  requestAnimationFrame(loop);
}
const speedNow = () => G.v0 * (1 + (G.level - 1) * 0.16);
const gapNow = () => Math.max(0.55, G.gap0 * Math.pow(0.9, G.level - 1));

function spawn() {
  const onScreen = new Set(G.drops.map(d => d.ch));
  let ch, tries = 0;
  do { ch = G.pool[Math.floor(Math.random() * G.pool.length)]; } while (onScreen.has(ch) && ++tries < 30);
  if (onScreen.has(ch)) return;
  const el = document.createElement('div');
  el.className = 'drop' + (EN() ? ' en' : '');
  el.innerHTML = `<span class="ch">${ch}</span>` + (cfg.hint && !EN() ? `<span class="hc">${hintText(ch)}</span>` : '');
  field.appendChild(el);
  const W = field.clientWidth, w = EN() ? ch.length * 16 + 34 : 74;
  // 盡量不和最近出現的字重疊
  let x = 0;
  for (let k = 0; k < 8; k++) {
    x = 8 + Math.random() * Math.max(10, W - w - 16);
    if (!G.drops.some(d => d.y < 90 && x < d.x + (d.w || 74) && d.x < x + w)) break;
  }
  const d = { ch, el, x, w, y: -60, v: speedNow() * (0.85 + Math.random() * 0.3) };
  el.style.left = x + 'px';
  G.drops.push(d);
}
function hintText(ch) {
  if (cfg.ime === 'qk') {
    const q = qkCodes(ch)[0] || '';
    const i = candList(q).indexOf(ch);
    return [...q].map(c => RAD[c]).join('') + (i >= 0 ? ` ${i >= PAGE ? Math.floor(i / PAGE) + 1 + '頁' : ''}${i % PAGE + 1}` : '');
  }
  return [...(cjCodes(ch)[0] || '')].map(c => RAD[c]).join('');
}

function loop(now) {
  if (!G || !G.running) return;
  const dt = Math.min(0.1, (now - G.last) / 1000);
  G.last = now;
  if (!G.paused) {
    G.t += dt;
    G.next -= dt;
    if (G.next <= 0) { spawn(); G.next = gapNow() * (0.8 + Math.random() * 0.4); }
    const H = field.clientHeight;
    for (const d of [...G.drops]) {
      d.y += d.v * dt;
      d.el.style.transform = `translateY(${d.y}px)`;
      if (d.y > H - 56) land(d);
    }
    markTargets();
  }
  if (G.running) requestAnimationFrame(loop);
}

function removeDrop(d) { G.drops.splice(G.drops.indexOf(d), 1); }
function land(d) {
  removeDrop(d);
  d.el.classList.add('landed');
  setTimeout(() => d.el.remove(), 600);
  G.missed.set(d.ch, (G.missed.get(d.ch) || 0) + 1);
  G.lives--; G.combo = 0;
  if (EN() && G.buf && !G.drops.some(o => o.ch.startsWith(G.buf))) clearBuf();
  field.classList.remove('hurt'); void field.offsetWidth; field.classList.add('hurt');
  beep(160, 0.25, 'sawtooth', 0.05);
  hud();
  if (G.lives <= 0) gameOver();
}
function hit(d) {
  removeDrop(d);
  G.hits++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
  const gain = Math.round(10 * G.level * (1 + Math.min(G.combo - 1, 20) * 0.1));
  G.score += gain;
  d.el.classList.add('pop');
  setTimeout(() => d.el.remove(), 450);
  const p = document.createElement('div');
  p.className = 'pts'; p.textContent = '+' + gain + (G.combo >= 3 ? `　${G.combo} 連擊！` : '');
  p.style.left = d.x + 'px'; p.style.top = Math.max(0, d.y) + 'px';
  field.appendChild(p); setTimeout(() => p.remove(), 900);
  beep(520 + Math.min(G.combo, 12) * 40, 0.09, 'triangle');
  const lv = 1 + Math.floor(G.hits / 10);
  if (lv > G.level) { G.level = lv; beep(880, 0.2, 'triangle', 0.07); flash(`第 ${lv} 關！`); }
  hud();
}
function wrong(text) {
  G.wrong++; G.combo = 0;
  const b = $('#buf'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  $('#gmsg').textContent = text;
  beep(220, 0.12, 'square', 0.04);
  hud();
}
function flash(t) { const f = $('#flash'); f.textContent = t; f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); }

function hud() {
  $('#hScore').textContent = G.score;
  $('#hLevel').textContent = G.level;
  $('#hCombo').textContent = G.combo;
  $('#hLives').textContent = '❤'.repeat(Math.max(0, G.lives)) + '♡'.repeat(Math.max(0, LIVES - G.lives));
  $('#hBest').textContent = store.get('best-' + cfg.ime, 0);
}
function lowest(match) {
  let best = null;
  for (const d of G.drops) if (match(d) && (!best || d.y > best.y)) best = d;
  return best;
}

/* ---------- 輸入 ---------- */
function showBuf() {
  $('#buf').innerHTML = (EN() ? `<span class="enbuf">${G.buf}</span>`
    : [...G.buf].map(c => `<span class="k"><b>${RAD[c]}</b><i>${c.toUpperCase()}</i></span>`).join('')) + '<span class="caret"></span>';
  if (EN() && G.drops) for (const d of G.drops) {
    const m = G.buf && d.ch.startsWith(G.buf);
    d.el.firstChild.innerHTML = m ? `<u>${G.buf}</u>${d.ch.slice(G.buf.length)}` : d.ch;
    d.el.classList.toggle('tgt', !!m);
  }
  const cand = $('#gcand');
  if (cfg.ime === 'qk' && G.open) {
    const list = candList(G.buf), pages = Math.max(1, Math.ceil(list.length / PAGE));
    const falling = new Set(G.drops.map(d => d.ch));
    cand.innerHTML = list.length
      ? list.slice(G.page * PAGE, G.page * PAGE + PAGE).map((c, i) =>
          `<span class="cd${cfg.hint && falling.has(c) ? ' tgt' : ''}"><small>${i + 1}</small>${c}</span>`).join('') +
        (pages > 1 ? `<span class="pg">${G.page + 1}/${pages} 頁（空白鍵下一頁）</span>` : '')
      : '<span class="pg">沒有這個碼的字</span>';
  } else cand.innerHTML = cfg.ime === 'qk' && G.buf.length === 1 ? '<span class="pg">按空白鍵開候選字，或再打一碼</span>' : '';
}
// 提示開啟時，候選窗口裡正在落下的字會標示出來
let lastMark = '';
function markTargets() {
  if (!(cfg.ime === 'qk' && G.open && cfg.hint)) return;
  const key = G.drops.map(d => d.ch).join('');
  if (key !== lastMark) { lastMark = key; showBuf(); }
}
function clearBuf() { G.buf = ''; G.open = false; G.page = 0; showBuf(); }

function cjConfirm() {
  if (!G.buf) return;
  const code = G.buf;
  const d = lowest(d => cjCodes(d.ch).includes(code));
  if (d) { hit(d); $('#gmsg').textContent = ''; }
  else wrong(`${code.toUpperCase()} 不是畫面上任何一個字的碼`);
  clearBuf();
}
// 自動消除：碼完全對上落下的字，而且沒有其他落下的字的碼以它開頭
function cjAuto() {
  const code = G.buf;
  const d = lowest(d => cjCodes(d.ch).includes(code));
  if (!d) return;
  if (G.drops.some(o => cjCodes(o.ch).some(c => c.length > code.length && c.startsWith(code)))) return;
  hit(d); $('#gmsg').textContent = ''; clearBuf();
}
// 英文：整個字打完就消除；如果還有更長的字以它開頭（例如 a 和 an），要按空白鍵確認
function enAuto() {
  const d = lowest(d => d.ch === G.buf);
  if (!d || G.drops.some(o => o.ch.length > G.buf.length && o.ch.startsWith(G.buf))) return;
  hit(d); $('#gmsg').textContent = ''; clearBuf();
}
function qkSelect(n) {
  const list = candList(G.buf), ch = list[G.page * PAGE + n];
  if (!ch) return;
  const d = lowest(d => d.ch === ch);
  if (d) { hit(d); $('#gmsg').textContent = ''; }
  else wrong(`選了「${ch}」，但它不在畫面上`);
  clearBuf();
}

document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'select' || tag === 'input') { if (e.key === 'Enter' && G && !G.running) { e.preventDefault(); e.target.blur(); newGame(); } return; }
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { $('#imeWarn').hidden = false; return; }
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key;
  if (!G || !G.running) {
    if (k === 'Enter') { e.preventDefault(); newGame(); }
    return;
  }
  if (k === 'Escape') { e.preventDefault(); if (G.buf) clearBuf(); else togglePause(); return; }
  if (G.paused) { if (k === 'Enter' || k === ' ') { e.preventDefault(); togglePause(); } return; }
  $('#imeWarn').hidden = true;
  if (/^[a-zA-Z]$/.test(k)) {
    e.preventDefault();
    const c = k.toLowerCase();
    if (EN()) {
      if (!G.drops.some(d => d.ch.startsWith(G.buf + c))) { wrong(`畫面上沒有以「${G.buf + c}」開頭的字`); return; }
      G.buf += c; showBuf(); enAuto();
      return;
    }
    if (cfg.ime === 'qk') {
      if (G.buf.length >= 2) return;
      G.buf += c; G.page = 0; G.open = G.buf.length === 2;
      showBuf();
    } else {
      if (G.buf.length >= 5) return;
      G.buf += c; showBuf(); cjAuto();
    }
    return;
  }
  if (k === 'Backspace') { e.preventDefault(); G.buf = G.buf.slice(0, -1); G.open = false; G.page = 0; showBuf(); return; }
  if (k === ' ') {
    e.preventDefault();
    if (EN()) {
      const d = G.buf && lowest(d => d.ch === G.buf);
      if (d) { hit(d); $('#gmsg').textContent = ''; } else if (G.buf) wrong(`「${G.buf}」還沒打完`);
      clearBuf();
    } else if (cfg.ime === 'qk') {
      if (!G.buf) return;
      if (!G.open) { G.open = true; G.page = 0; }
      else { const pages = Math.max(1, Math.ceil(candList(G.buf).length / PAGE)); G.page = (G.page + 1) % pages; }
      showBuf();
    } else cjConfirm();
    return;
  }
  if (cfg.ime === 'qk' && G.open && /^[1-9]$/.test(k)) { e.preventDefault(); qkSelect(+k - 1); return; }
  if (cfg.ime === 'qk' && G.open && (k === 'PageDown' || k === 'PageUp')) {
    e.preventDefault();
    const pages = Math.max(1, Math.ceil(candList(G.buf).length / PAGE));
    G.page = (G.page + (k === 'PageDown' ? 1 : pages - 1)) % pages; showBuf();
  }
  if (cfg.ime === 'cj' && k === 'Enter') { e.preventDefault(); cjConfirm(); }
});

function togglePause() {
  if (!G || !G.running) return;
  G.paused = !G.paused;
  $('#pauseBtn').textContent = G.paused ? '▶ 繼續' : '⏸ 暫停';
  $('#pauseMsg').hidden = !G.paused;
  field.classList.toggle('paused', G.paused);
  G.last = performance.now();
}
window.addEventListener('blur', () => { if (G && G.running && !G.paused) togglePause(); });

function gameOver() {
  G.running = false; G.over = true;
  const key = 'best-' + cfg.ime, best = store.get(key, 0), isBest = G.score > best;
  if (isBest) store.set(key, G.score);
  const acc = G.hits + G.wrong ? Math.round(G.hits / (G.hits + G.wrong) * 100) : 0;
  const missed = [...G.missed.keys()];
  const codeOf = ch => EN() ? '' : cfg.ime === 'qk'
    ? (qkCodes(ch)[0] || '').toUpperCase() + (() => { const i = candList(qkCodes(ch)[0]).indexOf(ch); return i >= 0 ? ` 第${Math.floor(i / PAGE) + 1}頁第${i % PAGE + 1}個` : ''; })()
    : cjCodes(ch).map(c => c.toUpperCase() + '（' + [...c].map(x => RAD[x]).join('') + '）').join(' / ');
  $('#ovBody').innerHTML =
    `<div class="big">遊戲結束${isBest ? '　🏆 新紀錄！' : ''}</div>` +
    `<div class="sumline">分數 <b>${G.score}</b>　關卡 <b>${G.level}</b>　消除 <b>${G.hits}</b> 字　最高連擊 <b>${G.maxCombo}</b>　準確率 <b>${acc}%</b></div>` +
    (missed.length ? `<div class="missed"><div>漏掉的字（記住它們的拆法）：</div>${missed.slice(0, 30).map(ch =>
      `<div class="mi"><span>${ch}</span><small>${codeOf(ch)}</small></div>`).join('')}</div>` : '<div>一個字都沒有漏掉，太厲害了！</div>') +
    `<div><button class="btn primary" id="againBtn">再玩一次（Enter）</button> <button class="btn" id="setupBtn">更改設定</button></div>`;
  $('#ovSetup').hidden = true;
  $('#overlay').hidden = false;
  $('#pauseBtn').hidden = true;
  $('#againBtn').onclick = e => { e.target.blur(); newGame(); };
  $('#setupBtn').onclick = e => { e.target.blur(); showSetup(); };
  clearBuf();
  hud();
}

/* ---------- 介面 ---------- */
function applyTheme() {
  document.body.classList.toggle('dark', cfg.dark);
  $('#themeBtn').textContent = cfg.dark ? '☀️ 淺色' : '🌙 深色';
}
function showSetup() {
  $('#ovBody').innerHTML = '<div class="big">落字雨</div><div>字會從上方落下，在落地前打出它的碼就能消除。漏掉 5 個字就結束。</div>';
  $('#ovSetup').hidden = false;
  $('#overlay').hidden = false;
  updateHelp();
}
function updateHelp() {
  $('#hintLbl').hidden = EN();
  $('#range').innerHTML = (EN() ? EN_RANGES : RANGES).map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  $('#range').value = EN() ? cfg.enRange : cfg.range;
  $('#howto').innerHTML = EN()
    ? '<b>英文玩法：</b>打出落下的英文單字，整個字打完就會自動消除。畫面上已打的部分會加底線。如果還有更長的字以它開頭（例如 <b>a</b> 和 <b>an</b>），按 <kbd>空白鍵</kbd> 確認。'
    : cfg.ime === 'qk'
    ? '<b>速成玩法：</b>打兩碼（例如「明」打 <kbd>A</kbd><kbd>B</kbd>）會自動打開候選字，再按數字選字；只有一碼的字按 <kbd>空白鍵</kbd> 開候選字。候選字超過一頁時按 <kbd>空白鍵</kbd> 翻頁。選字次序和微軟速成一樣。'
    : '<b>倉頡玩法：</b>打出字的倉頡碼（例如「明」打 <kbd>A</kbd><kbd>B</kbd>），碼對上畫面上的字就會自動消除；也可以按 <kbd>空白鍵</kbd> 確認。';
  $('#howto').innerHTML += '　<kbd>Backspace</kbd> 刪一碼，<kbd>Esc</kbd> 清除／暫停。打錯會中斷連擊，但不會扣命。';
}
function initUi() {
  applyTheme();
  $('#ime').innerHTML = '<option value="cj">倉頡</option><option value="qk">速成</option><option value="en">英文</option>';
  $('#speed').innerHTML = '<option value="slow">慢（新手）</option><option value="mid">中</option><option value="fast">快</option>';
  $('#ime').value = cfg.ime; $('#speed').value = cfg.speed;
  $('#hint').checked = cfg.hint; $('#sound').checked = cfg.sound;
  const on = (id, f) => $(id).onchange = e => { f(e.target); saveCfg(); updateHelp(); if (G) hud(); };
  on('#ime', el => {
    cfg.ime = el.value;
    const [href, txt] = { cj: ['index.html', '← 回倉頡練習'], qk: ['quick.html', '← 回速成練習'], en: ['english.html', '← 回英文打字'] }[cfg.ime];
    $('#backLink').href = href; $('#backLink').textContent = txt;
  });
  on('#range', el => { if (EN()) cfg.enRange = el.value; else cfg.range = el.value; });
  on('#speed', el => cfg.speed = el.value);
  on('#hint', el => cfg.hint = el.checked);
  on('#sound', el => cfg.sound = el.checked);
  $('#ime').onchange({ target: $('#ime') });
  $('#startBtn').onclick = e => { e.target.blur(); newGame(); };
  $('#pauseBtn').onclick = e => { e.target.blur(); togglePause(); };
  $('#themeBtn').onclick = e => { e.target.blur(); cfg.dark = !cfg.dark; saveCfg(); applyTheme(); };
  G = { running: false, score: 0, level: 1, combo: 0, lives: LIVES, buf: '', drops: [] };
  hud(); showBuf(); showSetup();
}
initUi();
