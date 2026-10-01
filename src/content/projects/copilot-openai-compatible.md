---
title: copilot-openai-compatible
tagline: 一个 OpenAI 兼容的 HTTP API 服务，把请求转发给 GitHub Copilot。
description: 通过 @github/copilot-sdk 把 GitHub Copilot 包装成 OpenAI chat-completions 接口，任何只懂 OpenAI 协议的框架都能接入。
role: 作者
period: "2026"
stack: [TypeScript, Node.js, Docker, SSE]
status: active
repo: https://github.com/moyuanhua/copilot-openai-compatible
featured: true
order: 3
---

<section>
  <h2>它解决什么</h2>
  <p>
    LangChain、LiteLLM、Open WebUI 这类工具只会说 OpenAI 的 chat-completions 协议。
    这个服务把它翻译成 <strong>GitHub Copilot</strong>：指过来，就能把 Copilot 当成后端用。
  </p>

  <h2>接口</h2>
  <table>
    <thead>
      <tr><th>端点</th><th>说明</th></tr>
    </thead>
    <tbody>
      <tr><td><code>GET /health</code></td><td>健康检查</td></tr>
      <tr><td><code>GET /v1/models</code></td><td>列出 Copilot 可用模型（OpenAI 格式）</td></tr>
      <tr><td><code>POST /v1/chat/completions</code></td><td>标准 ChatCompletion 请求</td></tr>
    </tbody>
  </table>

  <h2>要点</h2>
  <ul>
    <li>支持 SSE 流式输出、<code>tools</code> 透传到 Copilot SDK。</li>
    <li>会话有 TTL 回收，闲置即释放。</li>
    <li>采样参数（temperature 等）接受但不转发——采样由 Copilot 控制。</li>
  </ul>
</section>
