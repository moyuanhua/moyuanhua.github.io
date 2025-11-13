#!/usr/bin/env node

/**
 * 目录结构验证脚本
 * 验证中英文文档目录结构和slug一致性
 */

const path = require('path');
const fs = require('fs');

const DOCS_ZH = path.resolve(__dirname, '../docs');
const DOCS_EN = path.resolve(__dirname, '../i18n/en/docusaurus-plugin-content-docs/current');

console.log('🔍 验证目录结构一致性...\n');

// ============================================
// 辅助函数
// ============================================

function getDocPaths(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  目录不存在: ${dir}`);
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
// 主验证逻辑
// ============================================

function validateStructure() {
  console.log(`中文文档目录: ${DOCS_ZH}`);
  console.log(`英文文档目录: ${DOCS_EN}\n`);

  const zhDocs = getDocPaths(DOCS_ZH);
  const enDocs = getDocPaths(DOCS_EN);

  console.log(`✅ 找到 ${zhDocs.length} 个中文文档`);
  console.log(`✅ 找到 ${enDocs.length} 个英文文档\n`);

  if (zhDocs.length === 0 && enDocs.length === 0) {
    console.warn('⚠️  未找到任何文档');
    console.warn('   请先运行飞书同步脚本: node scripts/sync-feishu.js\n');
    process.exit(0);
  }

  const zhSlugs = new Set(zhDocs.map(extractSlug));
  const enSlugs = new Set(enDocs.map(extractSlug));

  // 检查slug一致性
  const missingInEn = [...zhSlugs].filter(slug => !enSlugs.has(slug));
  const missingInZh = [...enSlugs].filter(slug => !zhSlugs.has(slug));

  let hasIssues = false;

  if (missingInEn.length > 0) {
    hasIssues = true;
    console.error('❌ 英文版本缺少以下文档:');
    missingInEn.forEach(slug => console.error(`   - ${slug}`));
    console.error('');
  }

  if (missingInZh.length > 0) {
    hasIssues = true;
    console.error('❌ 中文版本缺少以下文档:');
    missingInZh.forEach(slug => console.error(`   - ${slug}`));
    console.error('');
  }

  if (!hasIssues) {
    console.log('✅ 目录结构完全一致');
    console.log('   语言切换功能将正常工作\n');
    process.exit(0);
  } else {
    console.error('⚠️  目录结构不一致');
    console.error('   建议:');
    console.error('   1. 检查飞书知识库中的文档结构');
    console.error('   2. 确保中英文根节点下的文档结构完全一致');
    console.error('   3. 确保对应文档的slug相同');
    console.error('   4. 重新运行同步脚本\n');
    process.exit(1);
  }
}

// 执行验证
validateStructure();
