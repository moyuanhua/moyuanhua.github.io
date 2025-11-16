---
title: 关于这个项目
slug: about-project
sidebar_position: 1
---

# 关于这个项目

基于 Docusaurus 和飞书知识库的现代化技术文档系统



## **🌐 在线访问**



- **GitHub Pages**: https://moyuanhua.github.io

- **Cloudflare Pages**: https://blog.shopifytools.work



两个站点内容完全相同，自动同步部署！



## **✨ 核心特性**



- 🚀 **真正的增量同步**: 智能检测文档更新时间，只同步变更内容，大幅提升同步速度

- 🤖 **GitHub Actions 自动化**: 每天自动从飞书同步文档并部署到双平台

- 📝 **飞书官方 API 集成**: 使用飞书官方 Markdown API，完整支持所有格式（有序列表、引用等）

- 🎯 **智能 Slug 管理**: 自动解析并应用文档 slug，生成友好的 URL 结构

- 📁 **嵌套文档支持**: 完美处理文档集合的父子关系，保持层级结构

- 🔢 **顺序保持**: 严格按照飞书中的文档顺序显示，sidebar_position 自动生成

- 🎨 **极简设计**: 简洁的黑白配色，专注内容本身

- 📱 **响应式布局**: 完美适配移动端和桌面端

- 🔍 **中文搜索**: 支持中文分词的全文搜索功能



## **🏗️ 技术架构**



### **核心技术栈**



- **静态站点生成器**: Docusaurus 3.9.2

- **内容源**: 飞书知识库

- **Markdown 转换**: 飞书官方 Markdown API (\`/open\-apis/docs/v1/content\`)

- **搜索引擎**: @easyops\-cn/docusaurus\-search\-local

- **语言**: TypeScript \+ React 19 \+ Node.js 20\+

- **CI/CD**: GitHub Actions

- **部署平台**: GitHub Pages \+ Cloudflare Pages



### **部署架构**



```Plain Text
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



**优势**：

- ✅ 一次编辑，双平台同步

- ✅ GitHub Pages 免费，无需配置域名

- ✅ Cloudflare Pages 全球 CDN，速度更快

- ✅ 两个备份，高可用性

### **创新技术方案**



#### **1. 两阶段增量同步系统**



传统方案的问题：

- feishu\-pages 每次全量同步，速度慢

- 第三方库转换不完整，有序列表、引用容器等格式丢失

- 无法精确控制同步范围

- 难以处理复杂的嵌套结构

**我们的解决方案（V4 \- 使用官方 Markdown API）**：



```JavaScript
// 第一阶段：扫描并下载
// - 遍历文档树，获取更新时间
// - 只下载 N 天内更新的文档
// - 使用飞书官方 Markdown API 一次性获取完整内容
// - 构建 nodeToken -> slug 映射表

// 第二阶段：智能保存
// - 使用 slug 映射替换路径
// - 优先使用 slug 作为目录名/文件名
// - 正确处理 index.md 和子文档关系
// - 保持文档在飞书中的顺序
```



**关键改进**：

```JavaScript
// 旧方案：使用 feishu-docx 第三方库
const blocks = await getDocBlocks(token, docId);  // 获取 Block 结构
const markdown = convertToMarkdown(blocks);        // 手动转换（不完整）

// 新方案：使用飞书官方 API
const markdown = await getMarkdownContent(token, docId);  // 一步到位，完整转换
```



**优势**：

- ⚡ 速度提升 10\-20 倍（只同步变更内容）

- ✅ 内容完整度 100%（有序列表、引用、所有格式）

- 📦 代码量减少 40%（移除 feishu\-docx 依赖）

- 🎯 完全自主控制同步逻辑

- 📁 完美支持嵌套文档集合

- 🔗 所有 URL 都基于 slug，SEO 友好

- 🔄 官方维护，自动支持新功能

#### **2. 智能文档结构映射**



**问题**：飞书的节点 token 很长（如 \`PXW0wbbLaiD77PkhD52ctpUvnIf\`），直接用作 URL 不友好



**解决方案**：



```Plain Text
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



#### **3. 文档顺序智能保持**



在遍历文档树时记录每个文档的位置：



```JavaScript
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



## **📦 项目结构**



```Plain Text
murphy-blog/
├── app/
│   ├── docs/                      # 文档目录（同步生成）
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
│   │   └── img/
│   │       ├── logo-placeholder.svg   # Logo（黑色 M）
│   │       └── favicon.svg            # Favicon（白底黑字 M）
│   ├── scripts/
│   │   ├── sync-feishu-v3.js     # V4 增量同步脚本（使用官方API）
│   │   └── run-sync.sh           # 同步入口脚本
│   ├── docusaurus.config.ts      # Docusaurus 配置
│   ├── .env                      # 环境变量
│   └── package.json
└── README.md
```



## **🚀 快速开始**



### **1. 环境准备**



```Bash
# 要求 Node.js >= 20.0
node --version

# 克隆项目
git clone <your-repo-url>
cd murphy-blog/app
```



### **2. 配置飞书应用**



在飞书开放平台创建应用，获取以下权限：

- `docs:document.content:read` \- 查看云文档内容（Markdown 导出）

- `wiki:wiki:readonly` \- 读取知识库结构

**重要**：\`docs:document.content:read\` 是飞书官方 Markdown API 所需权限，添加后需要发布新版本才能生效。



### **3. 配置环境变量**



创建 `app/\.env` 文件：



```Bash
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



### **4. 安装依赖**



```Bash
npm install
```



### **5. 同步飞书内容**



```Bash
npm run sync
```



输出示例：

```Plain Text
🚀 飞书内容同步 V4 - 使用官方 Markdown API

🔑 获取访问令牌...
   ✅ 令牌获取成功

📚 扫描文档树（增量模式：只同步 3 天内更新的文档）

📁 遍历节点: L0qTw3NQFimJGIkWfGNckkEQnwJ
  📄 关于这个项目
     更新时间: 2025/11/16 17:44:49
     ✅ 需要同步
  📄 AI 快速通关
     更新时间: 2025/11/16 15:39:00
     ✅ 需要同步

📊 扫描结果:
   找到 2 个需要更新的文档

📥 开始下载并转换文档...
   📥 下载: 关于这个项目
   ✅ 获取成功: 关于这个项目
   📥 下载: AI 快速通关
   ✅ 获取成功: AI 快速通关

💾 保存文档到文件系统...
   💾 保存: /docs/about-project.md
   ✅ 完成: 关于这个项目

✅ 文档同步完成
📄 处理"关于我"页面...
✅ "关于我"页面处理完成
```



### **6. 启动开发服务器**



```Bash
npm start
```



访问 http://localhost:3000



## **📝 内容管理工作流**



### **方式 1：自动同步（推荐）✨**



**GitHub Actions 每天自动同步飞书文档到 Git**



1. **在飞书中编辑文档**：在飞书知识库中创建/更新文档

2. **自动同步**：GitHub Actions 每天北京时间 9:00 自动同步

3. **自动部署**：Cloudflare Pages 检测到 Git 变更后自动部署



**配置步骤**：



在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：



```Plain Text
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx
FEISHU_SPACE_ID=7560180515966484484
FEISHU_DOCS_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
FEISHU_ABOUT_DOC_ID=DKvmwNWVOiYA6KklWcsc1gHInKg
```



**手动触发同步**：



在 GitHub 仓库 Actions 页面 → \&\#34;同步飞书文档\&\#34; → \&\#34;Run workflow\&\#34;



### **方式 2：本地手动同步**



**适合本地开发和测试**



1. **在飞书中管理内容**

- 文档组织：在飞书知识库中创建文档和文档集合

- 添加 Slug：在文档开头添加代码块指定 slug

    - 保存发布：飞书中的修改会自动记录更新时间

2. **同步到本地**



```Bash
# 增量同步（只同步最近 3 天更新的文档）
npm run sync

# 本地预览
npm start

# 构建生产版本
npm run build
```



## **🔨 可用命令**



<table><tbody>
<tr>
<td>

命令

</td>
<td>

说明

</td>
</tr>
<tr>
<td>

`npm start`

</td>
<td>

启动开发服务器 (http://localhost:3000)

</td>
</tr>
<tr>
<td>

`npm run build`

</td>
<td>

构建生产版本

</td>
</tr>
<tr>
<td>

`npm run build:cf`

</td>
<td>

Cloudflare Pages 构建（同步 \+ 构建）

</td>
</tr>
<tr>
<td>

`npm run sync`

</td>
<td>

从飞书增量同步内容

</td>
</tr>
<tr>
<td>

`npm run serve`

</td>
<td>

预览构建结果

</td>
</tr>
<tr>
<td>

`npm run clear`

</td>
<td>

清除缓存

</td>
</tr>
</tbody></table>



## **🎯 核心优势**



### **1. 性能优势**



<table><tbody>
<tr>
<td>

指标

</td>
<td>

传统方案

</td>
<td>

我们的方案

</td>
<td>

提升

</td>
</tr>
<tr>
<td>

首次同步

</td>
<td>

2\-3 分钟

</td>
<td>

2\-3 分钟

</td>
<td>

- 
</td>
</tr>
</tbody></table>

\| 增量同步 \| 2\-3 分钟 \| 10\-20 秒 \| **10\-20x** \|

\| API 调用 \| 全量 \| 按需 \| 减少 80%\+ \|



### **2. URL 友好度**



**传统方案**：

```Plain Text
/PXW0wbbLaiD77PkhD52ctpUvnIf/VZKWwL4wyidtr9kOSN3cHD20nbc
```



**我们的方案**：

```Plain Text
/collection-1/sub-document
```



### **3. 维护性**



- ✅ 完全自主的同步逻辑，易于调试和扩展

- ✅ 清晰的两阶段处理流程

- ✅ 详细的日志输出

- ✅ 代码简洁，注释完整

### **4. 功能完整性**



- ✅ 支持文档集合嵌套（无限层级）

- ✅ 保持文档顺序

- ✅ 自动解析和应用 slug

- ✅ 智能增量更新

- ✅ 错误处理和重试机制

## **🎨 UI/UX 设计**



### **极简美学**



- **Logo**: 黑色圆形背景 \+ 白色 M 字母

- **Favicon**: 白色背景 \+ 黑色 M 字母

- **导航**: 简洁导航栏，Logo 点击进入\&\#34;关于我\&\#34;

- **Footer**: 极简设计，只显示 Copyright



### **响应式设计**



- 完美适配桌面、平板、手机

- 自适应亮/暗主题

- 流畅的导航体验

## **🔧 高级配置**



### **GitHub Pages 部署设置**



**在 GitHub 仓库中启用 GitHub Pages**：



1. 进入仓库 Settings → Pages

2. Source 选择 \&\#34;GitHub Actions\&\#34;

3. 保存后会自动部署

**无需额外配置**！推送代码后会自动触发部署。



访问地址：`https://moyuanhua.github.io`



### **Cloudflare Pages 部署设置**



**连接 GitHub 仓库**：



4. 登录 Cloudflare Dashboard

5. Pages → 创建项目 → 连接到 Git

6. 选择 `moyuanhua/moyuanhua.github.io` 仓库

**构建配置**：



<table><tbody>
<tr>
<td>

配置项

</td>
<td>

值

</td>
</tr>
<tr>
<td>

框架预设

</td>
<td>

None

</td>
</tr>
<tr>
<td>

构建命令

</td>
<td>

`cd app \&\& npm install \&\& npm run build`

</td>
</tr>
<tr>
<td>

构建输出目录

</td>
<td>

`app/build`

</td>
</tr>
<tr>
<td>

根目录

</td>
<td>

`/`

</td>
</tr>
</tbody></table>



**环境变量设置**：



```Bash
SKIP_FEISHU_SYNC=true
NODE_ENV=production
SITE_URL=https://blog.shopifytools.work
BASE_URL=/
```



保存后会自动部署，每次 Git 推送都会触发自动部署。



访问地址：`https://blog.shopifytools.work`（或你的自定义域名）



### **双平台对比**



<table><tbody>
<tr>
<td>

特性

</td>
<td>

GitHub Pages

</td>
<td>

Cloudflare Pages

</td>
</tr>
<tr>
<td>

部署速度

</td>
<td>

\~1\-2 分钟

</td>
<td>

\~30\-60 秒

</td>
</tr>
<tr>
<td>

CDN

</td>
<td>

GitHub CDN

</td>
<td>

Cloudflare 全球 CDN

</td>
</tr>
<tr>
<td>

访问速度（国内）

</td>
<td>

较慢

</td>
<td>

快

</td>
</tr>
<tr>
<td>

访问速度（国外）

</td>
<td>

快

</td>
<td>

很快

</td>
</tr>
<tr>
<td>

自定义域名

</td>
<td>

支持

</td>
<td>

支持

</td>
</tr>
<tr>
<td>

HTTPS

</td>
<td>

自动

</td>
<td>

自动

</td>
</tr>
<tr>
<td>

成本

</td>
<td>

免费

</td>
<td>

免费

</td>
</tr>
</tbody></table>



**推荐**：两个都部署，国内用户访问 Cloudflare，国外用户访问 GitHub Pages。



### **调整增量同步天数**



编辑 `\.env`：



```Bash
# 本地开发：3-7 天
FEISHU_INCREMENTAL_DAYS=3

# GitHub Actions：7 天（在 workflow 文件中设置）
FEISHU_INCREMENTAL_DAYS=7

# 全量同步（首次或需要完整更新时）
FEISHU_INCREMENTAL_DAYS=0
```



### **GitHub Actions 定时任务配置**



编辑 `\.github/workflows/sync\-feishu\-docs.yml`：



```YAML
# 修改定时执行时间（cron 格式，UTC 时间）
schedule:
  - cron: '0 1 * * *'  # 每天 UTC 1:00 (北京时间 9:00)
  - cron: '0 13 * * *' # 每天 UTC 13:00 (北京时间 21:00)
```



### **自定义主题颜色**



编辑 `src/css/custom.css`：



```CSS
:root {
  --ifm-color-primary: #2e8555;
}

[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
}
```



## **📊 技术指标**



- **构建时间**: \~2\-3 秒（增量）

- **同步时间**: \~10\-20 秒（3天内更新）

- **包大小**: \~500KB（gzipped）

- **性能评分**: 95\+ (Lighthouse)

- **SEO 友好**: 100% 静态生成



## **🚧 故障排除**



### **同步失败**



```Bash
# 1. 检查环境变量
cat .env | grep FEISHU

# 2. 测试 API 连接
curl -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal \
  -H "Content-Type: application/json" \
  -d '{"app_id":"your_id","app_secret":"your_secret"}'

# 3. 查看详细日志
npm run sync
```



### **构建失败**



```Bash
# 清除缓存并重建
npm run clear
rm -rf node_modules package-lock.json
npm install
npm run build
```



## **🔐 安全性**



- ✅ API 密钥通过环境变量管理

- ✅ 不在代码中硬编码敏感信息

- ✅ 构建时敏感信息不会泄露到静态文件

- ✅ 使用 HTTPS 访问所有 API

## **📈 更新日志**



### **V4.0 (2025\-11\-16) 🎉**



**重大升级：迁移到飞书官方 Markdown API**



**新增功能：**

- ✅ 使用飞书官方 `/open\-apis/docs/v1/content` API 获取 Markdown

- ✅ 支持完整的文档格式（有序列表、引用容器、所有块类型）

- ✅ 自动处理 `Plain Text` 和 `text` 格式的 slug 代码块

**优化改进：**

- 📦 移除 `feishu\-docx` 第三方依赖，减少 43 个包

- 🚀 代码量减少 40%（移除 Block 获取和转换逻辑）

- ⚡ API 调用次数大幅减少（从分页获取 Block → 一次获取完整内容）

- 🔧 简化 `downloadAndConvertDoc()` 函数逻辑

**修复问题：**

- ✅ 修复有序列表在转换后丢失的问题

- ✅ 修复引用容器（quote_container）内容不显示的问题

- ✅ 修复其他第三方库不支持的块类型

**破坏性变更：**

- ⚠️ 需要在飞书应用中添加新权限：`docs:document.content:read`

- ⚠️ 旧的 `docx:document:readonly` 权限已不再使用

**升级指南：**

7. 访问飞书开放平台应用管理

8. 添加权限：`docs:document.content:read`（查看云文档内容）

9. 发布新版本（权限才会生效）

10. 运行 `npm install` 重新安装依赖

11. 运行 `npm run sync` 测试同步

### **V3.0 (2025\-11\-14)**



**核心功能：**

- ✅ 真正的增量同步系统

- ✅ 智能 Slug 管理和路径映射

- ✅ 嵌套文档集合支持

- ✅ 双平台自动部署

## **📈 未来规划**



* [ ] 支持多语言文档

* [ ] 添加评论系统集成

* [ ] 文档版本管理

* [ ] 全文搜索优化

* [ ] 图片自动上传和优化



## **📄 License**



MIT



## **🤝 贡献**



欢迎提交 Issues 和 Pull Requests！



## **📮 联系方式**



- GitHub: [@moyuanhua](https://github.com/moyuanhua)

- Website: https://blog.shopifytools.work

---



**Built with ❤️ using Docusaurus \& Feishu**



*智能增量同步 \| 完美 SEO \| 极简设计*