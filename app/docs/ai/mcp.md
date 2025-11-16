---
title: MCP 实现指南 - 从入门到精通
slug: mcp
sidebar_position: 1
---

# MCP 实现指南 - 从入门到精通

> 本文档详细介绍 Model Context Protocol (MCP) 在本项目中的实现原理和方法

## <b>📚 目录</b>

1. [什么是 MCP](#什么是-mcp)
2. [MCP 核心概念](#mcp-核心概念)
3. [项目架构概览](#项目架构概览)
4. [完整的请求流程](#完整的请求流程)
5. [核心组件详解](#核心组件详解)
6. [Session 管理机制](#session-管理机制)
7. [常见问题与解决方案](#常见问题与解决方案)
8. [实战示例](#实战示例)

---

## <b>什么是 MCP</b>

<b>MCP (Model Context Protocol)</b> 是 Anthropic 推出的一个开放协议，用于 AI 模型与外部工具、数据源之间的标准化通信。

### <b>核心价值</b>

```text
┌─────────────┐          MCP          ┌─────────────┐
│             │  ◄─────────────────►  │             │
│  AI Model   │   标准化协议通信      │   Tools &   │
│  (Claude)   │                       │  Resources  │
│             │                       │             │
└─────────────┘                       └─────────────┘
```

- <b>统一接口</b>：AI 可以通过统一的协议调用任何符合 MCP 标准的工具

- <b>动态发现</b>：AI 可以动态获取可用的工具列表和参数

- <b>标准化</b>：类似 HTTP 协议，为 AI 工具调用提供标准

### <b>与传统 API 的区别</b>

<table>
<colgroup>
<col width="200"/>
<col width="200"/>
<col width="200"/>
</colgroup>
<tbody>
<tr><td><p>特性</p></td><td><p>传统 REST API</p></td><td><p>MCP</p></td></tr>
<tr><td><p>发现机制</p></td><td><p>需要预先知道接口</p></td><td><p>动态发现工具列表</p></td></tr>
<tr><td><p>协议</p></td><td><p>HTTP RESTful</p></td><td><p>JSON-RPC 2.0</p></td></tr>
<tr><td><p>状态</p></td><td><p>无状态</p></td><td><p>有状态（需要 session）</p></td></tr>
<tr><td><p>初始化</p></td><td><p>无需握手</p></td><td><p>需要完整的初始化握手</p></td></tr>
<tr><td><p>用途</p></td><td><p>通用数据交互</p></td><td><p>AI 工具调用专用</p></td></tr>
</tbody>
</table>

---

## <b>MCP 核心概念</b>

### <b>1. Tools (工具)</b>

工具是 AI 可以调用的功能单元，类似函数：

```ts
interface Tool {
  name: string;              // 工具名称，如 "shopify_article_list"
  description: string;        // 工具描述，AI 用来理解工具用途
  inputSchema: JSONSchema;    // 输入参数的 JSON Schema
}
```

<b>示例</b>：

```json
{
  "name": "shopify_article_list",
  "description": "获取 Shopify 店铺的文章列表",
  "inputSchema": {
    "type": "object",
    "properties": {
      "shopify_domain": { "type": "string" },
      "page": { "type": "integer" },
      "page_size": { "type": "integer" }
    },
    "required": ["shopify_domain", "page", "page_size"]
  }
}
```

### <b>2. Resources (资源)</b>

资源是可供 AI 读取的数据源：

```ts
interface Resource {
  uri: string;           // 资源 URI，如 "file:///data/config.json"
  name: string;          // 资源名称
  description: string;   // 资源描述
  mimeType: string;      // MIME 类型
}
```

### <b>3. Prompts (提示词)</b>

预定义的提示词模板，AI 可以使用：

```ts
interface Prompt {
  name: string;
  description: string;
  arguments: PromptArgument[];
}
```

### <b>4. Session (会话)</b>

MCP 是<b>有状态协议</b>，需要通过 Session 维持客户端和服务器之间的连接状态。

```text
Session ID: "abc-123-def"
  ├─ 初始化状态（是否完成握手）
  ├─ 可用工具列表
  ├─ 认证信息
  └─ 上下文数据
```

---

## <b>项目架构概览</b>

### <b>整体架构图</b>

```text
┌──────────────────────────────────────────────────────────────┐
│                    Claude Code CLI (客户端)                   │
│  claude mcp add --transport http mcp-shopify ...             │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/JSON-RPC 2.0
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express 服务器 (app/)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  路由层 (routes/mcp.ts)                                 │  │
│  │  - POST /mcp/:combination_id                           │  │
│  │  - 认证、Session 管理                                   │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                               │
│               ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Session Manager (mcp/mcpSessionManager.ts)            │  │
│  │  - 缓存 Server 实例                                     │  │
│  │  - 管理 Session 生命周期                                │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                               │
│               ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  MCP SDK (@modelcontextprotocol/sdk)                   │  │
│  │  - StreamableHTTPServerTransport                       │  │
│  │  - Server Protocol 处理                                 │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                               │
│               ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  McpServerAdapter (mcp/adapters/mcpServerAdapter.ts)   │  │
│  │  - 动态注册 Tools                                       │  │
│  │  - 处理工具调用                                         │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                               │
│               ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tool Executors (mcp/executors/)                       │  │
│  │  - shopifyToolExecutor.ts (执行 Shopify API)           │  │
│  │  - 其他工具执行器...                                    │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                               │
│               ▼                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  外部 API                                               │  │
│  │  - Shopify API                                         │  │
│  │  - 其他第三方 API                                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### <b>目录结构</b>

```text
app/
├── routes/
│   └── mcp.ts                    # MCP 路由入口
├── mcp/
│   ├── mcpSessionManager.ts      # Session 管理器（核心！）
│   ├── sessionContext.ts         # Session 上下文
│   ├── adapters/
│   │   └── mcpServerAdapter.ts   # MCP Server 适配器
│   └── executors/
│       └── shopifyToolExecutor.ts # 工具执行器
├── models/
│   └── mcpSession.ts             # Session 数据模型
└── services/
    └── mcp/
        └── sessionService.ts     # Session 业务逻辑
```

---

## <b>完整的请求流程</b>

### <b>初始化握手流程</b>

```text
┌─────────┐                                              ┌─────────┐
│ Client  │                                              │ Server  │
└────┬────┘                                              └──���─┬────┘
     │                                                         │
     │ 1️⃣ POST /mcp/xxx                                       │
     │    Method: initialize                                  │
     │    (无 sessionId header)                               │
     ├────────────────────────────────────────────────────────►│
     │                                                         │
     │                                   检测无 sessionId ✓   │
     │                                   创建新 Server 实例    │
     │                                   调用 server.connect() │
     │                                   SDK 生成 sessionId    │
     │                                   注册到 SessionManager │
     │                                   存储到数据库          │
     │                                                         │
     │ Response:                                               │
     │ ◄────────────────────────────────────────────────────────┤
     │ Header: Mcp-Session-Id: abc-123                         │
     │ Body: { result: { capabilities: {...} } }               │
     │                                                         │
     │                                                         │
     │ 2️⃣ POST /mcp/xxx                                       │
     │    Method: notifications/initialized                   │
     │    Header: Mcp-Session-Id: abc-123                     │
     ├────────────────────────────────────────────────────────►│
     │                                                         │
     │                                   从 SessionManager 获取 │
     │                                   已有的 Server 实例 ✓  │
     │                                   标记为已初始化         │
     │                                                         │
     │ HTTP 202 Accepted                                       │
     │ ◄────────────────────────────────────────────────────────┤
     │                                                         │
     │                                                         │
     │ 3️⃣ POST /mcp/xxx                                       │
     │    Method: tools/list                                  │
     │    Header: Mcp-Session-Id: abc-123                     │
     ├────────────────────────────────────────────────────────►│
     │                                                         │
     │                                   复用已初始化的 Server  │
     │                                   返回工具列表 ✓         │
     │                                                         │
     │ Response:                                               │
     │ ◄────────────────────────────────────────────────────────┤
     │ { result: { tools: [...] } }                            │
     │                                                         │
     │                                                         │
     │ 4️⃣ POST /mcp/xxx                                       │
     │    Method: tools/call                                  │
     │    Header: Mcp-Session-Id: abc-123                     │
     ├────────────────────────────────────────────────────────►│
     │                                                         │
     │                                   执行工具调用           │
     │                                   返回结果 ✓            │
     │                                                         │
     │ Response:                                               │
     │ ◄────────────────────────────────────────────────────────┤
     │ { result: { content: [...] } }                          │
     │                                                         │
```

### <b>关键点说明</b>

1. <b>第一次请求（Initialize）</b>

- 客户端不发送 `Mcp-Session-Id` header
- 服务器创建新的 Server 和 Transport 实例
- SDK 自动生成 sessionId（UUID v4）
- 服务器在响应头中返回 `Mcp-Session-Id`

2. <b>第二次请求（Initialized Notification）</b>

- 客户端发送 `Mcp-Session-Id` header
- 服务器从 SessionManager 获取已有实例

   - <b>不再创建新实例</b>（这是关键！）

- SDK 标记该 session 为已初始化

3. <b>后续请求（Tools/List, Tools/Call 等）</b>

- 客户端继续使用同一个 sessionId
- 服务器复用同一个 Server 实例
- 保持会话状态

---

## <b>核心组件详解</b>

### <b>1. StreamableHTTPServerTransport</b>

MCP SDK 提供的 HTTP 传输层实现。

```ts
// app/routes/mcp.ts
const transport = new StreamableHTTPServerTransport({
  // 会话 ID 生成器
  sessionIdGenerator: () => randomUUID(),

  // 会话初始化回调
  onsessioninitialized: async (sessionId: string) => {
    // 存储到数据库
    await createSession({
      sessionId,
      combinationId: combination.combination_id,
      developerId,
      clientAgent: req.headers['user-agent'] || null,
    });

    // 注册到内存缓存
    mcpSessionManager.register(sessionId, serverAdapter, transport, true);

    console.log(`[MCP] Session initialized: ${sessionId}`);
  },

  // 会话关闭回调
  onsessionclosed: async (sessionId: string) => {
    mcpSessionManager.remove(sessionId);
    console.log(`[MCP] Session closed: ${sessionId}`);
  },

  // 启用 JSON 响应（而非 SSE）
  enableJsonResponse: true,
});
```

#### <b>关键配置</b>

- <b>sessionIdGenerator</b>: 生成唯一的 session ID

- <b>onsessioninitialized</b>: 在 `initialize` 请求完成后调用

- <b>enableJsonResponse</b>: `true` = JSON 格式响应，`false` = SSE 流式响应

### <b>2. McpServerAdapter</b>

将我们的工具动态注册到 MCP Server 的适配器。

```ts
// app/mcp/adapters/mcpServerAdapter.ts
export class McpServerAdapter {
  private server: Server;

  constructor(combination: CombinationWithDetails, authSession?: AuthSession) {
    // 创建 MCP Server 实例
    this.server = new Server(
      {
        name: `combination-${combination.combination_id}`,
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: { listChanged: true },
          resources: {},
          prompts: {},
        },
      }
    );

    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.convertToMcpTools(combination.tools),
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const result = await this.executeTool(request.params.name, request.params.arguments);
      return result;
    });
  }

  private async executeTool(toolName: string, args: any) {
    // 根据工具类型选择执行器
    const executor = this.getExecutor(toolName);
    return await executor.execute(toolName, args);
  }
}
```

#### <b>核心方法</b>

- <b>setRequestHandler</b>: 注册不同类型请求的处理器

- <b>ListToolsRequestSchema</b>: 处理 `tools/list` 请求

- <b>CallToolRequestSchema</b>: 处理 `tools/call` 请求

### <b>3. Session Manager</b>

<b>这是本次迭代的核心组件！</b> 解决 "Server not initialized" 问题的关键。

```ts
// app/mcp/mcpSessionManager.ts
class McpSessionManager {
  private sessions = new Map<string, SessionEntry>();

  // 注册新 session
  register(sessionId: string, serverAdapter: McpServerAdapter, transport: StreamableHTTPServerTransport) {
    this.sessions.set(sessionId, {
      sessionId,
      serverAdapter,
      transport,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      isConnected: true,
    });
  }

  // 获取已有 session
  get(sessionId: string): SessionEntry | null {
    const entry = this.sessions.get(sessionId);
    if (!entry) return null;

    // 检查是否过期
    const age = Date.now() - entry.lastAccessedAt.getTime();
    if (age > this.SESSION_TTL_MS) {
      this.remove(sessionId);
      return null;
    }

    // 更新最后访问时间
    entry.lastAccessedAt = new Date();
    return entry;
  }

  // 移除 session
  remove(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.transport.close();
      this.sessions.delete(sessionId);
    }
  }
}
```

#### <b>生命周期管理</b>

```text
Session 创建
    ↓
注册到 Manager (register)
    ↓
后续请求复用 (get)
    ↓
更新最后访问时间
    ↓
30分钟无活动 → 自动清理
    ↓
Session 销毁 (remove)
```

### <b>4. 路由处理逻辑</b>

```ts
// app/routes/mcp.ts
router.post('/:combination_id', async (req, res) => {
  const existingSessionId = req.headers['mcp-session-id'];

  let serverAdapter, transport;

  if (existingSessionId) {
    // 🔄 复用已有 session
    const cachedSession = mcpSessionManager.get(existingSessionId);

    if (cachedSession) {
      // ✅ 从缓存获取
      serverAdapter = cachedSession.serverAdapter;
      transport = cachedSession.transport;
      console.log(`[MCP] Reusing cached session: ${existingSessionId}`);
    } else {
      // ❌ Session 不存在或已过期
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session expired');
    }
  } else {
    // 🆕 创建新 session
    serverAdapter = new McpServerAdapter(combination, authSession);
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: async (sessionId) => {
        // 注册新 session
        mcpSessionManager.register(sessionId, serverAdapter, transport, true);
      },
      enableJsonResponse: true,
    });
  }

  // 连接并处理请求
  if (!existingSessionId) {
    await serverAdapter.getServer().connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});
```

---

## <b>Session 管理机制</b>

### <b>为什么需要 Session Manager？</b>

#### <b>问题：HTTP 是无状态的</b>

```text
请求 1: Initialize
  ├─ 创建 Server 实例 A
  ├─ 调用 server.connect()
  └─ 响应后实例销毁 ❌

请求 2: Tools List (同一个 sessionId)
  ├─ 创建新的 Server 实例 B ❌
  ├─ 实例 B 未初始化
  └─ 返回 "Server not initialized" 错误 ❌
```

#### <b>解决方案：Session Manager 缓存实例</b>

```text
请求 1: Initialize
  ├─ 创建 Server 实例 A
  ├─ 调用 server.connect()
  ├─ 注册到 SessionManager: cache["abc-123"] = 实例 A ✅
  └─ 响应（实例 A 保持在内存中）

请求 2: Tools List (sessionId: "abc-123")
  ├─ 从 SessionManager 获取: cache["abc-123"] ✅
  ├─ 复用实例 A（已初始化）✅
  └─ 成功返回工具列表 ✅
```

### <b>Session 数据结构</b>

```ts
interface SessionEntry {
  sessionId: string;                           // UUID v4
  serverAdapter: McpServerAdapter;             // Server 实例
  transport: StreamableHTTPServerTransport;    // Transport 实例
  createdAt: Date;                             // 创建时间
  lastAccessedAt: Date;                        // 最后访问时间
  isConnected: boolean;                        // 是否已连接
}
```

### <b>Session 状态转换图</b>

```text
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       │ Initialize 请求
       ↓
┌─────────────────┐
│   CREATED       │ ← 创建 Server 实例
│   isConnected:  │   生成 sessionId
│   false         │   注册到 Manager
└──────┬──────────┘
       │
       │ server.connect()
       ↓
┌─────────────────┐
│   CONNECTED     │ ← 标记 isConnected = true
│   isConnected:  │   等待 initialized 通知
│   true          │
└──────┬──────────┘
       │
       │ notifications/initialized
       ↓
┌─────────────────┐
│   INITIALIZED   │ ← 可以处理工具调用
│   可用状态       │   tools/list
└──────┬──────────┘   tools/call
       │
       │ 持续使用
       │ (更新 lastAccessedAt)
       │
       │ 30分钟无活动
       ↓
┌─────────────────┐
│   EXPIRED       │ ← 自动清理
│   已过期        │   transport.close()
└──────┬──────────┘   从 Map 删除
       │
       ↓
┌─────────────┐
│     END     │
└─────────────┘
```

### <b>TTL 清理机制</b>

```ts
// 每 5 分钟执行一次清理
setInterval(() => {
  const now = Date.now();

  for (const [sessionId, entry] of this.sessions.entries()) {
    const age = now - entry.lastAccessedAt.getTime();

    // 超过 30 分钟未使用
    if (age > 30 * 60 * 1000) {
      this.remove(sessionId);
      console.log(`[SessionManager] Cleaned up expired session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000);
```

---

## <b>常见问题与解决方案</b>

### <b>问题 1: "Server not initialized" 错误</b>

<b>症状</b>：

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Bad Request: Server not initialized"
  }
}
```

<b>原因</b>：

- 每次请求创建新的 Server 实例
- Session 状态未保持

<b>解决方案</b>：

- ✅ 使用 Session Manager 缓存实例
- ✅ 根据 sessionId 复用已有实例

### <b>问题 2: "Transport already started" 错误</b>

<b>症状</b>：

```text
Error: Transport already started
    at StreamableHTTPServerTransport.start
```

<b>原因</b>：

- 对同一个 transport 实例多次调用 `server.connect()`

<b>解决方案</b>：

```ts
// 只在首次或重连时调用 connect
if (existingSessionId) {
  const cachedSession = mcpSessionManager.get(existingSessionId);
  if (cachedSession && !cachedSession.isConnected) {
    await serverAdapter.getServer().connect(transport);
    mcpSessionManager.markConnected(existingSessionId);
  }
  // 如果已连接，跳过 connect()
} else {
  // 新 session - 总是 connect
  await serverAdapter.getServer().connect(transport);
}
```

### <b>问题 3: Session 泄漏（内存持续增长）</b>

<b>症状</b>：

- 服务器内存占用持续增长
- Session Map 大小不断增加

<b>原因</b>：

- Session 未正确清理
- 过期 session 仍保留在内存中

<b>解决方案</b>：

- ✅ 实现自动清理机制（TTL）
- ✅ 在 `onsessionclosed` 回调中移除
- ✅ 定期扫描过期 session

### <b>问题 4: 客户端未发送 sessionId</b>

<b>症状</b>：

- 每次请求都创建新 session
- 无法保持状态

<b>原因</b>：

- 客户端未保存第一次响应的 `Mcp-Session-Id` header
- 或未在后续请求中发送

<b>解决方案</b>：

```bash
# 正确的客户端调用方式
# 1. Initialize - 保存响应头中的 sessionId
SESSION_ID=$(curl -D - ... | grep -i "mcp-session-id" | cut -d' ' -f2)

# 2. 后续请求 - 发送 sessionId header
curl -H "Mcp-Session-Id: $SESSION_ID" ...
```

---

## <b>实战示例</b>

### <b>示例 1: 手动测试 MCP 端点</b>

```bash
#!/bin/bash
TOKEN="your-mcp-token"
MCP_URL="http://localhost:3000/mcp/your-combination-id"

# 1️⃣ Initialize
echo "Step 1: Initialize"
RESPONSE=$(curl -s -D /tmp/headers.txt -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }')

echo "$RESPONSE" | jq '.'

# 提取 Session ID
SESSION_ID=$(cat /tmp/headers.txt | grep -i "mcp-session-id" | cut -d' ' -f2 | tr -d '\r')
echo "Session ID: $SESSION_ID"

# 2️⃣ Initialized Notification
echo ""
echo "Step 2: Initialized Notification"
curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }'

# 3️⃣ Tools List
echo ""
echo "Step 3: Tools List"
curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' | jq '.'

# 4️⃣ Call Tool
echo ""
echo "Step 4: Call Tool"
curl -s -X POST "$MCP_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "shopify_article_list",
      "arguments": {
        "shopify_domain": "example.myshopify.com",
        "page": 1,
        "page_size": 10
      }
    }
  }' | jq '.'
```

### <b>示例 2: 在 Claude Code 中使用</b>

```bash
# 添加 MCP Server
claude mcp add --transport http mcp-shopify \
  http://your-server.com/mcp/your-combination-id \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer your-token"

# Claude Code 会自动处理：
# 1. Initialize 握手
# 2. 保存 sessionId
# 3. 发送 initialized 通知
# 4. 后续请求复用 sessionId
```

### <b>示例 3: 调试 Session 状态</b>

```ts
// 添加调试端点
router.get('/debug/sessions', (req, res) => {
  const activeSessions = mcpSessionManager.getActiveSessions();

  res.json({
    count: activeSessions.length,
    sessions: activeSessions.map(sessionId => {
      const entry = mcpSessionManager.get(sessionId);
      return {
        sessionId,
        age: Date.now() - entry.createdAt.getTime(),
        lastAccessedAgo: Date.now() - entry.lastAccessedAt.getTime(),
        isConnected: entry.isConnected,
      };
    }),
  });
});
```

访问：

```bash
curl http://localhost:3000/debug/sessions | jq '.'
```

输出：

```json
{
  "count": 2,
  "sessions": [
    {
      "sessionId": "abc-123-def",
      "age": 120000,
      "lastAccessedAgo": 5000,
      "isConnected": true
    },
    {
      "sessionId": "xyz-789-ghi",
      "age": 300000,
      "lastAccessedAgo": 180000,
      "isConnected": true
    }
  ]
}
```

---

## <b>总结</b>

### <b>MCP 实现的关键要点</b>

1. <b>有状态协议</b>

- 需要完整的初始化握手
- Session 必须在请求间保持

2. <b>Session Manager 是核心</b>

- 解决 HTTP 无状态与 MCP 有状态的矛盾
- 缓存 Server 实例，避免重复创建

3. <b>正确的生命周期管理</b>

- 注册（onsessioninitialized）
- 复用（get 方法）
- 清理（TTL + onsessionclosed）

4. <b>避免常见陷阱</b>

- 不要多次调用 `server.connect()`
- 不要忘记清理过期 session
- 客户端必须发送 sessionId header

### <b>最佳实践</b>

✅ <b>DO</b>

- 使用 Session Manager 管理实例生命周期
- 实现自动清理机制
- 记录详细的日志（session 创建、复用、清理）
- 提供调试端点查看 session 状态

❌ <b>DON'T</b>

- 不要每次请求都创建新实例
- 不要忽略 `notifications/initialized` 通知
- 不要让 session 无限堆积
- 不要在客户端忘记发送 sessionId

### <b>进一步学习</b>

- 📖 [MCP 官方文档](https://modelcontextprotocol.io)
- 📦 [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- 💻 [本项目代码](https://github.com/your-repo)

---

<b>编写时间</b>: 2025-11-13

<b>版本</b>: v1.0

<b>作者</b>: Claude (基于本项目实现经验)