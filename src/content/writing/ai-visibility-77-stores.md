---
title: 我测了 77 家独立站：AI 能看到你的店，但分不清你是谁
description: 给 77 家独立站跑的「AI 可发现性」实测。中位分 53，一半以上的店卡在同一个数字——那不是它们做得好，是 Shopify 替你生成的默认文件。真正自己写过内容的，只有 9 家。
date: 2026-10-11
type: essay
tags: [独立站, AI搜索, GEO]
draft: true
---

<section>
  <p>
    如果你的店在 ChatGPT、豆包、Perplexity 里搜不到，问题可能不是「没被收录」——
    而是<strong>被收录了，但和另外 41 家店长得一模一样</strong>。
  </p>

  <h2>我测了什么</h2>
  <p>
    我给 77 个独立站域名跑了同一套检查，看的是 2026 年 AI 购物链路用来「读懂一家店」的
    5 个标准入口：
  </p>
  <ul>
    <li><code>/agents.md</code></li>
    <li><code>/llms.txt</code></li>
    <li><code>/llms-full.txt</code></li>
    <li><code>/.well-known/ucp</code></li>
    <li><code>/sitemap_agentic_discovery.xml</code></li>
  </ul>
  <p>
    检查不打分主观内容，只看两件事：这些文件在不在，以及<strong>是不是这家店自己的内容</strong>。
  </p>

  <h2>数据</h2>
  <p>77 家，中位分 53，平均 39，最高 80，最低 0。</p>
  <ul>
    <li><strong>42 家（55%）正好 53 分</strong></li>
    <li>15 家（19%）0 分——连默认文件都没有</li>
    <li>只有 4 家在 60 分以上</li>
  </ul>
  <p>
    关键不是分数高低，而是那个扎堆的 <strong>53</strong>。
  </p>

  <h2>53 分是怎么来的</h2>
  <p>
    2026 年，Shopify 已经替所有店铺自动生成了上面那 5 个文件。内容是全站<strong>同一套模板</strong>，
    只替换了品牌名。
  </p>
  <p>
    所以 53 分不代表「这家店做对了什么」，它只代表「这家店开了 Shopify 店铺」。
  </p>
  <p>真正自己写过内容的，少得可怜：</p>
  <ul>
    <li><code>/llms.txt</code>：48 家用平台默认模板，只有 <strong>9 家</strong>写了属于自己的内容</li>
    <li><code>/agents.md</code>：48 家默认，只有 <strong>2 家</strong>自己写</li>
    <li><code>/llms-full.txt</code>：47 家默认，只有 <strong>3 家</strong>自己写</li>
  </ul>

  <h2>这意味着什么</h2>
  <p>
    AI 要推荐一家店，得先「读懂」它卖什么、凭什么值得信任。当 40 多家店的自我介绍长得一模一样时，
    AI 只能用最低限度的通用信息——你也就只能当「众多卖同类商品的店之一」。
  </p>
  <blockquote>
    默认文件让你「在」，但不让你「被选中」。
  </blockquote>

  <h2>所以能做什么</h2>
  <ol>
    <li>先确认你的店是「53 分俱乐部」的一员，还是连文件都没有的那 19%。</li>
    <li>把那套默认模板换成代表你自己品牌的内容：卖什么、和谁不一样、有什么可被验证的事实。</li>
    <li>把它当成常态动作，不是一次性设置——AI 搜索的规则半年就会变一轮。</li>
  </ol>
</section>
