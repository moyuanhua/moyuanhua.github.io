# Contract: feishu-pages Configuration

**File**: `scripts/sync-feishu.js` 和 `.feishu-pages.json` (可选)
**Purpose**: 飞书内容同步脚本和配置,遵循feishu-pages API规范

---

## Sync Script Structure

### 完整脚本示例

**scripts/sync-feishu.js**:

```javascript
#!/usr/bin/env node

/**
 * 飞书内容同步脚本
 *
 * 功能:
 * 1. 从飞书知识库同步中英文内容到Docusaurus目录
 * 2. 遵守API限流规则(300ms间隔)
 * 3. 下载并处理图片等资源
 * 4. 验证目录结构一致性
 *
 * 环境变量:
 * - FEISHU_APP_ID: 飞书应用ID
 * - FEISHU_APP_SECRET: 飞书应用密钥
 * - FEISHU_WIKI_ID: 知识库ID
 * - FEISHU_ZH_NODE_ID: 中文根节点ID
 * - FEISHU_EN_NODE_ID: 英文根节点ID
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

// ========== 配置验证 ==========

function validateEnv() {
  const required = [
    'FEISHU_APP_ID',
    'FEISHU_APP_SECRET',
    'FEISHU_WIKI_ID',
    'FEISHU_ZH_NODE_ID',
    'FEISHU_EN_NODE_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env file or GitHub Secrets.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// ========== 同步配置 ==========

const SYNC_CONFIG = {
  zh: {
    language: 'zh',
    nodeId: process.env.FEISHU_ZH_NODE_ID,
    outputPath: path.resolve(__dirname, '../app/docs'),
    label: '中文',
  },
  en: {
    language: 'en',
    nodeId: process.env.FEISHU_EN_NODE_ID,
    outputPath: path.resolve(__dirname, '../app/i18n/en/docusaurus-plugin-content-docs/current'),
    label: 'English',
  },
};

const ASSETS_PATH = path.resolve(__dirname, '../app/static/feishu-assets');

// ========== 同步函数 ==========

async function syncLanguage(config) {
  const { language, nodeId, outputPath, label } = config;

  console.log(`\n📥 Syncing ${label} content...`);
  console.log(`   Node ID: ${nodeId}`);
  console.log(`   Output: ${outputPath}`);

  // 确保输出目录存在
  await fs.ensureDir(outputPath);
  await fs.ensureDir(ASSETS_PATH);

  // 构建feishu-pages命令
  const command = [
    'npx feishu-pages sync',
    `--app-id ${process.env.FEISHU_APP_ID}`,
    `--app-secret ${process.env.FEISHU_APP_SECRET}`,
    `--type wiki`,
    `--wiki-id ${process.env.FEISHU_WIKI_ID}`,
    `--node-id ${nodeId}`,
    `--output ${outputPath}`,
    `--assets-path ${ASSETS_PATH}`,
    `--interval 300`,  // 请求间隔300ms
    `--max-retries 3`,
    `--verbose`,
  ].join(' ');

  try {
    console.log(`   Command: ${command}`);

    execSync(command, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        // 确保feishu-pages能访问环境变量
        FEISHU_APP_ID: process.env.FEISHU_APP_ID,
        FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET,
      },
    });

    console.log(`✅ ${label} sync completed`);
    return { success: true, language };
  } catch (error) {
    console.error(`❌ ${label} sync failed:`, error.message);
    return { success: false, language, error };
  }
}

// ========== 目录结构验证 ==========

async function validateStructure() {
  console.log('\n🔍 Validating directory structure consistency...');

  const zhDocs = await getDocPaths(SYNC_CONFIG.zh.outputPath);
  const enDocs = await getDocPaths(SYNC_CONFIG.en.outputPath);

  const zhSlugs = new Set(zhDocs.map(extractSlug));
  const enSlugs = new Set(enDocs.map(extractSlug));

  // 检查slug一致性
  const missingInEn = [...zhSlugs].filter(slug => !enSlugs.has(slug));
  const missingInZh = [...enSlugs].filter(slug => !zhSlugs.has(slug));

  if (missingInEn.length > 0) {
    console.warn('⚠️  Documents missing in English version:');
    missingInEn.forEach(slug => console.warn(`   - ${slug}`));
  }

  if (missingInZh.length > 0) {
    console.warn('⚠️  Documents missing in Chinese version:');
    missingInZh.forEach(slug => console.warn(`   - ${slug}`));
  }

  if (missingInEn.length === 0 && missingInZh.length === 0) {
    console.log('✅ Directory structure is consistent');
  } else {
    console.warn('⚠️  Structure inconsistencies detected, language switching may not work correctly');
  }
}

async function getDocPaths(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(path.relative(dir, fullPath));
      }
    }
  }

  await walk(dir);
  return files;
}

function extractSlug(filePath) {
  // 移除文件扩展名并归一化路径
  return filePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
}

// ========== 同步统计 ==========

async function generateSyncReport(results) {
  console.log('\n📊 Sync Report');
  console.log('=' . repeat(50));

  for (const result of results) {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${result.language.toUpperCase()}: ${status}`);

    if (!result.success) {
      console.log(`   Error: ${result.error.message}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log('=' . repeat(50));
  console.log(`Total: ${successCount}/${totalCount} successful`);

  if (successCount < totalCount) {
    console.error('\n❌ Some syncs failed. Please check the logs above.');
    process.exit(1);
  }
}

// ========== 主流程 ==========

async function main() {
  console.log('🚀 Starting Feishu content sync...\n');

  // 1. 验证环境变量
  validateEnv();

  // 2. 同步所有语言
  const results = [];

  for (const [lang, config] of Object.entries(SYNC_CONFIG)) {
    const result = await syncLanguage(config);
    results.push(result);

    // 失败后继续同步其他语言,最后统一报告
    if (!result.success) {
      console.error(`Failed to sync ${lang}, continuing with next language...`);
    }
  }

  // 3. 验证目录结构
  await validateStructure();

  // 4. 生成同步报告
  await generateSyncReport(results);

  console.log('\n✨ Sync process completed!\n');
}

// ========== 执行 ==========

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { syncLanguage, validateStructure };
```

---

## feishu-pages CLI Options

### 基础命令

```bash
npx feishu-pages sync [options]
```

### 核心选项

| 选项 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `--app-id` | string | 是 | 飞书应用ID |
| `--app-secret` | string | 是 | 飞书应用密钥 |
| `--type` | enum | 是 | 内容类型: `wiki` 或 `docx` |
| `--wiki-id` | string | 条件 | 知识库ID (type为wiki时必填) |
| `--node-id` | string | 否 | 起始节点ID(不填则同步整个知识库) |
| `--output` | string | 是 | 输出目录路径 |
| `--assets-path` | string | 否 | 资源文件输出路径(默认: output/assets) |

### 限流和重试选项

| 选项 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `--interval` | number | 300 | 请求间隔(毫秒) |
| `--max-retries` | number | 3 | 最大重试次数 |
| `--backoff-ms` | number | 1000 | 重试退避间隔(毫秒) |

### 内容处理选项

| 选项 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `--md-type` | enum | markdown | 输出格式: `markdown` 或 `mdx` |
| `--download-images` | boolean | true | 是否下载图片 |
| `--download-whiteboard` | boolean | false | 是否下载白板(需要ImageMagick) |
| `--preserve-meta` | boolean | true | 是否保留Page Meta |

### 日志选项

| 选项 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `--verbose` | boolean | false | 详细日志 |
| `--silent` | boolean | false | 静默模式 |
| `--log-file` | string | - | 日志文件路径 |

---

## Configuration File (可选)

除了命令行参数,也可以使用配置文件:

**.feishu-pages.json**:

```json
{
  "appId": "${FEISHU_APP_ID}",
  "appSecret": "${FEISHU_APP_SECRET}",
  "type": "wiki",
  "wikiId": "${FEISHU_WIKI_ID}",

  "output": {
    "path": "./app/docs",
    "mdType": "markdown",
    "assetsPath": "./app/static/feishu-assets"
  },

  "sync": {
    "downloadImages": true,
    "downloadWhiteboard": false,
    "preserveMeta": true
  },

  "rateLimiting": {
    "intervalMs": 300,
    "maxRetries": 3,
    "backoffMs": 1000
  },

  "logging": {
    "verbose": true,
    "logFile": "./logs/feishu-sync.log"
  }
}
```

**使用配置文件**:
```bash
npx feishu-pages sync --config .feishu-pages.json
```

---

## Environment Variables

脚本依赖以下环境变量:

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx

# 知识库配置
FEISHU_WIKI_ID=wikxxxxxxxxxx
FEISHU_ZH_NODE_ID=wikcnxxxxxxxxxxxxxx  # 中文根节点
FEISHU_EN_NODE_ID=wikcnxxxxxxxxxxxxxx  # 英文根节点
```

**在CI/CD中配置**:
- GitHub Secrets中添加所有变量
- 在workflow中通过`env`传递给脚本

---

## API Rate Limiting

### 飞书API限制

根据Constitution要求,必须遵守:
- **请求频率**: 最大100请求/分钟
- **请求间隔**: 至少300毫秒
- **重试策略**: 指数退避(1s, 2s, 4s, ...)

### 实现方式

脚本中已内置:
```javascript
const command = [
  'npx feishu-pages sync',
  // ... 其他参数 ...
  `--interval 300`,        // 300ms间隔
  `--max-retries 3`,       // 最多重试3次
].join(' ');
```

feishu-pages会自动处理:
1. 在每个API请求间等待指定间隔
2. 收到429响应时自动重试
3. 实现指数退避策略

---

## Output Structure

### 同步后的目录结构

```
app/
├── docs/                           # 中文内容(默认)
│   ├── intro.md
│   ├── tutorial/
│   │   ├── basics.md
│   │   └── advanced.md
│   └── api/
│       └── reference.md
│
├── i18n/
│   └── en/
│       └── docusaurus-plugin-content-docs/
│           └── current/           # 英文内容(结构与docs/完全一致)
│               ├── intro.md
│               ├── tutorial/
│               │   ├── basics.md
│               │   └── advanced.md
│               └── api/
│                   └── reference.md
│
└── static/
    └── feishu-assets/             # 共享资源
        ├── images/
        │   ├── abc123.png
        │   └── def456.jpg
        └── whiteboards/
            └── xyz789.png
```

### Markdown文件格式

**同步后的文档frontmatter**:

```markdown
---
title: 入门介绍
sidebar_position: 1
sidebar_label: 入门
hide: false
feishu_doc_id: doxcnXXXXXXXXXXXXX
feishu_last_modified: 1705132800000
---

# 入门介绍

这是从飞书同步的内容...

![图片描述](/feishu-assets/images/abc123.png)
```

**关键点**:
- frontmatter包含飞书元数据
- 图片路径自动转换为静态资源路径
- 保留飞书的目录层级

---

## Error Handling

### 常见错误和处理

| 错误类型 | 处理方式 |
|---------|---------|
| 认证失败 | 立即终止,提示检查APP_ID和APP_SECRET |
| 权限不足 | 立即终止,提示检查API权限配置 |
| 网络超时 | 自动重试(最多3次) |
| API限流 | 等待并重试(指数退避) |
| 节点不存在 | 跳过该节点,记录警告 |
| 图片下载失败 | 记录警告,继续处理其他内容 |

### 错误日志示例

```
❌ English sync failed: RequestError: Request failed with status 403
   Message: Permission denied - missing docx:document:readonly scope
   Please check your Feishu app permissions at:
   https://open.feishu.cn/app
```

---

## Validation Checks

### 同步后验证

脚本包含以下验证:

1. **目录结构一致性**:
   - 检查中英文版本的文件路径是否匹配
   - 报告缺失的翻译

2. **Markdown语法**:
   - 验证frontmatter格式
   - 检查必填字段(title, slug)

3. **资源完整性**:
   - 验证所有引用的图片是否已下载
   - 检查资源文件大小(排除空文件)

4. **元数据一致性**:
   - 验证同一文章的中英文slug是否一致
   - 检查sidebar_position冲突

### 验证输出示例

```
🔍 Validating directory structure consistency...
✅ Directory structure is consistent
   - 15 documents in Chinese
   - 15 documents in English
   - All slugs matched

⚠️  Documents missing in English version:
   - advanced/performance-tuning
   - advanced/security-best-practices

Recommendation: Add English translations for missing documents
```

---

## Incremental Sync

### 增量同步策略

未来可实现基于`feishu_last_modified`的增量同步:

```javascript
async function shouldSync(docPath, nodeMetadata) {
  const existingFile = await fs.readFile(docPath, 'utf8');
  const frontmatter = parseFrontmatter(existingFile);

  const existingTimestamp = frontmatter.feishu_last_modified;
  const newTimestamp = nodeMetadata.last_modified;

  return newTimestamp > existingTimestamp;
}
```

**优点**:
- 减少不必要的API请求
- 加快同步速度
- 降低API限流风险

**实现步骤**:
1. 读取现有文档的`feishu_last_modified`
2. 与飞书API返回的时间戳比较
3. 仅同步有更新的文档

---

## Integration with CI/CD

脚本设计为CI/CD友好:

```yaml
# GitHub Actions中调用
- name: Sync Feishu content
  env:
    FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
    FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
    FEISHU_WIKI_ID: ${{ secrets.FEISHU_WIKI_ID }}
    FEISHU_ZH_NODE_ID: ${{ secrets.FEISHU_ZH_NODE_ID }}
    FEISHU_EN_NODE_ID: ${{ secrets.FEISHU_EN_NODE_ID }}
  run: |
    node scripts/sync-feishu.js
```

**退出码**:
- `0`: 所有同步成功
- `1`: 部分或全部同步失败

---

## References

- [feishu-pages GitHub Repository](https://github.com/longbridgeapp/feishu-pages)
- [飞书开放平台 - API文档](https://open.feishu.cn/document/home/introduction)
- [飞书API限流规则](https://open.feishu.cn/document/ukTMukTMukTM/uITM1YjLyETN24iMxUjN)
