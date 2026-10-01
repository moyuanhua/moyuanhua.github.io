---
title: OpenTask
tagline: 把 AI Agent 接入你的工程任务流——你建任务、启动，Agent 自主执行，完成后回来等你审批。
description: 为 AI Agent 协作设计的轻量任务管理系统：任务看板、Agent 执行日志、审批队列。
role: 作者
period: "2026"
stack: [TypeScript, NestJS, Web]
status: active
repo: https://github.com/moyuanhua/OpenTask
featured: true
order: 2
---

<section>
  <h2>它解决什么</h2>
  <p>
    传统任务管理工具的对象是人：分配任务、人去做、回来汇报。OpenTask 的对象是
    <strong>Agent</strong>：你描述任务，Agent 去做，做完找你确认。人始终是最后一道关卡，
    但过程里不需要一直盯着它。
  </p>

  <pre><code>你创建任务 → 启动 Agent → Agent 自主执行 → Agent 请求审批 → 你审批 → 完成</code></pre>

  <h2>界面</h2>
  <ul>
    <li><strong>Dashboard</strong>：一览全局。</li>
    <li><strong>Projects / 任务看板</strong>：按项目组织与推进。</li>
    <li><strong>Agent 执行日志</strong>：实时追踪每一步。</li>
    <li><strong>Approvals</strong>：Agent 完成后进入审批队列，你决定是否通过。</li>
  </ul>

  <h2>要点</h2>
  <p>
    核心设计是<strong>把审批变成一等公民</strong>。Agent 越自主，"人在环上"的检查点就越重要——
    OpenTask 把"请求审批"做成流程里显式的一步，而不是事后 review。
  </p>
</section>
