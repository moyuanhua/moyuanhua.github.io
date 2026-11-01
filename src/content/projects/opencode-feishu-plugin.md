---
title: opencode-feishu-plugin
tagline: 把 OpenCode 接进飞书——一个飞书话题就是一个 OpenCode 会话，权限审批直接在卡片上点按钮。
description: opencode v2 飞书插件：纯长连接收发事件与卡片回调，零公网端点，最小权限。
role: 作者
period: "2026"
stack: [TypeScript, OpenCode V2, 飞书开放平台, WebSocket]
status: active
repo: https://github.com/moyuanhua/opencode-feishu-plugin
featured: true
order: 1
---

<section>
  <h2>它解决什么</h2>
  <p>
    OpenCode 是个强大的编码 Agent，但它活在终端里。这个插件把
    <strong>一个飞书话题 = 一个 OpenCode 会话</strong>，让你在手机上也能盯着 Agent 干活：
    工具调用实时上卡、权限请求变成飞书卡片上的按钮、随时强制停止。
  </p>

  <h2>亮点</h2>
  <ul>
    <li><strong>纯长连接</strong>：WebSocket 收发事件与卡片回调，不监听端口、不需要公网地址。</li>
    <li><strong>最小权限</strong>：只要 2 个 scope，不申请任何群权限，机器人物理上收不到群消息。</li>
    <li><strong>话题即会话</strong>：一个话题对应一个会话，主聊天流只做管理，互不串台。</li>
    <li><strong>卡片审批</strong>：允许一次 / 始终允许 / 本会话内允许 / 拒绝，自签 token 防伪防重放。</li>
    <li><strong>可控可停</strong>：每张回复卡带强制停止，看门狗自动中断卡死会话，支持排队与插队。</li>
    <li><strong>图片 / 文件</strong>：飞书里的图片、文件自动下载并挂进会话。</li>
  </ul>

  <h2>要点</h2>
  <p>
    最关键的取舍是<strong>不申请群权限</strong>：单人边界由平台的 scope 层保证，而不是只靠代码判断。
    这让"一个人的遥控台"在架构上就成立，而不只是靠约定。
  </p>

  <h2>工程质量：849 个测试，和三类「静默失败」</h2>
  <p>
    这类插件最容易死的地方不是调不通 API，而是<strong>看起来通了、其实静默坏掉</strong>。
    项目用 <strong>849 个测试</strong>覆盖边界与回归，线上遇到并修掉的三类静默失败：
  </p>
  <ul>
    <li><strong>pid 复用导致锁残留</strong>：进程号被系统复用后旧锁仍被判定有效，会话永久卡死 →
    改成按会话粒度的锁，不再依赖 pid。</li>
    <li><strong>消息重推晚到</strong>：平台重试导致过期事件被当成新指令执行 →
    加 <strong>120 秒时效窗口</strong>，超时事件直接丢弃。</li>
    <li><strong>字段名不一致</strong>：<code>reply</code> 与 <code>decision</code> 混用，导致兜底分支静默不生效 →
    收发两侧加字段校验，宁可报错也不要静默降级。</li>
  </ul>
  <p>
    共同点：<strong>不报错的 bug 最贵</strong>。所以这套插件的设计原则是「宁可显式失败，不要安静地正确」。
  </p>
</section>
