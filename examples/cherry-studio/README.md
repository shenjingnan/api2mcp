# Cherry Studio API Server 示例

本示例演示如何使用 api2mcp 的 `API_HEADERS`（自定义请求头）功能，将 Cherry Studio 本地 API Server 的接口转换为 MCP 工具。

Cherry Studio 的 API Server 通过 Bearer Token 进行鉴权，使用 `API_HEADERS` 可以将认证信息注入到每个请求中。本示例直接通过 `--url` 参数引用 Cherry Studio 提供的在线接口文档（`/api-docs.json`），无需本地维护 OpenAPI 规范文件。

## 前置条件

- 已安装 [Node.js](https://nodejs.org/)（v18+）
- 已安装 [Cherry Studio](https://github.com/CherryHQ/cherry-studio) 并开启 API Server 功能

## 文件说明

| 文件 | 说明 |
|------|------|
| `api2mcp.json` | Claude Desktop 配置示例，展示如何通过 `API_HEADERS` 注入认证信息 |

## 使用步骤

### 1. 启动 Cherry Studio 并开启 API Server

在 Cherry Studio 的设置中启用 API Server 功能，默认会在 `127.0.0.1:23333` 启动一个 OpenAI 兼容的端点。

### 2. 获取 API Token

在 Cherry Studio 的 API Server 设置中查看或设置 Bearer Token。

### 3. 修改配置

将 `api2mcp.json` 中的以下内容替换为实际值：

```json
{
  "mcpServers": {
    "cherry-studio": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "http://127.0.0.1:23333/api-docs.json",
        "--base-url",
        "http://127.0.0.1:23333"
      ],
      "env": {
        "API_HEADERS": "Authorization=Bearer YOUR_TOKEN"
      }
    }
  }
}
```

需要修改一处：

1. **`YOUR_TOKEN`**：替换为你的 Cherry Studio API Server Token

### 4. 添加到 Claude Desktop

将修改后的配置复制到 Claude Desktop 的配置文件中：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

将 `mcpServers` 中的内容合并到配置文件的 `mcpServers` 字段中。如果该字段已有其他 MCP 服务器，只需将 `cherry-studio` 条目添加进去即可。

修改完成后重启 Claude Desktop。

## 使用示例

配置完成后，可以在 Claude Desktop 中直接对话调用 Cherry Studio 的 API：

- "帮我查看当前可用的模型列表"
- "使用 DeepSeek 模型帮我总结一段文字"
- "调用本地模型生成一张图片的描述"

Claude 会自动调用对应的 MCP 工具，`Authorization` 请求头会通过 `API_HEADERS` 自动注入，无需在对话中提供 Token。
