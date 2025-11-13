---
sidebar_position: 3
title: Development Guide
---

# Development Guide

This guide helps you understand how to contribute and customize features.

## Project Structure

```
app/
├── docs/                      # Chinese docs
│   ├── intro.md
│   ├── quick-start.md
│   └── ...
├── blog/                      # Chinese blog
│   ├── 2025-01-15-xxx.md
│   └── authors.yml
├── i18n/en/                   # English content
│   ├── docusaurus-plugin-content-docs/
│   └── docusaurus-plugin-content-blog/
├── src/
│   ├── components/            # React components
│   │   ├── ProjectCard/
│   │   ├── HomepageFeatures/
│   │   └── RecentPosts/
│   ├── pages/                 # Pages
│   │   ├── index.tsx          # Homepage
│   │   └── about.md           # About page
│   ├── css/                   # Styles
│   │   └── custom.css
│   └── data/                  # Data files
│       └── projects.json
├── static/                    # Static assets
│   ├── img/
│   └── robots.txt
├── scripts/                   # Script tools
│   ├── sync-feishu.js         # Feishu sync
│   ├── validate-structure.js  # Structure validation
│   └── verify-build.js        # Build verification
├── docusaurus.config.ts       # Main config
├── sidebars.ts                # Sidebar config
├── .env                       # Environment variables
└── package.json               # Dependencies
```

## Development Setup

### Requirements
- Node.js >= 20.0
- npm or yarn
- Git
- Feishu app credentials (optional)

### Installation Steps

1. **Clone Project**
```bash
git clone https://github.com/your-username/murphy-blog.git
cd murphy-blog/app
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
Copy `.env.example` to `.env` and fill in:
```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_WIKI_ID=your_wiki_id
FEISHU_ZH_NODE_ID=chinese_node_id
FEISHU_EN_NODE_ID=english_node_id
```

4. **Start Dev Server**
```bash
npm start
```

Visit http://localhost:3000

## Core Concepts

### Component System

#### ProjectCard Component
Display project cards with bilingual titles and descriptions.

**Usage Example:**
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

**Props Type:**
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

#### HomepageFeatures Component
Display featured projects on homepage, reads data from `projects.json`.

```typescript
// Auto filter projects with featured=true and status=active
const featuredProjects = projectsData.projects
  .filter(project => project.featured && project.status === 'active')
  .sort((a, b) => (a.order || 999) - (b.order || 999));
```

#### RecentPosts Component
Display recent blog posts.

```typescript
const blogData = usePluginData('docusaurus-plugin-content-blog', 'default');
const recentPosts = blogData?.recentPosts.slice(0, 5);
```

### Data Management

#### Project Data (projects.json)
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

**Field Description:**
- `id`: Unique identifier
- `title`: Bilingual title object
- `description`: Bilingual description object
- `link`: Project link
- `image`: Project image (optional)
- `tags`: Technology tags array
- `featured`: Show on homepage
- `status`: Project status (active/archived/maintenance)
- `order`: Sort priority (lower number = higher priority)

#### Blog Authors (authors.yml)
```yaml
murphy:
  name: Murphy
  title: Full Stack Developer
  url: https://github.com/your-username
  image_url: https://github.com/your-username.png
```

## Theme Customization

### Color Configuration

Edit `src/css/custom.css`:

```css
:root {
  /* Primary colors */
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;

  /* Other colors */
  --ifm-code-font-size: 95%;
}

/* Dark mode */
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  /* ... */
}
```

### Custom Styles

Add global styles:

```css
/* Homepage hero style */
.hero--primary {
  background: linear-gradient(
    135deg,
    var(--ifm-color-primary) 0%,
    var(--ifm-color-primary-dark) 100%
  );
  padding: 4rem 2rem;
}

/* Card enhancement */
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

## Adding Features

### Create New Component

1. **Create Component Directory**
```bash
mkdir -p src/components/MyComponent
```

2. **Write Component Code**
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

3. **Add Styles**
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

4. **Use Component**
```typescript
import MyComponent from '@site/src/components/MyComponent';

<MyComponent title="Title" content="Content" />
```

### Add New Page

Create file in `src/pages/`:

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
        <Heading as="h1">Custom Page</Heading>
        <p>This is a custom page</p>
      </main>
    </Layout>
  );
}
```

Visit: http://localhost:3000/custom

### Configure Navigation

Edit `docusaurus.config.ts`:

```typescript
navbar: {
  items: [
    {
      label: 'Custom',
      to: '/custom',
      position: 'left'
    },
    {
      label: 'External',
      href: 'https://example.com',
      position: 'right'
    }
  ]
}
```

## Content Management

### Add Documentation

Create Markdown file in `docs/`:

```markdown
---
sidebar_position: 4
title: New Doc
---

# New Document Title

Content...
```

### Add Blog Post

Create file in `blog/`:

```markdown
---
slug: my-blog-post
title: Blog Title
authors: [murphy]
tags: [react, typescript]
---

Blog excerpt...

<!--truncate-->

Full content...
```

### Bilingual Content

Create corresponding files for English version:
- Chinese: `docs/guide.md`
- English: `i18n/en/docusaurus-plugin-content-docs/current/guide.md`

## Script Tools

### Feishu Sync
```bash
npm run sync
```

Sync Feishu Wiki content to local.

### Structure Validation
```bash
npm run validate
```

Validate Chinese-English directory consistency.

### Build Verification
```bash
npm run verify
```

Check build output completeness.

### Clear Cache
```bash
npm run clear
```

Clear build cache and generated files.

## Debug Tips

### View Verbose Logs
```bash
npm start -- --verbose
```

### Check Type Errors
```bash
npm run typecheck
```

### Analyze Bundle Size
```bash
npm run build -- --bundle-analyzer
```

## Build & Deploy

### Local Build
```bash
npm run build
```

Output directory: `build/`

### Preview Build
```bash
npm run serve
```

Visit http://localhost:3000

### Cloudflare Pages
```bash
npm run build:cf
```

Sync Feishu content then build.

## Testing

### Manual Test Checklist

- [ ] Pages load normally
- [ ] Language switch works
- [ ] Search function works
- [ ] No broken links
- [ ] Images display correctly
- [ ] Responsive layout works
- [ ] Dark mode works

### Build Verification
```bash
npm run build
npm run verify
```

## FAQ

### Q: Dev server fails to start
A: Check if port 3000 is occupied, or use another port:
```bash
npm start -- --port 3001
```

### Q: Build fails
A: Clear cache and retry:
```bash
npm run clear && npm run build
```

### Q: Search doesn't work
A: Ensure search plugin is installed, check configuration.

### Q: 404 after language switch
A: Check Chinese-English directory consistency:
```bash
npm run validate
```

## Contributing

Welcome to submit Issues and Pull Requests!

### PR Process
1. Fork project
2. Create feature branch: `git checkout -b feature/xxx`
3. Commit code: `git commit -m 'Add xxx'`
4. Push branch: `git push origin feature/xxx`
5. Create Pull Request

### Code Standards
- Use TypeScript
- Follow ESLint rules
- Add necessary comments
- Update relevant docs

## More Resources

- [Docusaurus Official Docs](https://docusaurus.io/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Feishu Open Platform](https://open.feishu.cn/)

Happy Coding! 🚀
