// 自定义 PDF 查看器：白容器 + 缩略图栏 + 页码 + 缩放胶囊（按效果图样式）
const pdfjsLib = window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.js', document.baseURI).href;

const CMAP = new URL('assets/pdfjs/', document.baseURI).href;
const THUMB_W = 126;

async function initViewer(el) {
  const url = el.dataset.src;
  const title = el.dataset.title || '文档';
  el.innerHTML = `
    <div class="pv-toolbar">
      <div class="pv-left">
        <button class="pv-menu" title="缩略图"><svg viewBox="0 0 24 24" width="18" height="18"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></g></svg></button>
        <span class="pv-title">${title}</span>
      </div>
      <span class="pv-page"><b class="pv-cur">1</b>&nbsp;/&nbsp;<span class="pv-total">…</span></span>
      <div class="pv-zoom">
        <button class="pv-out">−</button><span class="pv-pct">100%</span><button class="pv-in">+</button>
      </div>
    </div>
    <div class="pv-body">
      <div class="pv-thumbs"><div class="pv-thumb-list"></div></div>
      <div class="pv-scroll"><div class="pv-pages"></div></div>
    </div>`;
  const $ = s => el.querySelector(s);
  const scroll = $('.pv-scroll'), pagesEl = $('.pv-pages'),
        thumbList = $('.pv-thumb-list'), cur = $('.pv-cur'), total = $('.pv-total'),
        pct = $('.pv-pct'), thumbsEl = $('.pv-thumbs');

  const doc = await pdfjsLib.getDocument({ url, cMapUrl: CMAP, cMapPacked: true }).promise;
  total.textContent = doc.numPages;

  const CONTENT_W = () => Math.max(320, scroll.clientWidth - 48);  // 页面显示宽度
  let zoom = 1;
  let aspect = [];          // 每页高宽比
  let gen = 0;              // 渲染代际：缩放切换后旧渲染作废
  const doneGen = {};       // page -> 渲染时的 gen
  const thumbDone = new Set();

  // 读取每页尺寸，建立占位
  const pageVp = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const vp = (await doc.getPage(i)).getViewport({ scale: 1 });
    pageVp.push(vp);
    aspect.push(vp.height / vp.width);
  }
  const layout = () => {
    const w = CONTENT_W() * zoom;
    return pageVp.map(vp => ({ w, h: w * vp.height / vp.width }));
  };
  let dims = layout();
  for (let i = 0; i < doc.numPages; i++) {
    const ph = document.createElement('div');
    ph.className = 'pv-page-ph'; ph.dataset.page = i + 1;
    ph.style.width = dims[i].w + 'px'; ph.style.height = dims[i].h + 'px';
    pagesEl.appendChild(ph);
    const th = document.createElement('div');
    th.className = 'pv-thumb'; th.dataset.page = i + 1;
    th.innerHTML = `<canvas></canvas><span>${i + 1}</span>`;
    const cvs = th.querySelector('canvas');
    cvs.style.width = THUMB_W + 'px';
    cvs.style.height = Math.round(THUMB_W * pageVp[i].height / pageVp[i].width) + 'px';
    th.addEventListener('click', () => {
      scrollToPage(i + 1);
    });
    thumbList.appendChild(th);
  }

  function pageTop(i) {   // 第 i 页（0-based）在滚动容器内的偏移
    let y = parseFloat(getComputedStyle(pagesEl).paddingTop) || 0;
    for (let k = 0; k < i; k++) y = pagesEl.children[k].offsetTop + pagesEl.children[k].offsetHeight + 20;
    return pagesEl.children[i] ? pagesEl.children[i].offsetTop : y;
  }
  function scrollToPage(n) {
    scroll.scrollTo({ top: pagesEl.children[n - 1].offsetTop - 16, behavior: 'smooth' });
  }

  async function renderPage(i) {   // i: 0-based
    const ph = pagesEl.children[i];
    if (!ph || ph.dataset.done === String(gen)) return;
    ph.dataset.done = String(gen);
    const page = await doc.getPage(i + 1);
    const dispW = CONTENT_W() * zoom;   // CSS 像素显示宽度
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // CSS 尺寸视口与位图视口分开：位图按 dpr 放大，渲染必须用位图视口，
    // 否则画面只画进位图左上 1/dpr，右下留白（125% 缩放屏上的白边根源）
    const vpCss = page.getViewport({ scale: dispW / pageVp[i].width });
    const vpBmp = page.getViewport({ scale: (dispW * dpr) / pageVp[i].width });
    const cvs = document.createElement('canvas');
    cvs.width = Math.round(vpBmp.width); cvs.height = Math.round(vpBmp.height);
    cvs.style.width = Math.round(vpCss.width) + 'px';
    cvs.style.height = Math.round(vpCss.height) + 'px';
    ph.innerHTML = ''; ph.appendChild(cvs);
    ph.style.width = Math.round(vpCss.width) + 'px';
    ph.style.height = Math.round(vpCss.height) + 'px';
    await page.render({ canvasContext: cvs.getContext('2d'), viewport: vpBmp }).promise;
  }

  async function renderThumb(i) {  // i: 0-based
    if (thumbDone.has(i)) return;
    thumbDone.add(i);
    const th = thumbList.children[i];
    const page = await doc.getPage(i + 1);
    const vp = page.getViewport({ scale: THUMB_W / pageVp[i].width });
    const cvs = th.querySelector('canvas');
    cvs.width = Math.round(vp.width); cvs.height = Math.round(vp.height);
    await page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise;
  }

  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(async () => {
      raf = 0;
      const st = scroll.scrollTop, vh = scroll.clientHeight;
      let current = 1;
      const jobs = [];
      for (let i = 0; i < doc.numPages; i++) {
        const top = pagesEl.children[i].offsetTop, h = pagesEl.children[i].offsetHeight;
        if (top + h > st - 200 && top < st + vh + 200) {
          jobs.push(renderPage(i));
          if (top + h > st + vh / 2 && top <= st + vh / 2) current = i + 1;
        }
      }
      // 当前页判定（兜底）
      if (jobs.length === 0 && doc.numPages) current = Math.min(doc.numPages, Math.max(1, Math.round(st / (dims[0].h + 20)) + 1));
      for (let i = 0; i < doc.numPages; i++) {
        const top = thumbList.children[i].offsetTop, h = thumbList.children[i].offsetHeight;
        if (top + h > thumbsEl.scrollTop - 300 && top < thumbsEl.scrollTop + thumbsEl.clientHeight + 300) jobs.push(renderThumb(i));
      }
      [...thumbList.children].forEach((th, i) => th.classList.toggle('active', i + 1 === current));
      cur.textContent = current;
      await Promise.all(jobs);
    });
  }
  scroll.addEventListener('scroll', onScroll, { passive: true });
  thumbsEl.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // 缩放：更新布局尺寸，重新渲染可视页
  async function setZoom(z) {
    zoom = Math.min(2.5, Math.max(0.4, z));
    pct.textContent = Math.round(zoom * 100) + '%';
    gen++;
    dims = layout();
    [...pagesEl.children].forEach((ph, i) => {
      ph.dataset.done = '';
      ph.innerHTML = '';
      ph.style.width = dims[i].w + 'px';
      ph.style.height = dims[i].h + 'px';
    });
    scroll.scrollTop = Math.min(scroll.scrollTop, scroll.scrollHeight);
    await onScrollNow();
  }
  async function onScrollNow() {
    const st = scroll.scrollTop, vh = scroll.clientHeight;
    const jobs = [];
    for (let i = 0; i < doc.numPages; i++) {
      const top = pagesEl.children[i].offsetTop, h = pagesEl.children[i].offsetHeight;
      if (top + h > st - 200 && top < st + vh + 200) jobs.push(renderPage(i));
    }
    await Promise.all(jobs);
   }
  $('.pv-in').addEventListener('click', () => setZoom(zoom + 0.15));
  $('.pv-out').addEventListener('click', () => setZoom(zoom - 0.15));

  // 缩略图栏开合
  $('.pv-menu').addEventListener('click', () => el.classList.toggle('no-thumbs'));

  await onScrollNow();
}
function initSingle(el) { return initViewer(el); }
document.querySelectorAll('.pdf-viewer').forEach(el => initViewer(el));
