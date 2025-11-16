#!/usr/bin/env node

/**
 * 飞书内容同步脚本 V4 - 使用官方 Markdown API
 *
 * 功能：
 * 1. 扫描飞书知识库文档树
 * 2. 判断哪些文档需要更新(基于更新时间)
 * 3. 只下载需要更新的文档
 * 4. 使用飞书官方 Markdown API 直接获取内容
 * 5. 保存到本地
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

console.log('🚀 飞书内容同步 V4 - 使用官方 Markdown API\n');

// ============================================
// 配置
// ============================================

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  spaceId: process.env.FEISHU_SPACE_ID,
  docsNodeId: process.env.FEISHU_DOCS_NODE_ID || 'L0qTw3NQFimJGIkWfGNckkEQnwJ',
  aboutDocId: process.env.FEISHU_ABOUT_DOC_ID || 'DKvmwNWVOiYA6KklWcsc1gHInKg',
  // 0 表示全量同步，>0 表示增量同步（N天内更新的文档）
  incrementalDays: parseInt(process.env.FEISHU_INCREMENTAL_DAYS || '0'),
  skipSync: process.env.SKIP_FEISHU_SYNC === 'true',
};

// 检查是否跳过同步
if (CONFIG.skipSync) {
  console.log('⏭️  SKIP_FEISHU_SYNC=true');
  console.log('✨ 跳过飞书同步，使用现有内容\n');
  process.exit(0);
}

// ============================================
// 辅助函数
// ============================================

// HTTP 请求封装
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

// 获取 tenant_access_token
async function getTenantAccessToken() {
  console.log('🔑 获取访问令牌...');
  const data = JSON.stringify({
    app_id: CONFIG.appId,
    app_secret: CONFIG.appSecret
  });

  const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const result = await httpsRequest(options, data);

  if (result.code !== 0) {
    throw new Error(`获取令牌失败 ${result.code}: ${result.msg}`);
  }

  console.log('   ✅ 令牌获取成功\n');
  return result.tenant_access_token;
}

// 获取知识库节点列表
async function getWikiNodes(token, spaceId, parentNodeToken = null) {
  const path = parentNodeToken
    ? `/open-apis/wiki/v2/spaces/${spaceId}/nodes?parent_node_token=${parentNodeToken}`
    : `/open-apis/wiki/v2/spaces/${spaceId}/nodes`;

  const options = {
    hostname: 'open.feishu.cn',
    path: path,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const result = await httpsRequest(options);

  if (result.code !== 0) {
    throw new Error(`获取节点列表失败 ${result.code}: ${result.msg}`);
  }

  return result.data;
}

// 使用官方 API 获取 Markdown 内容
async function getMarkdownContent(token, docToken) {
  const options = {
    hostname: 'open.feishu.cn',
    path: `/open-apis/docs/v1/content?doc_token=${docToken}&doc_type=docx&content_type=markdown&lang=zh`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const result = await httpsRequest(options);

  if (result.code !== 0) {
    throw new Error(`获取文档内容失败 ${result.code}: ${result.msg}`);
  }

  return result.data.content;
}

// 检查文档是否需要更新（N天内更新过）
function shouldUpdate(updateTime, days = 3) {
  if (!updateTime) return true;

  // 飞书返回的是秒级时间戳
  const docDate = new Date(parseInt(updateTime) * 1000);
  const now = new Date();
  const diffDays = (now - docDate) / (1000 * 60 * 60 * 24);

  return diffDays <= days;
}

// 清理 Markdown 中可能导致 MDX 编译错误的内容
function cleanMarkdown(markdown) {
  if (!markdown) return markdown;

  let cleaned = markdown;

  // 1. 清理飞书官方 API 的过度转义
  // 移除 URL 中的转义反斜杠: https://example\.com -> https://example.com
  cleaned = cleaned.replace(/([a-zA-Z0-9])\\\./g, '$1.');

  // 移除列表符号的转义: \- -> -
  cleaned = cleaned.replace(/^\\-\s/gm, '- ');
  cleaned = cleaned.replace(/^\\\*\s/gm, '* ');

  // 移除其他常见 Markdown 符号的转义
  cleaned = cleaned.replace(/\\\(/g, '(');
  cleaned = cleaned.replace(/\\\)/g, ')');
  cleaned = cleaned.replace(/\\\[/g, '[');
  cleaned = cleaned.replace(/\\\]/g, ']');
  cleaned = cleaned.replace(/\\\_/g, '_');

  // 2. 清理表格中的列表标签（特别处理）
  // 移除 <td> 内的 <ul><li> 结构（常见于飞书表格转换错误）
  cleaned = cleaned.replace(/<td>([^<]*)<ul>\s*<li>\s*<\/td>/gi, '<td>$1-</td>');
  cleaned = cleaned.replace(/<td>([^<]*)<ul>\s*<li>[^<]*<\/li>\s*<\/ul>([^<]*)<\/td>/gi, '<td>$1$2</td>');

  // 3. 移除不完整的 HTML 标签（常见于飞书转换）
  cleaned = cleaned.replace(/<(ul|ol)([^>]*)>\s*<li>\s*$/gim, '');
  cleaned = cleaned.replace(/<\/(ul|ol)>\s*$/gim, '');

  // 4. 移除孤立的闭合标签
  cleaned = cleaned.replace(/<\/(ul|ol|li|div|span)>/gi, '');

  // 5. 修复常见的 HTML 实体
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&amp;/g, '&');

  // 6. 移除空的 HTML 注释
  cleaned = cleaned.replace(/<!--\s*-->/g, '');

  // 7. 确保代码块正确闭合
  const codeBlockCount = (cleaned.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    cleaned += '\n```\n';
  }

  return cleaned;
}

// 从 markdown 内容中解析并移除 slug
function parseAndRemoveSlug(markdown) {
  // 匹配代码块中的 slug: xxx (支持 Plain Text 或 text)
  const slugMatch = markdown.match(/```(?:Plain Text|text)?\s*slug:\s*(\S+)\s*```/i);

  if (slugMatch) {
    const slug = slugMatch[1];
    // 从 markdown 中移除这个代码块
    const cleanedMarkdown = markdown.replace(/```(?:Plain Text|text)?\s*slug:\s*\S+\s*```\s*/gi, '').trim();
    return { slug, markdown: cleanedMarkdown };
  }

  return { slug: null, markdown };
}

// 注意：convertToMarkdown 函数已被移除，现在直接使用官方 API 获取 Markdown

// 生成 Docusaurus 前置元数据
function generateFrontMatter(node, slug, isIndexDoc = false, position = 0) {
  const frontMatter = ['---'];
  frontMatter.push(`title: ${node.title}`);

  // 对于 index.md，不需要设置 slug（使用目录名）
  // 对于其他文档，设置 slug
  if (slug && !isIndexDoc) {
    frontMatter.push(`slug: ${slug}`);
  }

  frontMatter.push(`sidebar_position: ${position}`);
  frontMatter.push('---');
  frontMatter.push('');

  return frontMatter.join('\n');
}

// 保存 Markdown 文件
function saveMarkdown(outputPath, content) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, content, 'utf-8');
}

// 遍历文档树并获取需要更新的文档
async function traverseDocTree(token, spaceId, nodeToken, depth = 0, parentPath = '') {
  const indent = '  '.repeat(depth);
  console.log(`${indent}📁 遍历节点: ${nodeToken}`);

  const nodes = await getWikiNodes(token, spaceId, nodeToken);
  const docsToUpdate = [];

  // 遍历节点，记录在当前层级中的位置（用于 sidebar_position）
  for (let index = 0; index < (nodes.items || []).length; index++) {
    const node = nodes.items[index];

    // 使用节点数据中的 obj_edit_time
    const updateTime = node.obj_edit_time;
    const needsUpdate = shouldUpdate(updateTime, CONFIG.incrementalDays);
    const updateDate = updateTime
      ? new Date(parseInt(updateTime) * 1000).toLocaleString('zh-CN')
      : '未知';

    console.log(`${indent}  📄 ${node.title}`);
    console.log(`${indent}     更新时间: ${updateDate}`);
    console.log(`${indent}     ${needsUpdate ? '✅ 需要同步' : '⏭️  跳过'}`);

    if (needsUpdate) {
      docsToUpdate.push({
        title: node.title,
        updateTime: updateTime,
        nodeToken: node.node_token,
        objToken: node.obj_token,
        objType: node.obj_type,
        hasChild: node.has_child,
        depth: depth,
        parentPath: parentPath,
        position: index + 1  // 在当前层级中的位置（从1开始）
      });
    }

    // 如果有子节点，递归遍历
    if (node.has_child) {
      const childPath = path.join(parentPath, node.node_token);
      const childDocs = await traverseDocTree(token, spaceId, node.node_token, depth + 1, childPath);
      docsToUpdate.push(...childDocs);
    }

    // API 限流
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return docsToUpdate;
}

// 下载文档并返回 slug 和内容
async function downloadAndConvertDoc(token, doc) {
  try {
    console.log(`   📥 下载: ${doc.title}`);

    // 使用官方 API 直接获取 Markdown 内容
    let markdown = await getMarkdownContent(token, doc.objToken);

    if (!markdown || markdown.trim().length === 0) {
      console.log(`   ⚠️  文档为空，跳过: ${doc.title}`);
      return null;
    }

    console.log(`   ✅ 获取成功: ${doc.title}`);

    // 清理可能导致 MDX 编译错误的 HTML
    markdown = cleanMarkdown(markdown);

    // 解析并移除 slug
    const { slug, markdown: cleanedMarkdown } = parseAndRemoveSlug(markdown);

    // 生成前置元数据（如果有子节点，这将是 index.md）
    const isIndexDoc = doc.hasChild;
    const frontMatter = generateFrontMatter(doc, slug, isIndexDoc, doc.position);
    const fullContent = frontMatter + '\n' + cleanedMarkdown;

    // API 限流
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      slug: slug,
      content: fullContent,
      nodeToken: doc.nodeToken,
      hasChild: doc.hasChild,
      parentPath: doc.parentPath,
      title: doc.title,
      position: doc.position
    };

  } catch (error) {
    console.error(`   ❌ 处理失败: ${doc.title} - ${error.message}\n`);
    return null;
  }
}

// 保存文档到文件系统
function saveDoc(outputDir, docData, slugMap) {
  // 替换 parentPath 中的 nodeToken 为 slug
  let adjustedParentPath = docData.parentPath;
  if (adjustedParentPath) {
    const pathParts = adjustedParentPath.split(path.sep);
    const mappedParts = pathParts.map(part => slugMap[part] || part);
    adjustedParentPath = mappedParts.join(path.sep);
  }

  // 优先使用 slug 作为目录名/文件名
  const dirName = docData.slug || docData.nodeToken;

  let outputPath;
  let targetDir; // 目标目录，用于清理旧文件

  if (docData.hasChild) {
    // 如果文档有子节点，保存为 index.md 在目录下
    outputPath = adjustedParentPath
      ? path.join(outputDir, adjustedParentPath, dirName, 'index.md')
      : path.join(outputDir, dirName, 'index.md');
    targetDir = path.dirname(outputPath); // 文档目录本身
  } else {
    // 独立文档
    const fileName = `${dirName}.md`;
    outputPath = adjustedParentPath
      ? path.join(outputDir, adjustedParentPath, fileName)
      : path.join(outputDir, fileName);
    targetDir = path.dirname(outputPath); // 父目录
  }

  // 清理同目录下可能存在的旧文件（slug 相同但路径不同）
  if (docData.slug && fs.existsSync(targetDir)) {
    try {
      const files = fs.readdirSync(targetDir);
      for (const file of files) {
        const filePath = path.join(targetDir, file);
        const stat = fs.statSync(filePath);

        // 跳过目录和当前要写入的文件
        if (stat.isDirectory() || filePath === outputPath) {
          continue;
        }

        // 读取文件的 frontmatter 检查 slug
        if (file.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const slugMatch = content.match(/^---\n[\s\S]*?slug:\s*["']?([^\n"']+)["']?\n[\s\S]*?---/m);

          if (slugMatch && slugMatch[1] === docData.slug) {
            console.log(`   🗑️  删除旧文件: ${filePath}`);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      // 忽略清理错误，继续保存
      console.warn(`   ⚠️  清理旧文件时出错: ${error.message}`);
    }
  }

  console.log(`   💾 保存: ${outputPath}`);
  saveMarkdown(outputPath, docData.content);
  console.log(`   ✅ 完成: ${docData.title}\n`);
}

// ============================================
// 主函数
// ============================================

async function main() {
  try {
    const token = await getTenantAccessToken();

    // 1. 遍历文档树，找出需要更新的文档
    if (CONFIG.incrementalDays === 0) {
      console.log(`📚 扫描文档树（全量同步模式）\n`);
    } else {
      console.log(`📚 扫描文档树（增量模式：只同步 ${CONFIG.incrementalDays} 天内更新的文档）\n`);
    }
    const docsToUpdate = await traverseDocTree(token, CONFIG.spaceId, CONFIG.docsNodeId);

    console.log(`\n📊 扫描结果:`);
    console.log(`   找到 ${docsToUpdate.length} 个需要更新的文档\n`);

    // 2. 下载并转换文档（第一阶段：下载并解析）
    if (docsToUpdate.length > 0) {
      console.log('📥 开始下载并转换文档...\n');

      const docDataList = [];
      const slugMap = {}; // nodeToken -> slug 映射

      // 第一阶段：下载所有文档并构建 slug 映射
      for (const doc of docsToUpdate) {
        const docData = await downloadAndConvertDoc(token, doc);
        if (docData) {
          docDataList.push(docData);
          // 构建映射：只有当文档有 slug 时才添加映射
          if (docData.slug) {
            slugMap[docData.nodeToken] = docData.slug;
          }
        }
      }

      // 第二阶段：使用 slug 映射保存所有文档
      console.log('\n💾 保存文档到文件系统...\n');
      const docsDir = path.resolve(__dirname, '../docs');

      for (const docData of docDataList) {
        saveDoc(docsDir, docData, slugMap);
      }

      console.log('✅ 文档同步完成\n');
    } else {
      console.log('✨ 没有需要更新的文档\n');
    }

    // 3. 处理"关于我"页面
    console.log('📄 处理"关于我"页面...\n');

    try {
      // 使用官方 API 直接获取 Markdown 内容
      let aboutMarkdown = await getMarkdownContent(token, CONFIG.aboutDocId);

      if (aboutMarkdown) {
        // 清理 Markdown
        aboutMarkdown = cleanMarkdown(aboutMarkdown);

        // 解析并移除 slug
        const { slug: aboutSlug, markdown: cleanedAboutMarkdown } = parseAndRemoveSlug(aboutMarkdown);

        const aboutNode = {
          title: '关于我',
          nodeToken: CONFIG.aboutDocId,
        };
        // 关于我页面不需要 position（不在侧边栏中）
        const aboutFrontMatter = generateFrontMatter(aboutNode, aboutSlug, false, 0);
        const aboutContent = aboutFrontMatter + '\n' + cleanedAboutMarkdown;

        const aboutPath = path.resolve(__dirname, '../src/pages/about.md');
        saveMarkdown(aboutPath, aboutContent);

        console.log('✅ "关于我"页面处理完成\n');
      }
    } catch (error) {
      console.error(`❌ "关于我"页面处理失败: ${error.message}\n`);
    }

    console.log('=' .repeat(50));
    console.log('✨ 同步流程完成！\n');

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
