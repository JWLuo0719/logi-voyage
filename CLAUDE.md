# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Logi Voyage（学游纪）是一个纯静态个人主页型博客，无构建工具、无框架、无 package.json。直接用浏览器打开 HTML 文件即可运行，也可用任意静态服务器托管。

## 开发命令

```bash
# 本地预览（任选一种）
npx serve .          # 需要 Node.js
python -m http.server 8000  # 需要 Python
# 或直接双击 index.html 用浏览器打开
```

## 架构

### 页面结构

5 个 HTML 页面，通过 `<body data-page="...">` 标识当前页面：

- `index.html` — 首页（data-page="home"），展示 hero 区域、功能介绍、最新文章
- `posts.html` — 文章列表（data-page="posts"），支持分类筛选和关键词搜索
- `post.html` — 文章详情（data-page="post"），通过 URL 参数 `?id=xxx` 加载对应文章
- `editor.html` — 写文章（data-page="editor"），在线编辑文章并生成 JSON，粘贴到 data.js 即可发布
- `profile.html` — 关于我（data-page="profile"），个人介绍、账号入口、学习时间线

### 数据驱动

所有文章数据集中在 `scripts/data.js` 的 `window.BLOG_POSTS` 数组中。每篇文章包含 `id`、`title`、`category`、`date`、`readTime`、`summary`、`cover`、`content` 字段。`content` 是由 heading + paragraphs/list 组成的块数组。

添加新文章只需在 `BLOG_POSTS` 数组中追加对象，三个页面自动生效。

### JS 加载顺序（每个页面相同）

1. `scripts/data.js` — 注册 `window.BLOG_POSTS`
2. `scripts/site.js` — 注册 `window.createPostCard` 和 `window.formatDate`，处理移动端导航
3. 页面特定脚本：`home.js`（首页最新文章）、`posts.js`（列表筛选搜索）、`post.js`（详情渲染）、`editor.js`（文章编辑器）

### CSS 结构

- `styles/site.css` — 全局变量、基础样式、响应式断点（1100px / 960px / 760px）
- `styles/home.css` — 首页、文章列表 banner、个人资料页、编辑器页面的特定样式

所有组件共享 `:root` 中的 CSS 变量（`--accent`、`--panel`、`--radius-lg` 等）。玻璃拟态（glassmorphism）效果通过 `backdrop-filter: blur` + 半透明白色背景实现。

## 注意事项

- 使用原生 JavaScript（ES5 语法），无模块系统，依赖 `window` 全局变量传递数据
- `site.js` 中的 `createPostCard` 用字符串拼接生成 HTML，非模板字面量
- 文章详情页通过 `URLSearchParams` 读取 `?id=` 参数匹配数据
- `scripts/image-relay.config.json` 已被 gitignore，包含 API 密钥配置
