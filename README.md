# 邢慧东 · 个人介绍网站

按「简历web/网页效果.pdf」设计稿实现的纯静态个人介绍网站，无需构建、无需依赖。

## 使用方式

直接双击 `index.html` 即可在浏览器中打开；或在本目录运行 `python -m http.server 8765` 后访问 http://localhost:8765。

## 目录结构

```
resume-site/
├── index.html        # 全部页面内容（首页/关于我/教育背景/工作经历/作品集）
├── css/style.css     # 样式（设计令牌、响应式）
└── assets/           # 切分后的素材图（图标、文件夹、头像）+ MiSans woff2 字体
```

## 技术要点

- 纯 HTML/CSS/JS，无框架依赖
- MiSans 字体已转为 woff2 内置加载
- 交互：滚动吸顶导航高亮、区块进入动画、核心数据数字滚动、作品集文件夹悬停
