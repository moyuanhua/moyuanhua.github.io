import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Minimal static personal site.
// Deploy: GitHub Pages user site (repo `moyuanhua.github.io`) -> https://moyuanhua.github.io
// Local override: SITE=https://example.com BASE_PATH=/prefix/ npm run build
export default defineConfig({
  output: 'static',
  site: process.env.SITE || 'https://moyuanhua.github.io',
  // Normalize base to always end with `/` so `${BASE}projects` is well formed.
  base: (process.env.BASE_PATH || '/').replace(/\/?$/, '/'),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
