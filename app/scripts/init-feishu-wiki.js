#!/usr/bin/env node

/**
 * 飞书知识库初始化脚本
 * 创建基础的文档结构和示例内容
 */

const https = require('https');
require('dotenv').config();

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const WIKI_ID = process.env.FEISHU_WIKI_ID;
const ZH_NODE_ID = process.env.FEISHU_ZH_NODE_ID;
const EN_NODE_ID = process.env.FEISHU_EN_NODE_ID;

console.log('🚀 开始初始化飞书知识库...\n');

// 获取 tenant_access_token
function getTenantAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) {
          resolve(result.tenant_access_token);
        } else {
          reject(new Error(result.msg));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 创建文档
function createDoc(token, spaceId, title, content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: title,
      content: content
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: `/open-apis/docx/v1/documents`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) {
          resolve(result.data);
        } else {
          reject(new Error(`${result.code}: ${result.msg}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 在知识库中创建节点
function createWikiNode(token, spaceId, parentNodeToken, title, objType, objToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      obj_type: objType,
      parent_node_token: parentNodeToken,
      node_type: 'origin',
      origin_node_token: objToken,
      title: title
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: `/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) {
          resolve(result.data.node);
        } else {
          reject(new Error(`${result.code}: ${result.msg}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 中文文档内容
const zhDocs = [
  {
    title: '快速开始',
    content: `# 快速开始

欢迎来到 Murphy Blog！这是一个基于 Docusaurus 和飞书知识库的现代化技术博客系统。

## 主要特性

- 📝 **双语支持**: 完整的中英文内容支持
- 🔄 **飞书集成**: 在飞书中编辑，自动同步到网站
- 🔍 **智能搜索**: 支持中文分词的全文搜索
- 📱 **响应式设计**: 完美适配各种设备
- 🚀 **快速部署**: Cloudflare Pages 全球 CDN

## 快速上手

1. 浏览文档了解系统架构
2. 查看项目展示了解我的作品
3. 阅读博客文章学习技术知识
4. 通过关于页面了解更多信息

## 技术栈

- **前端框架**: React 19 + TypeScript
- **静态生成**: Docusaurus 3.9.2
- **内容管理**: 飞书知识库
- **搜索引擎**: 本地搜索 + 中文分词
- **部署平台**: Cloudflare Pages

让我们开始探索吧！🎉`
  },
  {
    title: '项目介绍',
    content: `# 项目介绍

Murphy Blog 是一个现代化的技术博客系统，专为开发者设计。

## 设计理念

### 内容为王
我们相信优质的内容是博客的核心价值。通过飞书知识库管理内容，让创作者专注于内容本身，而不是技术细节。

### 开发者友好
- TypeScript 类型安全
- 组件化架构
- 清晰的项目结构
- 完善的文档

### 性能优先
- 静态站点生成 (SSG)
- 代码分割和懒加载
- 图片优化
- CDN 全球加速

## 核心功能

### 1. 双语支持
完整的国际化支持，中英文内容独立管理，自动语言检测。

### 2. 飞书集成
- 在飞书中编辑内容
- 自动同步到网站
- 支持 Markdown 格式
- 图片资源托管

### 3. 本地搜索
- 无需第三方服务
- 支持中文分词
- 实时搜索结果
- 关键词高亮

### 4. 项目展示
通过结构化数据展示你的项目：
- 项目卡片
- 标签分类
- 状态标识
- 外链支持

## 适用场景

- 个人技术博客
- 项目文档站点
- 团队知识库
- 产品说明文档

## 开始使用

查看快速开始指南，5 分钟搭建你的技术博客！`
  },
  {
    title: '开发指南',
    content: `# 开发指南

本指南帮助你了解如何参与项目开发和自定义功能。

## 项目结构

\`\`\`
app/
├── docs/              # 中文文档
├── blog/              # 中文博客
├── i18n/en/           # 英文内容
├── src/
│   ├── components/    # React 组件
│   ├── pages/         # 页面
│   ├── css/           # 样式
│   └── data/          # 数据文件
├── static/            # 静态资源
└── scripts/           # 脚本工具
\`\`\`

## 开发环境

### 要求
- Node.js >= 20.0
- npm 或 yarn
- 飞书应用凭证

### 安装
\`\`\`bash
cd app
npm install
\`\`\`

### 启动开发服务器
\`\`\`bash
npm start
\`\`\`

访问 http://localhost:3000

## 自定义主题

### 颜色配置
编辑 \`src/css/custom.css\`:

\`\`\`css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  /* 更多颜色变量... */
}
\`\`\`

### 深色模式
\`\`\`css
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  /* 深色主题颜色... */
}
\`\`\`

## 添加组件

### 创建新组件
\`\`\`typescript
// src/components/MyComponent/index.tsx
import React from 'react';
import styles from './styles.module.css';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      {/* 组件内容 */}
    </div>
  );
}
\`\`\`

### 使用组件
\`\`\`typescript
import MyComponent from '@site/src/components/MyComponent';

<MyComponent />
\`\`\`

## 添加页面

在 \`src/pages/\` 目录创建文件：

\`\`\`typescript
// src/pages/custom.tsx
import Layout from '@theme/Layout';

export default function CustomPage() {
  return (
    <Layout title="Custom Page">
      <div>Your content here</div>
    </Layout>
  );
}
\`\`\`

访问 http://localhost:3000/custom

## 配置导航

编辑 \`docusaurus.config.ts\`:

\`\`\`typescript
navbar: {
  items: [
    {
      label: '自定义',
      to: '/custom',
      position: 'left'
    }
  ]
}
\`\`\`

## 构建部署

### 本地构建
\`\`\`bash
npm run build
\`\`\`

### 预览构建
\`\`\`bash
npm run serve
\`\`\`

### Cloudflare Pages
\`\`\`bash
npm run build:cf
\`\`\`

## 调试技巧

### 查看构建日志
构建失败时检查详细日志

### 清除缓存
\`\`\`bash
npm run clear
\`\`\`

### 验证结构
\`\`\`bash
npm run validate
\`\`\`

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### Pull Request 流程
1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 发起 PR

## 常见问题

### Q: 如何添加新的博客文章？
A: 在 \`blog/\` 目录创建 Markdown 文件

### Q: 如何修改首页？
A: 编辑 \`src/pages/index.tsx\`

### Q: 如何添加新的文档？
A: 在飞书知识库中创建，然后同步

更多问题请查看 GitHub Issues。`
  }
];

// 英文文档内容
const enDocs = [
  {
    title: 'Quick Start',
    content: `# Quick Start

Welcome to Murphy Blog! This is a modern tech blog system built with Docusaurus and Feishu Wiki.

## Key Features

- 📝 **Bilingual Support**: Complete Chinese and English content
- 🔄 **Feishu Integration**: Edit in Feishu, sync to website automatically
- 🔍 **Smart Search**: Full-text search with Chinese word segmentation
- 📱 **Responsive Design**: Perfect for all devices
- 🚀 **Fast Deployment**: Cloudflare Pages global CDN

## Getting Started

1. Browse documentation to understand the architecture
2. Check project showcase to see my work
3. Read blog articles to learn tech knowledge
4. Visit about page for more information

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Static Generator**: Docusaurus 3.9.2
- **Content Management**: Feishu Wiki
- **Search Engine**: Local search + Chinese segmentation
- **Deployment**: Cloudflare Pages

Let's explore! 🎉`
  },
  {
    title: 'Project Introduction',
    content: `# Project Introduction

Murphy Blog is a modern tech blog system designed for developers.

## Design Philosophy

### Content First
We believe quality content is the core value of a blog. By managing content in Feishu Wiki, creators can focus on content itself rather than technical details.

### Developer Friendly
- TypeScript type safety
- Component-based architecture
- Clear project structure
- Comprehensive documentation

### Performance First
- Static Site Generation (SSG)
- Code splitting and lazy loading
- Image optimization
- Global CDN acceleration

## Core Features

### 1. Bilingual Support
Complete internationalization support with independent Chinese and English content management and automatic language detection.

### 2. Feishu Integration
- Edit content in Feishu
- Automatic sync to website
- Markdown format support
- Image hosting

### 3. Local Search
- No third-party service needed
- Chinese word segmentation
- Real-time search results
- Keyword highlighting

### 4. Project Showcase
Display your projects with structured data:
- Project cards
- Tag categorization
- Status indicators
- External links

## Use Cases

- Personal tech blog
- Project documentation site
- Team knowledge base
- Product documentation

## Get Started

Check the quick start guide to build your tech blog in 5 minutes!`
  },
  {
    title: 'Development Guide',
    content: `# Development Guide

This guide helps you understand how to contribute and customize features.

## Project Structure

\`\`\`
app/
├── docs/              # Chinese docs
├── blog/              # Chinese blog
├── i18n/en/           # English content
├── src/
│   ├── components/    # React components
│   ├── pages/         # Pages
│   ├── css/           # Styles
│   └── data/          # Data files
├── static/            # Static assets
└── scripts/           # Script tools
\`\`\`

## Development Environment

### Requirements
- Node.js >= 20.0
- npm or yarn
- Feishu app credentials

### Installation
\`\`\`bash
cd app
npm install
\`\`\`

### Start Dev Server
\`\`\`bash
npm start
\`\`\`

Visit http://localhost:3000

## Theme Customization

### Color Configuration
Edit \`src/css/custom.css\`:

\`\`\`css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  /* More color variables... */
}
\`\`\`

### Dark Mode
\`\`\`css
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  /* Dark theme colors... */
}
\`\`\`

## Adding Components

### Create New Component
\`\`\`typescript
// src/components/MyComponent/index.tsx
import React from 'react';
import styles from './styles.module.css';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}
\`\`\`

### Use Component
\`\`\`typescript
import MyComponent from '@site/src/components/MyComponent';

<MyComponent />
\`\`\`

## Adding Pages

Create files in \`src/pages/\` directory:

\`\`\`typescript
// src/pages/custom.tsx
import Layout from '@theme/Layout';

export default function CustomPage() {
  return (
    <Layout title="Custom Page">
      <div>Your content here</div>
    </Layout>
  );
}
\`\`\`

Visit http://localhost:3000/custom

## Configure Navigation

Edit \`docusaurus.config.ts\`:

\`\`\`typescript
navbar: {
  items: [
    {
      label: 'Custom',
      to: '/custom',
      position: 'left'
    }
  ]
}
\`\`\`

## Build & Deploy

### Local Build
\`\`\`bash
npm run build
\`\`\`

### Preview Build
\`\`\`bash
npm run serve
\`\`\`

### Cloudflare Pages
\`\`\`bash
npm run build:cf
\`\`\`

## Debug Tips

### Check Build Logs
Review detailed logs when build fails

### Clear Cache
\`\`\`bash
npm run clear
\`\`\`

### Validate Structure
\`\`\`bash
npm run validate
\`\`\`

## Contributing

Welcome to submit Issues and Pull Requests!

### PR Process
1. Fork project
2. Create feature branch
3. Commit code
4. Create PR

## FAQ

### Q: How to add new blog post?
A: Create Markdown file in \`blog/\` directory

### Q: How to modify homepage?
A: Edit \`src/pages/index.tsx\`

### Q: How to add new documentation?
A: Create in Feishu Wiki, then sync

More questions? Check GitHub Issues.`
  }
];

// 等待函数
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  try {
    console.log('1️⃣ 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('   ✅ 令牌获取成功\n');

    // 创建中文文档
    console.log('2️⃣ 创建中文文档...');
    for (let i = 0; i < zhDocs.length; i++) {
      const doc = zhDocs[i];
      console.log(`   📝 创建: ${doc.title}`);

      try {
        // 注意：由于飞书 API 限制，这里只演示如何创建文档
        // 实际需要更复杂的文档内容格式
        console.log(`   ⚠️  需要在飞书知识库中手动创建文档: "${doc.title}"`);
        console.log(`   内容预览: ${doc.content.substring(0, 100)}...\n`);
      } catch (error) {
        console.log(`   ❌ 创建失败: ${error.message}\n`);
      }

      await wait(500);
    }

    // 创建英文文档
    console.log('3️⃣ 创建英文文档...');
    for (let i = 0; i < enDocs.length; i++) {
      const doc = enDocs[i];
      console.log(`   📝 创建: ${doc.title}`);

      try {
        console.log(`   ⚠️  需要在飞书知识库中手动创建文档: "${doc.title}"`);
        console.log(`   内容预览: ${doc.content.substring(0, 100)}...\n`);
      } catch (error) {
        console.log(`   ❌ 创建失败: ${error.message}\n`);
      }

      await wait(500);
    }

    console.log('=' .repeat(60));
    console.log('\n📋 初始化内容清单\n');

    console.log('中文文档 (简体中文节点):');
    zhDocs.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title}`);
    });

    console.log('\n英文文档 (English节点):');
    enDocs.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title}`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log('\n💡 下一步操作:\n');
    console.log('由于飞书 API 的限制，建议手动在飞书知识库中创建以上文档。');
    console.log('文档内容已保存在此脚本中，可以直接复制使用。\n');
    console.log('创建完成后运行: npm run sync\n');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

main();
