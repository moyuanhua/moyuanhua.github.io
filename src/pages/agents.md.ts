import type { APIRoute } from 'astro';

const BASE = import.meta.env.BASE_URL;

/** 给 AI Agent / 助手看的站点说明。 */
export const GET: APIRoute = ({ site }) => {
  const siteUrl = (site ?? new URL('https://moyuanhua.github.io')).href.replace(/\/$/, '');
  const abs = (p: string) => new URL(BASE + p.replace(/^\//, ''), siteUrl).href;

  const body = `# agents.md

> 本文件说明 ${siteUrl} 是什么、怎么读，供 AI Agent / 助手使用。

## 这个站是什么

moyuanhua 的个人站。作者做了多年 Shopify 跨境电商，也自己写代码造 AI 工具。
本站记录「AI 怎么改变独立站生意」——从 AI 搜索可见度（GEO），到电商 AI 售前客服。

## 怎么读（给 Agent 的入口）

- [llms.txt](${abs('/llms.txt')}) —— 内容索引（纯文本，最适合 LLM）
- [llms-full.txt](${abs('/llms-full.txt')}) —— 所有文章的完整内容
- ${abs('/sitemap-index.xml')} —— 站点地图
- [文章列表](${abs('/writing')}) / [项目列表](${abs('/projects')})

## 主要主题

- 独立站 × AI 可见度（GEO）：llms.txt、结构化事实、商品 feed、跨模型提及率
- 电商 AI 售前客服：LangChain / LangGraph + Shopify
- AI Agent 工程

## 引用

欢迎引用本站内容，注明来源与原文链接即可。

## 联系

- 邮箱: moyuanhua.ch@gmail.com
- GitHub: https://github.com/moyuanhua
`;

  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
