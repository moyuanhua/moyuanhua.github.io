# Murphy Blog

基于 Docusaurus 和飞书知识库的双语技术博客系统

## ✨ 特性

- 📝 **双语支持**: 完整的中英文支持,自动语言检测
- 🔄 **飞书集成**: 内容管理在飞书知识库,自动同步到网站
- 🔍 **本地搜索**: 支持中文分词的全文搜索功能
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🚀 **快速部署**: 基于 Cloudflare Pages 的全球 CDN 部署
- 🎨 **现代化 UI**: 基于 Docusaurus 3.9.2,支持亮/暗主题

## 🏗️ 技术栈

- **静态站点生成器**: Docusaurus 3.9.2
- **内容管理**: 飞书知识库 + feishu-pages
- **搜索引擎**: @easyops-cn/docusaurus-search-local (中文分词)
- **部署平台**: Cloudflare Pages
- **语言**: TypeScript + React 19

## 📦 项目结构

```
murphy-blog/
├── app/                          # 应用代码
│   ├── docs/                     # 中文文档(飞书同步生成)
│   ├── blog/                     # 中文博客(飞书同步生成)
│   ├── i18n/en/                  # 英文内容(飞书同步生成)
│   ├── src/
│   │   ├── components/           # React 组件
│   │   │   ├── ProjectCard/      # 项目卡片
│   │   │   ├── HomepageFeatures/ # 首页项目展示
│   │   │   └── RecentPosts/      # 最新博文列表
│   │   ├── pages/                # 页面
│   │   ├── css/                  # 样式
│   │   └── data/                 # 数据文件
│   ├── static/                   # 静态资源
│   ├── scripts/                  # 脚本
│   │   ├── sync-feishu.js        # 飞书同步脚本
│   │   └── validate-structure.js # 结构验证脚本
│   ├── docusaurus.config.ts      # 主配置
│   ├── .env                      # 环境变量(本地)
│   └── package.json
└── specs/                        # 项目规范文档
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 要求 Node.js >= 20.0
node --version

# 克隆项目
git clone https://github.com/your-username/murphy-blog.git
cd murphy-blog/app
```

### 2. 配置飞书应用

**⚠️ 重要**: 首次使用需要配置飞书应用权限,请参考: [FEISHU_SETUP.md](../FEISHU_SETUP.md)

必需权限:
- `docx:document:readonly` - 获取文档内容
- `wiki:wiki:readonly` - 获取知识库信息
- `drive:drive:readonly` - 云空间权限

### 3. 配置环境变量

`.env` 文件中配置飞书 API 凭证:

```bash
# 飞书 API 凭证
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
FEISHU_WIKI_ID=your-wiki-id
FEISHU_ZH_NODE_ID=chinese-root-node-id
FEISHU_EN_NODE_ID=english-root-node-id

# 站点配置
SITE_URL=https://your-site.com
BASE_URL=/
```

### 3. 安装依赖

```bash
npm install
```

### 4. 同步飞书内容

```bash
npm run sync
```

### 5. 启动开发服务器

```bash
npm start
```

访问 http://localhost:3000 查看网站

## 📝 内容管理

### 飞书知识库结构

```
知识库根目录
├── 简体中文 (ZH_NODE_ID)
│   ├── intro.md
│   ├── guides/
│   └── ...
└── English (EN_NODE_ID)
    ├── intro.md
    ├── guides/
    └── ...
```

**重要**: 中英文目录结构必须完全一致,以确保语言切换功能正常工作

### 内容更新流程

1. 在飞书知识库中编辑内容
2. 运行同步脚本: `npm run sync`
3. 验证本地预览: `npm start`
4. 提交并推送代码,触发部署

## 🔨 可用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:cf` | Cloudflare Pages 构建(同步+构建) |
| `npm run sync` | 从飞书同步内容 |
| `npm run validate` | 验证目录结构一致性 |
| `npm run verify` | 验证构建输出完整性 |
| `npm run serve` | 预览构建结果 |

## 🌐 部署

详细部署说明请参考: [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

### 简要步骤:

1. 推送代码到 GitHub
2. 在 Cloudflare Pages 连接仓库
3. 配置构建命令: `cd app && npm install && npm run build:cf`
4. 配置输出目录: `app/build`
5. 设置环境变量
6. 触发部署

## 🎨 自定义

### 修改主题颜色

编辑 `app/src/css/custom.css`:

```css
:root {
  --ifm-color-primary: #2e8555;  /* 修改主色调 */
}
```

### 添加项目展示

编辑 `app/src/data/projects.json`:

```json
{
  "projects": [
    {
      "id": "your-project",
      "title": { "zh": "项目名称", "en": "Project Name" },
      "description": { "zh": "描述", "en": "Description" },
      "link": "https://github.com/...",
      "tags": ["React", "TypeScript"],
      "featured": true,
      "status": "active"
    }
  ]
}
```

### 修改导航栏

编辑 `app/docusaurus.config.ts` 的 `navbar` 配置

### 自定义页面

在 `app/src/pages/` 中创建新的 `.tsx` 或 `.md` 文件

## 🔧 故障排除

### 飞书同步失败

1. 检查环境变量配置是否正确
2. 验证飞书应用权限
3. 确认 WIKI_ID 和 NODE_ID 正确
4. 查看同步脚本日志

### 构建失败

```bash
# 清除缓存
npm run clear

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 语言切换不工作

运行验证脚本检查目录结构:

```bash
npm run validate
```

确保中英文目录结构完全一致

## 📄 License

MIT

## 🤝 贡献

欢迎 Issues 和 Pull Requests!

## 📮 联系

- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

---

**Made with ❤️ using Docusaurus**
