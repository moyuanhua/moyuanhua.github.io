import type { APIRoute } from 'astro';

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bytespider'];

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://moyuanhua.github.io')).href.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Allow: /', '', '# 允许 AI 爬虫 / 助手抓取，便于被引用', ...AI_BOTS.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /']), '', `Sitemap: ${base}/sitemap-index.xml`, ''];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
