import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const BASE = import.meta.env.BASE_URL;

/**
 * 所有文章的完整内容，供 LLM / Agent 一次读完。
 * 详见 https://llmstxt.org/
 */
export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (site ?? new URL('https://moyuanhua.github.io')).href.replace(/\/$/, '');
  const abs = (p: string) => new URL(BASE + p.replace(/^\//, ''), siteUrl).href;

  const writing = (await getCollection('writing'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const out: string[] = [];
  out.push('# moyuanhua — 全文', '');
  out.push(`> 本站所有文章的完整内容。索引见 ${abs('/llms.txt')}。`, '');
  out.push('---', '');

  for (const p of writing) {
    out.push(`# ${p.data.title}`, '');
    out.push(`URL: ${abs(`/writing/${p.id}`)}`);
    out.push(`日期: ${p.data.date.toISOString().slice(0, 10)}`);
    if (p.data.updated && p.data.updated.valueOf() !== p.data.date.valueOf()) {
      out.push(`更新: ${p.data.updated.toISOString().slice(0, 10)}`);
    }
    if (p.data.tags.length) out.push(`主题: ${p.data.tags.join(', ')}`);
    out.push('');
    out.push((p.body ?? '').trim(), '');
    out.push('---', '');
  }

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
