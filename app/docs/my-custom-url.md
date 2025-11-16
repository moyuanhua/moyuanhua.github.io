---
title: 关于这个项目
slug: my-custom-url
sidebar_position: 1
---

# 关于这个项目

基于 Docusaurus 和飞书知识库的现代化技术文档系统

## <b>🌐 在线访问</b>

- <b>GitHub Pages</b>: https://moyuanhua.github.io

- <b>Cloudflare Pages</b>: https://blog.shopifytools.work

两个站点内容完全相同，自动同步部署！

## <b>✨ 核心特性</b>

- 🚀 <b>真正的增量同步</b>: 智能检测文档更新时间，只同步变更内容，大幅提升同步速度

- 🤖 <b>GitHub Actions 自动化</b>: 每天自动从飞书同步文档并部署到双平台

- 📝 <b>飞书深度集成</b>: 直接调用飞书 API，使用 feishu-docx 转换，完全自主可控

- 🎯 <b>智能 Slug 管理</b>: 自动解析并应用文档 slug，生成友好的 URL 结构

- 📁 <b>嵌套文档支持</b>: 完美处理文档集合的父子关系，保持层级结构

- 🔢 <b>顺序保持</b>: 严格按照飞书中的文档顺序显示，sidebar_position 自动生成

- 🎨 <b>极简设计</b>: 简洁的黑白配色，专注内容本身

- 📱 <b>响应式布局</b>: 完美适配移动端和桌面端

- 🔍 <b>中文搜索</b>: 支持中文分词的全文搜索功能

- ⚡ <b>智能缓存</b>: Cloudflare Pages 优化的缓存策略，兼顾更新速度和访问性能

- 🏠 <b>直达文档</b>: 首页直接展示文档内容，无需额外导航

## <b>🏗️ 技术架构</b>

### <b>核心技术栈</b>

- <b>静态站点生成器</b>: Docusaurus 3.9.2

- <b>内容源</b>: 飞书知识库

- <b>Markdown 转换</b>: feishu-docx (直接转换，不依赖 feishu-pages)

- <b>搜索引擎</b>: @easyops-cn/docusaurus-search-local

- <b>语言</b>: TypeScript + React 19 + Node.js 20+

- <b>CI/CD</b>: GitHub Actions

- <b>部署平台</b>: GitHub Pages + Cloudflare Pages

### <b>部署架构</b>

```text
飞书知识库 (内容管理)
    ↓
GitHub Actions (每天 9:00 自动运行)
    ├─ 同步飞书文档
    ├─ 提交到 Git
    ├─ 构建站点
    └─ 部署到 GitHub Pages
        ↓
moyuanhua.github.io (Git 仓库 + GitHub Pages)
    ↓
    ├─→ moyuanhua.github.io (GitHub Pages)
    │
    └─→ blog.shopifytools.work (Cloudflare Pages - 监听 Git 推送)
```

<b>优势</b>：

- ✅ 一次编辑，双平台同步
- ✅ GitHub Pages 免费，无需配置域名
- ✅ Cloudflare Pages 全球 CDN，速度更快
- ✅ 两个备份，高可用性

### <b>创新技术方案</b>

#### <b>1. 两阶段增量同步系统</b>

传统方案的问题：

- feishu-pages 每次全量同步，速度慢
- 无法精确控制同步范围
- 难以处理复杂的嵌套结构

<b>我们的解决方案</b>：

```js
// 第一阶段：扫描并下载
// - 遍历文档树，获取更新时间
// - 只下载 N 天内更新的文档
// - 使用 feishu-docx 直接转换
// - 构建 nodeToken -> slug 映射表

// 第二阶段：智能保存
// - 使用 slug 映射替换路径
// - 优先使用 slug 作为目录名/文件名
// - 正确处理 index.md 和子文档关系
// - 保持文档在飞书中的顺序
```

<b>优势</b>：

- ⚡ 速度提升 10-20 倍（只同步变更内容）
- 🎯 完全自主控制同步逻辑
- 📁 完美支持嵌套文档集合
- 🔗 所有 URL 都基于 slug，SEO 友好

#### <b>2. 智能文档结构映射</b>

<b>问题</b>：飞书的节点 token 很长（如 `PXW0wbbLaiD77PkhD52ctpUvnIf`），直接用作 URL 不友好

<b>解决方案</b>：

```text
飞书结构:
PXW0wbbLaiD77PkhD52ctpUvnIf (节点 token)
├── 标题: "测试文档集合1"
├── Slug: "collection-1"
└── 子文档...

生成结构:
docs/collection-1/           # 使用 slug 而非 token
├── index.md                 # 父文档（无 slug 避免重复）
└── sub-doc.md              # 子文档

URL 结果:
/collection-1/              # 干净友好的 URL
/collection-1/sub-doc       # 嵌套路径也很清晰
```

#### <b>3. 文档顺序智能保持</b>

在遍历文档树时记录每个文档的位置：

```js
// 遍历时记录位置
for (let index = 0; index < nodes.length; index++) {
  doc.position = index + 1;  // sidebar_position
}

// 生成 frontmatter 时应用
---
title: 文档标题
sidebar_position: 1  // 保持飞书中的顺序
---
```

## <b>📦 项目结构</b>

```text
murphy-blog/
├── app/
│   ├── docs/                      # 文档目录（同步生成）
│   │   ├── index.md              # 首页欢迎页面
│   │   ├── collection-1/          # 文档集合（使用 slug）
│   │   │   ├── index.md          # 父文档
│   │   │   └── sub-doc.md        # 子文档
│   │   └── standalone.md         # 独立文档
│   ├── src/
│   │   ├── pages/                # 页面
│   │   │   └── about.md          # 关于我页面
│   │   └── css/
│   │       └── custom.css        # 自定义样式
│   ├── static/
│   │   ├── _headers              # Cloudflare 缓存配置
│   │   └── img/
│   │       ├── logo-placeholder.svg   # Logo（黑色 M）
│   │       └── favicon.svg            # Favicon（白底黑字 M）
│   ├── scripts/
│   │   ├── sync-feishu-v3.js     # 增量同步脚本（主力）
│   │   └── run-sync.sh           # 同步入口脚本
│   ├── docusaurus.config.ts      # Docusaurus 配置
│   ├── .env                      # 环境变量
│   └── package.json
├── .github/
│   └── workflows/
│       └── sync-feishu-docs.yml  # 自动同步和部署工作流
└── README.md
```

## <b>🚀 快速开始</b>

### <b>1. 环境准备</b>

```bash
# 要求 Node.js >= 20.0
node --version

# 克隆项目
git clone <your-repo-url>
cd murphy-blog/app
```

### <b>2. 配置飞书应用</b>

在飞书开放平台创建应用，获取以下权限：

- `docx:document:readonly` - 读取文档内容
- `wiki:wiki:readonly` - 读取知识库结构

### <b>3. 配置环境变量</b>

创建 `app/.env` 文件：

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx

# 知识库配置
FEISHU_SPACE_ID=7560180515966484484
FEISHU_DOCS_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
FEISHU_ABOUT_DOC_ID=DKvmwNWVOiYA6KklWcsc1gHInKg

# 增量更新配置（只同步 N 天内更新的文档）
FEISHU_INCREMENTAL_DAYS=3

# 站点配置
SITE_URL=https://your-domain.com
BASE_URL=/

# 可选：跳过同步（使用现有内容）
SKIP_FEISHU_SYNC=false
```

### <b>4. 安装依赖</b>

```bash
npm install
```

### <b>5. 同步飞书内容</b>

```bash
npm run sync
```

输出示例：

```text
🚀 飞书内容同步 V3 - 真正的增量更新版

🔑 获取访问令牌...
   ✅ 令牌获取成功

📚 扫描文档树（只同步 3 天内更新的文档）

📁 遍历节点: L0qTw3NQFimJGIkWfGNckkEQnwJ
  📄 测试文档1
     更新时间: 2025/11/16 10:35:48
     ✅ 需要同步
  📄 测试文档集合1
     更新时间: 2025/11/16 10:39:21
     ✅ 需要同步

📊 扫描结果:
   找到 2 个需要更新的文档

📥 开始下载并转换文档...
💾 保存文档到文件系统...
✅ 文档同步完成
```

### <b>6. 启动开发服务器</b>

```bash
npm start
```

访问 http://localhost:3000

## <b>📝 内容管理工作流</b>

### <b>方式 1：自动同步（推荐）✨</b>

<b>GitHub Actions 每天自动同步飞书文档到 Git</b>

1. <b>在飞书中编辑文档</b>：在飞书知识库中创建/更新文档

2. <b>自动同步</b>：GitHub Actions 每天北京时间 9:00 自动同步

3. <b>自动部署</b>：Cloudflare Pages 检测到 Git 变更后自动部署

<b>配置步骤</b>：

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

```text
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx
FEISHU_SPACE_ID=7560180515966484484
FEISHU_DOCS_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
FEISHU_ABOUT_DOC_ID=DKvmwNWVOiYA6KklWcsc1gHInKg
```

<b>手动触发同步</b>：

在 GitHub 仓库 Actions 页面 → "同步飞书文档" → "Run workflow"

### <b>方式 2：本地手动同步</b>

<b>适合本地开发和测试</b>

1. <b>在飞书中管理内容</b>

- 文档组织：在飞书知识库中创建文档和文档集合
- 添加 Slug：在文档开头添加代码块指定 slug
    - 保存发布：飞书中的修改会自动记录更新时间

2. <b>同步到本地</b>

```bash
# 增量同步（只同步最近 3 天更新的文档）
npm run sync

# 本地预览
npm start

# 构建生产版本
npm run build
```

## <b>🔨 可用命令</b>

<table>
<colgroup>
<col width="200"/>
<col width="200"/>
</colgroup>
<tbody>
<tr><td><p>命令</p></td><td><p>说明</p></td></tr>
<tr><td><p><code>npm start</code></p></td><td><p>启动开发服务器 (<a href="http://localhost:3000">http://localhost:3000</a>)</p></td></tr>
<tr><td><p><code>npm run build</code></p></td><td><p>构建生产版本</p></td></tr>
<tr><td><p><code>npm run build:cf</code></p></td><td><p>Cloudflare Pages 构建（同步 + 构建）</p></td></tr>
<tr><td><p><code>npm run sync</code></p></td><td><p>从飞书增量同步内容</p></td></tr>
<tr><td><p><code>npm run serve</code></p></td><td><p>预览构建结果</p></td></tr>
<tr><td><p><code>npm run clear</code></p></td><td><p>清除缓存</p></td></tr>
</tbody>
</table>

## <b>🎯 核心优势</b>

### <b>1. 性能优势</b>

<table>
<colgroup>
<col width="200"/>
<col width="200"/>
<col width="200"/>
<col width="200"/>
</colgroup>
<tbody>
<tr><td><p>指标</p></td><td><p>传统方案</p></td><td><p>我们的方案</p></td><td><p>提升</p></td></tr>
<tr><td><p>首次同步</p></td><td><p>2-3 分钟</p></td><td><p>2-3 分钟</p></td><td></td></tr>
</tbody>
</table>

| 增量同步 | 2-3 分钟 | 10-20 秒 | <b>10-20x</b> |

| API 调用 | 全量 | 按需 | 减少 80%+ |

### <b>2. URL 友好度</b>

<b>传统方案</b>：

```text
/PXW0wbbLaiD77PkhD52ctpUvnIf/VZKWwL4wyidtr9kOSN3cHD20nbc
```

<b>我们的方案</b>：

```text
/collection-1/sub-document
```

### <b>3. 维护性</b>

- ✅ 完全自主的同步逻辑，易于调试和扩展
- ✅ 清晰的两阶段处理流程
- ✅ 详细的日志输出
- ✅ 代码简洁，注释完整

### <b>4. 功能完整性</b>

- ✅ 支持文档集合嵌套（无限层级）
- ✅ 保持文档顺序
- ✅ 自动解析和应用 slug
- ✅ 智能增量更新
- ✅ 错误处理和重试机制

## <b>🎨 UI/UX 设计</b>

### <b>极简美学</b>

- <b>Logo</b>: 黑色圆形背景 + 白色 M 字母

- <b>Favicon</b>: 白色背景 + 黑色 M 字母

- <b>导航</b>: 简洁导航栏，Logo 点击进入"关于我"

- <b>Footer</b>: 极简设计，只显示 Copyright

### <b>响应式设计</b>

- 完美适配桌面、平板、手机
- 自适应亮/暗主题
- 流畅的导航体验

### <b>首页设计</b>

访问根路径 `/` 直接展示欢迎页面，文档导航就在左侧，无需额外点击。

配置方式：在 [app/docs/index.md](app/docs/index.md) 中设置：

```md
---
title: 欢迎
slug: /
sidebar_position: 0
```

<b>---</b>

```text

```

## <b>🔧 高级配置</b>

### <b>GitHub Pages 部署设置</b>

<b>在 GitHub 仓库中启用 GitHub Pages</b>：

1. 进入仓库 Settings → Pages
2. Source 选择 "GitHub Actions"
3. 保存后会自动部署

<b>无需额外配置</b>！推送代码后会自动触发部署。

访问地址：`https://moyuanhua.github.io`

### <b>Cloudflare Pages 部署设置</b>

<b>连接 GitHub 仓库</b>：

1. 登录 Cloudflare Dashboard
2. Pages → 创建项目 → 连接到 Git
3. 选择 `moyuanhua/moyuanhua.github.io` 仓库

<b>构建配置</b>：

<table>
<colgroup>
<col width="200"/>
<col width="200"/>
</colgroup>
<tbody>
<tr><td><p>配置项</p></td><td><p>值</p></td></tr>
<tr><td><p>框架预设</p></td><td><p>None</p></td></tr>
<tr><td><p>构建命令</p></td><td><p><code>cd app && npm install && npm run build</code></p></td></tr>
<tr><td><p>构建输出目录</p></td><td><p><code>app/build</code></p></td></tr>
<tr><td><p>根目录</p></td><td><p><code>/</code></p></td></tr>
</tbody>
</table>

<b>环境变量设置</b>：

```bash
SKIP_FEISHU_SYNC=true
NODE_ENV=production
SITE_URL=https://blog.shopifytools.work
BASE_URL=/
```

保存后会自动部署，每次 Git 推送都会触发自动部署。

访问地址：`https://blog.shopifytools.work`（或你的自定义域名）

### <b>双平台对比</b>

<table>
<colgroup>
<col width="200"/>
<col width="200"/>
<col width="200"/>
</colgroup>
<tbody>
<tr><td><p>特性</p></td><td><p>GitHub Pages</p></td><td><p>Cloudflare Pages</p></td></tr>
<tr><td><p>部署速度</p></td><td><p>~1-2 分钟</p></td><td><p>~30-60 秒</p></td></tr>
<tr><td><p>CDN</p></td><td><p>GitHub CDN</p></td><td><p>Cloudflare 全球 CDN</p></td></tr>
<tr><td><p>访问速度（国内）</p></td><td><p>较慢</p></td><td><p>快</p></td></tr>
<tr><td><p>访问速度（国外）</p></td><td><p>快</p></td><td><p>很快</p></td></tr>
<tr><td><p>自定义域名</p></td><td><p>支持</p></td><td><p>支持</p></td></tr>
<tr><td><p>HTTPS</p></td><td><p>自动</p></td><td><p>自动</p></td></tr>
<tr><td><p>成本</p></td><td><p>免费</p></td><td><p>免费</p></td></tr>
</tbody>
</table>

<b>推荐</b>：两个都部署，国内用户访问 Cloudflare，国外用户访问 GitHub Pages。

### <b>Cloudflare Pages 缓存优化</b>

项目已配置智能缓存策略（[app/static/_headers](app/static/_headers)）：

<b>HTML 文件</b>：

```text
Cache-Control: public, max-age=0, must-revalidate
```

- 每次访问都验证，确保内容最新

<b>静态资源</b>（JS/CSS/图片）：

```text
Cache-Control: public, max-age=31536000, immutable
```

- 长期缓存（1年），因为 Docusaurus 已为文件名添加哈希值
- 内容更新时文件名会变化，自动失效旧缓存

<b>优势</b>：

- ✅ HTML 内容快速更新，无需手动清除缓存
- ✅ 静态资源长期缓存，减少带宽和加载时间
- ✅ Cloudflare 每次部署自动清除相关缓存

### <b>调整增量同步天数</b>

编辑 `.env`：

```bash
# 本地开发：3-7 天
FEISHU_INCREMENTAL_DAYS=3

# GitHub Actions：7 天（在 workflow 文件中设置）
FEISHU_INCREMENTAL_DAYS=7

# 全量同步（首次或需要完整更新时）
FEISHU_INCREMENTAL_DAYS=0
```

### <b>GitHub Actions 定时任务配置</b>

编辑 `.github/workflows/sync-feishu-docs.yml`：

```yaml
# 修改定时执行时间（cron 格式，UTC 时间）
schedule:
  - cron: '0 1 * * *'  # 每天 UTC 1:00 (北京时间 9:00)
  - cron: '0 13 * * *' # 每天 UTC 13:00 (北京时间 21:00)
```

### <b>自定义主题颜色</b>

编辑 `src/css/custom.css`：

```css
:root {
  --ifm-color-primary: #2e8555;
}

[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
}
```

## <b>📊 技术指标</b>

- <b>构建时间</b>: ~2-3 秒（增量）

- <b>同步时间</b>: ~10-20 秒（3天内更新）

- <b>包大小</b>: ~500KB（gzipped）

- <b>性能评分</b>: 95+ (Lighthouse)

- <b>SEO 友好</b>: 100% 静态生成

## <b>🚧 故障排除</b>

### <b>同步失败</b>

```bash
# 1. 检查环境变量
cat .env | grep FEISHU

# 2. 测试 API 连接
curl -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal \
  -H "Content-Type: application/json" \
  -d '{"app_id":"your_id","app_secret":"your_secret"}'

# 3. 查看详细日志
npm run sync
```

### <b>构建失败</b>

```bash
# 清除缓存并重建
npm run clear
rm -rf node_modules package-lock.json
npm install
npm run build
```

## <b>🔐 安全性</b>

- ✅ API 密钥通过环境变量管理
- ✅ 不在代码中硬编码敏感信息
- ✅ 构建时敏感信息不会泄露到静态文件
- ✅ 使用 HTTPS 访问所有 API

## <b>🎉 已完成功能</b>

- ✅ 增量同步系统（10-20x 性能提升）
- ✅ 双平台自动部署（GitHub Pages + Cloudflare Pages）
- ✅ 智能 Slug 管理和 SEO 优化
- ✅ 嵌套文档结构支持
- ✅ 中文全文搜索
- ✅ 首页直达文档（无需额外导航）
- ✅ Cloudflare 智能缓存策略
- ✅ 响应式设计和暗黑模式
- ✅ GitHub Actions 自动化工作流

## <b>📈 未来规划</b>

- [ ] 支持多语言文档

- [ ] 添加评论系统集成

- [ ] 文档版本管理

- [ ] 全文搜索优化

- [ ] MDX 组件库

## <b>📄 License</b>

MIT

## <b>🤝 贡献</b>

欢迎提交 Issues 和 Pull Requests！

## <b>📮 联系方式</b>

- GitHub: [@moyuanhua](https://github.com/moyuanhua)
- Website: https://blog.shopifytools.work

---

<b>Built with ❤️ using Docusaurus & Feishu</b>

<em>智能增量同步 | 完美 SEO | 极简设计</em>