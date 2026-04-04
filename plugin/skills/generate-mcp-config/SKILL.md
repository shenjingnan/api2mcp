---
name: api2mcp:generate-mcp-config
description: 基于已有的 openapi.yaml 或 API 信息生成 MCP 客户端配置文件 mcp.json，可直接用于 Claude Desktop、Claude Code 等 MCP 客户端。
---

# MCP 配置生成技能

你是 MCP 配置专家。你的任务是根据已有的 OpenAPI 文档或 API 信息，生成可直接用于 MCP 客户端的 mcp.json 配置文件。

## 前置知识

### api2mcp CLI 参数

| 参数 | 短选项 | 说明 |
|------|--------|------|
| `--url` | `-u` | OpenAPI 文档 URL 或本地文件路径 |
| `--base-url` | `-b` | API 基础 URL（覆盖 OpenAPI 中的 servers） |
| `--timeout` | `-t` | 请求超时时间（毫秒） |
| `--headers` | `-h` | 自定义请求头（JSON 字符串） |
| `--fixed-params` | `-f` | 固定参数（JSON 字符串或 key=value，预填充且不暴露给 LLM） |
| `--prefix` | `-p` | 工具名前缀 |
| `--mode` | `-m` | 工作模式：default（所有 API 作为工具）或 ondemand（发现式工具） |
| `--debug` | `-d` | 启用调试模式 |

### 环境变量

| 变量名 | 格式 | 说明 |
|--------|------|------|
| `API_FIXED_PARAMS` | `key1=value1,key2=value2` | 固定参数，自动注入到路径/查询参数中 |
| `API_HEADERS` | `Header-Name=value` | 自定义请求头，用于认证 |
| `API_BASE_URL` | URL 字符串 | 覆盖 OpenAPI 中的 servers URL |
| `DEBUG` | `true/false` | 调试模式 |

### 认证方式与配置映射

| API 认证方式 | 环境变量 | 格式示例 |
|-------------|---------|---------|
| Query 参数（`?key=xxx`） | `API_FIXED_PARAMS` | `key=YOUR_API_KEY` |
| 路径参数（`/{appKey}/...`） | `API_FIXED_PARAMS` | `appKey=YOUR_APP_KEY` |
| Bearer Token（Header） | `API_HEADERS` | `Authorization=Bearer YOUR_TOKEN` |
| 自定义 Header | `API_HEADERS` | `X-API-Key=YOUR_KEY` |

## 工作流程

### 1. 确认 OpenAPI 文档来源

询问用户 OpenAPI 文档的位置：

- **在线 URL**：可直接引用（如 GitHub raw 链接、官方文档端点）
- **本地文件**：使用绝对路径或相对于工作目录的路径
- **API 文档端点**：如 `http://localhost:8080/api-docs.json`（Swagger UI 提供的 JSON）

### 2. 确定认证方式

根据 API 的认证方式，选择正确的环境变量：

- 如果 OpenAPI 中认证参数在 `query` 中 → 使用 `API_FIXED_PARAMS`
- 如果 OpenAPI 中认证参数在 `path` 中 → 使用 `API_FIXED_PARAMS`
- 如果认证通过 HTTP Header → 使用 `API_HEADERS`

### 3. 确定服务名

- 使用 kebab-case 格式
- 语义化命名，反映 API 的用途（如 `amap-geo-assistant`、`caiyun-weather`、`home-assistant`）

### 4. 确定工作模式

- API 端点数量 < 50：使用 `default` 模式（每个端点直接作为 MCP 工具）
- API 端点数量 >= 50：使用 `ondemand` 模式（提供发现式工具：list/search/detail/execute）

### 5. 生成 mcp.json

按照以下模板生成配置文件：

```json
{
  "mcpServers": {
    "<服务名>": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url", "<OpenAPI 文档 URL 或路径>",
        "--base-url", "<API 基础 URL>"
      ],
      "env": {
        "<认证环境变量>": "<认证值>"
      }
    }
  }
}
```

## MCP 客户端配置路径

生成的 mcp.json 可以配置到以下位置：

| 客户端 | 配置路径 | 说明 |
|--------|---------|------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | macOS 默认路径 |
| Claude Code 项目级 | `.claude/mcp.json` | 当前项目的 MCP 配置 |
| Claude Code 用户级 | `~/.claude/mcp.json` | 全局 MCP 配置 |

如果用户需要在 Claude Desktop 中使用，需要将 `mcpServers` 中的内容合并到 `claude_desktop_config.json` 的 `mcpServers` 字段中。

## 输出

1. 将生成的 mcp.json 保存到用户指定位置
2. 提醒用户将 `YOUR_XXX` 占位符替换为实际的认证信息
3. 告知用户如何将配置应用到目标 MCP 客户端

## 参考示例

参阅 `examples/mcp-config-examples.md` 了解四种典型配置模式的完整示例。
