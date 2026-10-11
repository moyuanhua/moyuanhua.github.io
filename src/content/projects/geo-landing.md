---
title: geo-landing
tagline: 输入一个独立站域名，60 秒出一张「AI 可发现性体检」分数卡。
description: 零依赖 Cloudflare Worker：检查一家店在 AI 搜索时代是否「可被发现」，给出 0–100 分与同赛道排名。是「独立站 × AI 可见度」服务的获客入口。
role: 作者
period: "2026"
stack: [TypeScript, Cloudflare Workers]
status: active
live: https://geo-landing.moyuanhua-ch-281.workers.dev
featured: true
order: 0
---

<section>
  <h2>它解决什么</h2>
  <p>
    2026 年，AI 购物助手开始替用户「读」一家店。但商家自己完全不知道：
    <strong>我的店，AI 读得懂吗？它会在推荐里提到我吗？</strong>
    这个工具给了一个 60 秒能看懂的回答——一个 0–100 的分数，加同赛道排名。
  </p>

  <h2>怎么做</h2>
  <p>
    检查 AI 购物链路用来理解一家店的 5 个标准入口，按重要性加权，全程<strong>确定性规则打分、不调 LLM</strong>：
  </p>
  <ul>
    <li><code>/agents.md</code>（40 分）</li>
    <li><code>/llms.txt</code>（20 分）</li>
    <li><code>/llms-full.txt</code>（15 分）</li>
    <li><code>/.well-known/ucp</code>（15 分）</li>
    <li><code>/sitemap_agentic_discovery.xml</code>（10 分）</li>
  </ul>
  <p>
    它是一个<strong>零依赖的 Cloudflare Worker</strong>：输入域名、流式返回每一步检查、最后给出分数卡与可转发图片。
    没有登录、没有数据库、没有计费——它不是一个 SaaS，是一个<strong>获客工具</strong>。
  </p>

  <h2>结果</h2>
  <p>
    上线前我先扫了 <strong>77 个真实独立站</strong>，结果是这次做产品最有价值的一段：
  </p>
  <ul>
    <li>中位分 <strong>53</strong>、平均 39、最高 80、最低 0</li>
    <li><strong>55% 的店正好卡在 53 分</strong>；19% 得 0 分；只有 4 家上 60</li>
    <li>2026 年 Shopify 已替所有店铺自动生成那 5 个文件——<strong>全站同一套模板，只换品牌名</strong></li>
  </ul>
  <p>
    所以 53 分不代表「这家店做对了什么」，只代表「这家店开了 Shopify 店铺」。
    真正自己写过内容的极少：<code>/llms.txt</code> 只有 9 家自己写，<code>/agents.md</code> 只有 2 家。
  </p>

  <h2>学到什么</h2>
  <p>
    差异化不在「把文件补上」——平台已经代发了。真正值钱的是
    <strong>把全站一样的模板，换成代表这家品牌的内容</strong>，而这需要人工。
    另一个收获是：<strong>「分数 + 同赛道排名」本身就是社交货币</strong>——它天然可转发，比任何落地页都好用。
  </p>
</section>
