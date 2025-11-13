# Contract: GitHub Actions Workflows

**Files**: `.github/workflows/deploy.yml` 和 `.github/workflows/manual-sync.yml`
**Purpose**: 自动化部署和飞书内容同步的CI/CD配置

---

## Workflow Architecture

```
触发方式:
├── Push to main       → deploy.yml (完整流程)
├── Schedule (每日)     → deploy.yml (完整流程)
├── Manual dispatch    → deploy.yml 或 manual-sync.yml
└── Repository dispatch → deploy.yml (飞书webhook触发)

流程:
1. Checkout代码
2. 安装Node.js和依赖
3. 同步飞书内容
4. 构建Docusaurus
5. 部署到GitHub Pages
```

---

## Main Deployment Workflow

**.github/workflows/deploy.yml**:

```yaml
name: Deploy to GitHub Pages

on:
  # 推送到main分支时触发
  push:
    branches:
      - main
    paths-ignore:
      - 'specs/**'
      - '*.md'
      - '.gitignore'

  # 手动触发
  workflow_dispatch:
    inputs:
      skip-sync:
        description: 'Skip Feishu sync (use existing content)'
        required: false
        type: boolean
        default: false

  # 定时触发(每天UTC 00:00,即北京时间08:00)
  schedule:
    - cron: '0 0 * * *'

  # 外部触发(飞书webhook)
  repository_dispatch:
    types: [feishu-update]

# 设置权限
permissions:
  contents: read
  pages: write
  id-token: write

# 并发控制(同时只允许一个部署)
concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  # ========== 构建任务 ==========
  build:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 获取完整历史(用于last update time)

      # 2. 配置Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      # 3. 安装依赖
      - name: Install dependencies
        run: |
          cd app
          npm ci

      # 4. 同步飞书内容
      - name: Sync Feishu content
        if: ${{ !inputs.skip-sync }}
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_WIKI_ID: ${{ secrets.FEISHU_WIKI_ID }}
          FEISHU_ZH_NODE_ID: ${{ secrets.FEISHU_ZH_NODE_ID }}
          FEISHU_EN_NODE_ID: ${{ secrets.FEISHU_EN_NODE_ID }}
        run: |
          echo "📥 Starting Feishu content sync..."
          node scripts/sync-feishu.js

      # 4b. 跳过同步提示
      - name: Skip sync notice
        if: ${{ inputs.skip-sync }}
        run: |
          echo "⏭️  Skipping Feishu sync (using existing content)"

      # 5. 构建Docusaurus
      - name: Build Docusaurus
        env:
          NODE_ENV: production
          SITE_URL: ${{ secrets.SITE_URL || 'https://username.github.io' }}
          BASE_URL: ${{ secrets.BASE_URL || '/murphy-blog/' }}
        run: |
          cd app
          echo "🏗️  Building Docusaurus site..."
          npm run build
          echo "✅ Build completed"

      # 6. 验证构建产物
      - name: Validate build
        run: |
          if [ ! -d "app/build" ]; then
            echo "❌ Build directory not found"
            exit 1
          fi

          if [ ! -f "app/build/index.html" ]; then
            echo "❌ index.html not found"
            exit 1
          fi

          echo "✅ Build validation passed"

      # 7. 上传构建产物
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: app/build

  # ========== 部署任务 ==========
  deploy:
    needs: build
    runs-on: ubuntu-latest

    # 部署环境配置
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

      - name: Deployment summary
        run: |
          echo "🎉 Deployment successful!"
          echo "📍 Site URL: ${{ steps.deployment.outputs.page_url }}"
```

---

## Manual Sync Workflow

用于手动触发飞书同步,不部署:

**.github/workflows/manual-sync.yml**:

```yaml
name: Manual Feishu Sync

on:
  workflow_dispatch:
    inputs:
      language:
        description: 'Language to sync (zh, en, or both)'
        required: true
        type: choice
        options:
          - both
          - zh
          - en
        default: both

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Sync Feishu content
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_WIKI_ID: ${{ secrets.FEISHU_WIKI_ID }}
          FEISHU_ZH_NODE_ID: ${{ secrets.FEISHU_ZH_NODE_ID }}
          FEISHU_EN_NODE_ID: ${{ secrets.FEISHU_EN_NODE_ID }}
          SYNC_LANGUAGE: ${{ inputs.language }}
        run: |
          echo "📥 Syncing content for: ${{ inputs.language }}"
          node scripts/sync-feishu.js

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: sync Feishu content (${{ inputs.language }})'
          branch: feishu-sync-${{ github.run_number }}
          title: 'Sync Feishu Content - ${{ inputs.language }}'
          body: |
            Automated Feishu content sync

            - Language: ${{ inputs.language }}
            - Triggered by: @${{ github.actor }}
            - Run ID: ${{ github.run_id }}

            Please review the changes before merging.
          labels: |
            content-sync
            automated
```

---

## Required GitHub Secrets

在 Repository Settings → Secrets and variables → Actions 中配置:

### 必填 Secrets

| Secret Name | 描述 | 示例值 |
|------------|------|--------|
| `FEISHU_APP_ID` | 飞书应用ID | `cli_a1b2c3d4e5f6g7h8` |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | `xxxxxxxxxxxxxxxxxxxx` |
| `FEISHU_WIKI_ID` | 知识库ID | `wikxxxxxxxxxx` |
| `FEISHU_ZH_NODE_ID` | 中文根节点ID | `wikcnxxxxxxxxxxxxxx` |
| `FEISHU_EN_NODE_ID` | 英文根节点ID | `wikcnxxxxxxxxxxxxxx` |

### 可选 Secrets

| Secret Name | 描述 | 默认值 |
|------------|------|--------|
| `SITE_URL` | 站点URL | `https://username.github.io` |
| `BASE_URL` | 基础路径 | `/murphy-blog/` |

---

## GitHub Pages Configuration

### Repository Settings

**Pages设置路径**: Repository → Settings → Pages

**配置**:
```
Source: GitHub Actions
Custom domain: (可选)留空或填写自定义域名
Enforce HTTPS: ✅ 启用
```

### 权限配置

Workflow需要以下权限:
```yaml
permissions:
  contents: read     # 读取代码
  pages: write       # 写入Pages
  id-token: write    # OIDC认证(Pages部署)
```

---

## Trigger Conditions

### 1. Push触发

```yaml
on:
  push:
    branches:
      - main
    paths-ignore:
      - 'specs/**'        # 忽略spec更新
      - '*.md'            # 忽略README更新
      - '.gitignore'
```

**触发条件**:
- 推送到main分支
- 不包括仅修改specs/或*.md的提交

### 2. 定时触发

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 每天UTC 00:00
```

**Cron表达式格式**:
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6, 0=周日)
│ │ │ │ │
* * * * *
```

**常用定时**:
- `0 0 * * *` - 每天00:00(北京时间08:00)
- `0 */6 * * *` - 每6小时一次
- `0 0 * * 1` - 每周一00:00

### 3. 手动触发

```yaml
on:
  workflow_dispatch:
    inputs:
      skip-sync:
        description: 'Skip Feishu sync'
        type: boolean
        default: false
```

**触发方式**:
GitHub → Actions → Deploy to GitHub Pages → Run workflow

### 4. Repository Dispatch(飞书webhook)

```yaml
on:
  repository_dispatch:
    types: [feishu-update]
```

**触发方式**:
通过GitHub API:
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <TOKEN>" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{"event_type":"feishu-update"}'
```

---

## Environment Variables

### Build Time

在workflow中设置的环境变量:

```yaml
env:
  NODE_ENV: production
  SITE_URL: ${{ secrets.SITE_URL }}
  BASE_URL: ${{ secrets.BASE_URL }}
  FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
  # ... 其他飞书凭证
```

这些变量可以在:
1. 同步脚本中使用(`process.env.FEISHU_APP_ID`)
2. Docusaurus配置中使用(`process.env.SITE_URL`)

---

## Caching Strategy

### npm依赖缓存

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: app/package-lock.json
```

**效果**:
- 首次运行: 安装所有依赖(~2-3分钟)
- 缓存命中: 恢复缓存依赖(~10-20秒)

### 构建缓存(可选)

未来可添加Docusaurus构建缓存:

```yaml
- name: Cache Docusaurus build
  uses: actions/cache@v4
  with:
    path: |
      app/.docusaurus
      app/node_modules/.cache
    key: docusaurus-build-${{ hashFiles('app/docs/**', 'app/blog/**') }}
    restore-keys: |
      docusaurus-build-
```

---

## Error Handling

### 同步失败处理

如果飞书同步失败,workflow会终止:

```yaml
- name: Sync Feishu content
  run: |
    node scripts/sync-feishu.js
  # 如果脚本返回非0退出码,workflow终止
```

**通知方式**:
1. GitHub Actions界面显示失败
2. 触发者收到邮件通知
3. 可选:集成Slack/企业微信通知

### 构建失败处理

```yaml
- name: Build Docusaurus
  run: |
    cd app
    npm run build
```

**常见失败原因**:
- Markdown语法错误
- 缺失的图片引用
- 配置文件错误
- 内存不足(超大文档)

**调试方法**:
```yaml
- name: Build Docusaurus
  run: |
    cd app
    npm run build -- --debug
```

---

## Deployment Verification

### 自动验证

在deploy任务后添加验证步骤:

```yaml
- name: Verify deployment
  run: |
    SITE_URL="${{ steps.deployment.outputs.page_url }}"
    echo "Verifying $SITE_URL"

    # 等待DNS传播
    sleep 10

    # 检查HTTP状态
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")

    if [ "$STATUS" -eq 200 ]; then
      echo "✅ Site is accessible"
    else
      echo "❌ Site returned $STATUS"
      exit 1
    fi
```

### 手动验证清单

部署完成后验证:
- [ ] 首页正常显示
- [ ] 中英文语言切换正常
- [ ] 文章列表可访问
- [ ] 搜索功能可用
- [ ] 图片资源加载正常
- [ ] 移动端布局正常

---

## Performance Optimization

### 并发控制

```yaml
concurrency:
  group: 'pages'
  cancel-in-progress: false
```

**说明**:
- 同时只允许一个部署进行
- 新触发的workflow会等待当前部署完成
- 设置为`true`则取消进行中的部署

### 条件执行

```yaml
- name: Sync Feishu content
  if: ${{ !inputs.skip-sync }}
  run: node scripts/sync-feishu.js
```

**用途**:
- 仅配置更改时跳过同步
- 调试时使用现有内容

---

## Monitoring and Logging

### Workflow执行日志

GitHub Actions自动记录:
- 每个步骤的输出
- 执行时间
- 退出码

**查看路径**: Repository → Actions → 选择workflow run

### 自定义日志

在脚本中输出结构化日志:

```javascript
console.log('📥 Starting sync...');
console.log('✅ Sync completed');
console.error('❌ Error:', error.message);
```

**日志级别**:
- `console.log()`: 信息日志
- `console.warn()`: 警告日志
- `console.error()`: 错误日志

### 构建时间监控

```yaml
- name: Build Docusaurus
  run: |
    START_TIME=$(date +%s)
    cd app && npm run build
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "⏱️  Build took ${DURATION} seconds"

    if [ $DURATION -gt 300 ]; then
      echo "⚠️  Build time exceeded 5 minutes"
    fi
```

---

## Troubleshooting Guide

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| 部署失败: 403 | Pages未启用 | 检查Settings → Pages配置 |
| 同步失败: 401 | 凭证错误 | 验证Secrets中的飞书凭证 |
| 构建失败: OOM | 内存不足 | 减少并发构建,或使用self-hosted runner |
| 部署超时 | 构建产物过大 | 优化图片,启用压缩 |
| 样式丢失 | baseUrl配置错误 | 检查SITE_URL和BASE_URL |

### 调试步骤

1. **查看workflow日志**:
   Actions → 选择失败的run → 展开失败的步骤

2. **本地复现**:
   ```bash
   export FEISHU_APP_ID=xxx
   node scripts/sync-feishu.js
   cd app && npm run build
   ```

3. **启用调试模式**:
   ```yaml
   - name: Debug info
     run: |
       echo "Node version: $(node -v)"
       echo "npm version: $(npm -v)"
       echo "Working directory: $(pwd)"
       ls -la
   ```

---

## Security Best Practices

### Secrets管理

- ✅ 使用GitHub Secrets存储敏感信息
- ✅ 定期轮换飞书应用密钥
- ❌ 不要在日志中打印完整token
- ❌ 不要在PR中暴露secrets

### 权限最小化

```yaml
permissions:
  contents: read    # 只读代码
  pages: write      # 仅写Pages(不能写代码)
  id-token: write   # 仅OIDC认证
```

### 依赖安全

```yaml
- name: Audit dependencies
  run: |
    cd app
    npm audit --audit-level=moderate
```

---

## Future Enhancements

### 1. 通知集成

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. 性能报告

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      ${{ steps.deployment.outputs.page_url }}
    uploadArtifacts: true
```

### 3. 自动标签

```yaml
- name: Tag release
  if: github.event_name == 'push'
  run: |
    git tag "deploy-$(date +%Y%m%d-%H%M%S)"
    git push --tags
```

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Deployment Action](https://github.com/actions/deploy-pages)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Cron Schedule Expression](https://crontab.guru/)
