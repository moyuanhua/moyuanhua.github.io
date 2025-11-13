# 飞书应用配置指南

根据错误提示和官方文档,需要完成以下配置步骤。

## 问题诊断

当前错误: `permission denied: wiki space permission denied, tenant needs read permission.`

**原因**: 飞书应用缺少知识库读取权限

## 完整配置步骤

### 1. 创建/配置飞书应用

访问: https://open.feishu.cn/app

使用你的应用: `cli_a8181d8827ead01c`

### 2. 启用机器人能力

在应用配置中:
- 进入 **应用功能** → **机器人**
- 启用机器人功能

### 3. 配置权限 ⚠️ **重要**

进入 **权限管理** → **权限配置**,添加以下权限:

#### 必需权限:
- ✅ `docx:document:readonly` - 获取文档内容
- ✅ `wiki:wiki:readonly` - 获取知识库信息  
- ✅ `drive:drive:readonly` - 云空间权限
- ✅ `board:whiteboard:node:read` - 白板权限 (可选)

#### 添加权限后必须:
1. 点击 **发布版本**
2. 等待审核通过(企业内部应用通常自动通过)

### 4. 配置知识库访问

#### 方式 A: 通过飞书群 (推荐)

1. 在飞书中创建一个群,命名为 "Feishu Pages" 或任意名称
2. 将你的应用机器人添加到群中:
   - 群设置 → 添加群机器人 → 选择你的应用
3. 在知识库设置中:
   - 进入你的知识库: https://or6tftpha8.feishu.cn/wiki/space/7560180515966484484
   - 点击右上角 **设置**
   - **权限管理** → **协作者**
   - 添加刚才创建的群
   - 授予 **阅读权限** 或 **编辑权限**

#### 方式 B: 直接添加应用

某些版本的飞书支持直接将应用添加为协作者:
1. 知识库 → 设置 → 权限管理
2. 添加你的应用作为协作者
3. 授予读取权限

### 5. 验证环境变量

确保 `.env` 文件包含所有必需变量:

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_a8181d8827ead01c
FEISHU_APP_SECRET=mwC4jkHfxUpab5NGafXCbe1AK5GyRgc8

# 知识库配置
FEISHU_WIKI_ID=7560180515966484484        # 也作为 FEISHU_SPACE_ID
FEISHU_ZH_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
FEISHU_EN_NODE_ID=AaoVwYxbRiIRF5kbTWIctPSvnYg

# 站点配置
SITE_URL=https://your-site.com
BASE_URL=/
```

**注意**: `FEISHU_WIKI_ID` 和 `FEISHU_SPACE_ID` 是同一个值

### 6. 测试连接

配置完成后,运行测试脚本:

```bash
cd app
node scripts/test-feishu-api.js
```

**成功的输出**:
```
✅ 成功获取 tenant_access_token
✅ 成功获取知识库节点!
   找到 X 个节点
```

**如果还是报权限错误**:
1. 确认权限已发布新版本
2. 确认机器人已添加到有权限访问知识库的群
3. 等待几分钟让权限生效
4. 重新生成 App Secret (如果怀疑密钥问题)

### 7. 同步内容

测试通过后,运行同步:

```bash
npm run sync
```

### 8. 构建和预览

```bash
npm run build
npm run serve
```

## 权限配置检查清单

- [ ] 创建飞书应用
- [ ] 获取 App ID 和 App Secret
- [ ] 启用机器人功能
- [ ] 添加必需权限:
  - [ ] docx:document:readonly
  - [ ] wiki:wiki:readonly
  - [ ] drive:drive:readonly
- [ ] 发布应用版本
- [ ] 创建飞书群
- [ ] 将机器人添加到群
- [ ] 将群添加为知识库协作者
- [ ] 配置环境变量
- [ ] 运行测试脚本验证
- [ ] 同步内容

## 常见问题

### Q1: 添加了权限但还是报错?
A: 需要 **发布新版本** 才能让权限生效,不是保存即生效。

### Q2: 如何确认机器人有访问权限?
A: 在知识库的协作者列表中应该能看到包含机器人的群。

### Q3: 还是不行怎么办?
A: 尝试:
1. 重新生成 App Secret
2. 删除机器人重新添加
3. 检查知识库是否设置为私有
4. 联系飞书管理员确认企业权限设置

### Q4: 临时解决方案
如果暂时无法配置权限,可以设置:
```bash
SKIP_FEISHU_SYNC=true
```
然后使用手动创建的内容进行构建。

## 参考文档

- [feishu-pages 官方文档](https://longbridge.github.io/feishu-pages/zh-CN/)
- [飞书开放平台](https://open.feishu.cn/)
- [飞书权限说明](https://open.feishu.cn/document/ukTMukTMukTM/uQjN3QjL0YzN04CN2cDN)

---

配置完成后,使用 `npm run sync` 测试同步功能!
