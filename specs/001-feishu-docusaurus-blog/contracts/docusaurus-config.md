# Contract: Docusaurus Configuration

**File**: `app/docusaurus.config.ts`
**Purpose**: Docusaurus主配置文件,定义站点元数据、i18n、插件和主题配置

---

## Configuration Structure

```typescript
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  // ============ 站点元数据 ============
  title: 'Murphy Blog',
  tagline: '技术博客与项目展示',
  favicon: 'img/favicon.ico',

  // ============ 部署配置 ============
  url: 'https://username.github.io',
  baseUrl: '/murphy-blog/',
  organizationName: 'username',
  projectName: 'murphy-blog',

  // ============ 构建选项 ============
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  onDuplicateRoutes: 'warn',

  // ============ 国际化配置 ============
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
  },

  // ============ 预设配置 ============
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined, // 禁用"编辑此页"链接
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
        },
        blog: {
          showReadingTime: true,
          blogTitle: '博客',
          blogDescription: '技术文章与思考',
          postsPerPage: 10,
          blogSidebarTitle: '最近文章',
          blogSidebarCount: 'ALL',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Murphy Blog',
            description: '技术博客RSS订阅',
            copyright: `Copyright © ${new Date().getFullYear()} Murphy`,
            language: 'zh-CN',
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  // ============ 插件配置 ============
  plugins: [],

  // ============ 主题配置 ============
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['zh', 'en'],
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        highlightSearchTermsOnTargetPage: true,
        translations: {
          search_placeholder: '搜索',
          see_all_results: '查看所有结果',
          no_results: '没有找到结果',
          search_results_for: '搜索结果: "{{ keyword }}"',
          search_the_documentation: '搜索文档',
          count_documents_found: '找到 {{ count }} 篇文档',
          count_documents_found_plural: '找到 {{ count }} 篇文档',
          no_documents_were_found: '未找到文档',
        },
      },
    ],
  ],

  // ============ 主题UI配置 ============
  themeConfig: {
    image: 'img/social-card.jpg',

    // 色彩模式
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    // 导航栏
    navbar: {
      title: 'Murphy Blog',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      hideOnScroll: false,
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
          href: 'https://github.com/username/murphy-blog',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },

    // 页脚
    footer: {
      style: 'dark',
      links: [
        {
          title: '内容',
          items: [
            {
              label: '文档',
              to: '/docs/intro',
            },
            {
              label: '博客',
              to: '/blog',
            },
          ],
        },
        {
          title: '社交',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/username',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/username',
            },
          ],
        },
        {
          title: '更多',
          items: [
            {
              label: '关于我',
              to: '/about',
            },
            {
              label: 'RSS订阅',
              to: '/blog/rss.xml',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Murphy. Built with Docusaurus.`,
    },

    // 代码高亮
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml'],
    },

    // 头部元数据
    metadata: [
      {name: 'keywords', content: 'blog, 技术, 开发, 教程'},
      {name: 'author', content: 'Murphy'},
    ],

    // 公告栏(可选)
    announcementBar: {
      id: 'support_us',
      content: '欢迎来到我的博客!如果觉得内容有帮助,请给个Star ⭐️',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: true,
    },
  } satisfies Preset.ThemeConfig,

  // ============ 未来兼容性 ============
  future: {
    v4: true,
  },
};

export default config;
```

---

## Key Configuration Sections

### 1. Site Metadata

**必须修改的字段**:
- `title`: 站点标题
- `tagline`: 站点副标题
- `url`: 生产环境URL (如 `https://username.github.io`)
- `baseUrl`: 基础路径 (用户站点为 `/`, 项目站点为 `/repo-name/`)
- `organizationName`: GitHub用户名或组织名
- `projectName`: GitHub仓库名

**示例**:
```typescript
// 用户站点: https://username.github.io
url: 'https://username.github.io',
baseUrl: '/',

// 项目站点: https://username.github.io/murphy-blog
url: 'https://username.github.io',
baseUrl: '/murphy-blog/',
```

### 2. i18n Configuration

**结构契约**:
```typescript
i18n: {
  defaultLocale: 'zh',           // 默认语言(对应docs/和blog/)
  locales: ['zh', 'en'],         // 支持的语言列表
  localeConfigs: {
    [locale: string]: {
      label: string,             // 语言选择器显示名称
      direction: 'ltr' | 'rtl',  // 文本方向
      htmlLang: string,          // HTML lang属性(BCP 47标准)
      calendar: string,          // 日历系统
      path: string,              // URL路径前缀
    }
  }
}
```

**路由映射**:
- 中文(默认): `/docs/intro`, `/blog`
- 英文: `/en/docs/intro`, `/en/blog`

### 3. Docs Configuration

**关键选项**:
```typescript
docs: {
  sidebarPath: './sidebars.ts',      // 侧边栏配置文件路径
  editUrl: undefined,                // 禁用编辑链接(内容来自飞书)
  showLastUpdateTime: true,          // 显示最后更新时间
  showLastUpdateAuthor: false,       // 不显示作者(Git信息不准确)
  routeBasePath: 'docs',             // URL路径前缀
  include: ['**/*.md', '**/*.mdx'],  // 包含的文件类型
  exclude: [                         // 排除的文件
    '**/_*.{js,jsx,ts,tsx,md,mdx}',
    '**/_*/**',
    '**/*.test.{js,jsx,ts,tsx}',
  ],
}
```

### 4. Blog Configuration

**关键选项**:
```typescript
blog: {
  showReadingTime: true,             // 显示阅读时间
  postsPerPage: 10,                  // 每页文章数
  blogTitle: '博客',                 // 博客列表页标题
  blogDescription: '技术文章与思考',  // 博客描述
  blogSidebarTitle: '最近文章',      // 侧边栏标题
  blogSidebarCount: 'ALL',           // 侧边栏文章数(ALL或数字)
  routeBasePath: 'blog',             // URL路径前缀
  feedOptions: {                     // RSS配置
    type: ['rss', 'atom'],
    title: string,
    description: string,
    copyright: string,
    language: string,
  },
}
```

### 5. Search Plugin Configuration

**插件选项契约**:
```typescript
{
  hashed: boolean,                   // 文件名哈希(启用缓存)
  language: string[],                // 支持的语言
  docsRouteBasePath: string,         // 文档路由基础路径
  blogRouteBasePath: string,         // 博客路由基础路径
  indexDocs: boolean,                // 是否索引文档
  indexBlog: boolean,                // 是否索引博客
  indexPages: boolean,               // 是否索引自定义页面
  searchResultLimits: number,        // 搜索结果数量限制
  searchResultContextMaxLength: number,  // 上下文最大长度
  highlightSearchTermsOnTargetPage: boolean,  // 高亮搜索词
  translations: {                    // UI翻译
    [key: string]: string,
  },
}
```

### 6. Navbar Configuration

**导航项类型**:
```typescript
type NavbarItem =
  | {
      type: 'doc';
      docId: string;
      label: string;
      position: 'left' | 'right';
    }
  | {
      type: 'docSidebar';
      sidebarId: string;
      label: string;
      position: 'left' | 'right';
    }
  | {
      to: string;
      label: string;
      position: 'left' | 'right';
    }
  | {
      href: string;
      label: string;
      position: 'left' | 'right';
    }
  | {
      type: 'localeDropdown';
      position: 'left' | 'right';
    }
  | {
      type: 'dropdown';
      label: string;
      items: NavbarItem[];
      position: 'left' | 'right';
    };
```

---

## Environment Variables

某些配置项可以通过环境变量动态设置:

```typescript
const config: Config = {
  url: process.env.SITE_URL || 'https://username.github.io',
  baseUrl: process.env.BASE_URL || '/',

  // 条件性公告栏
  themeConfig: {
    announcementBar: process.env.ANNOUNCEMENT_ENABLED === 'true' ? {
      id: 'announcement',
      content: process.env.ANNOUNCEMENT_CONTENT || '',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: true,
    } : undefined,
  },
};
```

**GitHub Actions中的环境变量**:
```yaml
env:
  SITE_URL: https://username.github.io
  BASE_URL: /murphy-blog/
```

---

## Validation Rules

**必须满足的约束**:
1. `defaultLocale` 必须在 `locales` 数组中
2. `url` 必须是有效的HTTPS URL(生产环境)
3. `baseUrl` 必须以 `/` 开头和结尾
4. `organizationName` 和 `projectName` 必须与GitHub仓库匹配
5. 所有导航项的 `to` 或 `href` 必须有效
6. `sidebarId` 必须在 `sidebars.ts` 中定义
7. 搜索插件的 `language` 必须与 `i18n.locales` 一致

**类型检查**:
```bash
cd app
npm run typecheck
```

---

## Migration from Default

**从默认模板迁移的步骤**:

1. **更新站点元数据**:
```diff
- title: 'My Site'
+ title: 'Murphy Blog'
- url: 'https://your-docusaurus-site.example.com'
+ url: 'https://username.github.io'
```

2. **配置i18n**:
```diff
i18n: {
- defaultLocale: 'en',
- locales: ['en'],
+ defaultLocale: 'zh',
+ locales: ['zh', 'en'],
+ localeConfigs: { /* ... */ },
}
```

3. **添加搜索插件**:
```diff
+ themes: [
+   [
+     require.resolve('@easyops-cn/docusaurus-search-local'),
+     { /* ... */ },
+   ],
+ ],
```

4. **更新导航栏**:
```diff
items: [
  /* ... 现有项 ... */
+ {
+   to: '/about',
+   label: '关于我',
+   position: 'left',
+ },
+ {
+   type: 'localeDropdown',
+   position: 'right',
+ },
]
```

---

## References

- [Docusaurus Configuration API](https://docusaurus.io/docs/api/docusaurus-config)
- [i18n Tutorial](https://docusaurus.io/docs/i18n/tutorial)
- [Search Plugin Docs](https://github.com/easyops-cn/docusaurus-search-local)
- [Preset Classic Options](https://docusaurus.io/docs/api/plugins/@docusaurus/preset-classic)
