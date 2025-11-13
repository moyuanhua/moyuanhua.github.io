# Data Model: Feishu-Docusaurus Blog System

**Feature**: 001-feishu-docusaurus-blog | **Date**: 2025-01-13

本文档定义博客系统中的核心数据实体及其关系,这些实体主要通过Markdown frontmatter、配置文件和飞书API元数据来表示。

---

## Entity Diagram

```
┌─────────────┐
│   Article   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐      ┌──────────────────┐
│ Language Locale │◄─────┤ Navigation Item  │
└──────┬──────────┘      └──────────────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐      ┌──────────────┐
│  Search Index   │      │   Project    │
└─────────────────┘      └──────────────┘
```

---

## Entity Definitions

### 1. Article (文章)

**描述**: 代表一篇博客文章或文档,是系统的核心内容单元。

**来源**: 飞书知识库文档,通过feishu-pages同步

**存储位置**:
- 中文版本: `app/docs/` 或 `app/blog/`
- 英文版本: `app/i18n/en/docusaurus-plugin-content-docs/current/` 或对应blog目录

**数据结构 (Markdown frontmatter)**:

```yaml
---
# 核心字段
title: "文章标题"                    # 必填,显示标题
slug: "article-slug"                 # 必填,URL路径标识
description: "文章摘要"              # 可选,SEO描述
date: 2025-01-13                     # 发布日期

# 分类和标签
tags: ["技术", "教程"]               # 可选,文章标签
category: "前端开发"                 # 可选,文章分类

# 元数据(来自飞书Page Meta)
sidebar_position: 1                  # 侧边栏排序位置
sidebar_label: "简短标题"            # 侧边栏显示标题
hide: false                          # 是否隐藏此文档

# 作者信息
author: "Murphy"                     # 可选,作者名称
author_url: "https://github.com/murphy"  # 可选,作者链接

# 语言标识(用于验证)
language: "zh"                       # zh 或 en

# 飞书同步元数据
feishu_doc_id: "doxcnXXXXXXXXXXXXX" # 飞书文档ID
feishu_last_modified: 1705132800000  # 飞书最后修改时间戳
---

# 文章正文

文章内容使用Markdown/MDX格式...
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| title | string | 是 | 文章标题,显示在页面顶部和列表中 |
| slug | string | 是 | URL路径,必须在同一语言版本内唯一,且中英文slug必须一致 |
| description | string | 否 | 文章摘要,用于SEO和社交分享,不填则自动截取正文前150-200字符 |
| date | ISO date | 是 | 发布日期,格式YYYY-MM-DD,用于排序和显示 |
| tags | string[] | 否 | 标签列表,用于分类和筛选 |
| category | string | 否 | 主分类,一篇文章只能属于一个分类 |
| sidebar_position | number | 否 | 侧边栏中的排序位置,数字越小越靠前 |
| sidebar_label | string | 否 | 侧边栏显示的简短标题,不填则使用title |
| hide | boolean | 否 | 是否在侧边栏和列表中隐藏,默认false |
| author | string | 否 | 作者名称 |
| author_url | string | 否 | 作者个人链接 |
| language | string | 否 | 语言标识(zh/en),用于验证和调试 |
| feishu_doc_id | string | 否 | 飞书文档唯一ID,用于追踪同步源 |
| feishu_last_modified | number | 否 | 飞书文档最后修改时间戳,用于增量同步判断 |

**业务规则**:
1. 同一篇文章的中英文版本必须使用相同的slug
2. 如果文章只有一个语言版本(未标注特定语言),则在两个语言站点都显示
3. date字段决定"最新博文"的排序
4. sidebar_position决定侧边栏中的顺序
5. description为空时,系统自动提取正文前150-200字符作为摘要

**关联关系**:
- 属于一个Language Locale (1:N)
- 生成对应的Search Index条目 (1:N, 按段落)

---

### 2. Project (项目)

**描述**: 首页展示的项目卡片,用于突出显示个人或团队的重要项目。

**来源**: 配置文件手动维护

**存储位置**: `app/src/data/projects.json` 或 `docusaurus.config.ts`

**数据结构 (JSON)**:

```json
{
  "projects": [
    {
      "id": "project-001",
      "title": {
        "zh": "项目名称",
        "en": "Project Name"
      },
      "description": {
        "zh": "项目描述,介绍项目的主要功能和特点",
        "en": "Project description highlighting main features"
      },
      "link": "https://github.com/username/project",
      "image": "/img/projects/project-001.png",
      "tags": ["React", "TypeScript", "Open Source"],
      "status": "active",
      "featured": true,
      "order": 1
    }
  ]
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | string | 是 | 项目唯一标识 |
| title | object | 是 | 项目标题,包含中英文版本 |
| description | object | 是 | 项目描述,包含中英文版本 |
| link | string | 是 | 项目链接(GitHub仓库、在线Demo等) |
| image | string | 否 | 项目封面图路径,相对于static目录 |
| tags | string[] | 否 | 技术栈标签 |
| status | enum | 否 | 项目状态: active/archived/wip(work in progress) |
| featured | boolean | 否 | 是否在首页突出显示 |
| order | number | 否 | 首页展示顺序,数字越小越靠前 |

**业务规则**:
1. featured为true的项目显示在首页顶部
2. order字段控制项目在首页的排列顺序
3. status为archived的项目显示灰色样式
4. tags用于项目筛选功能(可选扩展)

**使用示例 (React组件)**:

```tsx
import projects from '@site/src/data/projects.json';

function ProjectsSection({ locale }) {
  const featuredProjects = projects.projects
    .filter(p => p.featured)
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      {featuredProjects.map(project => (
        <ProjectCard
          key={project.id}
          title={project.title[locale]}
          description={project.description[locale]}
          link={project.link}
          image={project.image}
          tags={project.tags}
        />
      ))}
    </div>
  );
}
```

---

### 3. Language Locale (语言环境)

**描述**: 代表系统支持的语言版本,控制i18n行为。

**来源**: Docusaurus配置文件

**存储位置**: `app/docusaurus.config.ts`

**数据结构 (TypeScript配置)**:

```typescript
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
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

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| locale | string | 是 | 语言代码(ISO 639-1): zh, en |
| label | string | 是 | 语言选择器中显示的名称 |
| direction | enum | 是 | 文本方向: ltr(从左到右), rtl(从右到左) |
| htmlLang | string | 是 | HTML lang属性值,用于SEO和辅助功能 |
| calendar | string | 否 | 日历系统,默认gregory(公历) |
| path | string | 是 | URL路径前缀 |

**业务规则**:
1. defaultLocale的内容直接放在`docs/`和`blog/`目录
2. 其他locale的内容放在`i18n/{locale}/`目录
3. 浏览器自动检测基于Accept-Language头匹配locale
4. URL结构: `/{path}/docs/intro` 如 `/zh/docs/intro`

**导航翻译结构**:

```json
// i18n/en/docusaurus-theme-classic/navbar.json
{
  "title": "My Blog",
  "item.label.Docs": "Documentation",
  "item.label.Blog": "Blog",
  "item.label.About": "About Me"
}
```

---

### 4. Navigation Item (导航项)

**描述**: 网站导航栏中的菜单项。

**来源**: Docusaurus配置文件

**存储位置**: `app/docusaurus.config.ts`

**数据结构 (TypeScript配置)**:

```typescript
navbar: {
  title: 'Murphy Blog',
  logo: {
    alt: 'Logo',
    src: 'img/logo.svg',
  },
  items: [
    {
      type: 'docSidebar',
      sidebarId: 'tutorialSidebar',
      position: 'left',
      label: '文档',
    },
    {
      to: '/blog',
      label: '博客',
      position: 'left',
    },
    {
      to: '/about',
      label: '关于我',
      position: 'left',
    },
    {
      type: 'localeDropdown',
      position: 'right',
    },
    {
      href: 'https://github.com/username/repo',
      position: 'right',
      className: 'header-github-link',
      'aria-label': 'GitHub repository',
    },
  ],
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| type | enum | 否 | 菜单类型: docSidebar/dropdown/localeDropdown/search |
| label | string | 条件 | 显示文本(可通过i18n翻译) |
| to | string | 条件 | 内部链接路径 |
| href | string | 条件 | 外部链接URL |
| position | enum | 是 | 位置: left/right |
| sidebarId | string | 条件 | 关联的侧边栏ID(type为docSidebar时必填) |
| items | array | 条件 | 子菜单项(type为dropdown时必填) |
| className | string | 否 | 自定义CSS类名 |

**业务规则**:
1. label需要在i18n翻译文件中提供对应翻译
2. position为left的项从左到右排列
3. position为right的项从右到左排列
4. localeDropdown自动显示语言切换器

---

### 5. Search Index (搜索索引)

**描述**: 前端搜索功能使用的索引数据。

**来源**: 构建时由@easyops-cn/docusaurus-search-local自动生成

**存储位置**: `app/build/search-index-{locale}.json`

**数据结构 (生成的JSON)**:

```json
{
  "documents": [
    {
      "id": "docs/intro",
      "title": "入门介绍",
      "content": "这是一篇介绍文档的内容...",
      "url": "/docs/intro",
      "type": "docs",
      "keywords": ["入门", "介绍", "文档"],
      "section": "快速开始",
      "tokens": ["入门", "介绍", "文档", "内容"]
    }
  ],
  "metadata": {
    "locale": "zh",
    "generatedAt": "2025-01-13T10:00:00Z",
    "documentCount": 42
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | string | 文档唯一标识(路径) |
| title | string | 文档标题 |
| content | string | 文档内容摘要(截断后的正文) |
| url | string | 文档URL路径 |
| type | enum | 类型: docs/blog/page |
| keywords | string[] | 提取的关键词 |
| section | string | 所属章节 |
| tokens | string[] | 中文分词后的词元(用于搜索匹配) |

**业务规则**:
1. 每个语言版本生成独立的索引文件
2. 中文内容使用nodejieba进行分词
3. 索引文件在构建时生成,客户端加载后缓存
4. 搜索时进行模糊匹配和相关度排序

**搜索流程**:
```
用户输入 -> 分词处理 -> 匹配索引 -> 相关度排序 -> 返回结果
```

---

## Entity Relationships

### 文章与语言环境

- 一个Article实例属于一个特定的Language Locale
- 同一篇文章的不同语言版本是独立的Article实例
- 通过相同的slug建立跨语言关联

**示例**:
```
Article(zh): slug="getting-started", language="zh", path="docs/getting-started.md"
Article(en): slug="getting-started", language="en", path="i18n/en/.../getting-started.md"
```

### 文章与搜索索引

- 一个Article生成多个Search Index条目(按段落或标题)
- Search Index继承Article的language属性
- 删除或隐藏Article时,对应索引在下次构建时移除

### 导航项与语言环境

- Navigation Item的label通过i18n系统翻译
- 不同语言版本共享同一导航结构
- 语言切换器(localeDropdown)自动适配当前locale

### 项目与语言环境

- Project实体内嵌多语言字段(title, description)
- 同一个Project在不同语言页面显示不同内容
- 语言切换不改变Project的展示顺序

---

## Data Flow

### 内容同步流程

```
飞书知识库
   │
   ▼ feishu-pages同步
Markdown文件 + 元数据
   │
   ├─► app/docs/ (中文默认)
   └─► app/i18n/en/.../current/ (英文)
   │
   ▼ Docusaurus构建
静态HTML + 搜索索引
   │
   ▼ 部署
GitHub Pages
```

### 用户访问流程

```
用户请求 -> 语言检测 -> 加载对应locale的HTML
   │
   ▼
渲染页面 -> 加载搜索索引(懒加载)
   │
   ▼
用户搜索 -> 查询索引 -> 返回结果
```

---

## Data Validation Rules

### 文章验证
- [ ] title非空且长度<100字符
- [ ] slug符合URL规范(小写字母、数字、连字符)
- [ ] date为有效日期且不晚于当前时间
- [ ] 中英文版本的slug必须完全一致
- [ ] feishu_doc_id格式正确(docx开头)

### 项目验证
- [ ] id唯一
- [ ] title和description包含所有支持的语言
- [ ] link为有效URL
- [ ] image路径存在(如果指定)
- [ ] order为非负整数

### 语言环境验证
- [ ] defaultLocale必须在locales列表中
- [ ] locale代码符合ISO 639-1标准
- [ ] htmlLang符合BCP 47标准
- [ ] path不包含特殊字符

### 导航项验证
- [ ] type和对应必填字段匹配
- [ ] 内部链接(to)以/开头
- [ ] 外部链接(href)以http/https开头
- [ ] sidebarId在sidebars.ts中存在

---

## Extension Points

### 未来可扩展的数据实体

1. **Author (作者)**: 独立管理作者信息,支持多作者
2. **Series (系列文章)**: 组织相关文章为系列教程
3. **Comment (评论)**: 集成评论系统(如Giscus)
4. **Analytics (统计)**: 文章浏览量、点赞等数据
5. **Newsletter (邮件订阅)**: 订阅者管理和邮件发送

### 数据迁移考虑

- 所有日期使用ISO 8601格式,便于跨时区处理
- 使用slug而非数据库ID作为主要标识,便于URL稳定
- frontmatter支持YAML和JSON两种格式,便于工具集成
- 保留feishu_*字段用于追溯源数据

---

## Summary

本数据模型设计遵循以下原则:

1. **内容优先**: Article是核心实体,其他实体围绕内容展示服务
2. **i18n友好**: 所有实体都原生支持多语言
3. **可追溯**: 保留飞书源数据标识,便于增量同步
4. **扁平化**: 尽量使用文件系统和配置文件,避免数据库复杂性
5. **可扩展**: 预留扩展字段和实体,支持未来功能增强

关键数据流:
- **写入**: 飞书 -> feishu-pages -> Markdown -> Git
- **读取**: 用户 -> GitHub Pages -> 静态HTML -> 搜索索引
- **更新**: Webhook/定时任务 -> GitHub Actions -> 重新构建 -> 部署
