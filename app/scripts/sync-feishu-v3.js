#!/usr/bin/env node

/**
 * 飞书内容同步脚本 V3 - 真正的增量更新版
 *
 * 功能：
 * 1. 扫描飞书知识库文档树
 * 2. 判断哪些文档需要更新(基于更新时间)
 * 3. 只下载需要更新的文档
 * 4. 使用 feishu-docx 转换为 Markdown
 * 5. 保存到本地
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const { MarkdownRenderer } = require('feishu-docx');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

console.log('🚀 飞书内容同步 V3 - 真正的增量更新版\n');

// ============================================
// 配置
// ============================================

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  spaceId: process.env.FEISHU_SPACE_ID,
  docsNodeId: process.env.FEISHU_DOCS_NODE_ID || 'L0qTw3NQFimJGIkWfGNckkEQnwJ',
  aboutDocId: process.env.FEISHU_ABOUT_DOC_ID || 'DKvmwNWVOiYA6KklWcsc1gHInKg',
  incrementalDays: parseInt(process.env.FEISHU_INCREMENTAL_DAYS || '3'),
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

// 获取文档所有块(Block)
async function getDocBlocks(token, documentId) {
  const options = {
    hostname: 'open.feishu.cn',
    path: `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const allBlocks = [];
  let pageToken = null;

  do {
    const requestPath = pageToken
      ? `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500&page_token=${pageToken}`
      : `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`;

    const options = {
      hostname: 'open.feishu.cn',
      path: requestPath,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };

    const result = await httpsRequest(options);

    if (result.code !== 0) {
      throw new Error(`获取文档块失败 ${result.code}: ${result.msg}`);
    }

    allBlocks.push(...(result.data.items || []));
    pageToken = result.data.has_more ? result.data.page_token : null;

    // API 限流
    if (pageToken) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } while (pageToken);

  return allBlocks;
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

// 从 markdown 内容中解析并移除 slug
function parseAndRemoveSlug(markdown) {
  // 匹配代码块中的 slug: xxx
  const slugMatch = markdown.match(/```(?:text)?\s*slug:\s*(\S+)\s*```/);

  if (slugMatch) {
    const slug = slugMatch[1];
    // 从 markdown 中移除这个代码块
    const cleanedMarkdown = markdown.replace(/```(?:text)?\s*slug:\s*\S+\s*```\s*/g, '').trim();
    return { slug, markdown: cleanedMarkdown };
  }

  return { slug: null, markdown };
}

// 使用 feishu-docx 转换为 Markdown
function convertToMarkdown(blocks, documentId) {
  try {
    // feishu-docx 需要的数据格式
    const docxData = {
      document: {
        document_id: documentId,
        revision_id: 1,
        title: '',
      },
      blocks: blocks
    };

    // 创建 MarkdownRenderer 实例并渲染
    const renderer = new MarkdownRenderer(docxData);
    const markdown = renderer.parse();

    return markdown;
  } catch (error) {
    console.error(`   ⚠️  转换 Markdown 失败: ${error.message}`);
    return null;
  }
}

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

    // 获取文档块数据
    const blocks = await getDocBlocks(token, doc.objToken);

    if (!blocks || blocks.length === 0) {
      console.log(`   ⚠️  文档为空，跳过: ${doc.title}`);
      return null;
    }

    // 转换为 Markdown
    console.log(`   🔄 转换: ${doc.title}`);
    let markdown = convertToMarkdown(blocks, doc.objToken);

    if (!markdown) {
      console.log(`   ⚠️  转换失败，跳过: ${doc.title}`);
      return null;
    }

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
  if (docData.hasChild) {
    // 如果文档有子节点，保存为 index.md 在目录下
    outputPath = adjustedParentPath
      ? path.join(outputDir, adjustedParentPath, dirName, 'index.md')
      : path.join(outputDir, dirName, 'index.md');
  } else {
    // 独立文档
    const fileName = `${dirName}.md`;
    outputPath = adjustedParentPath
      ? path.join(outputDir, adjustedParentPath, fileName)
      : path.join(outputDir, fileName);
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
    console.log(`📚 扫描文档树（只同步 ${CONFIG.incrementalDays} 天内更新的文档）\n`);
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
      const aboutBlocks = await getDocBlocks(token, CONFIG.aboutDocId);
      let aboutMarkdown = convertToMarkdown(aboutBlocks, CONFIG.aboutDocId);

      if (aboutMarkdown) {
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
