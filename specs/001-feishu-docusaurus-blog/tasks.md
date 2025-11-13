# Tasks: Feishu-Docusaurus 博客系统

**Input**: 设计文档来自 `/specs/001-feishu-docusaurus-blog/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本项目**不包含**自动化测试任务,spec未要求TDD方法。任务专注于功能实现和验证。

**Organization**: 任务按用户故事分组,每个故事独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行(不同文件,无依赖)
- **[Story]**: 任务所属用户故事(US1, US2, US3等)
- 包含准确的文件路径

## Path Conventions

本项目使用以下目录结构:
- **Docusaurus应用**: `app/` (包含src/, docs/, blog/, static/)
- **同步脚本**: `scripts/` (项目根目录)
- **配置文件**: 根目录 (`.env.example`, `.gitignore`, `README.md`)

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基本结构搭建

- [ ] T001 创建项目环境变量模板文件 `.env.example`,包含所有飞书API凭证字段(参考 contracts/env-variables.md)
- [ ] T002 [P] 更新 `.gitignore` 文件,忽略 `.env`, `app/docs/`, `app/i18n/en/docusaurus-plugin-content-docs/`, `app/static/feishu-assets/`, `app/.docusaurus/`, `app/build/`
- [ ] T003 [P] 在 `app/` 目录安装依赖: `feishu-pages@^0.7.6` 和 `@easyops-cn/docusaurus-search-local`
- [ ] T004 [P] 创建 `scripts/` 目录和基础同步脚本框架 `scripts/sync-feishu.js`(环境变量验证部分)
- [ ] T005 [P] 创建 `app/src/data/projects.json` 文件用于管理首页项目展示数据

**Checkpoint**: 基础项目结构和依赖就绪

---

## Phase 2: Foundational (阻塞性前置任务)

**Purpose**: 核心基础设施,必须在任何用户故事之前完成

**⚠️ CRITICAL**: 所有用户故事工作必须等此阶段完成

- [ ] T006 实现完整的 `scripts/sync-feishu.js` 同步脚本,包含:双语内容同步(zh-CN和en)、300ms API限流、指数退避重试、错误日志记录(参考 contracts/feishu-pages-config.md 和 contracts/cloudflare-pages.md 第94-186行)
- [ ] T007 [P] 配置 `app/docusaurus.config.ts` 的 i18n 模块:设置 defaultLocale='zh', locales=['zh','en'], 配置 localeConfigs (参考 contracts/docusaurus-config.md)
- [ ] T008 [P] 在 `app/docusaurus.config.ts` 中集成 `@easyops-cn/docusaurus-search-local` 插件,启用中文分词和双语搜索(参考 contracts/docusaurus-config.md 和 research.md 第246-332行)
- [ ] T009 [P] 更新 `app/package.json`,添加 `build:cf` 脚本: `"node ../scripts/sync-feishu.js && docusaurus build"` (参考 contracts/cloudflare-pages.md 第67-83行)
- [ ] T010 [P] 创建 `scripts/validate-structure.js` 脚本,验证中英文文档目录结构和slug一致性
- [ ] T011 [P] 在 `app/docusaurus.config.ts` 中配置 URL、baseUrl、organizationName、projectName 基础站点信息
- [ ] T012 配置 `app/docusaurus.config.ts` 的 navbar 导航栏:添加"首页"、"文档"、"博客"、"关于我"、语言切换器(参考 data-model.md 第258-304行)

**Checkpoint**: Foundation ready - 用户故事实现现在可以并行开始

---

## Phase 3: User Story 1 - 基础站点配置与双语支持 (Priority: P1) 🎯 MVP

**Goal**: 配置完整的博客系统,支持中英文双语,根据浏览器语言自动切换

**Independent Test**: 访问网站根路径,验证是否根据浏览器 Accept-Language 头自动跳转到中文(/zh)或英文(/en)版本,并检查导航栏、页脚等基础UI元素是否正确显示对应语言

### Implementation for User Story 1

- [ ] T013 [P] [US1] 创建中文版"关于我"页面 `app/src/pages/about.md` (Markdown格式,包含frontmatter: title, description)
- [ ] T014 [P] [US1] 创建英文版"关于我"页面 `app/i18n/en/docusaurus-plugin-content-pages/about.md` (对应中文版本的翻译)
- [ ] T015 [P] [US1] 创建 `app/i18n/en/docusaurus-theme-classic/navbar.json` 翻译文件,翻译导航栏所有菜单项(参考 research.md 第245-254行)
- [ ] T016 [P] [US1] 创建 `app/i18n/en/docusaurus-theme-classic/footer.json` 翻译文件,翻译页脚所有文本
- [ ] T017 [P] [US1] 在 `app/static/img/` 添加网站 logo 和 favicon
- [ ] T018 [US1] 在 `app/docusaurus.config.ts` 中配置 themeConfig.navbar.logo 和站点元数据(title, tagline, favicon)
- [ ] T019 [US1] 运行首次飞书内容同步测试: `node scripts/sync-feishu.js`,验证中英文文档是否正确同步到 `app/docs/` 和 `app/i18n/en/docusaurus-plugin-content-docs/current/`
- [ ] T020 [US1] 本地构建测试: `cd app && npm run build`,验证构建成功且生成 `build/zh/` 和 `build/en/` 两个语言版本
- [ ] T021 [US1] 本地预览测试: `cd app && npm run serve`,在浏览器中测试语言自动切换和手动切换功能
- [ ] T022 [US1] 验收测试: 按照 spec.md 第18-25行的5个验收场景逐一验证

**Checkpoint**: 此时 User Story 1 应完全功能可用并可独立测试 - **这是MVP**

---

## Phase 4: User Story 2 - 首页与内容展示 (Priority: P2)

**Goal**: 首页显示精心设计的项目展示区域和最新博文列表,快速了解站点核心内容和最新动态

**Independent Test**: 访问首页(中文或英文版本),验证是否显示项目展示卡片(可配置的项目列表)和最新博文列表(至少显示3-5篇最新文章的标题、摘要和发布日期)

### Implementation for User Story 2

- [ ] T023 [P] [US2] 创建 ProjectCard 组件 `app/src/components/ProjectCard/index.tsx`,接收 props: title, description, link, image, tags, status
- [ ] T024 [P] [US2] 创建 ProjectCard 样式文件 `app/src/components/ProjectCard/styles.module.css`
- [ ] T025 [P] [US2] 创建 HomepageFeatures 组件 `app/src/components/HomepageFeatures/index.tsx`,用于展示项目卡片列表,读取 `src/data/projects.json`
- [ ] T026 [P] [US2] 创建 RecentPosts 组件 `app/src/components/RecentPosts/index.tsx`,获取最新5篇博文并显示(使用 Docusaurus 的 `useGlobalData` 或 `useBlogPosts` hook)
- [ ] T027 [P] [US2] 在 `app/src/data/projects.json` 添加至少3个示例项目数据,包含中英文字段(参考 data-model.md 第119-143行)
- [ ] T028 [US2] 修改 `app/src/pages/index.tsx` 首页,集成 HomepageFeatures 和 RecentPosts 组件,替换默认首页内容
- [ ] T029 [US2] 在 `app/src/css/custom.css` 添加首页自定义样式,确保响应式布局(移动端和桌面端)
- [ ] T030 [US2] 在飞书知识库中创建至少5篇测试博文(中英文各一份),运行同步脚本验证首页最新博文列表显示
- [ ] T031 [US2] 验收测试: 按照 spec.md 第36-42行的5个验收场景逐一验证

**Checkpoint**: 此时 User Stories 1 和 2 都应独立工作

---

## Phase 5: User Story 3 - 文章列表与浏览 (Priority: P3)

**Goal**: 提供完整的文章列表页面,能够浏览所有已发布的博文,文章内容通过 feishu-pages 从飞书知识库同步

**Independent Test**: 访问文章列表页(/blog 或 /docs),验证是否显示所有文章,支持按时间/分类筛选,文章数据来自飞书同步的 Markdown 文件

### Implementation for User Story 3

- [ ] T032 [P] [US3] 在飞书知识库的两个语言根节点(zh-CN 和 en)下创建至少10篇文档,设置 sidebar_position 元数据
- [ ] T033 [P] [US3] 配置 `app/sidebars.ts`,定义侧边栏结构(如果使用自动生成,则配置 autogenerated 规则)
- [ ] T034 [US3] 运行同步脚本,验证所有文档正确同步并保持目录结构: `node scripts/sync-feishu.js && node scripts/validate-structure.js`
- [ ] T035 [US3] 在 `app/docusaurus.config.ts` 的 docs 和 blog 配置中设置 `routeBasePath`, `sidebarPath`, `showLastUpdateTime: true`
- [ ] T036 [US3] 本地测试文章列表页,验证中文和英文文章都正确显示,且按时间倒序排列
- [ ] T037 [US3] 验收测试: 按照 spec.md 第54-61行的5个验收场景逐一验证

**Checkpoint**: 所有用户故事 1-3 现在应独立功能完整

---

## Phase 6: User Story 4 - 关于我页面 (Priority: P4)

**Goal**: 提供个人品牌展示和联系渠道,访问者可以查看博客作者的背景信息

**Independent Test**: 访问关于我页面(/about),验证是否显示个人简介内容,支持双语版本

### Implementation for User Story 4

- [ ] T038 [P] [US4] 扩展 `app/src/pages/about.md` 中文版简介内容,添加个人背景、技能、联系方式、社交链接(支持 Markdown 格式化文本、图片、链接)
- [ ] T039 [P] [US4] 扩展 `app/i18n/en/docusaurus-plugin-content-pages/about.md` 英文版简介内容,对应中文版本的完整翻译
- [ ] T040 [US4] 在 `app/static/img/` 添加个人头像或关于页面的配图
- [ ] T041 [US4] 验收测试: 按照 spec.md 第72-78行的4个验收场景逐一验证

**Checkpoint**: 所有用户故事 1-4 现在应独立功能完整

---

## Phase 7: User Story 5 - 前端文章搜索 (Priority: P5)

**Goal**: 提供快速查找特定主题文章的能力,通过搜索功能输入关键词即时获得相关文章列表

**Independent Test**: 在搜索框输入关键词(中文或英文),验证是否返回匹配的文章列表,搜索结果支持高亮显示匹配文本

### Implementation for User Story 5

- [ ] T042 [P] [US5] 验证 `@easyops-cn/docusaurus-search-local` 插件在 `app/docusaurus.config.ts` 中已正确配置(已在 T008 完成)
- [ ] T043 [P] [US5] 在 `app/docusaurus.config.ts` 的搜索插件配置中自定义翻译标签: `search_placeholder`, `no_results`, `search_results_for` 等(中英文版本)
- [ ] T044 [US5] 运行生产构建: `cd app && npm run build`,验证搜索索引文件 `build/search-index-zh.json` 和 `build/search-index-en.json` 正确生成
- [ ] T045 [US5] 本地测试搜索功能: 在中文站点搜索中文关键词,在英文站点搜索英文关键词,验证结果相关性和高亮显示
- [ ] T046 [US5] 性能测试: 测量搜索响应时间,确保在500ms以内(文章数量<500篇时)
- [ ] T047 [US5] 验收测试: 按照 spec.md 第89-96行的5个验收场景逐一验证

**Checkpoint**: 所有5个用户故事现在应独立功能完整 - **完整功能集**

---

## Phase 8: Cloudflare Pages 部署配置 (部署就绪)

**Purpose**: 配置 Cloudflare Pages 自动化部署,实现手动触发构建

- [ ] T048 [P] 创建 `.npmrc` 文件在项目根目录,配置 npm 缓存和并行安装(参考 contracts/cloudflare-pages.md 第243-256行)
- [ ] T049 [P] 更新 `README.md`,添加项目介绍、快速开始指南、部署说明、环境变量配置说明
- [ ] T050 在 Cloudflare Pages 创建项目,连接 GitHub 仓库,配置构建命令 `npm run build:cf` 和输出目录 `app/build`
- [ ] T051 在 Cloudflare Pages 项目设置中添加环境变量: `FEISHU_APP_ID`, `FEISHU_APP_SECRET`, `FEISHU_SPACE_ID` (参考 contracts/cloudflare-pages.md 第46-62行)
- [ ] T052 手动触发首次 Cloudflare Pages 部署,验证构建成功(预期时间4-6分钟)
- [ ] T053 访问 Cloudflare Pages 提供的 URL(如 `murphy-blog.pages.dev`),验证网站正常运行
- [ ] T054 (可选) 配置自定义域名,添加 CNAME 记录(参考 contracts/cloudflare-pages.md 第276-301行)

**Checkpoint**: 网站已成功部署到 Cloudflare Pages,可通过公网访问

---

## Phase 9: Polish & Cross-Cutting Concerns (最终优化)

**Purpose**: 跨用户故事的改进和优化

- [ ] T055 [P] 在 `app/docusaurus.config.ts` 中启用 sitemap 插件: `sitemap: { changefreq: 'weekly', priority: 0.5 }`
- [ ] T056 [P] 创建 `app/static/robots.txt` 文件,允许所有爬虫访问
- [ ] T057 [P] 优化 `app/src/css/custom.css`,确保移动端响应式布局无横向滚动,所有交互元素可点击(满足 spec.md SC-006)
- [ ] T058 [P] 为 `app/docusaurus.config.ts` 配置 SEO 相关 metadata: Open Graph tags, Twitter Card, 描述信息
- [ ] T059 [P] 创建 `app/static/img/og-image.png` 作为社交分享预览图(建议尺寸1200x630)
- [ ] T060 运行完整的 quickstart.md 验证流程,确保所有步骤可以正常执行
- [ ] T061 运行 Lighthouse 测试,确保性能、可访问性、SEO 三项评分均>=90(满足 spec.md SC-005)
- [ ] T062 代码清理和格式化: 运行 `npm run typecheck` 验证 TypeScript 类型正确性
- [ ] T063 最终文档更新: 完善 `README.md`,添加截图、功能列表、技术栈说明、贡献指南

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-7)**: 全部依赖 Foundational 完成
  - 用户故事可并行进行(如有多人团队)
  - 或按优先级顺序执行(P1 → P2 → P3 → P4 → P5)
- **Deployment (Phase 8)**: 依赖至少 User Story 1 (MVP) 完成,建议 1-5 全部完成后部署
- **Polish (Phase 9)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成后立即开始 - 无其他用户故事依赖
- **User Story 2 (P2)**: 可在 Foundational 完成后立即开始 - 可与 US1 并行,但建议在 US1 后执行
- **User Story 3 (P3)**: 可在 Foundational 完成后立即开始 - 依赖飞书内容同步(T006 脚本)
- **User Story 4 (P4)**: 可在 Foundational 完成后立即开始 - 独立于其他用户故事
- **User Story 5 (P5)**: 可在 Foundational 完成后立即开始 - 依赖搜索插件配置(T008)

### Within Each User Story

- Models/Components before integration
- Core implementation before validation
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup 阶段**: T002, T003, T004, T005 可并行
- **Foundational 阶段**: T007, T008, T009, T010, T011 可并行(T006 必须先完成)
- **User Story 1**: T013, T014, T015, T016, T017 可并行
- **User Story 2**: T023, T024, T025, T026, T027 可并行
- **User Story 3**: T032, T033 可并行
- **User Story 4**: T038, T039 可并行
- **User Story 5**: T042, T043 可并行
- **Deployment**: T048, T049 可并行
- **Polish**: T055, T056, T057, T058, T059 可并行
- 一旦 Foundational 完成,所有用户故事可由不同团队成员并行开发

---

## Parallel Example: User Story 1

```bash
# 并行启动 User Story 1 的所有页面创建任务:
Task: "创建中文版'关于我'页面 app/src/pages/about.md"
Task: "创建英文版'关于我'页面 app/i18n/en/docusaurus-plugin-content-pages/about.md"
Task: "创建 app/i18n/en/docusaurus-theme-classic/navbar.json 翻译文件"
Task: "创建 app/i18n/en/docusaurus-theme-classic/footer.json 翻译文件"
Task: "在 app/static/img/ 添加网站 logo 和 favicon"
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (**CRITICAL** - 阻塞所有故事)
3. 完成 Phase 3: User Story 1
4. **STOP and VALIDATE**: 独立测试 User Story 1
5. 如果就绪可部署/演示

### Incremental Delivery (推荐)

1. 完成 Setup + Foundational → 基础就绪
2. 添加 User Story 1 → 独立测试 → 部署/演示 (**MVP!**)
3. 添加 User Story 2 → 独立测试 → 部署/演示
4. 添加 User Story 3 → 独立测试 → 部署/演示
5. 添加 User Story 4 → 独立测试 → 部署/演示
6. 添加 User Story 5 → 独立测试 → 部署/演示 (**完整功能集**)
7. 完成 Deployment → 上线
8. 完成 Polish → 优化完成
9. 每个故事增加价值而不破坏之前的故事

### Parallel Team Strategy

如果有多个开发者:

1. 团队一起完成 Setup + Foundational
2. Foundational 完成后:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. 故事独立完成并集成

---

## Task Summary

### Total Tasks: 63

### Tasks per User Story:
- **Setup**: 5 tasks (T001-T005)
- **Foundational**: 7 tasks (T006-T012) - **阻塞性前置任务**
- **User Story 1 (P1)**: 10 tasks (T013-T022) - **MVP**
- **User Story 2 (P2)**: 9 tasks (T023-T031)
- **User Story 3 (P3)**: 6 tasks (T032-T037)
- **User Story 4 (P4)**: 4 tasks (T038-T041)
- **User Story 5 (P5)**: 6 tasks (T042-T047)
- **Deployment**: 7 tasks (T048-T054)
- **Polish**: 9 tasks (T055-T063)

### Parallel Opportunities Identified:
- Setup 阶段: 4 个任务可并行
- Foundational 阶段: 5 个任务可并行
- User Story 1: 5 个任务可并行
- User Story 2: 5 个任务可并行
- User Story 3: 2 个任务可并行
- User Story 4: 2 个任务可并行
- User Story 5: 2 个任务可并行
- Deployment: 2 个任务可并行
- Polish: 5 个任务可并行
- **总计**: 32 个任务标记为可并行执行

### Independent Test Criteria:
- **US1**: 浏览器语言自动切换和 UI 元素正确显示
- **US2**: 首页项目卡片和最新博文列表正确显示
- **US3**: 文章列表页显示所有文章,支持筛选
- **US4**: 关于我页面显示个人简介,双语支持
- **US5**: 搜索功能返回相关文章,支持高亮

### Suggested MVP Scope:
**Phase 1 + Phase 2 + Phase 3 (User Story 1)**
- 这将提供一个功能完整的双语博客基础架构
- 包含导航、语言切换、基础页面
- 可以开始从飞书同步和发布内容
- 预估时间: 1-2 天(单人),如果并行执行可在 4-6 小时内完成

---

## Format Validation

✅ **所有 63 个任务都遵循标准检查清单格式**:
- [x] 每个任务以 `- [ ]` 开头(markdown checkbox)
- [x] 每个任务有唯一的任务ID (T001-T063)
- [x] 可并行任务标记 `[P]` (32个任务)
- [x] 用户故事任务标记 `[US1]`-`[US5]` (35个任务)
- [x] Setup 和 Foundational 任务无故事标签(12个任务)
- [x] Polish 任务无故事标签(9个任务)
- [x] 每个任务包含清晰的文件路径或具体操作

---

## Notes

- **[P]** 标记的任务 = 不同文件,无依赖,可并行执行
- **[Story]** 标签将任务映射到特定用户故事,便于追踪
- 每个用户故事应独立完成和测试
- 在任何检查点停止以独立验证故事
- 每个任务或逻辑组后提交代码
- 避免: 模糊任务、同文件冲突、破坏独立性的跨故事依赖
- 本项目**不包含**自动化测试,验证通过手动测试和验收场景完成
