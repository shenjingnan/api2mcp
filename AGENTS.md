# api2mcp 项目指南

## 项目概述

api2mcp 是一个 CLI 工具，将 OpenAPI/Swagger 规范一键转换为 MCP（Model Context Protocol）工具，让 AI 助手能够无缝调用 REST API。

支持两种工作模式：
- **default**：直接将所有 API 转换为 MCP 工具
- **ondemand**：提供发现式工具（list/search/detail/execute），按需加载和调用 API

## 技术栈

- TypeScript（strict 模式）、ESM 模块系统
- Node.js >= 20、pnpm 10
- tsup 构建（输出 CJS + ESM 双格式）
- Vitest 测试 + v8 覆盖率
- Biome 代码检查和格式化
- cspell 拼写检查
- husky + lint-staged 预提交钩子

## 常用命令

```bash
pnpm build          # 构建
pnpm dev            # 监听模式构建
pnpm start          # 运行 CLI
pnpm test           # 运行测试
pnpm test:watch     # 监听模式测试
pnpm test:coverage  # 生成覆盖率报告
pnpm lint           # 代码检查
pnpm lint:fix       # 自动修复
pnpm typecheck      # 类型检查
pnpm spellcheck     # 拼写检查
```

## 项目结构

```
src/
├── cli.ts              # CLI 入口（commander）
├── index.ts            # 库入口导出
├── config/             # 配置加载与校验
│   ├── types.ts        # 配置类型定义
│   └── loader.ts       # 配置加载逻辑
├── parser/             # OpenAPI 文档解析
│   ├── types.ts        # 解析相关类型
│   └── swagger.ts      # Swagger/OpenAPI 解析
├── converter/          # API 到 MCP 工具转换
│   ├── schema-converter.ts  # Schema 转换
│   └── tool-generator.ts    # 工具定义生成
├── executor/           # HTTP 请求执行
│   ├── http-client.ts       # HTTP 客户端
│   └── request-builder.ts   # 请求构建器
├── server/             # MCP 服务器
│   ├── index.ts        # 服务器创建与启动
│   └── tool-manager.ts # 工具注册管理
├── registry/           # API 注册表（ondemand 模式）
│   ├── types.ts
│   ├── index.ts
│   └── api-registry.ts
├── tools/              # 内置工具定义
│   └── discovery/      # 发现式工具（list/search/detail/execute）
└── utils/              # 通用工具
    ├── error.ts        # 自定义错误类继承体系
    └── logger.ts       # 日志工具（输出到 stderr）
```

## 代码规范

### 格式化（Biome）
- 单引号、2 空格缩进、行宽 100
- ES5 尾逗号
- 自动 import 排序

### TypeScript
- strict 模式，禁止 `any` 类型
- import 路径使用 `.js` 后缀（ESM 兼容，如 `'./config/loader.js'`）
- 启用 `noUnusedLocals`、`noUnusedParameters`、`noImplicitReturns`、`noFallthroughCasesInSwitch`

### 注释
- 注释和 JSDoc 使用中文
- 每个模块有独立的类型文件（types.ts）

### 错误处理
- 使用自定义错误类继承体系：`Api2McpError` → `ConfigurationError` / `OpenApiParseError` / `ToolExecutionError` / `HttpError`
- 错误类包含 `code` 属性用于错误分类

### 日志
- 所有日志输出到 stderr（`console.error`），不干扰 MCP stdio 协议
- 日志级别：debug / info / warn / error

## Git 规范

- 使用 Conventional Commits 格式，描述使用中文
- 提交前自动运行 lint-staged（Biome 检查 + 拼写检查）
- 分支命名使用 `feature/`、`bugfix/`、`docs/`、`test/` 前缀

## 测试规范

- 测试框架：Vitest
- 测试文件位于 `tests/` 目录，按模块组织
- 测试描述使用中文（`describe` / `it` / `test`）
- 测试 fixtures 放在 `tests/fixtures/`
- 覆盖率工具：v8，排除 node_modules、dist、tests、配置文件
- pre-commit 会运行完整检查链

## CI 流程

- 三平台（Ubuntu / Windows / macOS）× Node 24 矩阵测试
- 检查顺序：lint → build → typecheck → spellcheck → test:coverage
- 覆盖率报告上传 Codecov
