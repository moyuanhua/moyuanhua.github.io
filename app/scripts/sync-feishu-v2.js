#!/usr/bin/env node

/**
 * 飞书内容同步脚本 V2 - 优化版
 *
 * 功能：
 * 1. 从飞书同步文档树（支持增量更新，只同步3天内更新的文档）
 * 2. 同步"关于我"页面（单独文档）
 * 3. API 限流和重试机制
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
// 使用 override 选项强制覆盖系统环境变量
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

console.log('🚀 飞书内容同步 V2 - 增量更新版\n');

// ============================================
// 配置
// ============================================

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  wikiId: process.env.FEISHU_WIKI_ID,
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

// 获取文档元数据（包含更新时间）
async function getDocMeta(token, docId) {
  const options = {
    hostname: 'open.feishu.cn',
    path: `/open-apis/docx/v1/documents/${docId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  try {
    const result = await httpsRequest(options);

    if (result.code !== 0) {
      console.log(`   ⚠️  无法获取文档元数据: ${docId} (${result.code}: ${result.msg})`);
      return null;
    }

    return {
      title: result.data.document.title,
      updateTime: result.data.document.update_time,
      docId: docId
    };
  } catch (error) {
    console.log(`   ⚠️  无法获取文档元数据: ${docId} (${error.message})`);
    return null;
  }
}

// 检查文档是否需要更新（3天内更新过）
function shouldUpdate(updateTime, days = 3) {
  if (!updateTime) return true; // 如果没有更新时间，默认需要更新

  // 飞书返回的是秒级时间戳
  const docDate = new Date(parseInt(updateTime) * 1000);
  const now = new Date();
  const diffDays = (now - docDate) / (1000 * 60 * 60 * 24);

  return diffDays <= days;
}

// 遍历文档树并获取需要更新的文档
async function traverseDocTree(token, spaceId, nodeToken, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}📁 遍历节点: ${nodeToken}`);

  const nodes = await getWikiNodes(token, spaceId, nodeToken);
  const docsToUpdate = [];

  for (const node of nodes.items || []) {
    const meta = await getDocMeta(token, node.obj_token);

    if (meta) {
      const needsUpdate = shouldUpdate(meta.updateTime, CONFIG.incrementalDays);
      const updateDate = meta.updateTime
        ? new Date(parseInt(meta.updateTime) * 1000).toLocaleString('zh-CN')
        : '未知';

      console.log(`${indent}  📄 ${meta.title}`);
      console.log(`${indent}     更新时间: ${updateDate}`);
      console.log(`${indent}     ${needsUpdate ? '✅ 需要同步' : '⏭️  跳过'}`);

      if (needsUpdate) {
        docsToUpdate.push({
          ...meta,
          nodeToken: node.node_token,
          objToken: node.obj_token
        });
      }
    }

    // 如果有子节点，递归遍历
    if (node.has_child) {
      const childDocs = await traverseDocTree(token, spaceId, node.node_token, depth + 1);
      docsToUpdate.push(...childDocs);
    }

    // API 限流
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return docsToUpdate;
}

// ============================================
// 主函数
// ============================================

async function main() {
  try {
    const token = await getTenantAccessToken();

    // 1. 遍历文档树，找出需要更新的文档
    console.log(`📚 扫描文档树（只同步 ${CONFIG.incrementalDays} 天内更新的文档）\n`);
    const docsToUpdate = await traverseDocTree(token, CONFIG.wikiId, CONFIG.docsNodeId);

    console.log(`\n📊 扫描结果:`);
    console.log(`   找到 ${docsToUpdate.length} 个需要更新的文档\n`);

    if (docsToUpdate.length > 0) {
      console.log('📥 开始同步文档...\n');

      // 同步整个文档树（feishu-pages 会处理具体的同步逻辑）
      // 注意：feishu-pages 会忽略 --out-dir 参数，始终输出到 dist/docs
      const command = `npx feishu-pages@latest --space-id ${CONFIG.wikiId} --node-token ${CONFIG.docsNodeId}`;

      console.log(`   执行命令: ${command}`);
      console.log(`   WIKI_ID: ${CONFIG.wikiId}`);
      console.log(`   NODE_ID: ${CONFIG.docsNodeId}\n`);

      try {
        // 创建一个干净的环境变量,只包含必要的值
        const cleanEnv = {
          ...process.env,
          FEISHU_APP_ID: CONFIG.appId,
          FEISHU_APP_SECRET: CONFIG.appSecret,
          FEISHU_SPACE_ID: CONFIG.wikiId,
          FEISHU_WIKI_ID: CONFIG.wikiId,
        };
        // 删除可能冲突的旧环境变量
        delete cleanEnv.FEISHU_ZH_NODE_ID;
        delete cleanEnv.FEISHU_EN_NODE_ID;
        delete cleanEnv.FEISHU_ABOUT_DOC_ID;
        delete cleanEnv.FEISHU_DOCS_NODE_ID;

        execSync(command, {
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '..'),
          env: cleanEnv
        });

        // 将文件从 dist/docs 移动到 docs
        const distDocsDir = path.resolve(__dirname, '../dist/docs');
        const targetDocsDir = path.resolve(__dirname, '../docs');

        console.log('   📦 移动文档到目标目录...');

        // 确保目标目录存在
        if (!fs.existsSync(targetDocsDir)) {
          fs.mkdirSync(targetDocsDir, { recursive: true });
        }

        // 递归复制函数
        function copyRecursive(src, dest) {
          if (fs.statSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true });
            }
            const files = fs.readdirSync(src);
            for (const file of files) {
              copyRecursive(path.join(src, file), path.join(dest, file));
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        }

        // 复制文件
        if (fs.existsSync(distDocsDir)) {
          copyRecursive(distDocsDir, targetDocsDir);
        }

        console.log('✅ 文档同步完成\n');
      } catch (error) {
        console.error('❌ 文档同步失败:', error.message);
        throw error;
      }
    } else {
      console.log('✨ 没有需要更新的文档\n');
    }

    // 2. 同步"关于我"页面
    console.log('📄 同步"关于我"页面...\n');

    const aboutMeta = await getDocMeta(token, CONFIG.aboutDocId);
    if (aboutMeta) {
      const needsUpdate = shouldUpdate(aboutMeta.updateTime, CONFIG.incrementalDays);
      const updateDate = aboutMeta.updateTime
        ? new Date(parseInt(aboutMeta.updateTime) * 1000).toLocaleString('zh-CN')
        : '未知';

      console.log(`   标题: ${aboutMeta.title}`);
      console.log(`   更新时间: ${updateDate}`);
      console.log(`   ${needsUpdate ? '✅ 需要同步' : '⏭️  跳过'}\n`);

      if (needsUpdate) {
        // feishu-pages 会忽略 --out 参数，始终输出到 dist/docs
        const aboutCommand = `npx feishu-pages@latest --space-id ${CONFIG.wikiId}`;

        console.log(`   执行命令: ${aboutCommand}`);
        console.log(`   DOC_ID: ${CONFIG.aboutDocId}\n`);

        try {
          // 创建一个干净的环境变量,只包含必要的值
          const cleanEnv = {
            ...process.env,
            FEISHU_APP_ID: CONFIG.appId,
            FEISHU_APP_SECRET: CONFIG.appSecret,
            FEISHU_SPACE_ID: CONFIG.wikiId,
            FEISHU_WIKI_ID: CONFIG.wikiId,
          };
          // 删除可能冲突的旧环境变量
          delete cleanEnv.FEISHU_ZH_NODE_ID;
          delete cleanEnv.FEISHU_EN_NODE_ID;
          delete cleanEnv.FEISHU_ABOUT_DOC_ID;
          delete cleanEnv.FEISHU_DOCS_NODE_ID;

          execSync(aboutCommand, {
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '..'),
            env: cleanEnv
          });

          // 从 dist/docs 复制"关于我"文档到 src/pages/about.md
          const aboutSourceFile = path.resolve(__dirname, `../dist/docs/${CONFIG.aboutDocId}.md`);
          const aboutTargetFile = path.resolve(__dirname, '../src/pages/about.md');

          if (fs.existsSync(aboutSourceFile)) {
            console.log('   📦 移动"关于我"文档到目标位置...');
            fs.copyFileSync(aboutSourceFile, aboutTargetFile);
          }

          console.log('✅ "关于我"页面同步完成\n');
        } catch (error) {
          console.error('❌ "关于我"页面同步失败:', error.message);
          throw error;
        }
      }
    }

    console.log('=' .repeat(50));
    console.log('✨ 同步流程完成！\n');

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

main();
