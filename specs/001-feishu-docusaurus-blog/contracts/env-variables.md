# Contract: Environment Variables

**Files**: `.env`, `.env.example`, GitHub Secrets
**Purpose**: 定义项目所需的环境变量及其配置规范

---

## .env.example Template

**项目根目录的`.env.example`文件**:

```bash
# ============================================
# Feishu API Configuration
# ============================================

# 飞书应用凭证
# 获取方式: 飞书开放平台 -> 开发者后台 -> 凭证与基础信息
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx

# 知识库配置
# 获取方式: 飞书知识库 -> 浏览器地址栏中的ID
FEISHU_WIKI_ID=wikxxxxxxxxxx

# 语言根节点ID
# 获取方式: 飞书知识库 -> 右键节点 -> 复制链接 -> 提取ID
FEISHU_ZH_NODE_ID=wikcnxxxxxxxxxxxxxx  # 简体中文根节点
FEISHU_EN_NODE_ID=wikcnxxxxxxxxxxxxxx  # English根节点

# ============================================
# Site Configuration
# ============================================

# 生产环境站点URL
# 示例: https://username.github.io
SITE_URL=https://your-username.github.io

# 基础路径(项目站点需要设置,用户站点为/)
# 示例: /murphy-blog/
BASE_URL=/your-repo-name/

# ============================================
# Optional Configuration
# ============================================

# 构建环境
# 可选值: development | production
NODE_ENV=production

# 公告栏开关
# 可选值: true | false
ANNOUNCEMENT_ENABLED=false
ANNOUNCEMENT_CONTENT=欢迎来到我的博客!

# 同步配置
# 请求间隔(毫秒)
FEISHU_SYNC_INTERVAL=300

# 最大重试次数
FEISHU_MAX_RETRIES=3

# ============================================
# Development Only
# ============================================

# 本地开发端口
PORT=3000

# 调试模式
DEBUG=false

# 跳过飞书同步(使用现有内容)
SKIP_FEISHU_SYNC=false
```

---

## Environment Variable Reference

### 1. Feishu API Variables (必填)

#### FEISHU_APP_ID
- **类型**: String
- **必填**: 是
- **格式**: `cli_` + 16位字符
- **示例**: `cli_a1b2c3d4e5f6g7h8`
- **获取方式**:
  1. 访问 [飞书开放平台](https://open.feishu.cn/app)
  2. 选择你的应用
  3. 进入"凭证与基础信息"页面
  4. 复制"App ID"

**验证规则**:
```javascript
if (!/^cli_[a-zA-Z0-9]{16}$/.test(process.env.FEISHU_APP_ID)) {
  throw new Error('Invalid FEISHU_APP_ID format');
}
```

#### FEISHU_APP_SECRET
- **类型**: String
- **必填**: 是
- **格式**: 32位字符
- **示例**: `abcdef1234567890abcdef1234567890`
- **获取方式**: 同FEISHU_APP_ID页面,复制"App Secret"
- **安全要求**:
  - 不得提交到Git仓库
  - 定期轮换(建议每90天)
  - 仅授权必要的API权限

**验证规则**:
```javascript
if (!process.env.FEISHU_APP_SECRET || process.env.FEISHU_APP_SECRET.length < 20) {
  throw new Error('Invalid FEISHU_APP_SECRET');
}
```

#### FEISHU_WIKI_ID
- **类型**: String
- **必填**: 是
- **格式**: `wik` + 字符串
- **示例**: `wikbcSGV5UrDn4jJtQgwSr8Qk2g`
- **获取方式**:
  1. 打开飞书知识库
  2. 查看浏览器地址栏
  3. URL格式: `https://xxx.feishu.cn/wiki/wikbcSGV5UrDn4jJtQgwSr8Qk2g`
  4. 提取`wik`开头的ID

#### FEISHU_ZH_NODE_ID
- **类型**: String
- **必填**: 是
- **格式**: `wikcn` + 字符串
- **示例**: `wikcnGxAuVLmvW8Q6aLOTCLJe0e`
- **获取方式**:
  1. 在飞书知识库中找到"简体中文"根节点
  2. 右键节点 -> 更多 -> 复制文档链接
  3. 从链接中提取`wikcn`开头的ID
- **要求**: 必须是知识库的一级节点

#### FEISHU_EN_NODE_ID
- **类型**: String
- **必填**: 是
- **格式**: 同FEISHU_ZH_NODE_ID
- **示例**: `wikcnHxBuVMmvY9R7bMPUDMKf1f`
- **获取方式**: 同FEISHU_ZH_NODE_ID
- **要求**: 必须与中文节点有相同的子结构

---

### 2. Site Configuration Variables (必填)

#### SITE_URL
- **类型**: URL
- **必填**: 是(生产环境)
- **默认值**: `https://localhost:3000` (开发环境)
- **示例**:
  - 用户站点: `https://username.github.io`
  - 项目站点: `https://username.github.io`
  - 自定义域名: `https://blog.example.com`

**验证规则**:
```javascript
try {
  new URL(process.env.SITE_URL);
} catch (error) {
  throw new Error('SITE_URL must be a valid URL');
}
```

**在Docusaurus配置中使用**:
```typescript
const config: Config = {
  url: process.env.SITE_URL || 'https://localhost:3000',
  // ...
};
```

#### BASE_URL
- **类型**: String (路径)
- **必填**: 是
- **格式**: 必须以 `/` 开头和结尾
- **示例**:
  - 用户站点: `/`
  - 项目站点: `/murphy-blog/`
  - 子目录: `/blog/docs/`

**验证规则**:
```javascript
if (!process.env.BASE_URL.startsWith('/') || !process.env.BASE_URL.endsWith('/')) {
  throw new Error('BASE_URL must start and end with /');
}
```

---

### 3. Optional Configuration Variables

#### NODE_ENV
- **类型**: Enum
- **必填**: 否
- **可选值**: `development`, `production`, `test`
- **默认值**: `development`
- **用途**: 控制构建优化和调试输出

#### ANNOUNCEMENT_ENABLED
- **类型**: Boolean (string)
- **必填**: 否
- **可选值**: `true`, `false`
- **默认值**: `false`
- **用途**: 控制是否显示公告栏

#### ANNOUNCEMENT_CONTENT
- **类型**: String
- **必填**: 否(ANNOUNCEMENT_ENABLED为true时建议填写)
- **示例**: `欢迎来到我的博客!点击Star支持我⭐️`

#### FEISHU_SYNC_INTERVAL
- **类型**: Number (string)
- **必填**: 否
- **默认值**: `300` (毫秒)
- **范围**: 300-1000
- **用途**: 飞书API请求间隔

**验证规则**:
```javascript
const interval = parseInt(process.env.FEISHU_SYNC_INTERVAL || '300');
if (interval < 300) {
  throw new Error('FEISHU_SYNC_INTERVAL must be at least 300ms');
}
```

#### FEISHU_MAX_RETRIES
- **类型**: Number (string)
- **必填**: 否
- **默认值**: `3`
- **范围**: 0-10
- **用途**: API请求失败时的最大重试次数

---

### 4. Development Variables

#### PORT
- **类型**: Number (string)
- **必填**: 否
- **默认值**: `3000`
- **用途**: 本地开发服务器端口

#### DEBUG
- **类型**: Boolean (string)
- **必填**: 否
- **默认值**: `false`
- **用途**: 启用详细调试日志

#### SKIP_FEISHU_SYNC
- **类型**: Boolean (string)
- **必填**: 否
- **默认值**: `false`
- **用途**: 开发时跳过飞书同步,使用现有内容

---

## Configuration Loading

### 本地开发环境

**使用dotenv加载.env文件**:

```javascript
// scripts/sync-feishu.js
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 验证必填变量
const required = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_WIKI_ID'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

**package.json脚本**:
```json
{
  "scripts": {
    "sync": "node -r dotenv/config scripts/sync-feishu.js",
    "dev": "cd app && npm run start",
    "build": "cd app && npm run build"
  }
}
```

### GitHub Actions环境

**在workflow中配置**:

```yaml
env:
  FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
  FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
  FEISHU_WIKI_ID: ${{ secrets.FEISHU_WIKI_ID }}
  FEISHU_ZH_NODE_ID: ${{ secrets.FEISHU_ZH_NODE_ID }}
  FEISHU_EN_NODE_ID: ${{ secrets.FEISHU_EN_NODE_ID }}
  SITE_URL: ${{ vars.SITE_URL }}
  BASE_URL: ${{ vars.BASE_URL }}
```

**配置路径**:
- Secrets: Repository → Settings → Secrets and variables → Actions → Secrets
- Variables: Repository → Settings → Secrets and variables → Actions → Variables

**区别**:
- **Secrets**: 敏感信息(API密钥、密码),加密存储,日志中不显示
- **Variables**: 非敏感配置(URL、路径),明文存储,日志中可见

---

## Validation Script

**scripts/validate-env.js**:

```javascript
#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 用于CI/CD流程中验证配置完整性
 */

require('dotenv').config();

const validations = {
  FEISHU_APP_ID: {
    required: true,
    pattern: /^cli_[a-zA-Z0-9]{16}$/,
    message: 'Must be in format: cli_XXXXXXXXXXXXXXXX',
  },
  FEISHU_APP_SECRET: {
    required: true,
    minLength: 20,
    message: 'Must be at least 20 characters',
  },
  FEISHU_WIKI_ID: {
    required: true,
    pattern: /^wik[a-zA-Z0-9]+$/,
    message: 'Must start with "wik"',
  },
  FEISHU_ZH_NODE_ID: {
    required: true,
    pattern: /^wikcn[a-zA-Z0-9]+$/,
    message: 'Must start with "wikcn"',
  },
  FEISHU_EN_NODE_ID: {
    required: true,
    pattern: /^wikcn[a-zA-Z0-9]+$/,
    message: 'Must start with "wikcn"',
  },
  SITE_URL: {
    required: process.env.NODE_ENV === 'production',
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Must be a valid URL',
  },
  BASE_URL: {
    required: true,
    pattern: /^\/.*\/$/,
    message: 'Must start and end with /',
  },
};

let hasErrors = false;

for (const [key, rules] of Object.entries(validations)) {
  const value = process.env[key];

  // 检查必填
  if (rules.required && !value) {
    console.error(`❌ ${key} is required but not set`);
    hasErrors = true;
    continue;
  }

  if (!value) continue; // 可选变量未设置,跳过后续验证

  // 检查正则模式
  if (rules.pattern && !rules.pattern.test(value)) {
    console.error(`❌ ${key} format invalid: ${rules.message}`);
    hasErrors = true;
  }

  // 检查最小长度
  if (rules.minLength && value.length < rules.minLength) {
    console.error(`❌ ${key} too short: ${rules.message}`);
    hasErrors = true;
  }

  // 自定义验证
  if (rules.validate && !rules.validate(value)) {
    console.error(`❌ ${key} validation failed: ${rules.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Environment validation failed');
  process.exit(1);
} else {
  console.log('✅ All environment variables are valid');
}
```

**在workflow中使用**:
```yaml
- name: Validate environment
  run: node scripts/validate-env.js
```

---

## Security Best Practices

### 1. 不提交敏感信息

**.gitignore**:
```gitignore
# 环境变量文件
.env
.env.local
.env.*.local

# 不要忽略示例文件
!.env.example
```

### 2. 日志脱敏

```javascript
// 不要这样做 ❌
console.log('App Secret:', process.env.FEISHU_APP_SECRET);

// 应该这样做 ✅
console.log('App Secret:', process.env.FEISHU_APP_SECRET.substring(0, 8) + '...');
```

### 3. 权限最小化

飞书应用只授予必要的权限:
```
docx:document:readonly    # 读取文档
wiki:wiki:readonly        # 读取知识库
drive:drive:readonly      # 读取云文档
```

### 4. 定期轮换密钥

```bash
# 在飞书开放平台重新生成密钥后
# 更新GitHub Secrets
gh secret set FEISHU_APP_SECRET --body "new_secret_value"
```

---

## Troubleshooting

### 问题1: 环境变量未生效

**症状**: 脚本提示缺少环境变量,但.env文件中已配置

**原因**: dotenv未正确加载

**解决**:
```javascript
// 确保在文件顶部加载
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 或在命令行中加载
node -r dotenv/config scripts/sync-feishu.js
```

### 问题2: GitHub Actions中变量不可用

**症状**: workflow日志显示变量为空

**原因**: 未在workflow中正确传递

**解决**:
```yaml
- name: Sync content
  env:
    FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
    # 确保所有变量都在env中列出
  run: node scripts/sync-feishu.js
```

### 问题3: baseUrl导致样式丢失

**症状**: 部署后网站样式不正确

**原因**: BASE_URL配置错误

**解决**:
```typescript
// 确保与实际部署路径一致
// 用户站点: https://username.github.io
baseUrl: '/'

// 项目站点: https://username.github.io/murphy-blog
baseUrl: '/murphy-blog/'
```

---

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
SITE_URL=http://localhost:3000
BASE_URL=/
SKIP_FEISHU_SYNC=true
DEBUG=true
```

### Staging

```bash
NODE_ENV=production
SITE_URL=https://staging.example.com
BASE_URL=/
ANNOUNCEMENT_ENABLED=true
ANNOUNCEMENT_CONTENT=这是测试环境
```

### Production

```bash
NODE_ENV=production
SITE_URL=https://username.github.io
BASE_URL=/murphy-blog/
ANNOUNCEMENT_ENABLED=false
```

---

## Migration Checklist

设置新环境时的步骤:

- [ ] 复制`.env.example`到`.env`
- [ ] 填写飞书API凭证
- [ ] 填写知识库和节点ID
- [ ] 配置站点URL和基础路径
- [ ] 运行`node scripts/validate-env.js`验证
- [ ] 测试本地同步:`npm run sync`
- [ ] 测试本地构建:`cd app && npm run build`
- [ ] 在GitHub Secrets中配置生产环境变量
- [ ] 触发GitHub Actions验证部署

---

## References

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [飞书开放平台 - 凭证管理](https://open.feishu.cn/document/ukTMukTMukTM/uADO4YjLwgDO24CM4gjN)
- [GitHub Actions - Environment Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [GitHub Actions - Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
