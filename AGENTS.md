# resume-site 项目规范（AGENTS.md / DESIGN-SPEC）

> 本文件供任何 AI 助手或开发者在此项目中工作前阅读。修改任何文件前请先读完本文档，遵守既有设计决策。

## 项目概述

- 个人作品集静态网站，纯 HTML / CSS / vanilla JS，**无框架、无构建步骤**
- 入口：`index.html`（首页）→ `projects.html`（作品集导航）→ 四个子页：
  - `wanying.html` 万应之神（含 PDF 预览）
  - `tenhu.html` 十虎
  - `chunri.html` 春日计划
  - `meixiaoyue.html` 美小约（小程序详情页）
  - 另有 `icons.html`（LOGO 设计）、`posters.html`（海报）、`videos.html`（视频）等入口页
- 线上部署：GitHub Pages，仓库 `ZIONCOZE/ZIONCOZE.github.io`，分支 `site-clean`，地址 https://zioncoze.github.io
- 本地预览：`python -m http.server 8766`（必须 http，file:// 下 PDF 预览被浏览器禁止）

## 设计规格（已与用户逐像素确认，勿随意改动）

### 导航胶囊（css/style.css）
- 外层：`padding: 7px 7px 7px 20px`，高度约 49.6px，长度不变
- 按钮：`padding: 6px 22px`，字号 13.5px
- 背景磨砂：`rgba(255,255,255,.55)` + `backdrop-filter: blur(18px) saturate(1.5)`
- 蓝色高亮胶囊落在"作品集"时与外框三边间距均为 8px（右侧 padding 是 7px）

### 返回按钮（css/projects.css 与 css/icons.css，两处必须同步改）
- `.back-btn`：`padding: 9px 30px`，字号 13.5px，实测 87×40
- 移动端：`7px 21px` / 12px
- icons / posters / videos 三个入口页共用 icons.css 里的定义

### 灯箱体系（关键，改动前必读）
有两套灯箱，选择器必须**互相排除**：
1. 首页 `.img-lightbox`（肖像照放大用）：浅遮罩 `rgba(244,244,242,.42)` + body 加 `.lb-blur` 模糊 + 关闭图标 `btn-close.png` + `.lb-dim` 渐显动画
2. 作品集页 `.lightbox`（yichun.css 定义）
3. style.css 中的全局模糊规则必须写成：
   `body.lb-blur > *:not(.img-lightbox):not(.lightbox)`
   漏掉任何一个排除项会导致对应灯箱"放大后只见模糊背景不见图"（此 bug 已修过一次）
4. 关闭态必须 `visibility:hidden; pointer-events:none`，否则会拦截页面点击
5. 卡通形象不放大的；手机长图样机（chunri.html 的 dc-phone）也不进灯箱

### 排版
- 章节小标题 `.chapter-sub`：`margin-top: 72px`（但紧跟 `.chapter-head` 时为 0），yichun.css 定义，十虎/春日/美小约/伊纯共用
- 春日计划页（chunri.html + chunri.css）：
  - 四季胶囊文字为白色（background 覆盖处必须加 `color:#fff`）
  - 5 个主视觉条目全宽（`vi-full`：s1-01 / s2-01 / s3-01 / s3-04 / s4-01）
  - 图片一律去底框等比放大：`.vi-img { padding:0; background:transparent; width:100% }`，`img max-height:none`
  - 对不齐的条目统一上下排版（.side/.flip 改 1fr 列 + order），唯 10 号条目保持左右两列（文字 380px + 手机 600px，sticky top:100px）
  - "肆·传播物料"只有文字介绍 + 手机样机交互（phone-long.jpg 长图，用户自拼的 800 宽版本）

### 标题副标题格式
- 作品集卡片/子页标题格式：`<b>主标题</b><i>副标题</i>`

## 加载性能规范（2026-10 新增，与用户确认）

- 列表/正文 `<img>` 一律 `loading="lazy" decoding="async"`；首屏 hero（folders-hero.webp）除外，保持立即加载
- 大于 120KB 的图必须配缩略图：`assets/t/<原子路径>.webp`（720px、q72、PIL LANCZOS），HTML 里 `src` 指向缩略图、`data-full` 指向原图
- 灯箱取图必须用 `img.dataset.full || img.src`（index/tenhu/chunri/yichun/yanxi/meixy 六处都已改，新增灯箱页面要沿用）
- posters 页是 JS 动态生成、直接用原图列表，不经缩略图
- 更换/新增图片时同步生成缩略图并保持 `data-full` 一致
- jsDelivr CDN 在用户网络下不可达（已实测），勿作为图片源
- 【重要教训】本机 git 开启 autocrlf，`git hash-object` 对 CRLF 文件算出的 sha 与 GitHub 服务器不一致，会导致 tree 校验 422 且无限循环补传。计算 blob sha 必须用原始字节：`hashlib.sha1(b'blob %d\0' % len(data) + data)`（或 `git -c core.autocrlf=false hash-object --no-filters`）
- 组装 tree 的文件清单用 os.walk 时要剥掉 `./` 前缀（`.` 组件会被 GitHub 判为 malformed path）
- 新增视频：走 GitHub Releases（tag videos-v1），仓库不放 >38MB 的视频

## 技术约束

| 事项 | 规范 |
|---|---|
| 视频 | 只能 H.264 (avc1)，Chrome 不支持 HEVC；大文件用 imageio-ffmpeg libx264 压缩，+faststart |
| 视频大小 | 上传 GitHub blob API 上限约 38MB 原始文件（base64 后 <100MB）；超限走 git 直推或继续压码率 |
| 图片 | PNG 用 PIL `quantize(256, FASTOCTREE)` + 1600px 限宽；JPG quality 82 progressive |
| PDF | pdf.js 用 UMD 2.16.105（cdnjs 版），`workerSrc = new URL('assets/pdfjs/pdf.worker.min.js', document.baseURI)`；pdf-viewer.js 无 import/export |
| 超大 PDF | pymupdf `get_pixmap(dpi=110)` 重建，94MB→4.4MB |
| 中文文件名 | git 输出 octal 转义坑：操作文件清单用 `git -c core.quotepath=false ls-files` |

## 部署（GitHub Pages）

- 仓库默认分支与 Pages 源均为 **site-clean**（旧 main 历史含已吊销的 token secret，勿再用）
- 网络环境：MSYS git/curl 连不上 github.com；用 Windows 原生 git（`$LOCALAPPDATA/Programs/Git/cmd/git.exe`）或 Python urllib 走 GitHub API（blob→tree→commit→refs 四步，blob sha 可本地 `git hash-object` 计算，无需重复上传）
- 改动后上线流程：commit 到 site-clean → push（或 API 更新 ref）→ Pages 自动构建

## 素材备份（重要）

- `../videos_originals_backup/`：三个视频压缩前原件 + 简历原件（94MB PDF）
- `../imgs_originals_backup/`：91 张压缩前原图
- 桌面 `resume-site-latest-2026.zip`：当前版本完整打包（勿与 WEB-简历 文件夹里的 1.26GB 旧版混淆）

## 修改守则

1. 改 CSS 前先确认规则被哪些页面共用（style.css 全站、yichun.css 四个子页、icons.css 三入口页）
2. 像素级调整以实测（DevTools 量取）为准，改完要报具体数字
3. 用户要求"等比放大""去底框""上下排版"等措辞时，参照上文已固化的同名决策执行
4. 不要引入框架、构建工具或外部 CDN 依赖（pdf.js 除外）
