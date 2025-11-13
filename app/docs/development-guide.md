---
sidebar_position: 3
title: 开发指南
---

# 开发指南

本指南帮助你了解如何参与项目开发和自定义功能。

## 项目结构

```
app/
├── docs/                      # 中文文档
│   ├── intro.md
│   ├── quick-start.md
│   └── ...
├── blog/                      # 中文博客
│   ├── 2025-01-15-xxx.md
│   └── authors.yml
├── i18n/en/                   # 英文内容
│   ├── docusaurus-plugin-content-docs/
│   └── docusaurus-plugin-content-blog/
├── src/
│   ├── components/            # React 组件
│   │   ├── ProjectCard/
│   │   ├── HomepageFeatures/
│   │   └── RecentPosts/
│   ├── pages/                 # 页面
│   │   ├── index.tsx          # 首页
│   │   └── about.md           # 关于页
│   ├── css/                   # 样式
│   │   └── custom.css
│   └── data/                  # 数据文件
│       └── projects.json
├── static/                    # 静态资源
│   ├── img/
│   └── robots.txt
├── scripts/                   # 脚本工具
│   ├── sync-feishu.js         # 飞书同步
│   ├── validate-structure.js  # 结构验证
│   └── verify-build.js        # 构建验证
├── docusaurus.config.ts       # 主配置
├── sidebars.ts                # 侧边栏配置
├── .env                       # 环境变量
└── package.json               # 依赖配置
```

## 开发环境设置

### 系统要求
- Node.js >= 20.0
- npm 或 yarn
- Git
- 飞书应用凭证（可选）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/murphy-blog.git
cd murphy-blog/app
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
复制 `.env.example` 到 `.env` 并填写配置：
```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_WIKI_ID=your_wiki_id
FEISHU_ZH_NODE_ID=chinese_node_id
FEISHU_EN_NODE_ID=english_node_id
```

4. **启动开发服务器**
```bash
npm start
```

访问 http://localhost:3000

## 核心概念

### 组件系统

#### ProjectCard 组件
展示项目卡片，支持双语标题和描述。

**使用示例:**
```typescript
import ProjectCard from '@site/src/components/ProjectCard';

<ProjectCard
  title={{ zh: "项目名称", en: "Project Name" }}
  description={{ zh: "项目描述", en: "Description" }}
  link="https://github.com/..."
  tags={["React", "TypeScript"]}
  featured={true}
  status="active"
/>
```

**Props 类型:**
```typescript
interface ProjectCardProps {
  title: { zh: string; en: string } | string;
  description: { zh: string; en: string } | string;
  link: string;
  image?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'maintenance';
  featured?: boolean;
}
```

#### HomepageFeatures 组件
首页展示精选项目，从 `projects.json` 读取数据。

```typescript
// 自动筛选 featured=true 且 status=active 的项目
const featuredProjects = projectsData.projects
  .filter(project => project.featured && project.status === 'active')
  .sort((a, b) => (a.order || 999) - (b.order || 999));
```

#### RecentPosts 组件
显示最新的博客文章。

```typescript
const blogData = usePluginData('docusaurus-plugin-content-blog', 'default');
const recentPosts = blogData?.recentPosts.slice(0, 5);
```

### 数据管理

#### 项目数据 (projects.json)
```json
{
  "projects": [
    {
      "id": "unique-id",
      "title": {
        "zh": "中文标题",
        "en": "English Title"
      },
      "description": {
        "zh": "中文描述",
        "en": "English Description"
      },
      "link": "https://github.com/username/repo",
      "image": "/img/projects/project.png",
      "tags": ["React", "TypeScript", "Docusaurus"],
      "featured": true,
      "status": "active",
      "order": 1
    }
  ]
}
```

**字段说明:**
- `id`: 唯一标识符
- `title`: 双语标题对象
- `description`: 双语描述对象
- `link`: 项目链接
- `image`: 项目图片（可选）
- `tags`: 技术标签数组
- `featured`: 是否在首页展示
- `status`: 项目状态 (active/archived/maintenance)
- `order`: 排序优先级（数字越小越靠前）

#### 博客作者 (authors.yml)
```yaml
murphy:
  name: Murphy
  title: Full Stack Developer
  url: https://github.com/your-username
  image_url: https://github.com/your-username.png
```

## 主题定制

### 颜色配置

编辑 `src/css/custom.css`:

```css
:root {
  /* 主色调 */
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;

  /* 其他颜色 */
  --ifm-code-font-size: 95%;
}

/* 深色模式 */
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  /* ... */
}
```

### 自定义样式

添加全局样式:

```css
/* 首页hero样式 */
.hero--primary {
  background: linear-gradient(
    135deg,
    var(--ifm-color-primary) 0%,
    var(--ifm-color-primary-dark) 100%
  );
  padding: 4rem 2rem;
}

/* 卡片增强 */
.card {
  height: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

## 添加新功能

### 创建新组件

1. **创建组件目录**
```bash
mkdir -p src/components/MyComponent
```

2. **编写组件代码**
```typescript
// src/components/MyComponent/index.tsx
import React from 'react';
import styles from './styles.module.css';

interface MyComponentProps {
  title: string;
  content: string;
}

export default function MyComponent({ title, content }: MyComponentProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.content}>{content}</p>
    </div>
  );
}
```

3. **添加样式**
```css
/* src/components/MyComponent/styles.module.css */
.container {
  padding: 2rem;
  border-radius: 8px;
  background: var(--ifm-background-surface-color);
}

.title {
  margin-bottom: 1rem;
  color: var(--ifm-color-primary);
}

.content {
  line-height: 1.6;
}
```

4. **使用组件**
```typescript
import MyComponent from '@site/src/components/MyComponent';

<MyComponent title="标题" content="内容" />
```

### 添加新页面

在 `src/pages/` 创建文件:

```typescript
// src/pages/custom.tsx
import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function CustomPage() {
  return (
    <Layout
      title="Custom Page"
      description="Custom page description">
      <main className="container margin-vert--lg">
        <Heading as="h1">自定义页面</Heading>
        <p>这是一个自定义页面</p>
      </main>
    </Layout>
  );
}
```

访问路径: http://localhost:3000/custom

### 配置导航

编辑 `docusaurus.config.ts`:

```typescript
navbar: {
  items: [
    {
      label: '自定义',
      to: '/custom',
      position: 'left'
    },
    {
      label: '外部链接',
      href: 'https://example.com',
      position: 'right'
    }
  ]
}
```

## 内容管理

### 添加文档

在 `docs/` 目录创建 Markdown 文件:

```markdown
---
sidebar_position: 4
title: 新文档
---

# 新文档标题

文档内容...
```

### 添加博客

在 `blog/` 目录创建文件:

```markdown
---
slug: my-blog-post
title: 博客标题
authors: [murphy]
tags: [react, typescript]
---

博客摘要...

<!--truncate-->

完整内容...
```

### 双语内容

为英文版本创建对应文件:
- 中文: `docs/guide.md`
- 英文: `i18n/en/docusaurus-plugin-content-docs/current/guide.md`

## 脚本工具

### 飞书同步
```bash
npm run sync
```

同步飞书知识库内容到本地。

### 结构验证
```bash
npm run validate
```

验证中英文目录结构一致性。

### 构建验证
```bash
npm run verify
```

检查构建输出完整性。

### 清除缓存
```bash
npm run clear
```

清除构建缓存和生成文件。

## 调试技巧

### 查看详细日志
```bash
npm start -- --verbose
```

### 检查类型错误
```bash
npm run typecheck
```

### 分析包大小
```bash
npm run build -- --bundle-analyzer
```

## 构建部署

### 本地构建
```bash
npm run build
```

输出目录: `build/`

### 预览构建
```bash
npm run serve
```

访问 http://localhost:3000

### Cloudflare Pages
```bash
npm run build:cf
```

同步飞书内容后构建。

## 测试

### 手动测试清单

- [ ] 页面正常加载
- [ ] 语言切换正常
- [ ] 搜索功能正常
- [ ] 链接无损坏
- [ ] 图片正常显示
- [ ] 响应式布局正常
- [ ] 深色模式正常

### 构建验证
```bash
npm run build
npm run verify
```

## 常见问题

### Q: 开发服务器启动失败
A: 检查端口 3000 是否被占用，或使用其他端口:
```bash
npm start -- --port 3001
```

### Q: 构建失败
A: 清除缓存后重试:
```bash
npm run clear && npm run build
```

### Q: 搜索不工作
A: 确保已安装搜索插件依赖，检查配置是否正确。

### Q: 语言切换后 404
A: 检查中英文目录结构是否一致:
```bash
npm run validate
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### PR 流程
1. Fork 项目
2. 创建特性分支: `git checkout -b feature/xxx`
3. 提交代码: `git commit -m 'Add xxx'`
4. 推送分支: `git push origin feature/xxx`
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 规则
- 添加必要的注释
- 更新相关文档

## 更多资源

- [Docusaurus 官方文档](https://docusaurus.io/)
- [React 文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [飞书开放平台](https://open.feishu.cn/)

Happy Coding! 🚀
