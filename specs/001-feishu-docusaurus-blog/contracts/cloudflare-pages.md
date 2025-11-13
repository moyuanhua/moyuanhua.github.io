# Contract: Cloudflare Pages 部署配置

**Purpose**: 使用Cloudflare Pages部署静态博客,手动触发构建

---

## 架构概览

```
GitHub仓库 (murphy-blog)
  ↓ (Cloudflare Pages监听)
Cloudflare Pages构建环境
  ├── 1. 拉取代码
  ├── 2. 安装依赖
  ├── 3. 运行同步脚本 (feishu-pages)
  ├── 4. 构建Docusaurus
  └── 5. 部署到全球CDN
  ↓
https://murphy-blog.pages.dev (或自定义域名)
```

---

## Cloudflare Pages项目配置

### 初始设置

**1. 登录Cloudflare Dashboard**
- 访问: https://dash.cloudflare.com/
- 进入 `Workers & Pages` → `Create application` → `Pages` → `Connect to Git`

**2. 连接GitHub仓库**
- 选择仓库: `murphy-blog`
- 分支: `main`

**3. 构建配置**

| 配置项 | 值 |
|--------|-----|
| **Production branch** | `main` |
| **Build command** | `npm run build:cf` |
| **Build output directory** | `app/build` |
| **Root directory** | `/` |
| **Node.js version** | `20` |

### 环境变量配置

在Cloudflare Pages项目设置中添加以下环境变量:

```
FEISHU_APP_ID=cli_xxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx
FEISHU_SPACE_ID=xxxxxxxxxxxxxx
```

**配置路径**:
`Pages项目` → `Settings` → `Environment variables` → `Add variable`

**注意事项**:
- Production和Preview环境可以使用相同的变量
- 也可以为Preview环境配置测试用的飞书空间

---

## 构建脚本配置

### package.json更新

在 `app/package.json` 中添加Cloudflare Pages专用构建脚本:

```json
{
  "scripts": {
    "docusaurus": "docusaurus",
    "start": "docusaurus start",
    "build": "docusaurus build",
    "build:cf": "node ../scripts/sync-feishu.js && docusaurus build",
    "serve": "docusaurus serve",
    "clear": "docusaurus clear",
    "typecheck": "tsc"
  }
}
```

**说明**:
- `build:cf`: Cloudflare Pages使用的构建命令
- 先运行 `sync-feishu.js` 同步飞书内容
- 再运行 `docusaurus build` 构建站点

---

## 同步脚本配置

### scripts/sync-feishu.js

创建 `scripts/sync-feishu.js` 文件:

```javascript
#!/usr/bin/env node

/**
 * Feishu Content Sync Script for Cloudflare Pages
 * 在构建时从飞书知识库同步内容到app/docs目录
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 环境变量验证
const requiredEnvVars = [
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'FEISHU_SPACE_ID'
];

console.log('🔍 验证环境变量...');
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('请在Cloudflare Pages项目设置中配置环境变量');
  process.exit(1);
}

console.log('✅ 环境变量验证通过');

// 配置
const config = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  spaceId: process.env.FEISHU_SPACE_ID,
  outputDir: path.join(__dirname, '../app/docs'),
  tempDir: path.join(__dirname, '../.feishu-temp')
};

// 清理并创建临时目录
if (fs.existsSync(config.tempDir)) {
  fs.rmSync(config.tempDir, { recursive: true });
}
fs.mkdirSync(config.tempDir, { recursive: true });

console.log('📥 开始同步飞书内容...');
console.log(`   知识库ID: ${config.spaceId}`);
console.log(`   输出目录: ${config.outputDir}`);

try {
  // 运行feishu-pages CLI
  const command = `npx feishu-pages \
    --appId ${config.appId} \
    --appSecret ${config.appSecret} \
    --spaceId ${config.spaceId} \
    --outDir ${config.outputDir}`;

  console.log('\n⏳ 执行同步命令...');
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n✅ 飞书内容同步完成!');

  // 验证输出
  if (!fs.existsSync(config.outputDir)) {
    throw new Error('同步完成但输出目录不存在');
  }

  const files = fs.readdirSync(config.outputDir);
  console.log(`📁 同步了 ${files.length} 个文件/目录`);

} catch (error) {
  console.error('\n❌ 同步失败:', error.message);
  console.error('\n可能的原因:');
  console.error('  1. 飞书API凭证错误');
  console.error('  2. 知识库ID不正确');
  console.error('  3. 应用权限不足');
  console.error('  4. 网络连接问题');
  process.exit(1);
}

// 清理临时文件
if (fs.existsSync(config.tempDir)) {
  fs.rmSync(config.tempDir, { recursive: true });
}

console.log('\n🎉 构建准备完成,开始Docusaurus构建...\n');
```

**文件权限**:
```bash
chmod +x scripts/sync-feishu.js
```

---

## 触发构建的方式

### 方式1: Cloudflare Dashboard手动触发(推荐)

1. 访问Cloudflare Pages项目页面
2. 点击 `View build` 或 `Create deployment`
3. 选择分支: `main`
4. 点击 `Save and Deploy`

**优势**: 可视化界面,操作简单,有构建日志

### 方式2: Git Push触发

```bash
# 在本地修改后推送
git add .
git commit -m "Update content or config"
git push origin main
```

**说明**:
- Cloudflare Pages会自动检测到推送
- 适合修改代码或配置后自动部署
- 如果只是飞书内容更新,不需要push(直接用方式1手动触发)

### 方式3: Wrangler CLI触发

安装Wrangler CLI:
```bash
npm install -g wrangler
```

登录Cloudflare:
```bash
wrangler login
```

触发部署:
```bash
wrangler pages deployment create murphy-blog --branch=main
```

**优势**: 命令行操作,可以集成到脚本中

---

## 构建优化配置

### 1. 加速npm安装

创建 `.npmrc` 文件在项目根目录:

```
# 使用Cloudflare的npm镜像(更快)
registry=https://registry.npmjs.org/

# 启用缓存
cache=/opt/buildhome/.npm-cache

# 并行安装
maxsockets=10
```

### 2. 缓存策略

Cloudflare Pages自动缓存:
- ✅ `node_modules/` (依赖缓存)
- ✅ `.docusaurus/` (Docusaurus构建缓存)

**构建时间预期**:
- 首次构建: 4-6分钟
- 后续构建: 2-3分钟(有缓存)

### 3. 构建超时设置

默认超时: 30分钟(足够使用)

如需调整,在Cloudflare Pages项目设置中修改。

---

## 自定义域名配置

### 添加自定义域名

1. 在Cloudflare Pages项目中:
   - `Custom domains` → `Set up a custom domain`
   - 输入域名: `blog.yourdomain.com`

2. Cloudflare自动配置DNS:
   - 如果域名托管在Cloudflare: 自动添加CNAME记录
   - 如果域名在其他地方: 手动添加CNAME记录

**CNAME记录配置**:
```
名称: blog
目标: murphy-blog.pages.dev
```

### SSL/TLS配置

Cloudflare自动提供:
- ✅ 免费SSL证书
- ✅ 自动续期
- ✅ HTTP自动跳转HTTPS

---

## 预览部署(Preview Deployments)

### 功能说明

当推送到非主分支时,Cloudflare Pages自动创建预览部署:

```
feature/new-post分支 → https://abc123.murphy-blog.pages.dev
```

**用途**:
- 在合并到main前预览修改
- 测试新功能或新文章
- 分享给团队成员审核

### 预览环境配置

可以为Preview环境配置不同的环境变量:
- 使用测试飞书知识库
- 或者跳过飞书同步(手动添加测试内容)

---

## 构建日志和调试

### 查看构建日志

1. Cloudflare Pages项目页面
2. `View build` → 选择具体的部署
3. 查看详细日志

**关键日志部分**:
```
1. Install dependencies
   - npm install执行情况
   - 依赖版本冲突

2. Build application
   - sync-feishu.js执行结果
   - Docusaurus构建输出
   - 错误信息

3. Deploy to Cloudflare
   - 上传文件数量
   - 部署成功/失败状态
```

### 常见错误和解决方案

#### 错误1: 环境变量未配置
```
❌ 缺少必需的环境变量: FEISHU_APP_ID
```

**解决**:
- 在Cloudflare Pages项目设置中添加环境变量
- 确保变量名称拼写正确

#### 错误2: 飞书同步失败
```
❌ 同步失败: Request failed with status code 401
```

**解决**:
- 检查App ID和App Secret是否正确
- 确认应用权限是否配置完整
- 检查知识库ID是否正确

#### 错误3: 构建超时
```
❌ Build exceeded maximum time limit
```

**解决**:
- 检查文章数量是否过多
- 优化构建脚本
- 联系Cloudflare支持增加超时时间

#### 错误4: 输出目录错误
```
❌ Could not find build output directory
```

**解决**:
- 检查Build output directory设置为 `app/build`
- 确认Docusaurus构建成功

---

## 回滚部署

### 快速回滚

1. Cloudflare Pages项目页面
2. `Deployments` 标签
3. 找到之前的成功部署
4. 点击 `Rollback to this deployment`

**说明**:
- 回滚是即时的(<1分钟)
- 不会重新构建,直接切换到旧版本

---

## 分析和监控

### Cloudflare Analytics

**访问路径**: `Analytics` → `Web Analytics`

**指标**:
- 页面浏览量
- 唯一访问者
- 访问来源
- 热门页面
- 地理分布

### 集成第三方分析

在 `app/docusaurus.config.ts` 中配置:

```typescript
{
  // Google Analytics
  gtag: {
    trackingID: 'G-XXXXXXXXXX',
  },

  // 或 百度统计
  scripts: [
    {
      src: 'https://hm.baidu.com/hm.js?xxxxx',
      async: true,
    },
  ],
}
```

---

## 成本估算

### Cloudflare Pages免费额度

| 项目 | 免费额度 | 说明 |
|------|----------|------|
| 构建次数 | 500次/月 | 每天触发1次足够用1年 |
| 并发构建 | 1个 | 对个人博客足够 |
| 带宽 | 无限 | 免费无上限 |
| 请求数 | 无限 | 免费无上限 |
| 自定义域名 | 100个 | 足够使用 |
| 预览部署 | 无限 | 每次push都生成预览 |

**结论**: 对于个人博客,**完全免费**即可满足需求。

---

## 对比GitHub Pages

| 特性 | Cloudflare Pages | GitHub Pages |
|------|------------------|--------------|
| 构建速度 | ⭐⭐⭐⭐⭐ (2-3分钟) | ⭐⭐⭐ (5-8分钟) |
| 全球CDN | ⭐⭐⭐⭐⭐ (200+节点) | ⭐⭐⭐⭐ (GitHub CDN) |
| 自定义域名 | ✅ 免费SSL | ✅ 免费SSL |
| 构建限额 | 500次/月 | 10次/小时 |
| 预览部署 | ✅ 自动 | ❌ 需要插件 |
| 分析工具 | ✅ 内置 | ❌ 需要第三方 |
| 配置复杂度 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |

**推荐**: Cloudflare Pages 更快、更强大

---

## 最佳实践

### 1. 构建频率建议

- **日常更新**: 每天最多1-2次手动触发
- **紧急修复**: 随时手动触发
- **大量修改**: 使用预览部署测试后再发布

### 2. 内容更新工作流

```
1. 在飞书中编辑文档
2. 确认修改无误
3. 打开Cloudflare Pages Dashboard
4. 点击"Create deployment"触发构建
5. 等待2-3分钟构建完成
6. 访问网站验证更新
```

### 3. 安全建议

- ✅ 定期轮换飞书API凭证
- ✅ 使用环境变量而非硬编码
- ✅ 不要将`.env`文件提交到Git
- ✅ 定期检查Cloudflare访问日志

### 4. 性能优化

- 图片优化: 飞书中上传的图片建议<500KB
- 文章数量: 建议<500篇以保持构建速度
- 资源清理: 定期清理未使用的图片和附件

---

## 快速开始检查清单

部署到Cloudflare Pages前确认:

- [ ] GitHub仓库已推送所有代码
- [ ] `app/package.json` 包含 `build:cf` 脚本
- [ ] `scripts/sync-feishu.js` 已创建并设置执行权限
- [ ] 飞书应用已创建并获取凭证
- [ ] Cloudflare账号已注册
- [ ] 已在Cloudflare Pages中连接GitHub仓库
- [ ] 已配置环境变量(3个)
- [ ] 构建配置已设置(build command, output directory)
- [ ] 首次部署已成功

---

## 相关文档

- [Cloudflare Pages官方文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [Docusaurus部署指南](https://docusaurus.io/docs/deployment)
- [feishu-pages文档](https://longbridge.github.io/feishu-pages/)
