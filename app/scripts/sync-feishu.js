#!/usr/bin/env node

/**
 * Feishu Content Sync Script
 * 从飞书知识库同步内容到Docusaurus
 *
 * 功能:
 * 1. 从飞书知识库同步中英文内容到Docusaurus目录
 * 2. 遵守API限流规则(300ms间隔)
 * 3. 下载并处理图片等资源
 * 4. 验证目录结构一致性
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 Starting Feishu content sync...\n');

// ============================================
// 环境变量验证
// ============================================

const requiredEnvVars = [
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'FEISHU_WIKI_ID',
  'FEISHU_ZH_NODE_ID',
  'FEISHU_EN_NODE_ID'
];

console.log('🔍 验证环境变量...');

const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('\n请确保以下操作:');
  console.error('  1. 复制 .env.example 到 .env');
  console.error('  2. 填写所有必需的环境变量');
  console.error('  3. 重新运行此脚本\n');
  process.exit(1);
}

// 验证格式
if (!/^cli_[a-zA-Z0-9]{16}$/.test(process.env.FEISHU_APP_ID)) {
  console.error('❌ FEISHU_APP_ID 格式错误');
  console.error('   应该是: cli_ + 16位字符\n');
  process.exit(1);
}

// Wiki ID 格式验证 - 接受任何字母数字组合
if (!/^[a-zA-Z0-9]{15,}$/.test(process.env.FEISHU_WIKI_ID)) {
  console.error('❌ FEISHU_WIKI_ID 格式错误');
  console.error('   应该是至少15位的字母数字字符串\n');
  process.exit(1);
}

console.log('✅ 环境变量验证通过\n');

// ============================================
// 配置
// ============================================

const config = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  wikiId: process.env.FEISHU_WIKI_ID,
  zhNodeId: process.env.FEISHU_ZH_NODE_ID,
  enNodeId: process.env.FEISHU_EN_NODE_ID,
  syncInterval: parseInt(process.env.FEISHU_SYNC_INTERVAL || '300'),
  maxRetries: parseInt(process.env.FEISHU_MAX_RETRIES || '3'),
  skipSync: process.env.SKIP_FEISHU_SYNC === 'true',
};

const SYNC_CONFIG = {
  zh: {
    language: 'zh',
    nodeId: config.zhNodeId,
    outputPath: path.resolve(__dirname, '../docs'),
    label: '中文',
  },
  en: {
    language: 'en',
    nodeId: config.enNodeId,
    outputPath: path.resolve(__dirname, '../i18n/en/docusaurus-plugin-content-docs/current'),
    label: 'English',
  },
};

const ASSETS_PATH = path.resolve(__dirname, '../static/feishu-assets');

// ============================================
// 辅助函数
// ============================================

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 同步函数
// ============================================

async function syncLanguage(langConfig) {
  const { language, nodeId, outputPath, label } = langConfig;

  console.log(`\n📥 Syncing ${label} content...`);
  console.log(`   Node ID: ${nodeId}`);
  console.log(`   Output: ${outputPath}`);

  // 确保输出目录存在
  ensureDir(outputPath);
  ensureDir(ASSETS_PATH);

  // 构建feishu-pages命令
  // 注意: feishu-pages CLI 的实际参数可能需要根据实际版本调整
  const command = `npx feishu-pages ${config.wikiId} ${nodeId} --output="${outputPath}" --assets="${ASSETS_PATH}"`;

  let retries = 0;
  const maxRetries = config.maxRetries;

  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, retries - 1), 10000);
        console.log(`   ⏳ Retry ${retries}/${maxRetries} after ${backoffMs}ms...`);
        await sleep(backoffMs);
      }

      console.log(`   🔄 Executing sync command...`);

      execSync(command, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
        env: {
          ...process.env,
          FEISHU_APP_ID: config.appId,
          FEISHU_APP_SECRET: config.appSecret,
          FEISHU_SPACE_ID: config.wikiId,  // feishu-pages requires SPACE_ID
        },
      });

      console.log(`✅ ${label} sync completed\n`);

      // 验证输出
      if (!fs.existsSync(outputPath)) {
        throw new Error('Output directory does not exist after sync');
      }

      const files = fs.readdirSync(outputPath);
      console.log(`📁 Synced ${files.length} files/directories for ${label}`);

      return { success: true, language };
    } catch (error) {
      retries++;
      console.error(`❌ ${label} sync attempt ${retries} failed:`, error.message);

      if (retries > maxRetries) {
        console.error(`\n可能的原因:`);
        console.error('  1. 飞书API凭证错误');
        console.error('  2. 知识库ID或节点ID不正确');
        console.error('  3. 应用权限不足');
        console.error('  4. 网络连接问题\n');
        return { success: false, language, error };
      }
    }
  }
}

// ============================================
// 目录结构验证
// ============================================

async function validateStructure() {
  console.log('\n🔍 Validating directory structure consistency...');

  try {
    const zhDocs = getDocPaths(SYNC_CONFIG.zh.outputPath);
    const enDocs = getDocPaths(SYNC_CONFIG.en.outputPath);

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
      console.warn('⚠️  Structure inconsistencies detected');
      console.warn('   Language switching may not work correctly for some pages\n');
    }
  } catch (error) {
    console.warn('⚠️  Could not validate structure:', error.message);
  }
}

function getDocPaths(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(path.relative(dir, fullPath));
      }
    }
  }

  walk(dir);
  return files;
}

function extractSlug(filePath) {
  // 移除文件扩展名并归一化路径
  return filePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
}

// ============================================
// 同步报告
// ============================================

function generateSyncReport(results) {
  console.log('\n📊 Sync Report');
  console.log('==================================================');

  for (const result of results) {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const lang = result.language.toUpperCase();
    console.log(`${lang}: ${status}`);

    if (!result.success && result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  }

  console.log('==================================================');

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`Total: ${successCount}/${totalCount} successful\n`);

  if (successCount < totalCount) {
    console.error('⚠️  Some syncs failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  if (config.skipSync) {
    console.log('⏭️  Skipping Feishu sync (SKIP_FEISHU_SYNC=true)');
    console.log('   Using existing content for build\n');
    return;
  }

  console.log('📋 Sync Configuration:');
  console.log(`   Wiki ID: ${config.wikiId}`);
  console.log(`   Chinese Node ID: ${config.zhNodeId}`);
  console.log(`   English Node ID: ${config.enNodeId}`);
  console.log(`   API Request Interval: ${config.syncInterval}ms`);
  console.log(`   Max Retries: ${config.maxRetries}\n`);

  const results = [];

  // 同步中文内容
  const zhResult = await syncLanguage(SYNC_CONFIG.zh);
  results.push(zhResult);

  // 等待一段时间再同步英文内容(遵守API限流)
  if (zhResult.success) {
    console.log(`⏱️  Waiting ${config.syncInterval}ms before next sync...\n`);
    await sleep(config.syncInterval);
  }

  // 同步英文内容
  const enResult = await syncLanguage(SYNC_CONFIG.en);
  results.push(enResult);

  // 验证目录结构
  if (zhResult.success && enResult.success) {
    await validateStructure();
  }

  // 生成报告
  generateSyncReport(results);

  console.log('✨ Sync process completed!\n');
}

// 执行主函数
main().catch(error => {
  console.error('\n❌ Sync failed:', error.message);
  if (process.env.DEBUG === 'true') {
    console.error('\nDebug information:');
    console.error(error.stack);
  }
  process.exit(1);
});
