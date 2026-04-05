# MCP 配置示例模板

## 模式一：在线 OpenAPI + fixedParams（查询参数认证）

适用于 API Key 通过 URL 查询参数传递的场景。OpenAPI 文档托管在 GitHub 或其他在线位置。

```json
{
  "mcpServers": {
    "amap-geo-assistant": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/example/repo/main/openapi.yaml",
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

**说明**：`API_FIXED_PARAMS` 中的 `key` 参数会自动注入到每个请求的查询参数中，不会暴露给 LLM。

## 模式二：在线 OpenAPI + fixedParams（路径参数认证）

适用于 API Key 嵌入 URL 路径中的场景（如彩云天气的 `/{appKey}/...` 路径格式）。

```json
{
  "mcpServers": {
    "caiyun-weather": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/example/repo/main/openapi.yaml",
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

**说明**：`API_FIXED_PARAMS` 中的 `appKey` 参数会自动填充到路径中的 `{appKey}` 占位符。

## 模式三：本地端点 + Bearer Token（Header 认证）

适用于本地部署的服务，OpenAPI 文档通过 Swagger 端点获取。

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

**说明**：
- `--url` 指向本地服务的 Swagger JSON 端点
- `API_HEADERS` 的格式为 `HeaderName=value`，会自动注入到每个请求的 Header 中
- 适用于本地部署且提供 Swagger 文档的服务

## 模式四：在线 OpenAPI + Bearer Token（Header 认证）

适用于需要 Bearer Token 认证且 OpenAPI 文档在线托管的场景（如 Home Assistant）。

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://raw.githubusercontent.com/example/repo/main/openapi.yaml",
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

**说明**：
- `--base-url` 指向本地 Home Assistant 实例地址
- `API_HEADERS` 注入 `Authorization` 请求头
- 请将 `YOUR_HA_TOKEN` 替换为 Home Assistant 中生成的长期访问令牌
