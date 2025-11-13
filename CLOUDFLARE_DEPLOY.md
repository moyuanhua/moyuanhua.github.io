# Cloudflare Pages 部署指南

## 前提条件

1. Cloudflare 账号
2. GitHub 仓库已推送代码
3. 飞书 API 凭证已配置

## 部署步骤

### 1. 连接 GitHub 仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 服务
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择你的 `murphy-blog` 仓库

### 2. 配置构建设置

在 Cloudflare Pages 项目配置中设置:

**Build Configuration:**
- **Framework preset**: `None`
- **Build command**: `cd app && npm install && npm run build:cf`
- **Build output directory**: `app/build`
- **Root directory**: `/` (留空使用根目录)

### 3. 配置环境变量

在 Cloudflare Pages 项目的 **Settings** → **Environment variables** 中添加:

```bash
# 必需环境变量
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
FEISHU_WIKI_ID=DKvmwNWVOiYA6KklWcsc1gHInKg
FEISHU_ZH_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
FEISHU_EN_NODE_ID=AaoVwYxbRiIRF5kbTWIctPSvnYg

# 站点配置
SITE_URL=https://your-project.pages.dev
BASE_URL=/
NODE_ENV=production

# 可选配置
FEISHU_SYNC_INTERVAL=300
FEISHU_MAX_RETRIES=3
SKIP_FEISHU_SYNC=false
```

**注意**: 
- 环境变量需要分别为 **Production** 和 **Preview** 环境设置
- 敏感信息(APP_SECRET)请妥善保管

### 4. 部署

两种部署方式:

#### 方式 A: 自动部署
- 每次推送到 `main` 分支自动触发构建
- PR 会创建预览部署

#### 方式 B: 手动触发
1. 进入 Cloudflare Pages 项目
2. 点击 **Create deployment**
3. 选择分支并部署

### 5. 验证部署

部署完成后:

1. 访问 `https://your-project.pages.dev`
2. 测试语言切换功能
3. 检查搜索功能
4. 验证所有页面正常加载

## 常见问题

### Q: 构建失败怎么办?

A: 检查以下项目:
1. 环境变量是否正确配置
2. 飞书 API 凭证是否有效
3. 构建日志中的具体错误信息
4. 是否所有依赖都已安装

### Q: 如何跳过飞书同步?

A: 设置环境变量 `SKIP_FEISHU_SYNC=true`，这样构建时会使用现有内容

### Q: 如何更新内容?

A: 有两种方式:
1. 在飞书中更新内容后,手动触发 Cloudflare Pages 重新部署
2. 设置 GitHub Actions 定时触发(需要额外配置)

### Q: 自定义域名

1. 进入 Cloudflare Pages 项目的 **Custom domains**
2. 点击 **Set up a custom domain**
3. 添加你的域名并按照指引配置 DNS

## 本地构建测试

在推送到 GitHub 前,可以本地测试构建:

```bash
cd app
npm run build:cf  # 同步+构建
npm run serve     # 预览构建结果
```

## 目录结构

```
murphy-blog/
├── app/                 # 应用代码(部署此目录)
│   ├── docs/           # 中文文档(飞书同步)
│   ├── blog/           # 中文博客(飞书同步)
│   ├── i18n/en/        # 英文内容(飞书同步)
│   ├── src/            # React 组件
│   ├── static/         # 静态资源
│   ├── scripts/        # 同步脚本
│   ├── .env            # 环境变量(本地)
│   └── package.json    # 依赖配置
└── specs/              # 项目规范(不部署)
```

## 性能优化

Cloudflare Pages 自动提供:
- 全球 CDN 分发
- 自动 HTTPS
- 智能缓存
- HTTP/3 支持
- 边缘计算

## 安全建议

1. **API 密钥**: 仅在环境变量中配置,不要提交到代码仓库
2. **构建日志**: 检查是否泄露敏感信息
3. **权限控制**: 飞书应用设置最小必要权限
4. **定期更新**: 保持依赖包最新版本

## 监控与日志

1. 在 Cloudflare Pages 的 **Deployments** 查看构建历史
2. 点击具体部署查看详细日志
3. 使用 Cloudflare Analytics 查看访问统计

---

✨ **部署成功后,你的博客就上线了!**
