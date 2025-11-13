# Technical Research: Feishu-Docusaurus Blog System

**Feature**: 001-feishu-docusaurus-blog | **Date**: 2025-01-13

## Research Objectives

1. Docusaurus 3.x i18n最佳实践和配置方法
2. feishu-pages与Docusaurus集成方案(区别于VitePress)
3. @easyops-cn/docusaurus-search-local配置和中文分词支持
4. GitHub Actions自动化部署到GitHub Pages的完整workflow
5. 飞书webhook触发GitHub Actions的安全实现方案

---

## 1. Docusaurus i18n Configuration

### 概述
Docusaurus 3.x提供完整的内置i18n支持,通过配置文件和目录结构管理多语言内容。

### 核心配置

**docusaurus.config.ts中的i18n配置**:
```typescript
i18n: {
  defaultLocale: 'zh',        // 默认语言(中文)
  locales: ['zh', 'en'],      // 支持的语言列表
  localeConfigs: {
    zh: {
      label: '简体中文',
      direction: 'ltr',
      htmlLang: 'zh-CN',
      calendar: 'gregory',
      path: 'zh',
    },
    en: {
      label: 'English',
      direction: 'ltr',
      htmlLang: 'en',
      calendar: 'gregory',
      path: 'en',
    },
  },
}
```

### 目录结构
```
app/
├── docs/                    # 默认语言(中文)的文档
├── blog/                    # 默认语言的博客
├── i18n/                    # 翻译文件
│   ├── en/                  # 英文翻译
│   │   ├── docusaurus-theme-classic/
│   │   │   ├── navbar.json          # 导航栏翻译
│   │   │   └── footer.json          # 页脚翻译
│   │   ├── docusaurus-plugin-content-docs/
│   │   │   └── current/             # 文档英文版本
│   │   │       └── [同docs/结构]
│   │   └── docusaurus-plugin-content-blog/
│   │       └── [博客英文版本]
│   └── zh/                  # 中文翻译(可选,用于覆盖默认)
```

### 语言切换机制
- **自动检测**: 通过浏览器`Accept-Language`头自动跳转
- **URL结构**: `/zh/docs/intro` 和 `/en/docs/intro`
- **导航栏切换器**: 自动添加语言切换下拉菜单

### 翻译工作流
```bash
# 生成翻译文件模板
npm run write-translations -- --locale en

# 开发模式预览特定语言
npm run start -- --locale en

# 构建所有语言版本
npm run build
```

### 最佳实践
1. **默认语言内容放在根目录**: `docs/`和`blog/`直接存放默认语言(中文)
2. **其他语言放在i18n/**: `i18n/en/`存放英文翻译
3. **保持目录结构一致**: 各语言版本的文件路径必须完全匹配
4. **翻译静态文本**: 使用JSON文件翻译UI组件文本
5. **SEO优化**: 每个语言版本生成独立的sitemap

### 关键注意事项
- 所有语言版本的文档slug必须一致,否则语言切换会404
- 图片和静态资源可以共享,无需重复存放
- frontmatter中可以使用`sidebar_position`控制顺序

---

## 2. feishu-pages Integration with Docusaurus

### feishu-pages核心功能
feishu-pages是专门用于从飞书知识库同步内容到本地Markdown的工具,支持:
- 从飞书API拉取文档和wiki内容
- 转换飞书格式为Markdown/MDX
- 下载图片、附件、白板等资源
- 保持目录结构和元数据

### 与Docusaurus集成方案

**区别于VitePress**:
- VitePress使用`.vitepress/config.js`, Docusaurus使用`docusaurus.config.ts`
- feishu-pages的输出目标目录需调整为Docusaurus的`docs/`或`blog/`

### feishu-pages配置文件示例

**创建`.feishu-pages.json`或`feishu-pages.config.js`**:
```javascript
module.exports = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  type: 'wiki',  // 或 'docx'
  wikiId: process.env.FEISHU_WIKI_ID,

  output: {
    path: './app/docs',  // 输出到Docusaurus docs目录
    mdType: 'markdown',  // 或 'mdx'
  },

  // 资源下载配置
  assets: {
    enabled: true,
    path: './app/static/feishu-assets',
    downloadImages: true,
    downloadWhiteboard: true,
  },

  // 元数据映射
  meta: {
    sidebarPosition: true,  // 保留sidebar_position
    hide: true,             // 支持hide属性
  },

  // API限流配置
  rateLimiting: {
    enabled: true,
    intervalMs: 300,  // 请求间隔300ms
    maxRetries: 3,
    backoffMs: 1000,
  },
}
```

### i18n支持: Page Meta方法

根据spec要求,使用feishu-pages的Page Meta模式管理双语内容:

**飞书知识库结构**:
```
知识库根目录
├── 简体中文 (slug: zh-CN)
│   ├── intro.md
│   ├── tutorial/
│   │   ├── basics.md
│   │   └── advanced.md
│   └── ...
└── English (slug: en)
    ├── intro.md
    ├── tutorial/
    │   ├── basics.md
    │   └── advanced.md
    └── ...
```

**同步脚本处理**:
1. 分别同步两个语言根节点
2. zh-CN内容同步到`app/docs/`
3. en内容同步到`app/i18n/en/docusaurus-plugin-content-docs/current/`
4. 确保两个目录的文件结构和slug完全一致

### 同步脚本示例

**scripts/sync-feishu.js**:
```javascript
const feishuPages = require('feishu-pages');
const path = require('path');
const fs = require('fs-extra');

async function syncLanguage(config) {
  try {
    console.log(`Syncing ${config.language} content...`);
    await feishuPages.sync({
      ...config,
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET,
    });
    console.log(`${config.language} sync completed`);
  } catch (error) {
    console.error(`Error syncing ${config.language}:`, error);
    throw error;
  }
}

async function main() {
  // 同步中文内容(默认语言)
  await syncLanguage({
    language: 'zh',
    wikiId: process.env.FEISHU_WIKI_ID,
    nodeId: process.env.FEISHU_ZH_NODE_ID,  // 中文根节点ID
    output: {
      path: path.resolve(__dirname, '../app/docs'),
      mdType: 'markdown',
    },
    assets: {
      enabled: true,
      path: path.resolve(__dirname, '../app/static/feishu-assets'),
    },
  });

  // 同步英文内容
  await syncLanguage({
    language: 'en',
    wikiId: process.env.FEISHU_WIKI_ID,
    nodeId: process.env.FEISHU_EN_NODE_ID,  // 英文根节点ID
    output: {
      path: path.resolve(__dirname, '../app/i18n/en/docusaurus-plugin-content-docs/current'),
      mdType: 'markdown',
    },
    assets: {
      enabled: true,
      path: path.resolve(__dirname, '../app/static/feishu-assets'),
    },
  });

  console.log('All languages synced successfully');
}

main().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
```

### 关键集成点
1. **输出路径映射**: feishu-pages输出必须对应Docusaurus的i18n目录结构
2. **元数据转换**: 飞书的Page Meta转为Docusaurus的frontmatter
3. **资源路径**: 图片路径需调整为Docusaurus的`/feishu-assets/`格式
4. **目录一致性**: 两个语言版本的文件名和路径必须完全一致

---

## 3. @easyops-cn/docusaurus-search-local Setup

### 插件概述
@easyops-cn/docusaurus-search-local是Docusaurus的本地搜索插件,支持:
- 离线搜索(无需外部服务)
- 中文分词(基于nodejieba)
- 多语言支持
- 搜索结果高亮

### 安装
```bash
cd app
npm install @easyops-cn/docusaurus-search-local
```

### 配置

**docusaurus.config.ts中添加**:
```typescript
import type {Config} from '@docusaurus/types';

const config: Config = {
  // ... 其他配置

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        // 索引配置
        hashed: true,  // 文件名哈希,便于缓存
        language: ['zh', 'en'],  // 支持的语言

        // 中文分词配置
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',

        // 搜索范围
        indexDocs: true,
        indexBlog: true,
        indexPages: false,  // 不索引自定义页面

        // 搜索结果配置
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,

        // 高亮配置
        highlightSearchTermsOnTargetPage: true,

        // 翻译标签
        translations: {
          search_placeholder: '搜索',
          see_all_results: '查看所有结果',
          no_results: '没有找到结果',
          search_results_for: '搜索结果: "{{ keyword }}"',
          search_the_documentation: '搜索文档',
          count_documents_found: '找到 {{ count }} 篇文档',
          count_documents_found_plural: '找到 {{ count }} 篇文档',
          no_documents_were_found: '未找到文档',
        },
      },
    ],
  ],
};

export default config;
```

### 构建时索引生成
插件会在`npm run build`时自动生成搜索索引:
```
app/build/
└── search-index/
    ├── search-index-zh.json
    └── search-index-en.json
```

### 中文分词原理
- 使用nodejieba进行中文分词
- 自动识别中文内容并分词建立索引
- 支持模糊搜索和拼音搜索(可选)

### 性能优化建议
1. **限制索引范围**: 只索引docs和blog,不索引API文档等大型内容
2. **控制索引大小**: 超过500篇文章时考虑减少`searchResultContextMaxLength`
3. **启用哈希**: 设置`hashed: true`利用浏览器缓存

---

## 4. GitHub Actions Workflow for Deployment

### 完整部署流程

**目标**: 飞书内容同步 -> Docusaurus构建 -> GitHub Pages发布

### Workflow文件结构
```
.github/workflows/
├── deploy.yml          # 主部署workflow
└── sync-feishu.yml     # 飞书同步workflow(可被webhook触发)
```

### deploy.yml示例

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  # 手动触发
  workflow_dispatch:
  # 定时触发(每天UTC 00:00,即北京时间08:00)
  schedule:
    - cron: '0 0 * * *'

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  sync-and-build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        run: |
          cd app
          npm ci

      - name: Sync Feishu content
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_WIKI_ID: ${{ secrets.FEISHU_WIKI_ID }}
          FEISHU_ZH_NODE_ID: ${{ secrets.FEISHU_ZH_NODE_ID }}
          FEISHU_EN_NODE_ID: ${{ secrets.FEISHU_EN_NODE_ID }}
        run: |
          node scripts/sync-feishu.js

      - name: Build Docusaurus
        run: |
          cd app
          npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: app/build

  deploy:
    needs: sync-and-build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### GitHub Pages配置

**Repository Settings -> Pages**:
- Source: GitHub Actions
- Branch: 无需配置(由Actions管理)

**docusaurus.config.ts中的URL配置**:
```typescript
const config: Config = {
  url: 'https://<username>.github.io',
  baseUrl: '/<repo-name>/',  // 如果是用户站点则为 '/'
  organizationName: '<username>',
  projectName: '<repo-name>',
  trailingSlash: false,
};
```

### 关键配置点
1. **Secrets配置**: 在GitHub Repository Settings -> Secrets中添加所有飞书凭证
2. **权限设置**: workflow需要`contents: write`和`pages: write`权限
3. **构建缓存**: 使用`actions/setup-node`的cache功能加速构建
4. **artifact上传**: 使用`upload-pages-artifact`而非手动推送gh-pages分支

---

## 5. Feishu Webhook Integration

### 需求分析
实现飞书文档更新时自动触发GitHub Actions重新部署。

### 架构方案

**方案1: Repository Dispatch (推荐)**
```
飞书Webhook -> API Gateway/Serverless函数 -> GitHub Repository Dispatch -> GitHub Actions
```

**方案2: Workflow Dispatch via API**
```
飞书Webhook -> 直接调用GitHub API触发workflow
```

### 实现步骤

#### 1. 创建可被外部触发的Workflow

**sync-feishu.yml**:
```yaml
name: Sync Feishu and Deploy

on:
  repository_dispatch:
    types: [feishu-update]
  workflow_dispatch:

jobs:
  trigger-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger main deploy workflow
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'deploy.yml',
              ref: 'main'
            })
```

#### 2. 飞书Bot配置

在飞书开放平台创建机器人:
1. 开发者后台 -> 事件订阅
2. 订阅事件: `wiki.space.updated`, `wiki.page.updated`
3. 配置回调URL: 指向中间服务(如Cloudflare Worker)

#### 3. 中间服务实现(Cloudflare Worker示例)

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 验证飞书请求签名
  const signature = request.headers.get('X-Lark-Signature');
  const timestamp = request.headers.get('X-Lark-Request-Timestamp');

  // 获取请求体
  const body = await request.json();

  // 验证事件类型
  if (body.event?.event_type === 'wiki.page.updated') {
    // 触发GitHub Actions
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'feishu-update',
          client_payload: {
            page_id: body.event.page_id,
            timestamp: timestamp,
          }
        })
      }
    );

    return new Response('OK', { status: 200 });
  }

  return new Response('Event ignored', { status: 200 });
}
```

#### 4. 安全考虑

- **签名验证**: 验证飞书webhook的签名防止伪造请求
- **Token保护**: GitHub Personal Access Token存储在Worker的环境变量中
- **速率限制**: 防止频繁触发,设置冷却期(如5分钟内只触发一次)
- **白名单**: 只允许特定wiki_id的事件触发

### 简化方案(仅定时同步)

如果webhook实现复杂度过高,可以仅使用定时同步:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时同步一次
```

优点: 简单可靠,无需额外服务
缺点: 内容更新延迟最多6小时

---

## Research Summary

### 技术决策

| 决策点 | 选择方案 | 理由 |
|--------|---------|------|
| i18n实现 | Docusaurus内置i18n | 官方支持,稳定可靠,与生态集成好 |
| 内容同步 | feishu-pages | 专为飞书设计,支持完整的元数据和资源 |
| 搜索方案 | @easyops-cn/docusaurus-search-local | 中文分词支持,离线可用,无需外部服务 |
| 部署方式 | GitHub Actions + GitHub Pages | 免费,集成度高,自动化完善 |
| 双语管理 | Page Meta(语言根节点) | 目录结构清晰,易于管理和验证 |
| webhook触发 | 定时同步(初期) + 可选repository_dispatch | 先保证稳定性,后续可扩展实时触发 |

### 关键风险

1. **飞书API限流**: 通过300ms间隔和重试机制缓解
2. **目录结构一致性**: 需要验证脚本确保中英文slug匹配
3. **构建时间**: 文章数量增长可能导致构建超时,需监控
4. **搜索索引大小**: 大量文章可能导致索引过大,需优化配置

### 待验证事项

- [ ] feishu-pages最新版本(0.7.6)是否支持自定义输出路径到i18n目录
- [ ] Docusaurus 3.9.2与@easyops-cn/docusaurus-search-local的兼容性
- [ ] GitHub Pages对单次部署文件数量和大小的限制
- [ ] 飞书webhook的实际触发频率和稳定性

### 参考资源

- [Docusaurus i18n官方文档](https://docusaurus.io/docs/i18n/introduction)
- [feishu-pages GitHub仓库](https://github.com/longbridgeapp/feishu-pages)
- [@easyops-cn/docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local)
- [GitHub Actions部署Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
- [飞书开放平台 - 事件订阅](https://open.feishu.cn/document/ukTMukTMukTM/uUTNz4SN1MjL1UzM)
