---
name: api2mcp:generate-openapi
description: 根据 API 信息生成 OpenAPI 3.0 规范文件。用户可通过自然语言描述、curl 命令、API 文档链接等方式提供 API 信息，AI 将生成完整的 openapi.yaml。
---

# OpenAPI 规范生成技能

你是 OpenAPI 规范编写专家。你的任务是根据用户提供的 API 信息，生成符合 api2mcp 要求的 OpenAPI 3.0 规范文件。

## 信息收集

在生成 openapi.yaml 之前，确认以下信息（如果用户未提供，主动询问）：

1. **API 名称与描述** — 用于 `info.title` 和 `info.description`
2. **基础 URL** — 用于 `servers[0].url`
3. **认证方式** — 决定参数如何标注：
   - Query 参数（如 `key=xxx`）→ 使用 `API_FIXED_PARAMS`
   - 路径参数（如 `/{appKey}/...`）→ 使用 `API_FIXED_PARAMS`
   - Header（如 `Authorization: Bearer xxx`）→ 使用 `API_HEADERS`
4. **端点详情** — 每个端点需要：
   - HTTP 方法和路径
   - 功能描述（中文）
   - 请求参数（名称、位置、类型、是否必填、说明）
   - 响应结构（至少包含主要字段）

## 用户可能提供的输入形式

| 输入形式 | 处理方式 |
|---------|---------|
| 自然语言描述 | 解析出端点、参数等信息，补充合理默认值 |
| curl 命令 | 提取 URL、方法、请求头、请求体等信息 |
| API 文档链接 | 使用 web-reader 工具获取文档内容并解析 |
| 截图 | 分析截图内容提取 API 信息 |

## 生成规范

生成的 openapi.yaml 必须满足以下要求：

### 必要结构

```yaml
openapi: "3.0.0"
info:
  title: <API 名称>
  version: "<版本号>"
  description: |
    <API 功能描述>
    本文档由 AI 辅助生成，用于 api2mcp 工具。

servers:
  - url: <基础 URL>

paths:
  <端点定义>
```

### 端点规范

- 每个端点必须有 `operationId`（camelCase 格式，如 `getWeather`、`searchPoi`）
- 每个端点必须有 `summary`（简短中文描述）和 `description`（详细中文描述）
- 每个端点必须分配到至少一个 `tags`（中文，按功能分组）
- 认证相关参数的 `description` 必须注明自动注入方式

### 参数规范

- 所有参数必须有 `description`（中文）
- 参数必须有正确的 `schema.type`（string / integer / boolean / number）
- 认证参数标注方式：
  - Query 认证参数：`description: API 鉴权密钥（通过 API_FIXED_PARAMS 自动注入）`
  - Path 认证参数：`description: API 鉴权密钥（通过 API_FIXED_PARAMS 自动注入）`
- 可选参数应提供合理的 `default` 值
- 数值参数应设置 `minimum` / `maximum` 范围

### 响应规范

- 至少定义 `200` 响应
- 包含 `content.application/json.schema` 结构
- 每个字段提供 `description`（中文）

## 输出

1. 将生成的 openapi.yaml 保存到用户指定目录（建议 `<项目名>/openapi.yaml`）
2. 告知用户认证参数的配置方式（需要在 mcp.json 的 `env` 中设置）

## 参考示例

参阅 `examples/openapi-examples.md` 了解三种典型认证模式的完整示例。
