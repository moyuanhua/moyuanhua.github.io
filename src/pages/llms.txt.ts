import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const BASE = import.meta.env.BASE_URL;
const SUMMARY =
  '懂 Shopify 跨境，也自己写代码造 AI 工具。记录「AI 怎么改变独立站生意」——从 AI 搜索可见度，到 AI 售前客服。';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (site ?? new URL('https://moyuanhua.github.io')).href.replace(/\/$/, '');
  const abs = (p: string) => new URL(BASE + p.replace(/^\//, ''), siteUrl).href;

  const writing = (await getCollection('writing'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const projects = (await getCollection('projects'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => a.data.order - b.data.order);

  const out: string[] = [];
  out.push('# moyuanhua', '');
  out.push(`> ${SUMMARY}`, '');
  out.push('## 文章', '');
  for (const p of writing) out.push(`- [${p.data.title}](${abs(`/writing/${p.id}`)}): ${p.data.description}`);
  out.push('', '## 项目', '');
  for (const p of projects) out.push(`- [${p.data.title}](${abs(`/projects/${p.id}`)}): ${p.data.description}`);
  out.push('', '## 全文', '');
  out.push(`- [llms-full.txt](${abs('/llms-full.txt')}): 所有文章的完整内容`, '');
  out.push('## 联系', '');
  out.push('- 邮箱: moyuanhua.ch@gmail.com');
  out.push('- GitHub: https://github.com/moyuanhua', '');

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
