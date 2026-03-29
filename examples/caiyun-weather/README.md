# 彩云天气 API 示例

本示例演示如何使用 api2mcp 的 `fixedParams`（固定参数）功能，将彩云天气 API 转换为 MCP 工具。

彩云天气 API 的鉴权参数 `appKey` 通过路径参数传递，使用 `fixedParams` 可以将其预填到配置中，调用时无需手动传入。

## 前置条件

- 已安装 [Node.js](https://nodejs.org/)（v18+）
- 已获取彩云天气 API 的 appKey（可在[彩云科技开放平台](https://open.caiyunapp.com/)申请）

## 文件说明

| 文件 | 说明 |
|------|------|
| `openapi.yaml` | 彩云天气 API 的 OpenAPI 3.0 规范文件，定义了天气查询和每日预报两个接口 |
| `api2mcp.json` | Claude Desktop 配置示例，展示如何通过 `fixedParams` 预填 appKey |

## 使用步骤

### 1. 获取 appKey

前往[彩云科技开放平台](https://open.caiyunapp.com/)注册账号并创建应用，获取 API 密钥（appKey）。

### 2. 修改配置

将 `api2mcp.json` 中的以下内容替换为实际值：

```json
{
  "mcpServers": {
    "caiyun-weather": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "/path/to/examples/caiyun-weather/openapi.yaml",
        "--base-url",
        "https://api.caiyunapp.com"
      ],
      "env": {
        "API_FIXED_PARAMS": "{\"appKey\":\"YOUR_APP_KEY\"}"
      }
    }
  }
}
```

需要修改两处：

1. **`--url` 后的路径**：替换为 `openapi.yaml` 文件在本机的绝对路径
2. **`YOUR_APP_KEY`**：替换为你的彩云天气 appKey

### 3. 添加到 Claude Desktop

将修改后的配置复制到 Claude Desktop 的配置文件中：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

将 `mcpServers` 中的内容合并到配置文件的 `mcpServers` 字段中。如果该字段已有其他 MCP 服务器，只需将 `caiyun-weather` 条目添加进去即可。

修改完成后重启 Claude Desktop。

## 使用示例

配置完成后，可以在 Claude Desktop 中直接对话查询天气：

- "帮我查一下北京现在的天气"
- "上海的天气预报是怎样的"
- "查询经纬度 116.4,39.9 的天气情况"

Claude 会自动调用 `getWeather` 或 `getDaily` 工具，`appKey` 会通过 `fixedParams` 自动填入，无需在对话中提供。
