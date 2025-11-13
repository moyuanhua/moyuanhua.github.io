# Quickstart Guide: Feishu-Docusaurus Blog

**目标**: 在30分钟内完成从零到部署的完整流程

**前置条件**:
- Node.js >= 20.0
- Git
- GitHub账号
- 飞书账号(已创建知识库)

---

## 步骤概览

```
1. 飞书配置 (10分钟)
   └─ 创建应用,获取凭证,配置权限

2. 项目配置 (5分钟)
   └─ 克隆仓库,配置环境变量

3. 本地测试 (10分钟)
   └─ 同步内容,本地构建预览

4. 部署上线 (5分钟)
   └─ 配置GitHub Secrets,触发部署
```

---

## Step 1: 飞书开放平台配置

### 1.1 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击"创建企业自建应用"
3. 填写应用信息:
   - **应用名称**: Murphy Blog Sync
   - **应用描述**: 博客内容同步工具
   - **应用图标**: 上传图标(可选)

4. 创建完成后,进入应用详情页

### 1.2 获取应用凭证

在"凭证与基础信息"页面:

```
App ID: cli_a1b2c3d4e5f6g7h8          # 复制保存
App Secret: xxxxxxxxxxxxxxxx          # 点击"查看"并复制
```

**重要**: 妥善保存这两个值,后续会用到

### 1.3 配置API权限

进入"权限管理"页面,开通以下权限:

| 权限名称 | 权限代码 | 用途 |
|---------|---------|------|
| 获取文档内容 | `docx:document:readonly` | 读取文档正文 |
| 获取知识库信息 | `wiki:wiki:readonly` | 读取知识库结构 |
| 获取云文档 | `drive:drive:readonly` | 访问云端文件 |

**操作步骤**:
1. 搜索权限名称
2. 点击"申请权限"
3. 等待管理员审批(企业自建应用通常自动通过)

### 1.4 配置知识库

在飞书知识库中组织内容:

```
知识库根目录
├── 简体中文           # 中文根节点
│   ├── 入门
│   │   └── 快速开始.md
│   ├── 教程
│   │   ├── 基础教程.md
│   │   └── 高级教程.md
│   └── API参考
│       └── 接口文档.md
└── English           # 英文根节点
    ├── Getting Started
    │   └── Quick Start.md
    ├── Tutorials
    │   ├── Basic.md
    │   └── Advanced.md
    └── API Reference
        └── API Docs.md
```

**关键要求**:
1. 创建两个一级节点:"简体中文"和"English"
2. 两个节点下的文档结构必须完全一致
3. 对应文档的slug必须相同

**设置节点slug**:
1. 选中节点
2. 点击右上角"..."-> "设置"
3. 在"高级设置"中设置slug:
   - 简体中文: `zh-CN`
   - English: `en`

### 1.5 获取知识库和节点ID

**获取知识库ID**:
1. 打开知识库
2. 查看浏览器地址栏,格式如:
   ```
   https://xxx.feishu.cn/wiki/wikbcSGV5UrDn4jJtQgwSr8Qk2g
                              └─────── 知识库ID ────────┘
   ```
3. 复制`wik`开头的ID

**获取节点ID**:
1. 在知识库中右键"简体中文"节点
2. 选择"更多" -> "复制文档链接"
3. 从链接中提取`wikcn`开头的ID
4. 重复步骤获取"English"节点ID

**保存这些ID**:
```
FEISHU_WIKI_ID=wikbcSGV5UrDn4jJtQgwSr8Qk2g
FEISHU_ZH_NODE_ID=wikcnGxAuVLmvW8Q6aLOTCLJe0e
FEISHU_EN_NODE_ID=wikcnHxBuVMmvY9R7bMPUDMKf1f
```

---

## Step 2: 项目配置

### 2.1 克隆仓库

```bash
# 克隆仓库
git clone https://github.com/username/murphy-blog.git
cd murphy-blog

# 安装依赖
cd app
npm install
cd ..
```

### 2.2 配置环境变量

**复制环境变量模板**:
```bash
cp .env.example .env
```

**编辑`.env`文件**:
```bash
# 使用文本编辑器打开.env
nano .env

# 或
code .env
```

**填写配置**(使用Step 1中获取的值):
```bash
# 飞书配置
FEISHU_APP_ID=cli_a1b2c3d4e5f6g7h8
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_WIKI_ID=wikbcSGV5UrDn4jJtQgwSr8Qk2g
FEISHU_ZH_NODE_ID=wikcnGxAuVLmvW8Q6aLOTCLJe0e
FEISHU_EN_NODE_ID=wikcnHxBuVMmvY9R7bMPUDMKf1f

# 站点配置
SITE_URL=https://your-username.github.io
BASE_URL=/murphy-blog/
```

**保存并验证**:
```bash
# 验证环境变量
node scripts/validate-env.js
```

如果看到`✅ All environment variables are valid`,说明配置正确。

### 2.3 更新Docusaurus配置

编辑`app/docusaurus.config.ts`:

```typescript
const config: Config = {
  title: 'Murphy Blog',                    // 修改为你的站点名称
  tagline: '技术博客与项目展示',           // 修改为你的副标题

  url: 'https://your-username.github.io', // 修改为你的GitHub Pages URL
  baseUrl: '/murphy-blog/',               // 修改为你的仓库名

  organizationName: 'your-username',      // 你的GitHub用户名
  projectName: 'murphy-blog',             // 你的仓库名

  // ... 其他配置保持不变
};
```

---

## Step 3: 本地测试

### 3.1 同步飞书内容

```bash
# 首次同步(可能需要2-5分钟,取决于文档数量)
node scripts/sync-feishu.js
```

**预期输出**:
```
🚀 Starting Feishu content sync...

✅ Environment variables validated

📥 Syncing 中文 content...
   Node ID: wikcnGxAuVLmvW8Q6aLOTCLJe0e
   Output: /Users/anker/wps-me/murphy-blog/app/docs
   [feishu-pages] Syncing wiki...
   [feishu-pages] Downloaded 5 documents
   [feishu-pages] Downloaded 12 images
✅ 中文 sync completed

📥 Syncing English content...
   Node ID: wikcnHxBuVMmvY9R7bMPUDMKf1f
   Output: /Users/anker/wps-me/murphy-blog/app/i18n/en/...
   [feishu-pages] Syncing wiki...
   [feishu-pages] Downloaded 5 documents
   [feishu-pages] Downloaded 12 images
✅ English sync completed

🔍 Validating directory structure consistency...
✅ Directory structure is consistent

📊 Sync Report
==================================================
ZH: ✅ SUCCESS
EN: ✅ SUCCESS
==================================================
Total: 2/2 successful

✨ Sync process completed!
```

**检查同步结果**:
```bash
# 查看同步的中文文档
ls app/docs/

# 查看同步的英文文档
ls app/i18n/en/docusaurus-plugin-content-docs/current/

# 查看下载的图片
ls app/static/feishu-assets/images/
```

### 3.2 本地构建预览

```bash
# 进入app目录
cd app

# 开发模式(热重载)
npm run start

# 或指定语言
npm run start -- --locale zh
npm run start -- --locale en
```

**访问**: 浏览器自动打开 http://localhost:3000

**验证清单**:
- [ ] 首页正常显示
- [ ] 导航栏显示"文档"、"博客"、"关于我"
- [ ] 语言切换器可用
- [ ] 点击文档可以查看内容
- [ ] 图片正常加载
- [ ] 中英文切换正常

### 3.3 生产构建测试

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run serve
```

**访问**: http://localhost:3000

**检查构建产物**:
```bash
ls build/
# 应该看到:
# - index.html
# - zh/ (中文站点)
# - en/ (英文站点)
# - assets/ (样式和脚本)
# - feishu-assets/ (图片)
```

---

## Step 4: 部署到GitHub Pages

### 4.1 配置GitHub Secrets

1. 访问你的GitHub仓库
2. 进入 Settings → Secrets and variables → Actions
3. 点击"New repository secret"
4. 添加以下Secrets:

| Name | Value |
|------|-------|
| `FEISHU_APP_ID` | 你的飞书App ID |
| `FEISHU_APP_SECRET` | 你的飞书App Secret |
| `FEISHU_WIKI_ID` | 你的知识库ID |
| `FEISHU_ZH_NODE_ID` | 中文节点ID |
| `FEISHU_EN_NODE_ID` | 英文节点ID |

### 4.2 配置GitHub Pages

1. 进入 Settings → Pages
2. Source选择: **GitHub Actions**
3. 保存设置

### 4.3 创建Workflow文件

**如果`.github/workflows/deploy.yml`不存在,创建它**:

```bash
mkdir -p .github/workflows
```

**复制deploy.yml内容**:
参考`specs/001-feishu-docusaurus-blog/contracts/github-actions.md`中的完整配置

### 4.4 推送代码触发部署

```bash
# 添加所有更改
git add .

# 提交
git commit -m "feat: setup Feishu-Docusaurus blog system"

# 推送到main分支
git push origin main
```

### 4.5 监控部署进度

1. 访问 Actions 标签页
2. 查看"Deploy to GitHub Pages" workflow
3. 等待所有步骤完成(通常5-10分钟)

**workflow步骤**:
```
✅ Checkout repository
✅ Setup Node.js
✅ Install dependencies
✅ Sync Feishu content
✅ Build Docusaurus
✅ Upload Pages artifact
✅ Deploy to GitHub Pages
```

### 4.6 访问你的网站

部署成功后:
```
🎉 Deployment successful!
📍 Site URL: https://your-username.github.io/murphy-blog/
```

访问该URL,验证:
- [ ] 网站正常加载
- [ ] 中英文内容都可访问
- [ ] 语言自动切换正常
- [ ] 搜索功能可用
- [ ] 图片正常显示

---

## Step 5: 日常使用

### 在飞书中更新内容

1. 在飞书知识库中编辑文档
2. 等待GitHub Actions自动同步(每天一次)
3. 或手动触发同步:
   - 访问 Actions → Deploy to GitHub Pages
   - 点击"Run workflow"
   - 选择main分支
   - 点击"Run workflow"

### 本地预览更新

```bash
# 重新同步内容
node scripts/sync-feishu.js

# 启动开发服务器
cd app
npm run start
```

### 添加新文档

1. 在飞书知识库的对应语言节点下创建文档
2. 设置frontmatter(可选):
   ```markdown
   ---
   sidebar_position: 3
   sidebar_label: 简短标题
   ---

   # 文档标题

   正文内容...
   ```
3. 同步并部署(自动或手动触发)

---

## 常见问题

### Q1: 同步失败,提示403错误

**原因**: 飞书应用权限未配置

**解决**:
1. 检查飞书开放平台"权限管理"
2. 确保已开通`docx:document:readonly`、`wiki:wiki:readonly`、`drive:drive:readonly`权限
3. 如果是新申请的权限,等待生效(通常几分钟)

### Q2: 部署后样式丢失

**原因**: `baseUrl`配置错误

**解决**:
检查`app/docusaurus.config.ts`:
```typescript
// 用户站点: https://username.github.io
baseUrl: '/'

// 项目站点: https://username.github.io/murphy-blog
baseUrl: '/murphy-blog/'  // 必须与仓库名一致
```

### Q3: 中英文切换后404

**原因**: 中英文文档结构不一致

**解决**:
1. 运行验证脚本:
   ```bash
   node scripts/sync-feishu.js
   ```
2. 查看输出,找到缺失的文档
3. 在飞书中补充对应语言版本的文档

### Q4: 搜索功能不可用

**原因**: 搜索插件未安装

**解决**:
```bash
cd app
npm install @easyops-cn/docusaurus-search-local
```

然后检查`docusaurus.config.ts`中是否配置了search主题

### Q5: 图片显示404

**原因**: 图片未正确同步

**解决**:
1. 检查`app/static/feishu-assets/`目录是否有图片
2. 重新运行同步:
   ```bash
   node scripts/sync-feishu.js
   ```
3. 确认飞书文档中的图片有访问权限

---

## 下一步

完成快速开始后,你可以:

1. **自定义首页**:
   - 编辑`app/src/pages/index.tsx`
   - 添加项目展示卡片
   - 显示最新博文

2. **配置搜索**:
   - 按照`contracts/docusaurus-config.md`配置搜索插件
   - 调整搜索结果数量和上下文长度

3. **添加"关于我"页面**:
   - 创建`app/src/pages/about.md`
   - 编写个人简介

4. **优化SEO**:
   - 添加sitemap
   - 配置meta标签
   - 设置Open Graph图片

5. **集成评论系统**:
   - 使用Giscus或Disqus
   - 在文档底部显示评论

6. **配置飞书webhook**:
   - 实现实时同步(高级功能)
   - 参考`contracts/github-actions.md`

---

## 检查清单

部署前的最终检查:

- [ ] 飞书应用权限已配置
- [ ] 知识库结构符合要求(双语根节点)
- [ ] 环境变量已正确配置
- [ ] 本地同步和构建成功
- [ ] GitHub Secrets已配置
- [ ] GitHub Pages已启用
- [ ] Workflow文件已创建
- [ ] 代码已推送到main分支
- [ ] 部署workflow执行成功
- [ ] 网站可以正常访问

---

## 获取帮助

如果遇到问题:

1. **查看日志**:
   - GitHub Actions日志
   - 浏览器开发者工具Console

2. **参考文档**:
   - `specs/001-feishu-docusaurus-blog/research.md`
   - `specs/001-feishu-docusaurus-blog/contracts/`

3. **调试命令**:
   ```bash
   # 详细日志模式同步
   DEBUG=* node scripts/sync-feishu.js

   # Docusaurus调试模式
   cd app
   npm run build -- --debug
   ```

4. **社区支持**:
   - [Docusaurus Discord](https://discord.gg/docusaurus)
   - [飞书开放平台社区](https://open.feishu.cn/community)

---

恭喜!你已经成功搭建了基于飞书的双语博客系统!
