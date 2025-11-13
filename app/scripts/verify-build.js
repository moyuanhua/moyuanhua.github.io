#!/usr/bin/env node

/**
 * 构建验证脚本 - 检查构建输出是否符合预期
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证构建输出...\n');

const BUILD_DIR = path.resolve(__dirname, '../build');
const REQUIRED_FILES = [
  'index.html',
  'docs/intro/index.html',
  'blog/index.html',
  'about/index.html',
];

const REQUIRED_DIRS = [
  'assets',
  'docs',
  'blog',
  'en',
];

let hasErrors = false;

// 检查构建目录是否存在
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ 构建目录不存在: build/');
  process.exit(1);
}

console.log('✅ 构建目录存在\n');

// 检查必需文件
console.log('📄 检查必需文件:');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (缺失)`);
    hasErrors = true;
  }
});

// 检查必需目录
console.log('\n📁 检查必需目录:');
REQUIRED_DIRS.forEach(dir => {
  const dirPath = path.join(BUILD_DIR, dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`   ✅ ${dir}/`);
  } else {
    console.log(`   ❌ ${dir}/ (缺失)`);
    hasErrors = true;
  }
});

// 检查英文版本
console.log('\n🌐 检查英文版本:');
const EN_REQUIRED = [
  'en/index.html',
  'en/docs/intro/index.html',
  'en/blog/index.html',
  'en/about/index.html',
];

EN_REQUIRED.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (缺失)`);
    hasErrors = true;
  }
});

// 检查构建大小
console.log('\n📊 构建统计:');
function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  });

  return size;
}

const totalSize = getDirectorySize(BUILD_DIR);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`   总大小: ${sizeMB} MB`);

// 输出结果
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 验证失败 - 发现缺失文件或目录\n');
  process.exit(1);
} else {
  console.log('✅ 验证成功 - 构建输出完整\n');
  console.log('现在可以部署到 Cloudflare Pages!\n');
  process.exit(0);
}
