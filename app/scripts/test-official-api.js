#!/usr/bin/env node

/**
 * 测试飞书官方 Markdown 导出 API
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

console.log('🧪 测试飞书官方 Markdown 导出 API\n');

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

// 使用官方 API 获取 Markdown 内容
async function getMarkdownContent(token, docToken) {
  console.log('📥 获取 Markdown 内容（官方API）...');

  const options = {
    hostname: 'open.feishu.cn',
    path: `/open-apis/docs/v1/content?doc_token=${docToken}&doc_type=docx&content_type=markdown&lang=zh`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const result = await httpsRequest(options);

  if (result.code !== 0) {
    throw new Error(`获取内容失败 ${result.code}: ${result.msg}`);
  }

  console.log('   ✅ 获取成功\n');
  return result.data.content;
}

async function main() {
  try {
    const token = await getTenantAccessToken();
    const markdown = await getMarkdownContent(token, CONFIG.aboutDocId);

    console.log('=' .repeat(60));
    console.log('📝 官方API返回的 Markdown:\n');
    console.log(markdown);
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ 成功！`);
    console.log(`   字符数: ${markdown.length}`);
    console.log(`   行数: ${markdown.split('\n').length}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
