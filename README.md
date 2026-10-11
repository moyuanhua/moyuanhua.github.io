# moyuanhua.github.io

极简个人站：展示项目 + 记录关于 AI Agent 的思考。

- **技术栈**：Astro（静态输出）+ Tailwind CSS v4。无后端、无数据库。
- **部署**：GitHub Pages（user site）。push 到 `main` → Actions 构建 → 发布到 https://moyuanhua.github.io
- **内容**：`src/content/` 下的 Markdown，正文可直接写 HTML。既有手写文章，也支持飞书知识库自动同步。

## 本地开发

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # 产物在 dist/
npm run preview        # 本地预览 dist/
npm run sync:feishu    # 从飞书知识库同步文章（需环境变量，见下）
```

## 目录结构

```
src/
  content/
    projects/*.md              # 项目：frontmatter + 正文 = case study
    writing/*.md               # 文章 / 笔记（手写）
    writing/feishu/**          # 飞书知识库同步产出（自动生成，勿手改）
  layouts/BaseLayout.astro
  pages/
    index.astro                # 首页：简介 + 项目 + 最近文章
    projects/index.astro       # 项目列表
    projects/[slug].astro      # 项目详情
    writing/index.astro        # 文章列表
    writing/[slug].astro       # 文章详情
    about.astro                # 关于
  styles/global.css            # 设计 token + prose 排版
public/
  writing-assets/feishu/**     # 飞书同步下来的图片 / 画板
scripts/
  sync-feishu.mjs              # 飞书知识库同步脚本
feishu.config.json             # 同步配置（范围、输出、标签、排除规则）
docs/feishu-sync.md            # 飞书同步完整说明
.github/workflows/
  deploy.yml                   # 构建 + 发布 GitHub Pages
  sync-feishu.yml              # 定时 / 手动同步飞书知识库
.feishu-sync/manifest.json     # 同步状态（清理被删文档用，需提交）
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

**加一篇文章**：复制 `src/content/writing/_template.md`，改名成 `<slug>.md`（文件名以 `_` 开头不会被发布）：

```yaml
---
title: 标题
date: 2026-01-01
updated: 2026-01-01        # 可选：有实质修改时填，显示「更新于」
description: 摘要
type: essay                # essay 长文 | note 短记 | log 构建日志
tags: [ai]                 # 受控词表，每篇 ≤3 个
---
```

## 飞书知识库同步

把飞书 / Lark 知识库镜像成站点文章：整条链路写在仓库里，由 GitHub Actions 运行
（定时每 30 分钟 + 手动触发），**不依赖本机工具链**。完整配置见
**[docs/feishu-sync.md](docs/feishu-sync.md)**。

- **正文** → `src/content/writing/feishu/<slug>.md`，URL 为 `/writing/feishu/<slug>`。
- **图片 / 画板** → `public/writing-assets/feishu/<同层级目录>/<file_token>.<ext>`，正文引用就地改写。
- **转换**：直接调飞书 OpenAPI 拉取文档块，用 [`feishu-docx`](https://github.com/longbridgeapp/feishu-pages)（MIT）渲染 Markdown，保留图片、表格、代码块。
- **增量**：`.feishu-sync/manifest.json` 记录上次产出，wiki 里删掉的文档，其 md 与图片会自动清理。

启用前置（详见文档）：

1. 飞书**自建应用** + 权限（`docx:document:readonly`、`wiki:wiki:readonly`、`drive:drive:readonly`、`docs:document.media:download`、`board:whiteboard:node:read`），并加入知识库成为成员/管理员。
2. 仓库 **Secrets**：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_SPACE_ID`。
3. 同步范围、标签、发布标记等在 `feishu.config.json` 调整。

本地手动跑（可选）：

```bash
FEISHU_APP_ID=xxx FEISHU_APP_SECRET=yyy FEISHU_SPACE_ID=zzz npm run sync:feishu
```

> 同步提交后会自动触发部署。注意：用 `GITHUB_TOKEN` push 的提交不会触发其它 workflow，
> 所以 `sync-feishu.yml` 在提交后显式 dispatch 了一次 `deploy.yml`。

## 约定

- 所有内部链接用 `import.meta.env.BASE_URL` 前缀。
- 草稿：frontmatter 里 `draft: true`，各页面渲染时过滤。
- 单强调色（teal）、圆角 `rounded-[6px]`、字体 Geist；改样式只动 `src/styles/global.css` 的 token。
- `src/content/writing/feishu/`、`public/writing-assets/feishu/`、`.feishu-sync/` 由同步脚本生成，不要手改。
