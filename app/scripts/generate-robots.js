#!/usr/bin/env node

/**
 * 动态生成 robots.txt 文件
 * 根据 SITE_URL 环境变量生成正确的 Sitemap URL
 */

const fs = require('fs');
const path = require('path');

// 获取站点 URL,默认使用 GitHub Pages
const siteUrl = process.env.SITE_URL || 'https://moyuanhua.github.io';

// 生成 robots.txt 内容
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
# 允许所有搜索引擎爬取所有内容
User-agent: *
Allow: /

# Sitemap 位置
Sitemap: ${siteUrl}/sitemap.xml

# Google 搜索引擎
User-agent: Googlebot
Allow: /

# 百度搜索引擎
User-agent: Baiduspider
Allow: /
`;

// 写入到 static 目录
const staticDir = path.join(__dirname, '../static');
const robotsPath = path.join(staticDir, 'robots.txt');

// 确保 static 目录存在
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// 写入文件
fs.writeFileSync(robotsPath, robotsTxt, 'utf8');

console.log(`✅ robots.txt 已生成`);
console.log(`   站点 URL: ${siteUrl}`);
console.log(`   Sitemap: ${siteUrl}/sitemap.xml`);
console.log(`   文件位置: ${robotsPath}`);
