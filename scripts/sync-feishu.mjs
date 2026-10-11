#!/usr/bin/env node
/**
 * Sync a Feishu / Lark wiki space into this site's `writing` content collection.
 *
 * Runs headless in GitHub Actions (or locally). No local lark-cli required:
 * it talks to the Feishu OpenAPI directly and renders Markdown with the
 * `feishu-docx` library (the same engine behind the community `feishu-pages`).
 *
 *   tenant_access_token -> wiki nodes (recursive) -> docx blocks (Markdown)
 *   -> download images/boards -> src/content/writing/feishu/** + public/...
 *
 * Required env:
 *   FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_SPACE_ID
 * Optional env:
 *   FEISHU_ENDPOINT        (default https://open.feishu.cn, set to https://open.larksuite.com for Lark)
 *   FEISHU_ROOT_NODE_TOKEN (sync only one subtree)
 *   FEISHU_DRY_RUN=1       (fetch + render, do not write any file)
 *
 * See docs/feishu-sync.md for setup.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MarkdownRenderer } = require('feishu-docx');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── config ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  spaceId: '',
  rootNodeToken: '',
  output: 'src/content/writing/feishu',
  assets: 'public/writing-assets/feishu',
  assetsUrlBase: '/writing-assets/feishu',
  dateFrom: 'obj_edit_time', // obj_edit_time | obj_create_time
  defaultTags: ['feishu'],
  draft: false,
  titlePrefix: '',
  publishMarker: '', // if set, only titles containing it are synced (marker stripped)
  excludeNodeTokens: [],
  excludeTitlePatterns: [], // regex strings, matched against the node title
};

function loadConfig() {
  const p = path.join(ROOT, 'feishu.config.json');
  const file = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  const cfg = { ...DEFAULTS, ...file };
  cfg.spaceId = process.env.FEISHU_SPACE_ID || cfg.spaceId;
  cfg.rootNodeToken = process.env.FEISHU_ROOT_NODE_TOKEN || cfg.rootNodeToken;
  return cfg;
}

const cfg = loadConfig();
const DRY_RUN = process.env.FEISHU_DRY_RUN === '1';
const ENDPOINT = (process.env.FEISHU_ENDPOINT || 'https://open.feishu.cn').replace(/\/+$/, '');
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;

const OUT_ABS = path.join(ROOT, cfg.output);
const ASSETS_ABS = path.join(ROOT, cfg.assets);
const MANIFEST = path.join(ROOT, '.feishu-sync', 'manifest.json');

// ── tiny helpers ──────────────────────────────────────────────────────────
const log = (...a) => console.log('[feishu-sync]', ...a);
const warn = (...a) => console.warn('[feishu-sync]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function toAsciiSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function shortHash(s) {
  return crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8);
}

function yamlScalar(v) {
  return JSON.stringify(String(v));
}

function deriveDescription(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,9}\s+.*$/gm, ' ')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, ' ')
    .replace(/[>*_`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function cleanMarkdown(md) {
  return (
    md
      .replace(/\r\n/g, '\n')
      // The Page block renders the document title as a heading; when it is empty
      // (title lives in wiki metadata) it leaves a stray "# " line. Drop empty headings.
      .replace(/^#{1,9}[ \t]*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^(?:[ \t]*\n)+/, '')
      .replace(/(?:\n[ \t]*)+$/, '') + '\n'
  );
}

function stripDuplicateTitle(md, title) {
  const m = /^#\s+(.+)\n?/.exec(md);
  if (m && m[1].trim() === String(title).trim()) {
    return md.slice(m[0].length).replace(/^(?:[ \t]*\n)+/, '');
  }
  return md;
}

function msToDate(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString().slice(0, 10);
  return new Date(n).toISOString().slice(0, 10);
}

function extFromDisposition(cd) {
  if (!cd) return '';
  const star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  const plain = /filename="?([^";]+)"?/i.exec(cd);
  const name = decodeURIComponent((star ? star[1] : plain ? plain[1] : '') || '');
  const ext = path.extname(name).toLowerCase();
  return ext && ext.length <= 6 ? ext : '';
}

function extFromContentType(ct) {
  const t = (ct || '').split(';')[0].trim().toLowerCase();
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
  };
  return map[t] || '';
}

// ── Feishu API ────────────────────────────────────────────────────────────
let TOKEN = '';

async function auth() {
  const res = await fetch(`${ENDPOINT}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const j = await res.json().catch(() => ({}));
  if (j.code !== 0) throw new Error(`auth failed: ${j.code} ${j.msg}`);
  TOKEN = j.tenant_access_token;
  log('authenticated, token acquired');
}

async function api(method, urlPath, { query, body } = {}) {
  const url = new URL(ENDPOINT + urlPath);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await res.json().catch(() => ({}));
    if (j.code === 0) return j.data || {};
    // 99991400 = rate limited; back off and retry.
    if (j.code === 99991400 && attempt < 3) {
      const wait = 2 ** attempt * 1000;
      warn(`rate limited on ${urlPath}, retry in ${wait}ms`);
      await sleep(wait);
      continue;
    }
    const err = new Error(`${j.code} ${j.msg} (${method} ${urlPath})`);
    err.code = j.code;
    throw err;
  }
  throw new Error(`retries exhausted (${method} ${urlPath})`);
}

async function paginate(urlPath, query = {}) {
  const items = [];
  let pageToken = '';
  do {
    const data = await api('GET', urlPath, {
      query: { ...query, page_size: query.page_size || 50, page_token: pageToken || undefined },
    });
    items.push(...(data.items || []));
    pageToken = data.has_more ? data.page_token : '';
  } while (pageToken);
  return items;
}

async function listNodes(parentNodeToken) {
  const base = `/open-apis/wiki/v2/spaces/${encodeURIComponent(cfg.spaceId)}/nodes`;
  return paginate(base, { parent_node_token: parentNodeToken || undefined });
}

async function collectNodes() {
  const all = [];
  const walk = async (parent) => {
    const nodes = await listNodes(parent);
    for (const n of nodes) {
      all.push(n);
      if (n.has_child) await walk(n.node_token);
    }
  };
  await walk(cfg.rootNodeToken || '');
  return all;
}

async function fetchBlocks(documentId) {
  const blocks = [];
  let pageToken = '';
  do {
    const data = await api('GET', `/open-apis/docx/v1/documents/${documentId}/blocks`, {
      query: { page_size: 500, document_revision_id: -1, page_token: pageToken || undefined },
    });
    blocks.push(...(data.items || []));
    pageToken = data.has_more ? data.page_token : '';
  } while (pageToken);
  return blocks;
}

async function downloadMedia(token, type) {
  const urlPath =
    type === 'board'
      ? `/open-apis/board/v1/whiteboards/${token}/download_as_image`
      : `/open-apis/drive/v1/medias/${token}/download`;
  const res = await fetch(ENDPOINT + urlPath, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`media ${token}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext =
    extFromDisposition(res.headers.get('content-disposition')) ||
    extFromContentType(res.headers.get('content-type')) ||
    (type === 'board' ? '.png' : '.bin');
  return { buf, ext };
}

// ── rendering ─────────────────────────────────────────────────────────────
async function renderNode(node) {
  const documentId = node.obj_token;
  const blocks = await fetchBlocks(documentId);
  const renderer = new MarkdownRenderer({ document: { document_id: documentId }, blocks });
  const markdown = cleanMarkdown(renderer.parse());
  return { markdown, fileTokens: renderer.fileTokens || {}, meta: renderer.meta || {} };
}

async function materializeMedia(node, segs, markdown, fileTokens, outAssets) {
  for (const [token, info] of Object.entries(fileTokens)) {
    try {
      const { buf, ext } = await downloadMedia(token, info.type);
      const dirSegs = segs.slice(0, -1);
      const name = token + ext;
      const destAbs = path.join(ASSETS_ABS, ...dirSegs, name);
      if (!DRY_RUN) {
        fs.mkdirSync(path.dirname(destAbs), { recursive: true });
        fs.writeFileSync(destAbs, buf);
      }
      outAssets.push(rel(destAbs));
      const url = [cfg.assetsUrlBase, ...dirSegs, name].join('/');
      markdown = markdown.split(token).join(url);
    } catch (e) {
      warn(`media ${token} (${info.type}) failed on "${node.title}": ${e.message}`);
    }
  }
  return markdown;
}

// ── path / slug planning ──────────────────────────────────────────────────
function planTree(nodes) {
  const byToken = new Map(nodes.map((n) => [n.node_token, n]));
  const used = new Set();

  const slugFor = (n) => {
    let base = toAsciiSlug(n.title) || `doc-${shortHash(n.node_token)}`;
    if (used.has(base)) base = `${base}-${shortHash(n.node_token)}`;
    used.add(base);
    return base;
  };

  const segsFor = (n) => {
    const chain = [];
    let cur = n;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_node_token ? byToken.get(cur.parent_node_token) : null;
    }
    return chain.map((x) => (x === n ? slugFor(n) : toAsciiSlug(x.title) || shortHash(x.node_token)));
  };

  return { byToken, segsFor };
}

function shouldSync(node) {
  if (node.obj_type !== 'docx') return { skip: true, reason: `type=${node.obj_type}` };
  if (cfg.excludeNodeTokens.includes(node.node_token)) return { skip: true, reason: 'excluded' };
  for (const pat of cfg.excludeTitlePatterns) {
    if (new RegExp(pat).test(node.title || '')) return { skip: true, reason: `title matches /${pat}/` };
  }
  if (cfg.publishMarker && !(node.title || '').includes(cfg.publishMarker)) {
    return { skip: true, reason: 'no publish marker' };
  }
  return { skip: false };
}

function cleanTitle(node) {
  let t = (node.title || '').trim() || node.obj_token;
  if (cfg.publishMarker) t = t.split(cfg.publishMarker).join('').trim();
  if (cfg.titlePrefix) t = cfg.titlePrefix + t;
  return t;
}

// ── manifest (stale cleanup across runs) ──────────────────────────────────
function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return { files: [], assets: [] };
  }
}

function cleanupStale(prev, next, keep = new Set()) {
  const removed = [];
  const drop = (list, nextSet, rootAbs) => {
    for (const r of list) {
      if (nextSet.has(r) || keep.has(r)) continue;
      const abs = path.join(ROOT, r);
      if (!abs.startsWith(rootAbs + path.sep)) continue;
      if (fs.existsSync(abs)) {
        fs.rmSync(abs, { force: true });
        removed.push(r);
      }
    }
  };
  drop(prev.files || [], new Set(next.files), OUT_ABS);
  drop(prev.assets || [], new Set(next.assets), ASSETS_ABS);
  return removed;
}

function pruneEmptyDirs(dirAbs) {
  if (!fs.existsSync(dirAbs)) return;
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirs(path.join(dirAbs, entry.name));
  }
  if (fs.readdirSync(dirAbs).length === 0) fs.rmdirSync(dirAbs);
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  if (!APP_ID || !APP_SECRET) throw new Error('FEISHU_APP_ID and FEISHU_APP_SECRET are required');
  if (!cfg.spaceId) throw new Error('FEISHU_SPACE_ID (or "spaceId" in feishu.config.json) is required');

  log(`endpoint=${ENDPOINT} space=${cfg.spaceId} output=${cfg.output}`);
  await auth();

  const nodes = await collectNodes();
  log(`found ${nodes.length} wiki node(s)`);

  const { segsFor } = planTree(nodes);
  const prev = readManifest();
  const next = { files: [], assets: [] };
  const keep = new Set(); // files whose doc failed this run: do not treat as deleted
  const usedLeaf = new Set(); // 防止文档声明的 slug 互相覆盖
  let written = 0;
  let failures = 0;

  for (const node of nodes) {
    const gate = shouldSync(node);
    if (gate.skip) {
      log(`skip  ${node.obj_token}  ${node.title}  (${gate.reason})`);
      continue;
    }
    const segs = segsFor(node);
    let fileAbs = path.join(OUT_ABS, ...segs.slice(0, -1), `${segs[segs.length - 1]}.md`);
    try {
      const { markdown, fileTokens, meta } = await renderNode(node);
      // 文档首块 YAML 里的 slug 可覆盖文件名，mapping 到干净 URL：
      // 节点标题保持中文（飞书里好读），URL 用 slug，如 slug: ai-visibility-77-stores
      if (meta.slug) {
        let s = toAsciiSlug(meta.slug);
        if (s) {
          if (usedLeaf.has(s)) s = `${s}-${shortHash(node.node_token)}`;
          usedLeaf.add(s);
          segs[segs.length - 1] = s;
          fileAbs = path.join(OUT_ABS, ...segs.slice(0, -1), `${s}.md`);
        }
      }
      if (!markdown.trim()) {
        log(`skip  ${node.obj_token}  ${node.title}  (empty)`);
        continue;
      }
      const rawBody = await materializeMedia(node, segs, markdown, fileTokens, next.assets);

      const title = meta.title || cleanTitle(node);
      const body = stripDuplicateTitle(rawBody, title);
      const date = meta.date ? String(meta.date) : msToDate(node[cfg.dateFrom] || node.obj_edit_time);
      const description = meta.description || deriveDescription(body) || title;
      const tags = [...new Set([...(meta.tags || []), ...(cfg.defaultTags || [])])];
      const draft = meta.draft ?? cfg.draft;

      const front = ['---'];
      front.push(`title: ${yamlScalar(title)}`);
      front.push(`date: ${yamlScalar(date)}`);
      if (meta.updated) front.push(`updated: ${yamlScalar(String(meta.updated))}`);
      front.push(`description: ${yamlScalar(description)}`);
      if (meta.type) front.push(`type: ${yamlScalar(String(meta.type))}`);
      front.push(`tags: [${tags.map(yamlScalar).join(', ')}]`);
      if (draft) front.push('draft: true');
      front.push('---', '');
      const out = front.join('\n') + body.replace(/\s+$/, '') + '\n';

      if (!DRY_RUN) {
        fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
        fs.writeFileSync(fileAbs, out);
      }
      next.files.push(rel(fileAbs));
      written++;
      log(`write ${rel(fileAbs)}  (${out.length} bytes, ${Object.keys(fileTokens).length} asset(s))`);
    } catch (e) {
      failures++;
      keep.add(rel(fileAbs));
      warn(`FAILED ${node.title} (${node.obj_token}): ${e.message}`);
    }
  }

  if (!DRY_RUN) {
    const removed = cleanupStale(prev, next, keep);
    for (const r of removed) log(`remove ${r}`);
    pruneEmptyDirs(OUT_ABS);
    pruneEmptyDirs(ASSETS_ABS);
    next.files.sort();
    next.assets.sort();
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + '\n');
  }

  log(`done: ${written} synced, ${failures} failed${DRY_RUN ? ' (dry-run)' : ''}`);
}

main().catch((e) => {
  console.error('[feishu-sync] fatal:', e.message);
  process.exit(1);
});
