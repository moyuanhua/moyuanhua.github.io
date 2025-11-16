---
title: SEO 优化指南
slug: seo-guide
sidebar_position: 99
---

# SEO 优化指南

本指南将帮助你让网站被 Google 和百度等搜索引擎收录。

## 📋 已完成的基础配置

我们已经为你的网站配置好了以下 SEO 基础设施:

### 1. Sitemap (站点地图)

- **文件位置**: `https://moyuanhua.github.io/sitemap.xml`
- **更新频率**: 每周 (weekly)
- **优先级**: 0.5
- **自动生成**: 每次构建时自动生成

### 2. robots.txt

- **文件位置**: `https://moyuanhua.github.io/robots.txt`
- **配置内容**:
  - 允许所有搜索引擎爬取
  - 明确指定 Googlebot 和 Baiduspider
  - 声明 Sitemap 位置

### 3. Meta 标签

已在网站配置中添加:
- **关键词**: Shopify, 跨境电商, AI开发, MCP, 技术博客, Docusaurus, 飞书
- **作者**: Murphy
- **描述**: 分享Shopify开发、跨境电商技术和AI应用的技术博客
- **Open Graph**: 网站类型和站点名称

## 🔍 Google 搜索引擎收录

### 第一步: 验证网站所有权

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 点击「添加资源」
3. 选择「网址前缀」方式
4. 输入你的网站地址: `https://moyuanhua.github.io`
5. 选择验证方法:
   - **HTML 文件验证**:
     - 下载 Google 提供的 HTML 验证文件
     - 放到 `/Users/anker/wps-me/murphy-blog/app/static/` 目录
     - 重新构建并部署
     - 点击「验证」
   - **HTML 标签验证**:
     - 复制 Google 提供的 meta 标签
     - 添加到 `docusaurus.config.ts` 的 `metadata` 数组中
     - 重新构建并部署
     - 点击「验证」

### 第二步: 提交 Sitemap

1. 验证成功后,在左侧菜单找到「站点地图」
2. 输入: `sitemap.xml`
3. 点击「提交」
4. 等待 Google 处理(通常需要几天到几周)

### 第三步: 请求编入索引

1. 在 Search Console 中使用「网址检查」工具
2. 输入你的主页 URL: `https://moyuanhua.github.io/`
3. 点击「请求编入索引」
4. 对重要页面重复此操作

### 监控索引状态

- **覆盖率报告**: 查看哪些页面已被索引
- **效果报告**: 查看搜索展现和点击数据
- **增强功能**: 检查结构化数据是否正常

## 🇨🇳 百度搜索引擎收录

### 第一步: 注册百度站长平台

1. 访问 [百度搜索资源平台](https://ziyuan.baidu.com/)
2. 使用百度账号登录(如没有请先注册)
3. 点击「用户中心」-「站点管理」-「添加网站」

### 第二步: 验证网站

1. 输入网站域名: `https://moyuanhua.github.io`
2. 选择站点类型: HTTPS
3. 选择验证方式:
   - **文件验证**:
     - 下载百度提供的验证文件
     - 放到 `/Users/anker/wps-me/murphy-blog/app/static/` 目录
     - 重新构建并部署
     - 点击「完成验证」
   - **HTML 标签验证**:
     - 复制百度提供的 meta 标签
     - 添加到 `docusaurus.config.ts` 的 `metadata` 数组中
     - 重新构建并部署
     - 点击「完成验证」

### 第三步: 提交 Sitemap

1. 进入「链接提交」-「sitemap」
2. 输入: `https://moyuanhua.github.io/sitemap.xml`
3. 点击「提交」
4. 建议每次更新内容后手动提交一次

### 第四步: 主动推送(推荐)

百度提供主动推送功能,可以加快收录速度:

1. 在「链接提交」-「普通收录」-「API提交」获取推送接口
2. 每次发布新内容后,可以手动推送 URL:

```bash
curl -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=https://moyuanhua.github.io&token=你的token"
```

其中 `urls.txt` 包含要推送的 URL 列表(每行一个)。

## ⚡ 加快收录的技巧

### 1. 提高内容质量

- ✅ 原创内容优先
- ✅ 定期更新
- ✅ 内容充实,避免过短
- ✅ 合理使用标题层级(H1, H2, H3)

### 2. 优化页面性能

- ✅ 使用 CDN 加速
- ✅ 压缩图片
- ✅ 启用缓存
- ✅ 减少页面加载时间

### 3. 建立外部链接

- 在其他网站、博客、社交媒体分享你的内容
- 参与技术社区讨论,适当引用自己的文章
- 提交到技术文章聚合平台(如掘金、思否、知乎等)

### 4. 使用结构化数据

考虑添加 JSON-LD 结构化数据,帮助搜索引擎理解内容:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Murphy Blog",
  "url": "https://moyuanhua.github.io",
  "description": "分享Shopify开发、跨境电商技术和AI应用的技术博客",
  "author": {
    "@type": "Person",
    "name": "Murphy"
  }
}
</script>
```

### 5. 社交媒体分享优化

确保添加完整的 Open Graph 标签:

```typescript
// 在 docusaurus.config.ts 的 metadata 中添加
{property: 'og:title', content: '页面标题'},
{property: 'og:description', content: '页面描述'},
{property: 'og:image', content: 'https://moyuanhua.github.io/img/social-card.jpg'},
{property: 'og:url', content: 'https://moyuanhua.github.io'},
```

## 📊 监控和维护

### Google Analytics (可选)

可以添加 Google Analytics 来追踪访问数据:

1. 创建 GA4 属性
2. 在 `docusaurus.config.ts` 中添加:

```typescript
gtag: {
  trackingID: 'G-XXXXXXXXXX',
  anonymizeIP: true,
},
```

### 定期检查

- **每周**: 查看 Search Console 中的索引状态
- **每月**: 检查排名和流量变化
- **季度**: 审查和更新旧内容

## 🚀 预期时间表

- **提交后 1-3 天**: sitemap 被处理
- **提交后 1-2 周**: 首页开始出现在索引中
- **提交后 2-4 周**: 主要内容页面被索引
- **提交后 1-3 个月**: 搜索排名逐步提升

**注意**: 百度的索引速度通常比 Google 慢,需要更多耐心。

## ❓ 常见问题

### Q: 为什么提交后还是搜索不到?

A: 搜索引擎需要时间爬取和索引,通常需要几天到几周。可以通过以下方式检查:
- Google: 搜索 `site:moyuanhua.github.io`
- 百度: 搜索 `site:moyuanhua.github.io`

### Q: 如何让特定页面更快被收录?

A:
1. 使用「请求编入索引」功能(Google)
2. 使用主动推送(百度)
3. 在社交媒体分享该页面
4. 从已收录页面添加链接到新页面

### Q: GitHub Pages 对 SEO 有影响吗?

A: GitHub Pages 完全支持 SEO,没有任何负面影响。自定义域名可能会更好,但不是必需的。

## 📚 相关资源

- [Google Search Console 帮助](https://support.google.com/webmasters/)
- [百度搜索资源平台](https://ziyuan.baidu.com/)
- [Docusaurus SEO 文档](https://docusaurus.io/docs/seo)
- [网站 SEO 最佳实践](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

---

最后更新: 2025-11-16
