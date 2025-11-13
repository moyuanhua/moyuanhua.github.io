---
sidebar_position: 2
title: Project Introduction
---

# Project Introduction

Murphy Blog is a modern tech blog system designed for developers.

## Design Philosophy

### Content First 👑
We believe quality content is the core value of a blog. By managing content in Feishu Wiki, creators can focus on content itself rather than technical details.

### Developer Friendly 💻
- **TypeScript Type Safety**: Catch errors at compile time
- **Component-based Architecture**: Reusable React components
- **Clear Project Structure**: Easy to understand and maintain
- **Comprehensive Documentation**: Detailed usage instructions

### Performance First ⚡
- **Static Site Generation (SSG)**: Fast page loading
- **Code Splitting and Lazy Loading**: Load resources on demand
- **Image Optimization**: Automatic compression and format conversion
- **Global CDN Acceleration**: Cloudflare Pages distribution

## Core Features

### 1. Bilingual Support 🌐

Complete internationalization support with independent Chinese and English content management and automatic language detection.

**Features:**
- Separate content directories for Chinese and English
- Automatic language switcher
- Localized URL paths
- Complete UI translation

**Implementation:**
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

### 2. Feishu Integration 📄

Automatic content sync through feishu-pages.

**Workflow:**
1. Edit content in Feishu Wiki
2. Run sync script `npm run sync`
3. Content automatically converts to Markdown
4. Build website to generate static pages

**Advantages:**
- Familiar editing environment
- Convenient team collaboration
- Version history
- Image hosting

### 3. Local Search 🔍

Search engine based on @easyops-cn/docusaurus-search-local.

**Features:**
- No third-party service needed
- Chinese word segmentation support (nodejieba)
- Real-time search results
- Keyword highlighting
- Search result ranking

**Configuration:**
```typescript
{
  hashed: true,
  language: ['zh', 'en'],
  indexDocs: true,
  indexBlog: true,
  searchResultLimits: 8
}
```

### 4. Project Showcase 🎨

Display your projects with structured data:

**Data Structure:**
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

**Display Format:**
- Project cards (ProjectCard)
- Tag categorization
- Status indicators (active/archived/maintenance)
- External link support

## Technical Architecture

### Frontend Architecture
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

### Content Flow
```
Feishu Wiki → feishu-pages → Markdown → Docusaurus → Static HTML
```

### Deployment Flow
```
GitHub Push → Cloudflare Pages → Auto Build → Global CDN Distribution
```

## Use Cases

### Personal Blog 📝
- Tech article sharing
- Study notes organization
- Project portfolio showcase

### Project Documentation 📚
- Open source project docs
- API reference manual
- User guide tutorial

### Team Knowledge Base 👥
- Internal technical docs
- Best practices sharing
- Process specification

### Product Documentation 📖
- Product user guide
- Feature introduction
- FAQ

## Comparison

| Feature | Murphy Blog | GitHub Pages | Notion | WordPress |
|---------|-------------|--------------|--------|-----------|
| Deploy Speed | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡ |
| Customization | ✅ Full | ✅ Full | ❌ Limited | ✅ Full |
| Chinese Search | ✅ Excellent | ❌ None | ✅ Basic | ✅ Plugin |
| Maintenance Cost | 💰 Low | 💰 Low | 💰 Medium | 💰 High |
| Team Collaboration | ✅ Feishu | ✅ Git | ✅ Native | ✅ Native |

## Performance Metrics

Based on Lighthouse test:
- **Performance**: 98/100
- **SEO**: 100/100
- **Best Practices**: 100/100
- **Accessibility**: 95/100

## Get Started

Ready to start? Check the [Quick Start](./quick-start) guide to build your tech blog in 5 minutes!

Or check the [Development Guide](./development-guide) to learn how to contribute and customize features.
