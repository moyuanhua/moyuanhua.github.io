#!/usr/bin/env node

/**
 * 测试 feishu-docx 转换 - 诊断转换问题
 */

const path = require('path');
const https = require('https');
const { MarkdownRenderer } = require('feishu-docx');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  aboutDocId: process.env.FEISHU_ABOUT_DOC_ID || 'DKvmwNWVOiYA6KklWcsc1gHInKg',
};

console.log('🧪 测试 Markdown 转换\n');

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

  return result.tenant_access_token;
}

// 获取文档所有块(Block)
async function getDocBlocks(token, documentId) {
  const options = {
    hostname: 'open.feishu.cn',
    path: `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const result = await httpsRequest(options);

  if (result.code !== 0) {
    throw new Error(`获取文档块失败 ${result.code}: ${result.msg}`);
  }

  return result.data.items || [];
}

// 使用 feishu-docx 转换为 Markdown
function convertToMarkdown(blocks, documentId) {
  try {
    const docxData = {
      document: {
        document_id: documentId,
        revision_id: 1,
        title: '',
      },
      blocks: blocks
    };

    const renderer = new MarkdownRenderer(docxData);
    const markdown = renderer.parse();

    return markdown;
  } catch (error) {
    console.error(`转换失败: ${error.message}`);
    console.error(error.stack);
    return null;
  }
}

async function main() {
  try {
    const token = await getTenantAccessToken();
    const blocks = await getDocBlocks(token, CONFIG.aboutDocId);

    console.log(`✅ 获取到 ${blocks.length} 个块\n`);
    console.log('=' .repeat(60));
    console.log('🔄 使用 feishu-docx 转换...\n');

    const markdown = convertToMarkdown(blocks, CONFIG.aboutDocId);

    if (markdown) {
      console.log('=' .repeat(60));
      console.log('📝 转换结果:\n');
      console.log(markdown);
      console.log('\n' + '='.repeat(60));
      console.log(`\n字符数: ${markdown.length}`);
      console.log(`行数: ${markdown.split('\n').length}`);
    } else {
      console.log('❌ 转换失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
