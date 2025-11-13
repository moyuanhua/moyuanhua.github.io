---
sidebar_position: 2
title: 项目介绍
---

# 项目介绍

Murphy Blog 是一个现代化的技术博客系统，专为开发者设计。

## 设计理念

### 内容为王 👑
我们相信优质的内容是博客的核心价值。通过飞书知识库管理内容，让创作者专注于内容本身，而不是技术细节。

### 开发者友好 💻
- **TypeScript 类型安全**: 编译时捕获错误
- **组件化架构**: 可复用的 React 组件
- **清晰的项目结构**: 易于理解和维护
- **完善的文档**: 详细的使用说明

### 性能优先 ⚡
- **静态站点生成 (SSG)**: 快速的页面加载
- **代码分割和懒加载**: 按需加载资源
- **图片优化**: 自动压缩和格式转换
- **CDN 全球加速**: Cloudflare Pages 分发

## 核心功能

### 1. 双语支持 🌐

完整的国际化支持，中英文内容独立管理，自动语言检测。

**特点:**
- 中文和英文独立的内容目录
- 自动语言切换器
- URL 路径本地化
- 完整的界面翻译

**实现:**
```typescript
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
  localeConfigs: {
    zh: { label: '简体中文', htmlLang: 'zh-CN' },
    en: { label: 'English', htmlLang: 'en' }
  }
}
```

### 2. 飞书集成 📄

通过 feishu-pages 实现内容自动同步。

**工作流程:**
1. 在飞书知识库中编辑内容
2. 运行同步脚本 `npm run sync`
3. 内容自动转换为 Markdown
4. 构建网站生成静态页面

**优势:**
- 熟悉的编辑环境
- 团队协作便捷
- 版本历史记录
- 图片资源托管

### 3. 本地搜索 🔍

基于 @easyops-cn/docusaurus-search-local 的搜索引擎。

**功能:**
- 无需第三方服务
- 支持中文分词 (nodejieba)
- 实时搜索结果
- 关键词高亮显示
- 搜索结果排名

**配置:**
```typescript
{
  hashed: true,
  language: ['zh', 'en'],
  indexDocs: true,
  indexBlog: true,
  searchResultLimits: 8
}
```

### 4. 项目展示 🎨

通过结构化数据展示你的项目：

**数据结构:**
```json
{
  "id": "project-id",
  "title": { "zh": "项目名称", "en": "Project Name" },
  "description": { "zh": "描述", "en": "Description" },
  "link": "https://github.com/...",
  "tags": ["React", "TypeScript"],
  "featured": true,
  "status": "active"
}
```

**展示形式:**
- 项目卡片 (ProjectCard)
- 标签分类
- 状态标识 (active/archived/maintenance)
- 外链支持

## 技术架构

### 前端架构
```
┌─────────────────────────────────┐
│      Docusaurus Framework       │
├─────────────────────────────────┤
│  React 19 + TypeScript          │
├─────────────────────────────────┤
│  Components                     │
│  ├── ProjectCard                │
│  ├── HomepageFeatures           │
│  └── RecentPosts                │
├─────────────────────────────────┤
│  Theme & Styling                │
│  └── CSS Variables              │
└─────────────────────────────────┘
```

### 内容流程
```
飞书知识库 → feishu-pages → Markdown → Docusaurus → 静态 HTML
```

### 部署流程
```
GitHub Push → Cloudflare Pages → 自动构建 → 全球 CDN 分发
```

## 适用场景

### 个人博客 📝
- 技术文章分享
- 学习笔记整理
- 项目作品展示

### 项目文档 📚
- 开源项目文档
- API 参考手册
- 使用指南教程

### 团队知识库 👥
- 内部技术文档
- 最佳实践分享
- 流程规范说明

### 产品文档 📖
- 产品使用说明
- 功能介绍展示
- 常见问题解答

## 对比其他方案

| 特性 | Murphy Blog | GitHub Pages | Notion | WordPress |
|------|-------------|--------------|--------|-----------|
| 部署速度 | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡ |
| 自定义能力 | ✅ 完全 | ✅ 完全 | ❌ 有限 | ✅ 完全 |
| 中文搜索 | ✅ 优秀 | ❌ 无 | ✅ 基础 | ✅ 需插件 |
| 维护成本 | 💰 低 | 💰 低 | 💰 中 | 💰 高 |
| 团队协作 | ✅ 飞书 | ✅ Git | ✅ 原生 | ✅ 原生 |

## 性能指标

基于 Lighthouse 测试:
- **性能**: 98/100
- **SEO**: 100/100
- **最佳实践**: 100/100
- **可访问性**: 95/100

## 开始使用

准备好开始了吗？查看[快速开始](./quick-start)指南，5 分钟搭建你的技术博客！

或者查看[开发指南](./development-guide)了解如何参与开发和自定义功能。
