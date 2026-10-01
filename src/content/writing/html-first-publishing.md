---
title: 为什么用 HTML 发布内容，而不是 Markdown
date: 2024-06-01
description: HTML 是 Markdown 的超集——更丰富的表现力、可交互，以及 AI 时代无摩擦的生成工作流。
tags: [html, publishing, ai]
---

<section>
  <p>
    Markdown 是写作的利器，但它有一个根本限制：<strong>它只是 HTML 的一个子集</strong>。
    当你要内嵌交互图表、Canvas 动画、自定义布局时，Markdown 要么依赖插件，要么只能放弃。
  </p>

  <h2>HTML 能做、Markdown 做不到的事</h2>
  <ul>
    <li>任意 CSS 布局（Grid、Flexbox、自定义样式）</li>
    <li>内嵌 <code>&lt;canvas&gt;</code>、<code>&lt;video&gt;</code>、<code>&lt;iframe&gt;</code></li>
    <li>交互式组件（无需框架，原生 JS 即可）</li>
    <li>精确的排版控制，不被渲染器覆盖</li>
  </ul>

  <h2>AI 时代的优势</h2>
  <p>
    AI 生成 HTML 的质量已经很高。你描述一个布局或交互，它直接输出可运行的 HTML——
    <strong>这个文件本身就是发布单元</strong>，不需要额外的渲染步骤。
  </p>

  <blockquote>
    Markdown 是给人写的，HTML 是给机器（浏览器、AI）写的。AI 时代，这个区别更显著。
  </blockquote>

  <h2>本站的做法</h2>
  <p>
    这个站用 <code>.md</code> 文件，但正文支持完整 HTML：frontmatter 处理元数据，body 随便写。
    简单文章用纯 Markdown，复杂内容用 HTML，AI 生成直接接受输出、零转换。
  </p>
</section>
