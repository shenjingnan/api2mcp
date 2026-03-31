# 高德地图地理助手示例

本示例演示如何使用 api2mcp 的 `fixedParams`（固定参数）功能，将高德地图 Web 服务 API 转换为 MCP 工具。

高德地图 API 的鉴权参数 `key` 通过查询参数传递，使用 `fixedParams` 可以将其预填到配置中，调用时无需手动传入。本示例包含三个互补的工具：地理编码、POI 搜索、步行路径规划，能够展示多工具协作的能力。

## 前置条件

- 已安装 [Node.js](https://nodejs.org/)（v18+）
- 已获取高德开放平台 Web 服务 API Key（可在[高德开放平台](https://lbs.amap.com/)申请）

## 文件说明

| 文件 | 说明 |
|------|------|
| `openapi.yaml` | 高德地图 API 的 OpenAPI 3.0 规范文件，定义了地理编码、POI 搜索、步行路径规划三个接口 |
| `api2mcp.json` | Claude Desktop 配置示例，展示如何通过 `fixedParams` 预填 key |

## 使用步骤

### 1. 获取 API Key

前往[高德开放平台](https://lbs.amap.com/)注册账号，创建应用并添加 Web 服务类型的 Key。

### 2. 修改配置

将 `api2mcp.json` 中的以下内容替换为实际值：

```json
{
  "mcpServers": {
    "amap-geo-assistant": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "/path/to/examples/amap-geo-assistant/openapi.yaml",
        "--base-url",
        "https://restapi.amap.com"
      ],
      "env": {
        "API_FIXED_PARAMS": "key=YOUR_AMAP_KEY"
      }
    }
  }
}
```

需要修改两处：

1. **`--url` 后的路径**：替换为 `openapi.yaml` 文件在本机的绝对路径
2. **`YOUR_AMAP_KEY`**：替换为你的高德地图 Web 服务 API Key

### 3. 添加到 Claude Desktop

将修改后的配置复制到 Claude Desktop 的配置文件中：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

将 `mcpServers` 中的内容合并到配置文件的 `mcpServers` 字段中。如果该字段已有其他 MCP 服务器，只需将 `amap-geo-assistant` 条目添加进去即可。

修改完成后重启 Claude Desktop。

## 使用示例

配置完成后，可以在 Claude Desktop 中直接对话进行地理相关的查询：

**地理编码：**
- "帮我把'北京市朝阳区阜通东大街6号'转成经纬度"
- "上海的东方明珠塔的经纬度是多少"

**POI 搜索：**
- "帮我找一下北京大学附近有哪些餐厅"
- "搜索北京的加油站"

**步行路径规划：**
- "我想从北京天安门步行到王府井，帮我规划一下路线"
- "从中关村到北京大学走路要多久"

**多工具协作：**
- "帮我查一下从'望京 SOHO'步行到'三元桥地铁站'怎么走、有多远" — Claude 会先调用 geocode 将两个地址转为经纬度，再调用 planWalkingRoute 规划步行路线
