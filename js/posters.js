// 海报文件清单
const POSTER_FILES = ["0430.jpg","母亲节.webp","芒种.webp","1-1.jpg","1-2.jpg","1-3.jpg","2-1.jpg","2-2.jpg","2-3.jpg","3-1.jpg","3-2.jpg","3-3.jpg","4-1.jpg","4-2.jpg","4-3.jpg","520.jpg","C01开业-1.jpg","C01开业-2.jpg","C01开业-3.jpg","Y01第七批-7.jpg","七夕.jpg","上虞开业.jpg","中面部.jpg","中面部提升紧致1-1.jpg","五一假期.jpg","五四青年节.jpg","人体微生态活菌海报-1.jpg","创业宣发1-1.jpg","创业宣发1-2.jpg","创业宣发1-3.jpg","创业宣发2-1.jpg","创业宣发2-2.jpg","创业宣发2-3.jpg","创业宣发海报3-1.jpg","创业宣发海报3-3.jpg","创意海报5-1.png","创享自由-美小约招商.webp","南通开业.jpg","南通操作会0506.jpg","南通沙龙.jpg","反重力0514-1.jpg","反重力0514-11.jpg","反重力0514-2.jpg","反重力0514-3.jpg","反重力0514-7.jpg","反重力0514-8.jpg","反重力1.jpg","反重力2.jpg","反重力3.jpg","反重力4.jpg","口周.jpg","口周抗衰1-4.jpg","夏日嘭弹季-11.jpg","夏日嘭弹季-2.jpg","外轮廓.jpg","外轮廓固定1-2.jpg","未标题-1.jpg","水光高定2.jpg","父亲节.jpg","盛夏抵衰-1.jpg","眼周.jpg","眼周抗衰1-3.jpg","秋季抗衰沙龙.jpg","蜂巢激光皮秒1-1.jpg","蜂巢激光皮秒1-2.jpg","蜂巢激光皮秒1-3.jpg","蜂巢激光皮秒1-4.jpg","财富沙盘活动.jpg","黑卡-2.jpg"];

// 分组规则：按系列归类，其余进瀑布流
const series = [
  { name: '节日节点海报', note: '520 / 七夕 / 五一 / 五四 / 父亲节', match: f =>
      /^(520|七夕|五一假期|五四青年节|父亲节|0430|母亲节|芒种)/.test(f) },
  { name: '开业与活动', note: '门店开业 / 沙龙活动', match: f =>
      /^(C01开业|上虞开业|南通|财富沙盘活动|Y01)/.test(f) },
  { name: '创业宣发系列', note: '招募 / 品牌宣发', match: f => /^创业宣发/.test(f) },
  { name: '反重力 · 引力计划', note: '产品 campaign / 系列延展', match: f => f.startsWith('反重力') },
  { name: '抗衰项目系列', note: '眼周 / 口周 / 中面部 / 外轮廓 / 蜂巢皮秒', match: f =>
      /^(眼周|口周|中面部|外轮廓|水光|夏日嘭弹季|盛夏抵衰|蜂巢|秋季抗衰沙龙|黑卡)/.test(f) },
];

const sorted = POSTER_FILES.slice().sort((a,b) => a.localeCompare(b, 'zh', { numeric: true }));
const used = new Set();
series.forEach(s => {
  s.files = sorted.filter(f => s.match(f) && !used.has(f));
  s.files.forEach(f => used.add(f));
});
const leftovers = sorted.filter(f => !used.has(f));

// 渲染系列行
const wrap = document.getElementById('seriesWrap');
series.filter(s => s.files.length).forEach(s => {
  const sec = document.createElement('div');
  sec.className = 'series';
  sec.innerHTML = `<div class="series-head"><h3>${s.name}</h3><span>${s.note}</span></div>`;
  const sc = document.createElement('div');
  sc.className = 'series-scroll';
  s.files.forEach(f => sc.appendChild(card(f, s.name)));
  sec.appendChild(sc);
  wrap.appendChild(sec);
});

// 渲染瀑布流
const masonry = document.getElementById('masonry');
leftovers.forEach(f => masonry.appendChild(card(f, '更多创作')));

// 生成卡片
function card(file, group) {
  const c = document.createElement('div');
  c.className = 'poster-card';
  c.innerHTML = `<img src="assets/posters/${file}" loading="lazy" alt="${file}">`;
  c.addEventListener('click', () => openLightbox(file, group));
  return c;
}

// 灯箱：在所属分组的文件列表内前后切换
let lbList = [], lbIdx = 0;
const lb = document.getElementById('lightbox'),
      lbImg = document.getElementById('lbImg'),
      lbCap = document.getElementById('lbCaption');
function openLightbox(file, group) {
  const g = series.find(s => s.name === group);
  lbList = (group === '更多创作') ? leftovers : (g ? g.files : [file]);
  lbIdx = lbList.indexOf(file);
  show();
  lb.classList.add('open');
  document.body.classList.add('lb-blur');
  requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('show')));
  document.body.style.overflow = 'hidden';
}
function show(dir) {
  const f = lbList[lbIdx];
  const swap = () => {
    lbImg.src = `assets/posters/${f}`;
    lbCap.textContent = `${f.replace(/\.[^.]+$/, '')}　${lbIdx + 1} / ${lbList.length}`;
  };
  if (!dir) { swap(); return; }               // 首次打开无方向
  // 先预加载新图，避免切换时空白闪跳
  const img = new Image();
  img.src = `assets/posters/${f}`;
  const play = () => {
    // 旧图渐隐 → 换图 → 新图渐显（纯 transition，无关键帧冲突）
    lbImg.classList.add('lb-dim');
    setTimeout(() => {
      swap();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => lbImg.classList.remove('lb-dim'));
      });
    }, 300);
  };
  img.complete ? play() : (img.onload = play);
}
function closeLightbox() {
  lb.classList.remove('show');
  document.body.classList.remove('lb-blur');
  setTimeout(() => { lb.classList.remove('open'); document.body.style.overflow = ''; }, 400);
}
document.getElementById('lbClose').addEventListener('click', closeLightbox);
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; show('left'); }
  if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbList.length; show('right'); }
});
document.getElementById('lbPrev').addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; show('left'); });
document.getElementById('lbNext').addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbList.length; show('right'); });
