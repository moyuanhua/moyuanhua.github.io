<!--
========================================
Sync Impact Report
========================================
Version change: [INITIAL] → 1.0.0
Modified principles: N/A (Initial creation)
Added sections: All core sections added
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Reviewed and aligned
  ✅ spec-template.md - Reviewed and aligned
  ✅ tasks-template.md - Reviewed and aligned
Follow-up TODOs: None
========================================
-->

# Murphy Blog Constitution

## Core Principles

### I. Content-First Philosophy

内容创作者应该专注于写作本身,而非技术实现细节。本项目必须保持"在飞书文档中写作,自动发布到网站"的核心体验。

**原则细节**:
- 所有功能设计必须优先考虑内容创作者的体验
- 技术复杂性必须对内容创作者完全透明
- 不得要求内容创作者学习Git、Markdown语法或任何技术工具
- 飞书文档是内容的唯一真实来源(Single Source of Truth)

**理由**: 降低内容创作门槛是本项目的核心价值主张,任何违背此原则的设计都会削弱项目的根本目的。

### II. 双引擎架构

本项目必须同时遵循 feishu-pages 的同步规则和 Docusaurus 的技术架构。这两个引擎缺一不可。

**原则细节**:
- **feishu-pages引擎**: 负责从飞书API获取文档并转换为Markdown
  - 必须严格遵守飞书API限流规则(100请求/分钟,300ms间隔)
  - 必须保持目录结构一致性
  - 必须正确处理元数据(sidebar_position, hide等)
  - 必须下载并处理资源文件(图片、附件、白板)
- **Docusaurus引擎**: 负责将Markdown渲染为静态网站
  - 必须遵循Docusaurus的文件组织规范
  - 必须使用MDX支持React组件
  - 必须支持国际化和版本管理
  - 必须保持构建性能和SEO优化

**理由**: 两个引擎各司其职,feishu-pages解决内容同步问题,Docusaurus解决网站生成问题,任何一方的削弱都会导致整个系统失效。

### III. API限流与容错 (NON-NEGOTIABLE)

与飞书API的交互必须严格遵守限流规则,并具备完善的容错机制。

**原则细节**:
- 必须在请求间添加至少300ms延迟
- 必须实现指数退避重试机制
- 必须记录所有API错误和重试情况
- 必须提供清晰的错误信息给开发者
- 必须在达到限流前主动降速
- 严禁使用并发请求绕过限流
- 严禁在未确认权限的情况下执行API调用

**理由**: 飞书API限流是硬性约束,违反将导致服务不可用。此外,良好的容错机制确保在网络不稳定或飞书服务波动时系统仍能可靠运行。

### IV. 权限与安全

所有敏感信息必须通过环境变量管理,严禁硬编码。

**原则细节**:
- App ID和App Secret必须通过环境变量配置
- 必须在文档中明确说明所需的飞书API权限范围:
  - `docx:document:readonly` - 读取文档
  - `wiki:wiki:readonly` - 读取知识库
  - `drive:drive:readonly` - 读取云文档
  - `board:whiteboard:node:read` - 读取白板(可选)
- 严禁在代码仓库中提交包含凭证的文件
- 严禁在日志中输出完整的访问令牌
- 必须在README中提供安全配置指南

**理由**: 凭证泄露会导致严重的安全问题,保护飞书应用凭证是系统安全的基础。

### V. 元数据与目录结构

必须忠实保留飞书文档的目录结构,并正确转换元数据以支持Docusaurus的特性。

**原则细节**:
- 目录层级必须与飞书知识库保持一致
- 必须支持通过Page Meta控制文档行为(如`hide: true`)
- 必须生成Docusaurus兼容的元数据(`sidebar_position`等)
- 必须支持自定义URL模式
- 必须正确处理中文路径和文件名
- 文档标题必须从飞书文档提取,不得随意更改

**理由**: 保持结构一致性让内容创作者能在飞书中完全掌控网站的信息架构,这是"内容优先"原则的具体体现。

### VI. 资源处理与性能

图片、附件等资源必须可靠下载并优化,同时保持构建性能。

**原则细节**:
- 必须下载所有文档引用的图片到本地
- 必须支持ImageMagick等工具进行图片后处理
- 白板图片必须转换为可渲染的格式
- 必须缓存已下载的资源避免重复下载
- 必须在资源下载失败时提供降级方案
- 构建时间必须在合理范围内(建议<5分钟)

**理由**: 用户体验依赖于完整的内容呈现,资源缺失会严重影响阅读体验;同时频繁的完整重建会降低开发效率。

### VII. CI/CD集成

本项目必须支持GitHub Actions等CI/CD工具的自动化部署。

**原则细节**:
- 必须提供可复用的CI/CD配置示例
- 同步脚本必须能在无人值守模式下运行
- 必须支持增量更新(仅同步变更的文档)
- 必须提供构建状态的清晰反馈
- 失败时必须提供可操作的错误信息
- 必须支持定时触发和手动触发

**理由**: 自动化是"内容创作者只需关注写作"这一承诺的关键,手动部署会破坏整个用户体验。

## Technology Standards

### 技术栈约束

- **Node.js**: >=20.0 (与Docusaurus 3.x兼容)
- **Package Manager**: Yarn或Bun(推荐Bun以提升性能)
- **核心依赖**:
  - `feishu-pages`: ^0.7.6或更高版本
  - `@docusaurus/core`: 3.9.2或更高版本
  - TypeScript: ~5.6.2
- **可选依赖**:
  - ImageMagick: 用于白板图片处理
  - Algolia: 用于搜索功能

### 文件组织规范

```
project-root/
├── app/                    # Docusaurus应用根目录
│   ├── docs/              # Markdown文档目录(由feishu-pages生成)
│   ├── blog/              # 博客文章(可选)
│   ├── src/               # 自定义React组件和页面
│   ├── static/            # 静态资源
│   ├── docusaurus.config.js  # Docusaurus配置
│   └── package.json
├── scripts/               # 同步脚本
│   └── sync-feishu.js    # feishu-pages调用脚本
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD配置
├── .env.example          # 环境变量示例
└── README.md             # 项目文档
```

### 配置管理

- 所有环境特定的配置必须通过环境变量注入
- 必须提供`.env.example`展示所需的所有变量
- Docusaurus配置应支持多环境(dev/prod)
- 飞书同步配置应与Docusaurus配置分离

## Development Workflow

### 内容更新流程

1. **内容创作**: 创作者在飞书文档中编写/更新内容
2. **自动同步**: CI/CD定时触发或通过webhook触发同步
3. **内容提取**: feishu-pages从飞书API拉取更新
4. **Markdown转换**: 将飞书格式转换为Docusaurus兼容的Markdown
5. **资源下载**: 下载并处理图片、附件等资源
6. **网站构建**: Docusaurus构建静态网站
7. **部署发布**: 将构建产物部署到托管平台(GitHub Pages/Vercel等)

### 开发规范

- 修改feishu-pages集成逻辑前必须运行测试验证
- 修改Docusaurus配置后必须本地构建验证
- 新增React组件必须遵循Docusaurus的组件规范
- 必须在PR中说明对同步流程或构建流程的影响
- 必须更新文档反映配置变更

### 错误处理要求

- API错误必须区分可重试和不可重试
- 网络错误必须自动重试(最多3次)
- 权限错误必须立即失败并给出配置指引
- 资源下载失败应记录警告但不中断整体流程
- 构建失败必须保留详细日志用于排查

## Quality Gates

### 同步质量检查

在每次同步完成后必须验证:
- [ ] 所有飞书文档都已转换为Markdown文件
- [ ] 目录结构与飞书知识库一致
- [ ] 元数据正确生成且格式合规
- [ ] 所有引用的图片都已下载
- [ ] 没有损坏的内部链接

### 构建质量检查

在每次构建完成后必须验证:
- [ ] Docusaurus构建成功无报错
- [ ] 所有Markdown文件都被正确渲染
- [ ] 导航栏和侧边栏正确生成
- [ ] 搜索功能可用(如已配置)
- [ ] 移动端响应式布局正常

### 性能检查

- 同步时间不应超过文档数量的合理预期(约1秒/文档)
- 构建时间不应超过5分钟(小型站点)或15分钟(大型站点)
- 生成的网页Lighthouse得分应>=90(性能、可访问性、SEO)

## Governance

### 宪章优先级

本宪章是本项目的最高规范,任何代码、配置或文档与宪章冲突时以宪章为准。

### 修订流程

1. **提案**: 在issue中提出修订理由和具体变更
2. **讨论**: 至少3个工作日的公开讨论期
3. **审批**: 需要项目维护者(maintainer)批准
4. **迁移计划**: 如涉及破坏性变更,必须提供迁移指南
5. **版本递增**: 按语义化版本规则更新版本号
6. **同步更新**: 更新所有相关模板和文档

### 版本规则

- **MAJOR**: 删除或重新定义核心原则,破坏向后兼容性
- **MINOR**: 新增原则或显著扩展现有原则
- **PATCH**: 文字澄清、错别字修正、非语义调整

### 合规审查

- 所有PR必须在描述中说明对宪章的符合性
- 违反"NON-NEGOTIABLE"原则的PR将直接拒绝
- Code Review必须验证对"双引擎架构"的遵守情况
- CI/CD必须强制执行API限流和安全配置检查

### 例外处理

如果确实需要违背某项原则:
1. 必须在PR中明确标注`[CONSTITUTION EXCEPTION]`
2. 必须详细说明违背的原因和权衡分析
3. 必须提供替代方案的对比说明
4. 需要至少两位维护者审批
5. 必须在代码中添加注释说明例外情况

**Version**: 1.0.0 | **Ratified**: 2025-01-13 | **Last Amended**: 2025-01-13
