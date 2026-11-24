'use strict';

// 速成版：quick.html 會先設定 window.CJ_QUICK_MODE = true
const QUICK = !!window.CJ_QUICK_MODE;
const PAGE = 9;   // 速成候選字每頁數量
const quickOf = c => c.length <= 2 ? c : c[0] + c[c.length - 1];

/* ---------- 基本資料 ---------- */
const RAD = { a:'日', b:'月', c:'金', d:'木', e:'水', f:'火', g:'土', h:'竹', i:'戈', j:'十', k:'大', l:'中', m:'一',
  n:'弓', o:'人', p:'心', q:'手', r:'口', s:'尸', t:'廿', u:'山', v:'女', w:'田', x:'難', y:'卜', z:'重' };
const RAD_GROUPS = [['哲理類','abcdefg'], ['筆畫類','hijklmn'], ['人體類','opqr'], ['字形類','stuvwy'], ['特別鍵','xz']];
const RAD_CHARS = '日月金木水火土竹戈十大中一弓人心手口尸廿山女田卜';

// [符號, 鍵盤按鍵, 倉頡符號碼, 按鍵說明]
const PUNCT = [
  ['，', ',', 'zxab', ','], ['、', '\\', 'zxac', '\\'], ['。', '.', 'zxad', '.'],
  ['；', ';', 'zxag', ';'], ['：', ':', 'zxah', 'Shift + ;'], ['？', '?', 'zxai', 'Shift + /'],
  ['！', '!', 'zxaj', 'Shift + 1'], ['「', '[', 'zxcd', '['], ['」', ']', 'zxce', ']'],
  ['『', '{', 'zxch', 'Shift + ['], ['』', '}', 'zxci', 'Shift + ]'], ['（', '(', 'zxbe', 'Shift + 9'],
  ['）', ')', 'zxbf', 'Shift + 0'], ['《', '<', 'zxbu', 'Shift + ,'], ['》', '>', 'zxbv', 'Shift + .'],
  ['〈', '', 'zxby', ''], ['〉', '', 'zxca', ''], ['…', '^', 'zxal', 'Shift + 6（一次出「……」）'],
  ['—', '_', 'zxay', 'Shift + -（一次出「——」）'], ['·', '', 'zxaf', ''],
  ['【', '', 'zxbq', ''], ['】', '', 'zxbr', ''], ['〔', '', 'zxbm', ''], ['〕', '', 'zxbn', ''],
];
const PINFO = new Map();
const KEYOUT = {};
for (const [ch, key, code, label] of PUNCT) {
  PINFO.set(ch, { key, code, label });
  if (key) KEYOUT[key] = (ch === '…' || ch === '—') ? ch + ch : ch;
}
// 練標點時的出現比重
const PUNCT_POOL = '，，，，。。。、、、？？！！：：；「」「」『』（）《》…—〈〉·【】〔〕';
const MIX_POOL = '，，，，，。。。、、？！：；「」';

const PASSAGES = [
  { title: '學習倉頡', text: '倉頡輸入法是依照字形來取碼的。剛開始學習時，難免會覺得字根很多、規則很複雜；但只要每天練習十分鐘，熟悉了「日、月、金、木、水、火、土」等字根，速度自然會越來越快。記住：先求正確，再求快！' },
  { title: '雨後的早晨', text: '昨夜下了一場大雨，今天早上，空氣特別清新。路邊的樹葉還掛著水珠，在陽光下閃閃發亮。我沿著河邊慢慢散步，聽見鳥兒在枝頭唱歌，心情也跟著輕鬆起來。' },
  { title: '約看電影', text: '「你今天晚上有空嗎？」小明問。\n「有啊，怎麼了？」\n「我想去看電影，聽說新上映的那部很好看！」\n「好啊！那我們七點在車站見面，好不好？」' },
  { title: '煮一碗麵', text: '煮一碗好吃的麵，需要準備以下材料：麵條、雞蛋、青菜、蔥花和一點醬油。先把水燒開，再放入麵條；等麵快熟的時候，加入青菜和雞蛋。最後撒上蔥花——簡單又美味。' },
  { title: '圖書館', text: '學校的圖書館共有三層：一樓是期刊區，二樓是中文書籍，三樓則是自修室。每到考試前，自修室總是坐滿了人，大家都安安靜靜地看書，只聽得見翻頁的聲音……' },
  { title: '月亮的秘密', text: '月亮本身並不會發光，我們看到的月光，其實是太陽光照在月球表面後反射出來的。月亮繞地球一圈大約需要二十七天；因為地球同時也在繞著太陽運行，所以從一次滿月到下一次滿月，大約要二十九天半。' },
  { title: '火車旅行', text: '我喜歡坐火車旅行。窗外的風景不停地變換：有時是金黃色的稻田，有時是連綿的山脈，有時又是藍色的大海。帶一本好書、一杯熱茶，幾個小時的車程，一點也不覺得無聊。' },
  { title: '珍惜時間', text: '有人說：「時間就是金錢。」其實，時間比金錢更寶貴——錢花掉了還可以再賺，時間過去了卻永遠不會回來。所以，我們應該好好珍惜每一天，做自己真正喜歡的事情。' },
  { title: '讀書心得', text: '上個月，我讀了一本名叫《海邊的燈塔》的小說。故事講述一位老人獨自守護燈塔（一守就是四十年）的經歷。書中老人說：「我母親常對我說：『燈不是為自己而亮的。』」讀完以後，我想了很久。' },
  { title: '運動的好處', text: '每天運動三十分鐘，對身體有很多好處：可以增強體力、改善睡眠，還能讓心情變好。跑步、游泳、騎單車、打籃球……選一項自己喜歡的運動，持之以恆，比什麼都重要！' },
  { title: '城市的夜晚', text: '夜幕低垂，城市的燈火一盞盞亮了起來。街上的行人漸漸多了：下班的上班族、放學的學生、出來散步的老夫婦。夜市裡傳來陣陣香味，烤玉米、蚵仔煎、珍珠奶茶，每一樣都讓人忍不住停下腳步。' },
  { title: '靜夜思（李白）', text: '床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。' },
  { title: '登鸛雀樓（王之渙）', text: '白日依山盡，黃河入海流。欲窮千里目，更上一層樓。' },
  { title: '《論語．學而》', text: '子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」' },
  { title: '寫信給朋友', text: '親愛的阿華：\n好久不見，你最近好嗎？上星期我搬了新家，房間不大，但窗外有一棵很高的樹，每天早上都有小鳥來拜訪。下次放假，歡迎你來玩！\n祝 平安\n小雨 敬上' },
  { title: '植物的生長', text: '植物生長需要三樣東西：陽光、空氣和水。葉子裡的葉綠素能吸收陽光，把二氧化碳和水轉化成養分，同時釋放出氧氣，這個過程叫做「光合作用」。如果把植物放在黑暗的地方，它很快就會變黃、枯萎。' },
];

/* ---------- 載入字碼 ---------- */
const DICT = new Map();   // 字 -> [碼]
const REV = new Map();    // 碼 -> [字]（按常用程度）
const QDICT = new Map();  // 字 -> [速成碼]
const QREV = new Map();   // 速成碼 -> [全部候選字]（按常用程度）
const LV1 = [], LV2 = [], HK = [];
function loadData(s, arr) {
  if (!s) return;
  for (const tok of s.split(' ')) {
    const ch = String.fromCodePoint(tok.codePointAt(0));   // 香港字有擴展 B 區字（兩個 UTF-16 單位）
    const codes = tok.slice(ch.length).split('|');
    DICT.set(ch, codes);
    arr.push(ch);
    for (const c of codes) {
      if (!REV.has(c)) REV.set(c, []);
      const r = REV.get(c);
      if (r.length < 6) r.push(ch);
    }
    if (QUICK) {
      const qs = [...new Set(codes.map(quickOf))];
      QDICT.set(ch, qs);
      for (const q of qs) {
        if (!QREV.has(q)) QREV.set(q, []);
        QREV.get(q).push(ch);
      }
    }
  }
}
loadData(window.CJ_LV1, LV1);
loadData(window.CJ_LV2, LV2);
loadData(window.CJ_HK, HK);
for (const [ch, p] of PINFO) {
  DICT.set(ch, [p.code]);
  if (!REV.has(p.code)) REV.set(p.code, [ch]);
  if (QUICK) { QDICT.set(ch, [p.code]); if (!QREV.has(p.code)) QREV.set(p.code, [ch]); }
}
// 速成碼與「微軟速成」候選次序：採用傳統速成字表（quick-classic，倉頡三代碼，與微軟速成一致）。
// 字表沒有的香港字，用倉頡五代碼推出速成碼，按 Big5 內碼次序排在最後。
const QREV_B5 = new Map();
if (QUICK) {
  const rankOf = list => { const m = new Map(); let i = 0; for (const ch of list) m.set(ch, i++); return ch => m.has(ch) ? m.get(ch) : 1e9; };
  const b5 = rankOf(window.CJ_B5ORDER || '');
  const fq = rankOf(LV1.concat(LV2, HK));
  if (window.CJ_QC) {
    const msDict = new Map();
    for (const tok of window.CJ_QC.split(' ')) {
      const code = /^[a-y]+/.exec(tok)[0];
      const chars = [...tok.slice(code.length)];
      QREV_B5.set(code, chars);
      for (const ch of chars) { if (!msDict.has(ch)) msDict.set(ch, []); msDict.get(ch).push(code); }
    }
    const extra = new Map();
    for (const [ch, qs] of QDICT) {
      if (msDict.has(ch) || PINFO.has(ch)) continue;
      msDict.set(ch, qs);
      for (const q of qs) { if (!extra.has(q)) extra.set(q, []); extra.get(q).push(ch); }
    }
    for (const [q, list] of extra) QREV_B5.set(q, (QREV_B5.get(q) || []).concat(list.sort((a, b) => b5(a) - b5(b))));
    for (const [ch, p] of PINFO) { msDict.set(ch, [p.code]); if (!QREV_B5.has(p.code)) QREV_B5.set(p.code, [ch]); }
    QDICT.clear(); for (const [ch, qs] of msDict) QDICT.set(ch, qs);
  } else {
    for (const [k, v] of QREV) QREV_B5.set(k, PINFO.has(v[0]) ? v : [...v].sort((a, b) => b5(a) - b5(b)));
  }
  // 「常用程度」次序：同一組候選字，改按字頻排列
  QREV.clear();
  for (const [k, v] of QREV_B5) QREV.set(k, PINFO.has(v[0]) ? v : [...v].sort((a, b) => fq(a) - fq(b)));
}
const candList = buf => (QUICK ? (cfg.qorder === 'freq' ? QREV : QREV_B5) : REV).get(buf) || [];
// 字根練習時只收單碼
const RAD_CODE = {};
for (const ch of RAD_CHARS) {
  const one = (DICT.get(ch) || []).find(c => c.length === 1);
  if (one) RAD_CODE[ch] = one;
}

/* ---------- 狀態與設定 ---------- */
const $ = s => document.querySelector(s);
const store = {
  pre: QUICK ? 'qk-' : 'cj-',   // 速成版與倉頡版分開記錄
  get(k, d) { try { const v = localStorage.getItem(this.pre + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(this.pre + k, JSON.stringify(v)); } catch {} },
};
const cfg = Object.assign({ range: '300', order: 'rand', hintMode: 'error', auto: false, passage: 0, mode: 'char',
  mix: false, punctSrc: 'rand', punctWay: 'any', qorder: 'big5',
  dark: !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) }, store.get('cfg', {}));
const errBook = store.get('errors', {});
const seqPos = store.get('seq', {});
const ROUND = 20;

if (QUICK) {
  cfg.auto = false;
  // 速成版標點預設「直接按符號鍵」（一鍵出全形標點；Ctrl / ` + 符號鍵也接受）
  if (cfg.qpunctVer !== 2) { cfg.punctWay = 'key'; cfg.qpunctVer = 2; }
  if (!['ms', 'key'].includes(cfg.punctWay)) cfg.punctWay = 'key';
}
// 速成版只練鍵盤打得出的標點（〈〉·【】〔〕 在微軟速成要用符號鍵盤）
const keyable = s => [...s].filter(c => !QUICK || PINFO.get(c).key).join('');
const P_POOL = keyable(PUNCT_POOL), M_POOL = keyable(MIX_POOL);
const S = { tokens: [], spans: [], pos: 0, buf: '', page: 0, done: false, title: '',
  typed: 0, firstOk: 0, errs: 0, active: 0, last: 0 };

function saveCfg() { store.set('cfg', cfg); }
function addErr(ch) { if (PINFO.has(ch)) return; errBook[ch] = (errBook[ch] || 0) + 1; store.set('errors', errBook); }
function decErr(ch) { if (errBook[ch]) { errBook[ch]--; if (errBook[ch] <= 0) delete errBook[ch]; store.set('errors', errBook); } }

/* ---------- 題目產生 ---------- */
function pool(range) {
  if (range === 'rad') return [...RAD_CHARS];
  if (range === 'lv1') return LV1;
  if (range === 'lv2') return LV2;
  if (range === 'all') return LV1.concat(LV2);
  if (range === 'hk') return HK;
  if (range === 'hk1000') return HK.slice(0, 1000);
  if (range === 'allhk') return LV1.concat(LV2, HK);
  return LV1.slice(0, +range);
}
function sample(arr, n) {
  const res = [], used = new Set();
  n = Math.min(n, arr.length);
  while (res.length < n) {
    const i = Math.floor(Math.random() * arr.length);
    if (!used.has(i)) { used.add(i); res.push(arr[i]); }
  }
  return res;
}
function genChars() {
  const p = pool(cfg.range);
  if (cfg.order === 'seq') {
    let i = seqPos[cfg.range] || 0;
    if (i >= p.length) i = 0;
    const out = p.slice(i, i + ROUND);
    seqPos[cfg.range] = i + out.length;
    store.set('seq', seqPos);
    const n = Math.min(i + out.length, p.length);
    S.title = `依常用程度：第 ${i + 1}–${n} 字（共 ${p.length} 字）`;
    return mixIn(out);
  }
  S.title = `隨機抽 ${Math.min(ROUND, p.length)} 字（範圍 ${p.length} 字）`;
  return mixIn(sample(p, ROUND));
}
// 在字與字之間隨機插入標點
function mixIn(arr) {
  if (!cfg.mix) return arr.join('');
  let s = '';
  arr.forEach((ch, i) => {
    s += ch;
    if (i < arr.length - 1 && Math.random() < 0.35) s += M_POOL[Math.floor(Math.random() * M_POOL.length)];
  });
  return s + '。';
}
function genPunct() {
  if (cfg.punctSrc === 'passage') {
    const p = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    S.title = `文章填標點〈${p.title}〉：文字已打好，只要打出標點`;
    S.punctOnly = true;
    return p.text;
  }
  S.title = QUICK ? '標點符號練習：直接按符號鍵（也可以用 Ctrl + 符號鍵，或先按 ` 再按符號鍵）'
    : '標點符號練習：可以直接按符號鍵，或打 ZX 開頭的符號碼';
  let s = '';
  for (let i = 0; i < ROUND; i++) s += P_POOL[Math.floor(Math.random() * P_POOL.length)];
  return s;
}
function genReview() {
  const list = Object.entries(errBook).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, ROUND);
  S.title = list.length ? `錯字複習：共 ${Object.keys(errBook).length} 個字待加強（打對一次扣一次紀錄）` : '';
  return sample(list, list.length).join('');
}
function normalizeCustom(t) {
  const map = { ',': '，', '?': '？', '!': '！', ':': '：', ';': '；', '(': '（', ')': '）',
    '“': '「', '”': '」', '‘': '『', '’': '』', '⋯': '…', '─': '—', '‧': '·', '．': '。' };
  return t.replace(/\r/g, '').replace(/[,?!:;()“”‘’⋯─‧．]/g, c => map[c]);
}

/* ---------- 流程 ---------- */
function resetStats() { S.typed = 0; S.firstOk = 0; S.errs = 0; S.active = 0; S.last = 0; }
function setTokens(str, keepStats) {
  S.tokens = [...str].map(ch => {
    const given = S.punctOnly && !PINFO.has(ch);
    return { ch, skip: given || !DICT.has(ch), given, err: 0, peek: false };
  });
  S.pos = 0; clearBuf(); S.bq = false; S.done = false;
  if (!keepStats) resetStats();
  skipAhead();
  $('#result').hidden = true;
  setMsg('');
  render();
  if (S.pos >= S.tokens.length) {
    showResult(S.mode === 'review' ? '目前沒有錯字紀錄，太棒了！<br>先去其他模式練習吧。'
      : S.mode === 'custom' ? '請在上方貼上要練習的文字，再按「開始練習」。' : '沒有可練習的字。', false);
  }
}
function startMode(keepStats) {
  const m = cfg.mode;
  S.mode = m;
  S.punctOnly = false;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  document.querySelectorAll('.opt[data-for]').forEach(d => { d.hidden = d.dataset.for !== m; });
  if (m === 'char') setTokens(genChars(), keepStats);
  else if (m === 'punct') setTokens(genPunct(), keepStats);
  else if (m === 'review') setTokens(genReview(), keepStats);
  else if (m === 'text') {
    const p = PASSAGES[cfg.passage] || PASSAGES[0];
    S.title = `〈${p.title}〉`;
    setTokens(p.text, keepStats);
  } else if (m === 'custom') {
    S.title = '自訂文字';
    setTokens(normalizeCustom(store.get('custom', '')), keepStats);
  }
}
function nextRound() {
  if (S.mode === 'text') {
    cfg.passage = (cfg.passage + 1) % PASSAGES.length; saveCfg();
    $('#passage').value = cfg.passage;
    startMode(false);
  } else if (S.mode === 'custom') startMode(false);
  else startMode(true);
}
function cur() { return S.tokens[S.pos]; }
function skipAhead() { while (S.pos < S.tokens.length && S.tokens[S.pos].skip) S.pos++; }
function codesOf(ch) {
  if (cfg.mode === 'char' && cfg.range === 'rad' && RAD_CODE[ch]) return [RAD_CODE[ch]];
  return (QUICK ? QDICT : DICT).get(ch) || [];
}
// 速成：目標字在某個碼的候選清單中的位置
function quickPos(ch, code) {
  return candList(code).indexOf(ch);
}

function accept(n) {
  for (let i = 0; i < n && S.pos < S.tokens.length; i++) {
    const t = S.tokens[S.pos];
    S.typed++;
    if (!t.err && !t.peek) { S.firstOk++; decErr(t.ch); }
    S.pos++;
    skipAhead();
  }
  clearBuf();
  setMsg('');
  if (S.pos >= S.tokens.length) finish();
  refresh();
}
function wrong(text) {
  const t = cur();
  t.err++; S.errs++;
  addErr(t.ch);
  clearBuf();
  setMsg('✗ ' + text);
  const bar = $('#inputBar');
  bar.classList.remove('shake'); void bar.offsetWidth; bar.classList.add('shake');
  refresh();
}
function commit(sel = 0) {
  const t = cur();
  if (!t || !S.buf) return;
  if (QUICK && !PINFO.has(t.ch)) return commitQuick(t, sel);
  if (codesOf(t.ch).includes(S.buf)) {
    const p = PINFO.get(t.ch);
    if (p && p.key && cfg.punctWay === 'key') return wrong(`「${t.ch}」請直接按符號鍵：${p.label}`);
    return accept(1);
  }
  const got = (REV.get(S.buf) || [])[0];
  wrong(got ? `你打出了「${got}」（${S.buf.toUpperCase()}），正確是「${t.ch}」` : `${S.buf.toUpperCase()} 不是有效的倉頡碼`);
}
function clearBuf() { S.buf = ''; S.page = 0; S.focus = 0; S.open = false; }
// 速成（仿微軟速成）：打滿兩碼自動開候選窗；一碼要按空白鍵開窗。
// 候選窗開著時：空白鍵＝下一頁，數字鍵選字，Enter 選反白的字，↑↓ 移動反白。
function quickSpace() {
  const cands = candList(S.buf);
  if (!cands.length) return wrong(`${S.buf.toUpperCase()} 不是有效的速成碼`);
  if (!S.open) { S.open = true; S.page = 0; }
  else { const pages = Math.ceil(cands.length / PAGE); S.page = (S.page + 1) % pages; }
  S.focus = 0;
  updateBuf(); updateKb();
}
function commitQuick(t, sel) {
  const cands = candList(S.buf);
  const B = S.buf.toUpperCase();
  if (!cands.length) return wrong(`${B} 不是有效的速成碼`);
  const got = cands[S.page * PAGE + sel];
  if (!got) return;   // 這一頁沒有那麼多候選字，忽略
  if (got === t.ch) return accept(1);
  const idx = cands.indexOf(t.ch);
  if (idx >= 0) return wrong(`你選了「${got}」。${B} 碼對了，「${t.ch}」在${placeText(idx, S.buf.length)}`);
  wrong(`你打出了「${got}」（${B}），正確是「${t.ch}」`);
}
function placeText(idx, len = 2) {
  const p = Math.floor(idx / PAGE), n = idx % PAGE + 1;
  const keys = (len < 2 ? ['空白鍵開候選'] : []).concat(p ? [`空白鍵翻 ${p} 頁`] : [], [`按 ${n}`]);
  return (p ? `第 ${p + 1} 頁的` : '') + `第 ${n} 個（${keys.join('，再')}）`;
}
// 速成版的標點：微軟速成用 Ctrl + 符號鍵，或先按 ` 再按符號鍵
const msLabel = label => `Ctrl + ${label.replace(/（.*）/, '')}　或　\` 再按 ${label.replace(/（.*）/, '')}`;
function punctKey(out, via = 'plain') {
  const t = cur();
  if (!t) return;
  if (cfg.punctWay === 'code' && PINFO.has(t.ch)) return wrong(`請用符號碼輸入「${t.ch}」：${PINFO.get(t.ch).code.toUpperCase()}`);
  if (QUICK && cfg.punctWay === 'ms' && via === 'plain' && PINFO.has(t.ch) && PINFO.get(t.ch).key)
    return wrong(`微軟速成的全形標點要用 Ctrl 或 \`：「${t.ch}」請按 ${msLabel(PINFO.get(t.ch).label)}`);
  const slice = S.tokens.slice(S.pos, S.pos + out.length).map(x => x.ch).join('');
  if (slice === out) return accept(out.length);
  if (out[0] === t.ch) return accept(1);
  wrong(`你打出了「${out}」，正確是「${t.ch}」`);
}
function finish() {
  S.done = true;
  const acc = S.typed ? Math.round(S.firstOk / S.typed * 100) : 100;
  const spd = S.active > 2000 ? Math.round(S.typed / (S.active / 60000)) : '—';
  const nextLabel = S.mode === 'text' ? '下一篇' : S.mode === 'custom' ? '再練一次' : '下一回合';
  showResult(`<div class="big">完成！</div><div>已打 ${S.typed} 字 · 一次打對 ${acc}% · 速度 ${spd} 字/分</div>`, nextLabel);
}
function showResult(html, nextLabel) {
  const r = $('#result');
  r.innerHTML = html + (nextLabel ? `<div><button class="btn primary" id="nextBtn">${nextLabel}（Enter）</button></div>` : '');
  r.hidden = false;
  S.done = true;
  const b = $('#nextBtn');
  if (b) b.onclick = () => { b.blur(); nextRound(); };
}

/* ---------- 畫面 ---------- */
function keyHtml(c) { return `<span class="k"><b>${RAD[c] || c}</b><i>${c.toUpperCase()}</i></span>`; }
function render() {
  const el = $('#text');
  el.className = (S.mode === 'text' || S.mode === 'custom' || S.punctOnly) ? 'para' : 'grid';
  el.innerHTML = '';
  S.spans = S.tokens.map(t => {
    if (t.ch === '\n') { const br = document.createElement('br'); el.appendChild(br); return null; }
    const s = document.createElement('span');
    s.textContent = t.ch;
    el.appendChild(s);
    return s;
  });
  $('#title').textContent = S.title;
  refresh();
}
function refresh() {
  S.tokens.forEach((t, i) => {
    const s = S.spans[i];
    if (!s) return;
    let c = '';
    if (t.given) c = '';
    else if (t.skip) c = 'skip';
    else if (i < S.pos) c = t.err ? 'bad' : t.peek ? 'hinted' : 'good';
    else if (i === S.pos && !S.done) c = 'cur';
    s.className = c;
  });
  const cs = S.spans[S.pos];
  if (cs && !S.done) cs.scrollIntoView({ block: 'nearest' });
  updateHint(); updateBuf(); updateKb(); updateStats();
}
function hintVisible(t) {
  if (!t) return false;
  return t.peek || cfg.hintMode === 'always' || (cfg.hintMode === 'error' && t.err > 0);
}
function updateHint() {
  const t = S.done ? null : cur();
  $('#hChar').textContent = t ? t.ch : '';
  const body = $('#hBody');
  if (!t) { body.innerHTML = ''; return; }
  if (!hintVisible(t)) { body.innerHTML = '<div class="muted">想不起來？按 <kbd>Tab</kbd> 看提示</div>'; return; }
  const p = PINFO.get(t.ch);
  if (p && QUICK && p.key) {
    body.innerHTML = cfg.punctWay === 'ms'
      ? `<div><kbd>Ctrl</kbd> + <kbd>${p.label}</kbd></div><div class="muted" style="margin-top:6px">或先按 <kbd>\`</kbd> 再按 <kbd>${p.label}</kbd></div>`
      : `<div>按鍵：<kbd>${p.label}</kbd></div><div class="muted" style="margin-top:6px">（也可以用 Ctrl + 符號鍵）</div>`;
    return;
  }
  if (p) {
    if (p.key && cfg.punctWay === 'key') { body.innerHTML = `<div>按鍵：<kbd>${p.label}</kbd></div>`; return; }
    if (cfg.punctWay === 'code') { body.innerHTML = `<div>打符號碼</div><div class="code">${[...p.code].map(keyHtml).join('')}</div>`; return; }
    body.innerHTML = (p.key ? `<div>按鍵：<kbd>${p.label}</kbd></div><div class="muted" style="margin-top:6px">或打符號碼</div>` : '<div>打符號碼</div>')
      + `<div class="code">${[...p.code].map(keyHtml).join('')}</div>`;
    return;
  }
  const codes = codesOf(t.ch);
  if (QUICK) {
    const full = (DICT.get(t.ch) || []).map(c => c.toUpperCase()).join('／');
    body.innerHTML = codes.map(c => `<div class="code">${[...c].map(keyHtml).join('')}</div>`
      + `<div class="muted">候選${placeText(Math.max(0, quickPos(t.ch, c)), c.length)}</div>`).join('')
      + `<div class="muted" style="margin-top:6px">倉頡碼（五代）：${full}</div>`;
    return;
  }
  body.innerHTML = codes.map(c => `<div class="code">${[...c].map(keyHtml).join('')}</div>`).join('')
    + (codes.length > 1 ? '<div class="muted">以上任一種都可以</div>' : '');
}
function updateBuf() {
  const t = cur();
  const el = $('#buf');
  el.innerHTML = [...S.buf].map(keyHtml).join('') + '<span class="caret"></span>';
  const ok = !t || !S.buf || codesOf(t.ch).some(c => c.startsWith(S.buf));
  el.classList.toggle('wrong', !ok && cfg.hintMode !== 'never');
  const cands = S.buf ? candList(S.buf) : [];
  if (QUICK && S.bq) { $('#cand').innerHTML = '<span class="pg">已按 ` ，再按符號鍵輸入全形標點</span>'; return; }
  if (!QUICK || (t && PINFO.has(t.ch))) {
    $('#cand').textContent = cands.length ? '候選：' + cands.slice(0, 6).map((c, i) => `${i + 1}.${c}`).join(' ') : '';
    return;
  }
  const pages = Math.ceil(cands.length / PAGE);
  const show = hintVisible(t);
  if (!S.open) {
    $('#cand').innerHTML = S.buf && cands.length ? '<span class="pg">按 <kbd>空白鍵</kbd> 開啟候選字</span>' : '';
    return;
  }
  $('#cand').innerHTML = cands.length
    ? cands.slice(S.page * PAGE, S.page * PAGE + PAGE)
        .map((c, i) => `<span class="cd${show && c === t.ch ? ' tgt' : ''}${i === S.focus ? ' foc' : ''}"><small>${i + 1}</small>${c}</span>`).join('')
      + `<span class="pg">${pages > 1 ? `${S.page + 1}/${pages} 頁　<kbd>空白鍵</kbd> 下一頁　` : ''}<kbd>數字</kbd> 或 <kbd>Enter</kbd> 選字</span>`
    : '';
}
function setMsg(text, ok) { const m = $('#msg'); m.textContent = text; m.className = ok ? 'ok' : ''; }
function updateStats() {
  const acc = S.typed ? Math.round(S.firstOk / S.typed * 100) + '%' : '—';
  const spd = S.active > 2000 ? Math.round(S.typed / (S.active / 60000)) : '—';
  const left = S.tokens.slice(S.pos).filter(t => !t.skip).length;
  $('#stats').innerHTML = `<span>已打 <b>${S.typed}</b> 字</span><span>剩 <b>${left}</b> 字</span>`
    + `<span>一次打對 <b>${acc}</b></span><span>速度 <b>${spd}</b> 字/分</span><span>錯 <b>${S.errs}</b> 次</span>`
    + `<span>錯字簿 <b>${Object.keys(errBook).length}</b> 字</span>`;
}
const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function buildKb() {
  const kb = $('#kb');
  kb.innerHTML = KB_ROWS.map(r => `<div class="row">${[...r].map(c =>
    `<div class="key" data-k="${c}"><b>${RAD[c] || ''}</b><i>${c.toUpperCase()}</i></div>`).join('')}</div>`).join('')
    + `<div class="row"><div class="key space" data-k=" ">${QUICK ? '空白鍵（開候選／下一頁）' : '空白鍵（上字）'}</div></div>`;
}
function updateKb() {
  document.querySelectorAll('#kb .key.next').forEach(k => k.classList.remove('next'));
  const t = S.done ? null : cur();
  if (!hintVisible(t)) return;
  const code = codesOf(t.ch).find(c => c.startsWith(S.buf));
  if (!code) return;
  let k = code.length > S.buf.length ? code[S.buf.length] : ' ';
  // 速成：候選窗沒開或目標在後面的頁 → 提示空白鍵；已在本頁 → 用數字鍵，不亮鍵
  if (QUICK && k === ' ' && !PINFO.has(t.ch) && S.open && Math.floor(quickPos(t.ch, code) / PAGE) === S.page) return;
  const el = document.querySelector(`#kb .key[data-k="${k}"]`);
  if (el) el.classList.add('next');
}
function flashKey(k) {
  const el = document.querySelector(`#kb .key[data-k="${k}"]`);
  if (!el) return;
  el.classList.add('press');
  setTimeout(() => el.classList.remove('press'), 120);
}

/* ---------- 鍵盤 ---------- */
function tick() {
  const now = performance.now();
  if (S.last) S.active += Math.min(now - S.last, 5000);
  S.last = now;
}
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { $('#imeWarn').hidden = false; return; }
  const k = e.key;
  // 速成版：Ctrl + 符號鍵 → 全形標點（同微軟速成）
  if (QUICK && e.ctrlKey && !e.altKey && !e.metaKey && KEYOUT[k] && !S.done) {
    e.preventDefault(); tick();
    if (S.buf) return setMsg('請先選字，或按 Esc 取消輸入碼');
    S.bq = false;
    return punctKey(KEYOUT[k], 'ms');
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  $('#imeWarn').hidden = true;

  if (S.done) {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); if ($('#nextBtn')) nextRound(); }
    return;
  }
  // 速成版：先按 ` 再按符號鍵 → 全形標點
  if (QUICK && k === '`' && !S.buf) { e.preventDefault(); S.bq = !S.bq; updateBuf(); return; }
  if (QUICK && S.bq) {
    if (k === 'Shift') return;
    S.bq = false;
    if (KEYOUT[k]) { e.preventDefault(); tick(); return punctKey(KEYOUT[k], 'ms'); }
    updateBuf();
    if (k === 'Escape') return;
  }
  if (/^[a-zA-Z]$/.test(k)) {
    e.preventDefault();
    const c = k.toLowerCase();
    flashKey(c); tick();
    // 速成最多兩碼（Z 開頭的符號碼除外）
    const max = QUICK && S.buf[0] !== 'z' && c !== 'z' ? 2 : 5;
    if (S.buf.length < max) { S.buf += c; S.page = 0; S.focus = 0; }
    if (QUICK && S.buf.length === 2 && S.buf[0] !== 'z') S.open = true;   // 打滿兩碼自動開候選窗
    const t = cur();
    if (cfg.auto && t && codesOf(t.ch).includes(S.buf)) return commit();
    updateBuf(); updateKb();
    return;
  }
  if (QUICK && S.buf && S.open) {
    const cands = candList(S.buf);
    const onPage = Math.min(PAGE, cands.length - S.page * PAGE);
    if (/^[1-9]$/.test(k)) { e.preventDefault(); tick(); commit(+k - 1); return; }
    if (k === 'Enter') { e.preventDefault(); tick(); commit(S.focus); return; }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      S.focus = (S.focus + (k === 'ArrowDown' ? 1 : onPage - 1)) % onPage;
      updateBuf(); return;
    }
    if (k === 'PageDown' || k === 'PageUp') {
      e.preventDefault();
      const pages = Math.ceil(cands.length / PAGE);
      S.page = (S.page + (k === 'PageDown' ? 1 : pages - 1)) % pages; S.focus = 0;
      updateBuf(); updateKb(); return;
    }
  }
  if (QUICK && S.buf && k === ' ') {
    const t = cur();
    if (!(t && PINFO.has(t.ch))) { e.preventDefault(); flashKey(' '); tick(); quickSpace(); return; }
  }
  if (k === 'Backspace') {
    e.preventDefault(); S.buf = S.buf.slice(0, -1); S.page = 0; S.focus = 0;
    S.open = QUICK && S.buf.length === 2;
    updateBuf(); updateKb(); return;
  }
  if (k === 'Escape') { clearBuf(); updateBuf(); updateKb(); return; }
  if (k === 'Tab') {
    e.preventDefault();
    const t = cur();
    if (t) { t.peek = true; refresh(); }
    return;
  }
  if (k === ' ' || k === 'Enter') { e.preventDefault(); flashKey(' '); tick(); commit(); return; }
  if (KEYOUT[k]) {
    e.preventDefault(); tick();
    if (QUICK && S.buf) return setMsg('請先選字，或按 Esc 取消輸入碼');
    if (S.buf) { const before = S.pos; commit(); if (S.pos === before || S.done) return; }
    punctKey(KEYOUT[k]);
  }
});

/* ---------- 選項 ---------- */
function initUi() {
  const rs = [['rad', `24 個基本字根`], ['100', '最常用 100 字'], ['300', '最常用 300 字'], ['500', '最常用 500 字'],
    ['1000', '最常用 1000 字'], ['2000', '最常用 2000 字'], ['3000', '最常用 3000 字'],
    ['lv1', `常用字全部（${LV1.length} 字）`], ['lv2', `次常用字（${LV2.length} 字）`],
    ['all', `全部繁體字（${LV1.length + LV2.length} 字）`],
    ['hk1000', '香港字 HKSCS：較常用 1000 字'], ['hk', `香港字 HKSCS 全部（${HK.length} 字）`],
    ['allhk', `繁體字＋香港字（${LV1.length + LV2.length + HK.length} 字）`]];
  $('#range').innerHTML = rs.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  $('#passage').innerHTML = PASSAGES.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join('');
  $('#range').value = cfg.range; $('#order').value = cfg.order; $('#hintMode').value = cfg.hintMode;
  $('#auto').checked = cfg.auto; $('#passage').value = cfg.passage;
  $('#mix').checked = cfg.mix; $('#punctSrc').value = cfg.punctSrc; $('#punctWay').value = cfg.punctWay;
  const applyTheme = () => {
    document.body.classList.toggle('dark', cfg.dark);
    $('#themeBtn').textContent = cfg.dark ? '☀️ 淺色' : '🌙 深色';
  };
  applyTheme();
  $('#themeBtn').onclick = e => { e.target.blur(); cfg.dark = !cfg.dark; saveCfg(); applyTheme(); };
  $('#customText').value = store.get('custom', '');
  if (QUICK) $('#auto').closest('label').hidden = true;
  if ($('#qorder')) {
    $('#qorder').value = cfg.qorder;
    $('#qorder').addEventListener('change', e => { cfg.qorder = e.target.value; saveCfg(); e.target.blur(); S.buf = ''; S.page = 0; refresh(); });
  }

  const on = (id, fn) => $(id).addEventListener('change', e => { fn(e.target); saveCfg(); e.target.blur(); });
  on('#range', el => { cfg.range = el.value; startMode(false); });
  on('#order', el => { cfg.order = el.value; startMode(false); });
  on('#passage', el => { cfg.passage = +el.value; startMode(false); });
  on('#hintMode', el => { cfg.hintMode = el.value; refresh(); });
  on('#auto', el => { cfg.auto = el.checked; });
  on('#mix', el => { cfg.mix = el.checked; startMode(false); });
  on('#punctSrc', el => { cfg.punctSrc = el.value; startMode(false); });
  on('#punctWay', el => { cfg.punctWay = el.value; refresh(); });
  $('#restart').onclick = e => { e.target.blur(); startMode(false); };
  $('#customGo').onclick = e => {
    e.target.blur();
    store.set('custom', $('#customText').value);
    startMode(false);
  };
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
    b.blur(); cfg.mode = b.dataset.mode; saveCfg(); startMode(false);
  });

  // 說明表格
  $('#radTable').innerHTML = RAD_GROUPS.map(([name, ks]) =>
    `<tr><th>${name}</th>${[...ks].map(c => `<td>${RAD[c]}<br><kbd>${c.toUpperCase()}</kbd></td>`).join('')}</tr>`).join('');
  if (QUICK) $('#punctTable').innerHTML = '<tr><th>符號</th><th>直接按</th><th>或</th></tr>'
    + PUNCT.filter(p => p[1]).map(([ch, , , label]) => `<tr><td style="font-size:20px">${ch}</td><td><kbd>${label}</kbd></td><td>${msLabel(label)}</td></tr>`).join('');
  else $('#punctTable').innerHTML = '<tr><th>符號</th><th>按鍵</th><th>符號碼</th></tr>'
    + PUNCT.map(([ch, , code, label]) => `<tr><td style="font-size:20px">${ch}</td><td>${label ? `<kbd>${label}</kbd>` : '—'}</td><td>${code.toUpperCase()}</td></tr>`).join('');
  buildKb();
}

initUi();
startMode(false);
