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
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { projects, writing };
