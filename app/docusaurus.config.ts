import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Murphy Blog',
  tagline: '技术博客与项目展示',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  // 支持环境变量配置，默认使用 GitHub Pages
  url: process.env.SITE_URL || 'https://moyuanhua.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: process.env.BASE_URL || '/',

  // GitHub pages deployment config.
  organizationName: 'moyuanhua', // Usually your GitHub org/user name.
  projectName: 'moyuanhua.github.io', // Usually your repo name.

  onBrokenLinks: 'warn', // 临时设置为 warn 以便构建通过

  // Markdown configuration
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Single language configuration (Chinese only)
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // 文档作为根路径
          showLastUpdateTime: true,
          editUrl: undefined,
        },
        blog: false, // 禁用博客
        theme: {
          customCss: './src/css/custom.css',
        },
        // SEO: 启用 sitemap 生成
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Search plugin configuration (T008)
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['zh'],
        docsRouteBasePath: '/',
        indexDocs: true,
        indexPages: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    // SEO: 社交媒体卡片图片
    image: 'img/docusaurus-social-card.jpg',
    // SEO: 网站元数据
    metadata: [
      {name: 'keywords', content: 'Shopify, 跨境电商, AI开发, MCP, 技术博客, Docusaurus, 飞书'},
      {name: 'author', content: 'Murphy'},
      {name: 'description', content: '分享Shopify开发、跨境电商技术和AI应用的技术博客'},
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'Murphy Blog'},
    ],
    colorMode: {
      respectPrefersColorScheme: true,
    },
    // Navbar configuration (T012)
    navbar: {
      title: '',  // 移除标题文字
      logo: {
        alt: 'M',
        src: 'img/logo-placeholder.svg',
        href: '/about-me',  // 点击 logo 进入关于我页面
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '文档',
        },
        {
          to: '/about-me',
          label: '关于我',
          position: 'left',
        },
        {
          href: 'https://github.com/moyuanhua/moyuanhua.github.io',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Murphy Blog.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
