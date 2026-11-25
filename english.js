'use strict';
/* 英文打字練習：逐個字元比對，計算 WPM 與準確率，鍵盤顯示指法。 */
const $ = s => document.querySelector(s);
const WORDS = window.EN_WORDS || [];
const PASSAGES = window.EN_PASSAGES || [];

/* ---------- 鍵盤與指法 ---------- */
// [一般字元, Shift 字元, 手指]  手指：0 左尾指 1 左無名指 2 左中指 3 左食指 4 右食指 5 右中指 6 右無名指 7 右尾指
const ROWS = [
  [['`', '~', 0], ['1', '!', 0], ['2', '@', 1], ['3', '#', 2], ['4', '$', 3], ['5', '%', 3], ['6', '^', 4], ['7', '&', 4], ['8', '*', 5], ['9', '(', 6], ['0', ')', 7], ['-', '_', 7], ['=', '+', 7]],
  [['q', 'Q', 0], ['w', 'W', 1], ['e', 'E', 2], ['r', 'R', 3], ['t', 'T', 3], ['y', 'Y', 4], ['u', 'U', 4], ['i', 'I', 5], ['o', 'O', 6], ['p', 'P', 7], ['[', '{', 7], [']', '}', 7], ['\\', '|', 7]],
  [['a', 'A', 0], ['s', 'S', 1], ['d', 'D', 2], ['f', 'F', 3], ['g', 'G', 3], ['h', 'H', 4], ['j', 'J', 4], ['k', 'K', 5], ['l', 'L', 6], [';', ':', 7], ["'", '"', 7]],
  [['z', 'Z', 0], ['x', 'X', 1], ['c', 'C', 2], ['v', 'V', 3], ['b', 'B', 3], ['n', 'N', 4], ['m', 'M', 4], [',', '<', 5], ['.', '>', 6], ['/', '?', 7]],
];
const FINGER = ['左手尾指', '左手無名指', '左手中指', '左手食指', '右手食指', '右手中指', '右手無名指', '右手尾指'];
const KEYOF = new Map();   // 字元 -> { base, shift, finger }
for (const row of ROWS) for (const [b, s, f] of row) { KEYOF.set(b, { base: b, shift: false, finger: f }); KEYOF.set(s, { base: b, shift: true, finger: f }); }
KEYOF.set(' ', { base: ' ', shift: false, finger: 8 });

/* ---------- 設定與記錄 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('en-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('en-' + k, JSON.stringify(v)); } catch {} },
};
function oldDark() { try { return JSON.parse(localStorage.getItem('cj-cfg') || '{}').dark; } catch { return undefined; } }
const cfg = Object.assign({ mode: 'lesson', lesson: 'home', wordSet: '200', passage: 0, strict: true, caps: false,
  dark: oldDark() ?? !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) }, store.get('cfg', {}));
const saveCfg = () => store.set('cfg', cfg);
const keyMiss = store.get('miss', {});   // 字元 -> 打錯次數
const best = store.get('best', {});      // 模式 -> 最高 WPM

const LESSONS = [
  ['home', '1. 中排基本鍵 A S D F　J K L ;', 'asdfjkl;'],
  ['home2', '2. 中排加 G H', 'asdfghjkl;'],
  ['top', '3. 加上排 Q W E R T Y U I O P', 'asdfghjkl;qwertyuiop'],
  ['bottom', '4. 加下排 Z X C V B N M , .', 'asdfghjkl;qwertyuiopzxcvbnm,.'],
  ['all', '5. 全部字母', 'abcdefghijklmnopqrstuvwxyz'],
  ['shift', '6. 大寫字母（Shift）', 'SHIFT'],
  ['num', '7. 數字列 1–0', '1234567890'],
];
const WORD_SETS = [['short', '短字（4 個字母或以下）'], ['200', '最常用 200 字'], ['all', '全部常用字（約 600 字）']];

/* ---------- 產生練習內容 ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cap = w => w[0].toUpperCase() + w.slice(1);

function lessonText(id) {
  const letters = LESSONS.find(l => l[0] === id)[2];
  const out = [];
  if (letters === 'SHIFT') {
    const ws = shuffle(WORDS.filter(w => w.length >= 3 && w.length <= 7)).slice(0, 18);
    return ws.map((w, i) => i % 4 === 0 && w.length <= 4 ? w.toUpperCase() : cap(w)).join(' ');
  }
  if (/^\d+$/.test(letters)) {
    for (let i = 0; i < 16; i++) { let n = ''; const len = 1 + Math.floor(Math.random() * 4); for (let k = 0; k < len; k++) n += pick(letters); out.push(n); }
    return out.join(' ');
  }
  const set = new Set(letters);
  const real = WORDS.filter(w => w.length >= 2 && [...w].every(c => set.has(c)));
  // 先練幾組重複鍵（例如 fff jjj fjf），再練真實單字或字母組合
  const L = [...letters], AZ = L.filter(c => /[a-z]/.test(c));
  for (let i = 0; i < 6; i++) { const a = pick(L), b = pick(L); out.push(a + a + a, a + b + a); }
  for (let i = 0; i < 14; i++) {
    if (real.length >= 6 && Math.random() < 0.7) out.push(pick(real));
    else { let w = ''; const len = 2 + Math.floor(Math.random() * 4); for (let k = 0; k < len; k++) w += pick(AZ); out.push(w); }
  }
  return out.join(' ');
}
function wordText() {
  const src = cfg.wordSet === 'short' ? WORDS.filter(w => w.length <= 4) : cfg.wordSet === '200' ? WORDS.slice(0, 200) : WORDS;
  const ws = [];
  for (let i = 0; i < 30; i++) { const w = pick(src); ws.push(cfg.caps && Math.random() < 0.3 ? cap(w) : w); }
  return ws.join(' ');
}
function symbolText() {
  const T = [() => Math.floor(Math.random() * 1000) + '', () => '$' + (1 + Math.floor(Math.random() * 99)), () => (5 + Math.floor(Math.random() * 95)) + '%',
    () => '(' + pick(WORDS.slice(0, 100)) + ')', () => '"' + pick(WORDS.slice(0, 100)) + '"', () => pick(WORDS.slice(0, 80)) + '@mail.com',
    () => Math.floor(Math.random() * 24) + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0'), () => '#' + (1 + Math.floor(Math.random() * 50)),
    () => (1 + Math.floor(Math.random() * 9)) + '+' + (1 + Math.floor(Math.random() * 9)) + '=' + '?', () => pick(WORDS.slice(0, 100)) + '!',
    () => pick(WORDS.slice(0, 100)) + '?', () => pick(WORDS.slice(0, 100)) + "'s", () => (1 + Math.floor(Math.random() * 30)) + '/' + (1 + Math.floor(Math.random() * 12)),
    () => pick(WORDS.slice(0, 60)) + '-' + pick(WORDS.slice(0, 60)), () => '[' + (1 + Math.floor(Math.random() * 9)) + ']', () => pick(WORDS.slice(0, 80)) + ';'];
  const out = []; for (let i = 0; i < 18; i++) out.push(pick(T)());
  return out.join(' ');
}
function weakKeys() {
  return Object.entries(keyMiss).filter(([c, n]) => n > 0 && /[a-z]/.test(c)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
}
function reviewText() {
  const weak = weakKeys();
  if (!weak.length) return null;
  const ws = WORDS.filter(w => weak.some(c => w.includes(c)));
  const out = [];
  for (let i = 0; i < 26; i++) out.push(pick(ws.length ? ws : WORDS));
  for (const c of weak) out.splice(Math.floor(Math.random() * out.length), 0, c + c + c);
  return out.join(' ');
}
function cleanCustom(s) {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/[^\x20-\x7E\n]/g, '').replace(/[ \t]*\n+[ \t]*/g, ' ').replace(/ {2,}/g, ' ').trim();
}

/* ---------- 練習狀態 ---------- */
let S = null;
function startMode() {
  saveCfg();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === cfg.mode));
  document.querySelectorAll('.opt[data-for]').forEach(o => o.hidden = o.dataset.for !== cfg.mode);
  let text = '', title = '';
  if (cfg.mode === 'lesson') { text = lessonText(cfg.lesson); title = LESSONS.find(l => l[0] === cfg.lesson)[1]; }
  else if (cfg.mode === 'words') { text = wordText(); title = '單字練習'; }
  else if (cfg.mode === 'text') { const p = PASSAGES[cfg.passage] || PASSAGES[0]; text = p.text; title = p.title; }
  else if (cfg.mode === 'symbol') { text = symbolText(); title = '數字與符號'; }
  else if (cfg.mode === 'review') {
    text = reviewText();
    title = '錯字複習：' + weakKeys().map(c => c.toUpperCase()).join(' ');
    if (!text) { text = ''; title = '還沒有打錯的記錄，先去練習其他項目吧！'; }
  } else if (cfg.mode === 'custom') { text = cleanCustom(store.get('custom', '')); title = '自訂文字'; if (!text) title = '在上面貼上英文文字，再按「開始練習這段文字」'; }
  S = { text, title, pos: 0, marks: [], errs: 0, keys: 0, start: 0, end: 0, done: false, wrongNow: false, miss: {} };
  $('#result').hidden = true;
  render(); updateStats();
}

function render() {
  $('#title').textContent = S.title;
  const el = $('#text');
  el.innerHTML = '';
  S.spans = [...S.text].map(ch => { const s = document.createElement('span'); s.textContent = ch; if (ch === ' ') s.className = 'sp'; el.appendChild(s); return s; });
  refresh();
}
function refresh() {
  S.spans.forEach((s, i) => {
    let c = S.text[i] === ' ' ? 'sp' : '';
    if (i < S.pos) c += S.marks[i] ? ' bad' : ' good';
    else if (i === S.pos && !S.done) c += ' cur' + (S.wrongNow ? ' wrongnow' : '');
    s.className = c.trim();
  });
  const cur = S.spans[S.pos];
  if (cur) { const box = $('#textWrap'); const top = cur.offsetTop - box.offsetTop; if (top > box.scrollTop + box.clientHeight - 60 || top < box.scrollTop) box.scrollTop = top - 40; }
  showNextKey();
}
function showNextKey() {
  document.querySelectorAll('#kb .key').forEach(k => k.classList.remove('next'));
  const ch = S && !S.done ? S.text[S.pos] : null;
  const info = ch != null ? KEYOF.get(ch) : null;
  if (!info) { $('#finger').textContent = ''; return; }
  const k = document.querySelector(`#kb .key[data-k="${CSS.escape(info.base)}"]`);
  if (k) k.classList.add('next');
  let tip = info.finger === 8 ? '空白鍵：用拇指' : `「${ch}」用 ${FINGER[info.finger]}`;
  if (info.shift) {
    const side = info.finger <= 3 ? 'R' : 'L';
    document.querySelector(`#kb .key[data-k="shift${side}"]`).classList.add('next');
    tip += `，同時用${side === 'R' ? '右' : '左'}手尾指按 Shift`;
  }
  $('#finger').textContent = tip;
}
function elapsed() { return S.start ? ((S.end || performance.now()) - S.start) / 1000 : 0; }
// WPM：每 5 個字元算一個字
function wpm() { const t = elapsed(); return t > 1 ? Math.round(S.pos / 5 / (t / 60)) : 0; }
function accuracy() { return S.keys ? Math.round((S.keys - S.errs) / S.keys * 100) : 100; }
function updateStats() {
  const t = elapsed();
  $('#stats').innerHTML = `<span>速度 <b>${wpm()}</b> WPM</span><span>準確率 <b>${accuracy()}%</b></span>` +
    `<span>進度 <b>${S.pos}</b> / ${S.text.length}</span><span>時間 <b>${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</b></span>`;
}
setInterval(() => { if (S && S.start && !S.done) updateStats(); }, 500);

function typeChar(ch) {
  if (S.done || !S.text) return;
  if (!S.start) S.start = performance.now();
  const want = S.text[S.pos];
  S.keys++;
  flashKey(ch);
  if (ch === want) {
    S.wrongNow = false;
    S.pos++;
  } else {
    S.errs++;
    S.marks[S.pos] = true;
    const mk = want.toLowerCase();   // 大小寫算同一個鍵
    keyMiss[mk] = (keyMiss[mk] || 0) + 1; S.miss[mk] = (S.miss[mk] || 0) + 1;
    store.set('miss', keyMiss);
    $('#msg').textContent = `應該打「${want === ' ' ? '空白' : want}」，你打了「${ch === ' ' ? '空白' : ch}」`;
    if (cfg.strict) { S.wrongNow = true; const t = $('#text'); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
    else S.pos++;
  }
  if (ch === want) $('#msg').textContent = '';
  if (S.pos >= S.text.length) finish();
  refresh(); updateStats();
}
// 完成一回：這回沒打錯的鍵，錯誤記錄減 1（錯字複習會慢慢轉向其他弱項）
function finish() {
  S.done = true; S.end = performance.now();
  for (const c of new Set(S.text.toLowerCase())) if (!S.miss[c] && keyMiss[c]) keyMiss[c] = Math.max(0, keyMiss[c] - 1);
  store.set('miss', keyMiss);
  const w = wpm(), a = accuracy(), key = cfg.mode, isBest = w > (best[key] || 0) && a >= 90;
  if (isBest) { best[key] = w; store.set('best', best); }
  const worst = Object.entries(S.miss).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([c, n]) => `<kbd>${c === ' ' ? '空白' : c}</kbd>×${n}`).join(' ');
  $('#result').innerHTML = `<div class="big">完成！${isBest ? '　🏆 新紀錄' : ''}</div>` +
    `<div>速度 <b>${w}</b> WPM　準確率 <b>${a}%</b>　用時 ${Math.round(elapsed())} 秒</div>` +
    (worst ? `<div>這次打錯最多的鍵：${worst}</div>` : '<div>一個錯都沒有！</div>') +
    `<div class="muted">${a < 90 ? '準確率低於 90%，先放慢一點，打準比打快重要。' : w < 20 ? '眼睛看螢幕、手指放在基本鍵上，速度會慢慢提升。' : '做得很好，繼續保持！'}</div>` +
    `<button class="btn primary" id="nextBtn">下一回（Enter）</button>`;
  $('#result').hidden = false;
  $('#nextBtn').onclick = e => { e.target.blur(); startMode(); };
}
function backspace() {
  if (S.done || S.pos === 0 || cfg.strict) return;
  S.pos--; refresh(); updateStats();
}

document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { $('#imeWarn').hidden = false; return; }
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (!S) return;
  if (S.done) { if (e.key === 'Enter') { e.preventDefault(); startMode(); } return; }
  if (e.key === 'Escape') { e.preventDefault(); startMode(); return; }
  if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
  if (e.key.length === 1) { e.preventDefault(); $('#imeWarn').hidden = true; typeChar(e.key); }
});

/* ---------- 介面 ---------- */
function buildKb() {
  const keyHtml = ([b, s, f]) => `<div class="key f${f}" data-k="${b.replace(/"/g, '&quot;')}"><b>${/[a-z]/.test(b) ? b.toUpperCase() : b}</b><i>${/[a-z]/.test(b) ? '' : s}</i></div>`;
  $('#kb').innerHTML =
    `<div class="row">${ROWS[0].map(keyHtml).join('')}</div>` +
    `<div class="row"><div class="key wide">Tab</div>${ROWS[1].map(keyHtml).join('')}</div>` +
    `<div class="row"><div class="key wide">Caps</div>${ROWS[2].map(keyHtml).join('')}</div>` +
    `<div class="row"><div class="key wider f0" data-k="shiftL">Shift</div>${ROWS[3].map(keyHtml).join('')}<div class="key wider f7" data-k="shiftR">Shift</div></div>` +
    `<div class="row"><div class="key space f8" data-k=" ">空白鍵</div></div>` +
    `<div id="finger"></div>` +
    `<div class="legend">${FINGER.map((n, i) => `<span class="f${i}">${n}</span>`).join('')}<span class="f8">拇指</span></div>`;
}
function flashKey(ch) {
  const info = KEYOF.get(ch);
  if (!info) return;
  const k = document.querySelector(`#kb .key[data-k="${CSS.escape(info.base)}"]`);
  if (k) { k.classList.add('press'); setTimeout(() => k.classList.remove('press'), 140); }
}
function applyTheme() {
  document.body.classList.toggle('dark', cfg.dark);
  $('#themeBtn').textContent = cfg.dark ? '☀️ 淺色' : '🌙 深色';
}
function initUi() {
  applyTheme();
  $('#lesson').innerHTML = LESSONS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  $('#wordSet').innerHTML = WORD_SETS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  $('#passage').innerHTML = PASSAGES.map((p, i) => `<option value="${i}">${p.title}</option>`).join('');
  $('#lesson').value = cfg.lesson; $('#wordSet').value = cfg.wordSet; $('#passage').value = cfg.passage;
  $('#strict').checked = cfg.strict; $('#caps').checked = cfg.caps;
  $('#customText').value = store.get('custom', '');
  const on = (id, f) => $(id).onchange = e => { f(e.target); e.target.blur(); startMode(); };
  on('#lesson', el => cfg.lesson = el.value);
  on('#wordSet', el => cfg.wordSet = el.value);
  on('#passage', el => cfg.passage = +el.value);
  on('#strict', el => cfg.strict = el.checked);
  on('#caps', el => cfg.caps = el.checked);
  $('#customGo').onclick = e => { e.target.blur(); store.set('custom', $('#customText').value); startMode(); };
  $('#restart').onclick = e => { e.target.blur(); startMode(); };
  $('#resetMiss').onclick = e => { e.target.blur(); for (const k in keyMiss) delete keyMiss[k]; store.set('miss', keyMiss); startMode(); };
  $('#themeBtn').onclick = e => { e.target.blur(); cfg.dark = !cfg.dark; saveCfg(); applyTheme(); };
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { b.blur(); cfg.mode = b.dataset.mode; startMode(); });
  buildKb();
}
initUi();
startMode();
