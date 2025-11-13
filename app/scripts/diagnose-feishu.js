#!/usr/bin/env node

/**
 * 飞书配置诊断脚本
 */

const https = require('https');
require('dotenv').config();

console.log('🔍 飞书配置诊断工具\n');
console.log('=' .repeat(50));

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const WIKI_ID = process.env.FEISHU_WIKI_ID;

// 检查环境变量
console.log('\n1️⃣ 检查环境变量:');
console.log(`   FEISHU_APP_ID: ${APP_ID ? '✅ ' + APP_ID : '❌ 未设置'}`);
console.log(`   FEISHU_APP_SECRET: ${APP_SECRET ? '✅ ' + APP_SECRET.substring(0, 10) + '...' : '❌ 未设置'}`);
console.log(`   FEISHU_WIKI_ID: ${WIKI_ID ? '✅ ' + WIKI_ID : '❌ 未设置'}`);

// 获取 token
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

    console.log('\n2️⃣ 测试应用凭证:');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) {
          console.log('   ✅ 应用凭证有效');
          console.log(`   Token: ${result.tenant_access_token.substring(0, 20)}...`);
          resolve(result.tenant_access_token);
        } else {
          console.log('   ❌ 应用凭证无效');
          console.log(`   错误: ${result.msg}`);
          reject(new Error(result.msg));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 测试知识库访问
function testWikiAccess(token) {
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

    console.log('\n3️⃣ 测试知识库访问权限:');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        
        if (result.code === 0) {
          console.log('   ✅ 成功访问知识库!');
          console.log(`   找到 ${result.data.items?.length || 0} 个节点`);
          resolve(result);
        } else if (result.code === 131006) {
          console.log('   ❌ 权限不足 (错误码: 131006)');
          console.log('\n   可能原因:');
          console.log('   1. 应用权限未配置或未发布');
          console.log('   2. 机器人未添加到知识库');
          console.log('   3. 知识库 ID 不正确');
          reject(new Error('Permission denied'));
        } else {
          console.log(`   ❌ 访问失败 (错误码: ${result.code})`);
          console.log(`   错误: ${result.msg}`);
          reject(new Error(result.msg));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// 主函数
async function main() {
  try {
    const token = await getTenantAccessToken();
    await testWikiAccess(token);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 诊断完成 - 配置正确!\n');
    console.log('现在可以运行: npm run sync\n');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ 诊断失败\n');
    console.log('📋 下一步操作:\n');
    console.log('1. 访问飞书开放平台: https://open.feishu.cn/app');
    console.log(`2. 选择应用: ${APP_ID}`);
    console.log('3. 进入"权限管理" → 添加权限:');
    console.log('   - docx:document:readonly');
    console.log('   - wiki:wiki:readonly');
    console.log('   - drive:drive:readonly');
    console.log('4. 点击"发布版本" (重要!)');
    console.log('5. 在飞书中创建群,添加机器人');
    console.log('6. 将群添加为知识库协作者\n');
    console.log('详细步骤: 查看 FEISHU_SETUP.md\n');
    process.exit(1);
  }
}

main();
