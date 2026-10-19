// 影视作品数据（素材为整卡设计图；link 为点击跳转的三级页）
const VIDEOS = [
  { name: '泡泡马特',     link: 'video-player.html?id=bubble' },
  { name: '雀巢茶萃',     link: 'video-player.html?id=nestea' },
  { name: '紫竹药业',     link: 'video-player.html?id=zihr' },
  { name: '文化之脉',     link: 'video-player.html?id=culture' },
  { name: '十六追光者',   link: 'video-player.html?id=lonely' },
  { name: '万应之神',     link: 'video-wanying.html' },
];

const grid = document.getElementById('videoGrid');
grid.innerHTML = VIDEOS.map(v => {
  const inner = `<img src="assets/videos/${v.name}.png" alt="${v.name}" loading="eager">`;
  return `<a class="video-card" href="${v.link}">${inner}</a>`;
}).join('');
