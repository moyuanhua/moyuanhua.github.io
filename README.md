# moyuanhua.github.io

极简个人站：展示项目 + 记录关于 AI Agent 的思考。

- **技术栈**：Astro（静态输出）+ Tailwind CSS v4。无后端、无数据库。
- **部署**：GitHub Pages（user site）。push 到 `main` → Actions 构建 → 发布到 https://moyuanhua.github.io
- **内容**：全部是 `src/content/` 下的 Markdown，正文可直接写 HTML。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
npm run preview  # 本地预览 dist/
```

## 目录结构

```
src/
  content/
    projects/*.md      # 项目：frontmatter + 正文 = case study
    writing/*.md       # 文章 / 笔记
  layouts/BaseLayout.astro
  pages/
    index.astro                 # 首页：简介 + 项目 + 最近文章
    projects/index.astro        # 项目列表
    projects/[slug].astro       # 项目详情
    writing/index.astro         # 文章列表
    writing/[slug].astro        # 文章详情
    about.astro                 # 关于
  styles/global.css             # 设计 token + prose 排版
```

## 加内容

**加一个项目**：在 `src/content/projects/` 新建 `<slug>.md`：

```yaml
---
title: 项目名
tagline: 一句话（会显示在详情页）
description: 一两句（会显示在卡片）
role: 作者
period: 2026
stack: [TypeScript]
status: active        # active | paused | archived
repo: https://github.com/...
featured: true
order: 1
---
```

正文写 case study（背景 / 做法 / 结果 / 学到什么），可以直接用 HTML。

**加一篇文章**：在 `src/content/writing/` 新建 `<slug>.md`：

```yaml
---
title: 标题
date: 2026-01-01
description: 摘要
tags: [ai]
---
```

## 约定

- 所有内部链接用 `import.meta.env.BASE_URL` 前缀。
- 草稿：frontmatter 里 `draft: true`，各页面渲染时过滤。
- 单强调色（teal）、圆角 `rounded-[6px]`、字体 Geist；改样式只动 `src/styles/global.css` 的 token。
