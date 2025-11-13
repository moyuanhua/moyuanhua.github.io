#!/usr/bin/env node

/**
 * 测试飞书 API 连接
 */

const https = require('https');
require('dotenv').config();

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const WIKI_ID = process.env.FEISHU_WIKI_ID;

console.log('🔍 测试飞书 API 连接...\n');

// 获取 tenant_access_token
function getTenantAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            console.log('✅ 成功获取 tenant_access_token');
            console.log(`   Token: ${result.tenant_access_token.substring(0, 20)}...\n`);
            resolve(result.tenant_access_token);
          } else {
            console.error('❌ 获取 token 失败:', result.msg);
            reject(new Error(result.msg));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 测试获取知识库节点列表
async function testWikiNodes(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: `/open-apis/wiki/v2/spaces/${WIKI_ID}/nodes?page_size=10`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`🔍 测试获取知识库节点...`);
    console.log(`   Wiki ID: ${WIKI_ID}\n`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('📊 API 响应:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.code === 0) {
            console.log('\n✅ 成功获取知识库节点!');
            if (result.data && result.data.items) {
              console.log(`   找到 ${result.data.items.length} 个节点\n`);
            }
            resolve(result);
          } else {
            console.error('\n❌ 获取节点失败');
            console.error(`   错误码: ${result.code}`);
            console.error(`   错误信息: ${result.msg}\n`);
            reject(new Error(result.msg));
          }
        } catch (e) {
          console.error('❌ 解析响应失败:', e.message);
          console.error('   原始响应:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ 请求失败:', e.message);
      reject(e);
    });
    req.end();
  });
}

// 主函数
async function main() {
  try {
    const token = await getTenantAccessToken();
    await testWikiNodes(token);
    
    console.log('\n✨ 测试完成!');
    console.log('\n💡 提示:');
    console.log('   如果看到错误,可能是:');
    console.log('   1. 应用权限不足 - 需要在飞书开放平台配置知识库权限');
    console.log('   2. WIKI_ID 不正确 - 请检查知识库 ID');
    console.log('   3. 应用未启用 - 检查应用状态\n');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();
