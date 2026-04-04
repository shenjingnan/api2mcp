# api2mcp 完整设置示例

## 场景一：通过 curl 命令设置天气 API

### 用户输入

```
我想把彩云天气 API 接入 MCP。这是我的 curl 命令：

curl "https://api.caiyunapp.com/v2.6/MY_APP_KEY/116.4,39.9/weather"
```

### AI 分析

- **API 名称**：彩云天气 API
- **基础 URL**：`https://api.caiyunapp.com`
- **认证方式**：路径参数（`{appKey}` 嵌入 URL 路径中）
- **端点信息**：
  - `GET /v2.6/{appKey}/{location}/weather` — 天气查询
  - `location` 为经纬度坐标

### 生成的文件

**openapi.yaml**（保存到 `caiyun-weather/openapi.yaml`）：

```yaml
openapi: "3.0.0"
info:
  title: 彩云天气 API
  version: "2.6"
  description: |
    彩云天气 API 提供精准的天气预报服务。
    认证参数 appKey 通过 API_FIXED_PARAMS 环境变量自动注入，调用时无需手动传入。

servers:
  - url: https://api.caiyunapp.com

paths:
  /v2.6/{appKey}/{location}/weather:
    get:
      operationId: getWeather
      summary: 实时天气查询
      description: 查询指定位置的实时天气、小时级预报、每日预报等完整天气信息
      tags:
        - 天气
      parameters:
        - name: appKey
          in: path
          required: true
          description: API 鉴权密钥（通过 API_FIXED_PARAMS 自动注入）
          schema:
            type: string
        - name: location
          in: path
          required: true
          description: |
            经纬度坐标，格式为 `经度,纬度`
            例如：`116.4,39.9`
          schema:
            type: string
      responses:
        "200":
          description: 成功返回天气数据
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  result:
                    type: object
                    description: 天气数据
```

**mcp.json**（保存到 `caiyun-weather/mcp.json`）：

```json
{
  "mcpServers": {
    "caiyun-weather": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/example/repo/main/caiyun-weather/openapi.yaml",
        "--base-url",
        "https://api.caiyunapp.com"
      ],
      "env": {
        "API_FIXED_PARAMS": "appKey=YOUR_APP_KEY"
      }
    }
  }
}
```

### 输出提示

> 已生成以下文件：
> - `caiyun-weather/openapi.yaml` — OpenAPI 规范文件
> - `caiyun-weather/mcp.json` — MCP 客户端配置
>
> 请将 `mcp.json` 中的 `YOUR_APP_KEY` 替换为你的彩云天气 API Key。
>
> 配置到 Claude Desktop：将 mcpServers 内容合并到 `~/Library/Application Support/Claude/claude_desktop_config.json`

---

## 场景二：通过自然语言描述设置智能家居 API

### 用户输入

```
我有一个 Home Assistant 实例运行在 http://localhost:8123，需要通过 Bearer Token 认证。
我想让 AI 能够查询设备状态、控制设备（开灯/关灯）、查看传感器数据。
```

### AI 分析

- **API 名称**：Home Assistant REST API
- **基础 URL**：`http://localhost:8123`
- **认证方式**：Bearer Token（HTTP Header）
- **主要功能**：
  - 查询所有设备状态
  - 查询单个设备状态
  - 调用服务控制设备
  - 获取系统配置

### 生成的文件

**openapi.yaml**（保存到 `home-assistant/openapi.yaml`）：

包含端点：
- `GET /api/` — 检查 API 状态
- `GET /api/states` — 获取所有实体状态
- `GET /api/states/{entity_id}` — 获取指定实体状态
- `POST /api/services/{domain}/{service}` — 调用服务

**mcp.json**（保存到 `home-assistant/mcp.json`）：

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/example/repo/main/home-assistant/openapi.yaml",
        "--base-url",
        "http://localhost:8123"
      ],
      "env": {
        "API_HEADERS": "Authorization=Bearer YOUR_HA_TOKEN"
      }
    }
  }
}
```

### 输出提示

> 已生成以下文件：
> - `home-assistant/openapi.yaml` — OpenAPI 规范文件（包含 4 个主要端点）
> - `home-assistant/mcp.json` — MCP 客户端配置
>
> 请将 `YOUR_HA_TOKEN` 替换为你的 Home Assistant 长期访问令牌（在 HA 的 用户设置 → 安全 → 长期访问令牌 中创建）。
>
> 配置到 Claude Code：将 mcp.json 保存为 `.claude/mcp.json`

---

## 场景三：用户已有 OpenAPI 文档

### 用户输入

```
我已经有一个 openapi.yaml 文件，在本项目的 openapi/ 目录下。
API 地址是 https://api.myapp.com，认证用的是 API Key，通过 URL 参数 key 传递。
```

### AI 工作流程

1. 读取已有的 `openapi/openapi.yaml` 文件
2. 确认认证方式为 Query 参数认证
3. 直接生成 mcp.json（跳过 openapi.yaml 生成阶段）

### 生成的文件

**mcp.json**：

```json
{
  "mcpServers": {
    "my-app": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "openapi/openapi.yaml",
        "--base-url",
        "https://api.myapp.com"
      ],
      "env": {
        "API_FIXED_PARAMS": "key=YOUR_API_KEY"
      }
    }
  }
}
```

### 输出提示

> 已基于你现有的 openapi.yaml 生成 mcp.json。
> 请将 `YOUR_API_KEY` 替换为你的 API Key。
> openapi.yaml 使用本地路径引用，请确保 mcp.json 和 openapi/ 目录的相对位置正确。
