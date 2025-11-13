# Implementation Plan: Feishu-Docusaurus 博客系统

**Branch**: `001-feishu-docusaurus-blog` | **Date**: 2025-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-feishu-docusaurus-blog/spec.md`

## Summary

本特性实现一个基于飞书知识库的双语(中英文)博客系统,使用feishu-pages从飞书同步内容,通过Docusaurus生成静态网站并部署到Cloudflare Pages。系统支持自动语言切换、项目展示、文章列表、前端搜索等核心功能,并通过手动触发构建实现内容发布。

技术路线:
- 使用feishu-pages的Page Meta模式管理双语内容(在飞书知识库中创建语言根节点)
- 利用Docusaurus内置i18n模块实现完整的双语支持
- 集成@easyops-cn/docusaurus-search-local实现中文分词搜索
- 通过Cloudflare Pages实现快速部署和全球CDN分发
- 手动触发构建机制:内容创作者在飞书编辑后手动触发Cloudflare Pages构建

## Technical Context

**Language/Version**: Node.js >=20.0, TypeScript ~5.6.2
**Primary Dependencies**:
  - @docusaurus/core 3.9.2
  - @docusaurus/preset-classic 3.9.2
  - feishu-pages ^0.7.6
  - @easyops-cn/docusaurus-search-local (待安装)
  - React 19.0.0

**Storage**: 文件系统(Markdown + 静态资源), 飞书知识库作为内容源
**Testing**: TypeScript类型检查, Docusaurus构建验证, 端到端链接检查
**Target Platform**: Cloudflare Pages (静态站点托管,全球CDN), 支持现代浏览器(Chrome/Firefox/Safari最近3个版本)
**Project Type**: Web静态站点 (Docusaurus应用在app/目录)
**Performance Goals**:
  - 首页加载时间: 3G网络<3s, 4G网络<1.5s
  - 搜索响应时间: <500ms (500篇文章以内)
  - 语言切换: <1s
  - Lighthouse评分: 性能/可访问性/SEO均>=90

**Constraints**:
  - 飞书API限流: 100请求/分钟, 请求间隔>=300ms
  - 构建时间: <3分钟 (100篇文章以内,使用Cloudflare Pages缓存)
  - Cloudflare Pages构建限额: 500次/月
  - 并发访问: 无限(Cloudflare全球CDN)
  - 移动端响应式布局必须无横向滚动

**Scale/Scope**:
  - 初始规模: 10-50篇文章
  - 预期增长: 100-500篇文章
  - 支持语言: 中文(默认)和英文
  - 页面类型: 首页、文章列表、文章详情、关于我、搜索

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

根据 [constitution.md](../../.specify/memory/constitution.md) 检查以下合规性:

- [x] **I. Content-First Philosophy**: 完全符合。内容创作者只需在飞书文档中编写,无需接触Git/Markdown。feishu-pages自动同步,技术细节对创作者透明。
- [x] **II. 双引擎架构**: 完全符合。使用feishu-pages处理飞书API同步和Markdown转换,使用Docusaurus处理静态站点生成和i18n。两个引擎职责清晰。
- [x] **III. API限流与容错**: 完全符合。将在同步脚本中实现300ms请求间隔、指数退避重试、错误日志记录。feishu-pages本身已内置限流保护。
- [x] **IV. 权限与安全**: 完全符合。飞书App ID/Secret通过环境变量(.env)管理,提供.env.example模板。所需权限已在spec中明确列出。
- [x] **V. 元数据与目录结构**: 完全符合。使用feishu-pages的Page Meta功能保持飞书文档目录结构,正确转换sidebar_position等元数据。语言根节点方案确保结构一致性。
- [x] **VI. 资源处理与性能**: 完全符合。feishu-pages自动下载图片到本地,支持白板和附件处理。构建时间目标<5分钟符合规范。
- [x] **VII. CI/CD集成**: 完全符合。使用Cloudflare Pages自动化部署,支持手动触发构建,简化操作流程。

所有7项核心原则完全符合,无违反项。

## Project Structure

### Documentation (this feature)

```text
specs/001-feishu-docusaurus-blog/
├── plan.md              # 本文件 - 实施计划
├── research.md          # 技术调研文档
├── data-model.md        # 数据模型定义
├── quickstart.md        # 快速开始指南
├── contracts/           # API和配置契约
│   ├── docusaurus-config.md
│   ├── feishu-pages-config.md
│   ├── cloudflare-pages.md
│   └── env-variables.md
└── spec.md              # 特性规格说明(已存在)
```

### Source Code (repository root)

```text
murphy-blog/
├── app/                           # Docusaurus应用根目录
│   ├── docs/                     # 文档目录(由feishu-pages同步生成)
│   │   ├── intro.md             # 示例文档
│   │   └── [feishu-synced]/     # 飞书同步的文档
│   ├── blog/                     # 博客文章目录
│   │   └── [feishu-synced]/     # 飞书同步的博客
│   ├── i18n/                     # 国际化翻译文件
│   │   ├── en/                  # 英文翻译
│   │   │   ├── docusaurus-theme-classic/
│   │   │   ├── docusaurus-plugin-content-docs/
│   │   │   └── docusaurus-plugin-content-blog/
│   │   └── zh/                  # 中文翻译
│   │       └── [同上结构]
│   ├── src/                      # 自定义源码
│   │   ├── components/          # React组件
│   │   │   ├── HomepageFeatures/  # 首页项目展示组件
│   │   │   └── ProjectCard/     # 项目卡片组件
│   │   ├── pages/               # 自定义页面
│   │   │   ├── index.tsx        # 首页(需修改以显示项目和最新博文)
│   │   │   └── about.md         # 关于我页面
│   │   └── css/                 # 自定义样式
│   │       └── custom.css
│   ├── static/                   # 静态资源
│   │   ├── img/                 # 图片资源
│   │   └── [feishu-assets]/     # 飞书同步的资源文件
│   ├── docusaurus.config.ts      # Docusaurus主配置(需更新)
│   ├── sidebars.ts               # 侧边栏配置
│   ├── package.json              # 依赖配置(已存在)
│   └── tsconfig.json             # TypeScript配置
│
├── scripts/                       # 同步脚本(需创建)
│   ├── sync-feishu.js            # feishu-pages同步脚本(Cloudflare Pages构建时调用)
│   └── validate-structure.js     # 目录结构验证脚本
│
├── .env.example                   # 环境变量示例(需创建)
├── .gitignore                     # Git忽略配置(需更新)
└── README.md                      # 项目文档(需更新)
```

**Structure Decision**:
采用Docusaurus标准的Web应用结构,所有Docusaurus相关代码位于app/目录。这符合Constitution规定的文件组织规范。选择此结构的原因:

1. **app/目录隔离**: 将Docusaurus应用与项目根目录的管理文件(specs/, scripts/, .github/)分离,结构清晰
2. **docs/和blog/分离**: 使用Docusaurus标准目录,docs/存放文档型内容,blog/存放博客文章
3. **i18n/目录**: 利用Docusaurus内置的i18n目录结构管理翻译
4. **scripts/独立**: 飞书同步脚本放在项目根目录,便于CI/CD调用
5. **静态资源本地化**: 所有飞书图片下载到static/目录,确保离线可用

## Complexity Tracking

无违反项,此表不适用。
