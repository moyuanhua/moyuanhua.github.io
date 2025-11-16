#!/usr/bin/env node

/**
 * 调试"关于我"文档 - 查看原始 Block 数据
 */

const path = require('path');
const https = require('https');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  aboutDocId: process.env.FEISHU_ABOUT_DOC_ID || 'DKvmwNWVOiYA6KklWcsc1gHInKg',
};

console.log('🔍 调试"关于我"文档\n');
console.log(`文档 ID: ${CONFIG.aboutDocId}\n`);

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

// 获取文档所有块(Block)
async function getDocBlocks(token, documentId) {
  console.log('📥 获取文档块...');

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

    if (pageToken) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } while (pageToken);

  console.log(`   ✅ 获取到 ${allBlocks.length} 个块\n`);
  return allBlocks;
}

async function main() {
  try {
    const token = await getTenantAccessToken();
    const blocks = await getDocBlocks(token, CONFIG.aboutDocId);

    console.log('=' .repeat(60));
    console.log('📄 文档块详细信息:\n');

    blocks.forEach((block, index) => {
      console.log(`\n[Block ${index + 1}] ID: ${block.block_id}`);
      console.log(`类型: ${block.block_type}`);
      console.log(`父块: ${block.parent_id}`);
      console.log(`子块数: ${block.children?.length || 0}`);

      // 显示块的所有内容
      console.log('完整块数据:', JSON.stringify(block, null, 2));
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ 总共 ${blocks.length} 个块`);

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
