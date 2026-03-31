# Home Assistant 智能家居示例

本示例演示如何使用 api2mcp 的 `API_HEADERS`（自定义请求头）功能，将 Home Assistant REST API 转换为 MCP 工具，使 AI 助手能够通过对话控制智能家居设备。

Home Assistant 的 REST API 通过 Bearer Token 进行鉴权，使用 `API_HEADERS` 可以将认证信息注入到每个请求中。本示例包含 20 个常用 API 端点，涵盖设备状态查询、服务调用、事件管理、历史记录、日历、摄像头等功能。

## 前置条件

- 已安装 [Node.js](https://nodejs.org/)（v18+）
- 已部署 [Home Assistant](https://www.home-assistant.io/) 实例，且 Web 前端可正常访问
- 已获取 Home Assistant 的 Long-Lived Access Token

## 文件说明

| 文件 | 说明 |
|------|------|
| `openapi.yaml` | Home Assistant REST API 的 OpenAPI 3.0 规范文件，定义了 20 个常用接口 |
| `api2mcp.json` | Claude Desktop 配置示例，展示如何通过 `API_HEADERS` 注入 Bearer Token |

## 使用步骤

### 1. 获取 Long-Lived Access Token

1. 在浏览器中打开 Home Assistant 前端（默认 `http://IP_ADDRESS:8123`）
2. 登录后点击左下角用户头像进入个人资料页面（或直接访问 `http://IP_ADDRESS:8123/profile`）
3. 滚动到底部「长期访问令牌」部分，点击「创建令牌」
4. 输入令牌名称（如 `api2mcp`），点击确认并复制生成的令牌

> **注意**：令牌只显示一次，请务必完整复制并妥善保存。

### 2. 修改配置

将 `api2mcp.json` 中的以下内容替换为实际值：

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/shenjingnan/api2mcp/refs/heads/main/examples/home-assistant/openapi.yaml",
        "--base-url",
        "http://YOUR_HA_IP:8123"
      ],
      "env": {
        "API_HEADERS": "Authorization=Bearer YOUR_HA_TOKEN"
      }
    }
  }
}
```

需要修改两处：

1. **`--base-url` 后的地址**：替换为你的 Home Assistant 实际访问地址（如 `http://192.168.1.100:8123`）
2. **`YOUR_HA_TOKEN`**：替换为你在步骤 1 中获取的 Long-Lived Access Token

### 3. 添加到 Claude Desktop

将修改后的配置复制到 Claude Desktop 的配置文件中：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

将 `mcpServers` 中的内容合并到配置文件的 `mcpServers` 字段中。如果该字段已有其他 MCP 服务器，只需将 `home-assistant` 条目添加进去即可。

修改完成后重启 Claude Desktop。

## 使用示例

配置完成后，可以在 Claude Desktop 中直接对话控制智能家居：

**查看设备状态：**
- "帮我查看所有设备的状态"
- "客厅的温度是多少"
- "查看卧室灯当前的状态"

**控制设备：**
- "帮我打开书房的灯"
- "把客厅空调温度调到 26 度"
- "关闭圣诞灯"

**查看天气与传感器：**
- "今天的天气怎么样"
- "查看温度传感器的历史数据"

**系统管理：**
- "检查一下 Home Assistant 的配置文件有没有问题"
- "查看系统的错误日志"

**日历事件：**
- "看看假期日历本月有什么安排"

Claude 会自动调用对应的 MCP 工具，`Authorization` 请求头会通过 `API_HEADERS` 自动注入，无需在对话中提供 Token。
