# 太平洋网络 IP 归属地查询示例

本示例演示如何使用 api2mcp 将太平洋网络的公开 IP 查询 API 转换为 MCP 工具。

该 API 无需鉴权，可直接调用查询任意 IP 地址的地理位置归属信息（省份、城市、区县、运营商等）。

## 前置条件

- 已安装 [Node.js](https://nodejs.org/)（v20+）

## 文件说明

| 文件 | 说明 |
|------|------|
| `openapi.yaml` | IP 查询 API 的 OpenAPI 3.0 规范文件 |
| `mcp.json` | Claude Desktop 配置示例 |

## 使用步骤

### 1. 修改配置

将 `mcp.json` 中的 `--url` 路径替换为 `openapi.yaml` 文件在本机的绝对路径：

```json
{
  "mcpServers": {
    "pconline-ip-lookup": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "/path/to/examples/pconline-ip-lookup/openapi.yaml",
        "--base-url",
        "https://whois.pconline.com.cn"
      ]
    }
  }
}
```

### 2. 添加到 Claude Desktop

将修改后的配置复制到 Claude Desktop 的配置文件中：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

将 `mcpServers` 中的内容合并到配置文件的 `mcpServers` 字段中。修改完成后重启 Claude Desktop。

## 使用示例

配置完成后，可以在 Claude Desktop 中直接对话查询 IP 信息：

- "查一下 8.8.8.8 这个 IP 是哪里的"
- "帮我查一下 114.114.114.114 的归属地"
- "我的当前 IP 是什么"

Claude 会自动调用 `queryIpLocation` 工具进行查询并返回结果。
