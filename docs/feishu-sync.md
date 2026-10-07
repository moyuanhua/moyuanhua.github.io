# 飞书知识库同步到站点

把飞书 / Lark 知识库（Wiki）镜像到本站的 `writing` 集合，由 GitHub Actions 定时或手动触发。
整条链路写在仓库里，不依赖本机工具链：

```
tenant_access_token → wiki 节点(递归) → docx blocks → Markdown(feishu-docx)
→ 下载图片/画板 → src/content/writing/feishu/** + public/writing-assets/feishu/**
→ git commit → 触发 Deploy 工作流
```

相关文件：

| 文件 | 作用 |
| --- | --- |
| `scripts/sync-feishu.mjs` | 同步脚本（Node 22，直接调 OpenAPI） |
| `feishu.config.json` | 输出目录、标签、排除规则等 |
| `.github/workflows/sync-feishu.yml` | 定时 / 手动 / `repository_dispatch` 触发 |
| `.feishu-sync/manifest.json` | 记录上次产出，用于清理被删改的文档（需提交） |

---

## 1. 创建飞书应用并开通权限

1. 到 [开放平台开发者后台](https://open.feishu.cn/app) 创建**企业自建应用**。
2. 「权限管理」开通以下权限：

   | 权限 | 用途 |
   | --- | --- |
   | `docx:document:readonly` | 读取文档块 |
   | `wiki:wiki:readonly` | 遍历知识库节点 |
   | `drive:drive:readonly` | 读取文档元信息 |
   | `docs:document.media:download` | 下载文档里的图片/附件 |
   | `board:whiteboard:node:read` | 下载画板（可选） |

3. 在「凭证与基础信息」拿到 **App ID** 与 **App Secret**。
4. **发布应用版本**并等审批通过（个人版可直接发布）。

## 2. 把应用加入知识库

`tenant_access_token` 只能读**应用被授权**的内容。两种方式任选：

- **知识库**：知识空间「设置 → 权限设置 → 添加管理员」，把应用（或含该应用的群）加进去。
  否则会报 `permission denied: wiki space permission denied`。
- **单篇文档**：文档右上角「···」→「更多」→「添加文档应用」，选中该应用。

## 3. 获取 space_id

打开知识库设置页，URL 形如
`https://xxx.feishu.cn/wiki/settings/6992046856314306562`，
其中的 `6992046856314306562` 就是 `space_id`。
（要同步「我的文档库」则填 `my_library`。）

## 4. 配置 GitHub Secrets

仓库 → Settings → Secrets and variables → Actions，新增：

| Secret | 说明 |
| --- | --- |
| `FEISHU_APP_ID` | 应用 App ID |
| `FEISHU_APP_SECRET` | 应用 App Secret |
| `FEISHU_SPACE_ID` | 知识库 space_id |

> Lark 国际版还需在 workflow 里取消注释 `FEISHU_ENDPOINT: https://open.larksuite.com`。

## 5. 调整同步范围（可选）

`feishu.config.json`：

```jsonc
{
  "spaceId": "",              // 也可只用 Secret
  "rootNodeToken": "",        // 只同步某个子树时填该节点 token
  "output": "src/content/writing/feishu",
  "assets": "public/writing-assets/feishu",
  "assetsUrlBase": "/writing-assets/feishu",
  "dateFrom": "obj_edit_time",// 或 obj_create_time 作为文章日期
  "defaultTags": ["feishu"],
  "draft": false,             // true = 全部先标为草稿不上线
  "publishMarker": "",        // 如 "【发布】"，只同步标题含该标记的文档，并自动去掉标记
  "excludeNodeTokens": [],
  "excludeTitlePatterns": []  // 正则，如 ["^内部", "草稿$"]
}
```

## 6. 触发方式

- **手动**：Actions → `Sync Feishu Wiki` → Run workflow。
- **定时**：默认每 30 分钟一次（`cron: '*/30 * * * *'`，可改）。
- **未配置即跳过**：只要 `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_SPACE_ID` 任一为空，
  第一步就会判定并直接跳过（绿色通过），不会报错——所以先挂上定时任务也没关系。
- **实时（预留）**：workflow 已监听 `repository_dispatch`（`type: feishu-sync`）。
  若要"飞书一改就发"，需要一个公网中转（Cloudflare Worker / 云函数）接收飞书
  `drive.file.edit_v1` 事件，再用 PAT 调 GitHub：
  ```
  POST https://api.github.com/repos/<owner>/<repo>/dispatches
  { "event_type": "feishu-sync" }
  ```
  （GitHub Actions 无法被飞书事件直接触发，这一步逃不掉。）

同步提交后会自动 `gh workflow run deploy.yml` 触发部署 —— 因为用 `GITHUB_TOKEN`
push 的提交**不会**触发其它 workflow，所以脚本里显式 dispatch 了一次。

## 7. 本地跑

```bash
FEISHU_APP_ID=xxx FEISHU_APP_SECRET=yyy FEISHU_SPACE_ID=zzz npm run sync:feishu
FEISHU_APP_ID=xxx FEISHU_APP_SECRET=yyy FEISHU_SPACE_ID=zzz FEISHU_DRY_RUN=1 npm run sync:feishu
```

## 内容约定

- 文章输出到 `src/content/writing/feishu/**`，URL 形如 `/writing/feishu/<slug>`。
- frontmatter 自动生成：`title`（节点标题）、`date`（编辑时间）、`description`（自动取首段）、`tags`。
- **文档首块为 YAML 代码块**时，可作为 frontmatter 覆盖，例如：

  ````markdown
  ```yaml
  title: 自定义标题
  description: 自定义摘要
  tags: [agent, design]
  draft: true
  ```
  ````

- 文件名/路径由标题生成 ASCII slug；纯中文标题回退为 `doc-<hash>`。

## 已知限制

- 只同步 `docx`（新版文档）节点，`sheet`/`bitable`/`file` 等会跳过并记日志。
- 渲染引擎是社区库 [`feishu-docx`](https://github.com/longbridgeapp/feishu-pages)（MIT，
  `feishu-pages` 同款）。覆盖文本/标题/列表/代码/引用/待办/表格/图片/画板/高亮块等；
  个别新块类型可能退化为占位。
- 单篇文档读取失败（如未授权）会告警跳过，不影响其它文档；鉴权/配置错误则整体失败。
