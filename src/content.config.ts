import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projects = things I built. Body is the case study (HTML-first).
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    role: z.string().optional(),
    period: z.string().optional(),
    stack: z.array(z.string()).optional().default([]),
    status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
    repo: z.string().optional(),
    live: z.string().optional(),
    featured: z.boolean().optional().default(false),
    order: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
  }),
});

// Writing = AI notes / essays / build logs. Body is HTML-first too.
// 文件名以下划线开头的文件（如 _template.md）= 模板，不进入集合。
const writing = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 有实质修改时才填 updated；用于展示"更新于"。
    updated: z.coerce.date().optional(),
    description: z.string(),
    // 内容形态：essay 长文 / note 短记 / log 构建日志。
    type: z.enum(['essay', 'note', 'log']).optional().default('essay'),
    // 受控词表：每篇 ≤3 个，见 src/content/writing/_template.md。
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { projects, writing };
