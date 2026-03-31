# api2mcp

将 OpenAPI 规范动态转换为 MCP (Model Context Protocol) 工具。

## 特性

- 🔧 **动态转换**: 只需配置 OpenAPI 文档 URL，自动将每个 API endpoint 转换为 MCP 工具
- 📝 **完整支持**: 支持 OpenAPI 3.x 规范，包括路径参数、查询参数、请求体等
- 🚀 **简单易用**: 通过 CLI 或配置文件快速启动
- 🔌 **MCP 兼容**: 完全兼容 MCP 协议，可在 Claude Desktop 等 MCP 客户端中使用
- 🎯 **按需模式**: 针对大型 OpenAPI 文档，提供按需发现和调用 API 的模式

## 安装

```bash
# 推荐使用 npx，无需安装
npx api2mcp --url https://petstore3.swagger.io/api/v3/openapi.json

# 或全局安装
npm install -g api2mcp
# 或
pnpm add -g api2mcp
```

## 从源码构建

```bash
# 克隆仓库
git clone https://github.com/shenjingnan/api2mcp.git
cd api2mcp

# 安装依赖
pnpm install

# 构建
pnpm build
```

## 使用方法

### npx 快速使用（推荐）

无需安装，直接使用 npx 运行：

```bash
# 基本使用
npx api2mcp --url https://petstore3.swagger.io/api/v3/openapi.json

# 指定基础 URL
npx api2mcp --url ./openapi.json --base-url https://api.example.com

# 带认证头
npx api2mcp --url https://api.example.com/openapi.json --headers '{"Authorization":"Bearer xxx"}'

# 带工具前缀
npx api2mcp --url https://api.example.com/openapi.json --prefix myapi

# 调试模式
npx api2mcp --url https://api.example.com/openapi.json --debug
```

### CLI

如果需要全局安装：

```bash
# 使用 pnpm 全局安装
pnpm add -g api2mcp

# 或使用 npm 全局安装
npm install -g api2mcp

# 然后直接运行
api2mcp --url https://petstore3.swagger.io/api/v3/openapi.json
```

### CLI 参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `--url` | `-u` | OpenAPI 文档 URL 或本地文件路径 |
| `--base-url` | `-b` | API 基础 URL (覆盖 OpenAPI servers) |
| `--timeout` | `-t` | 请求超时时间 (毫秒) |
| `--headers` | `-h` | 自定义请求头 (JSON 字符串) |
| `--prefix` | `-p` | 工具名前缀 |
| `--mode` | `-m` | 工作模式：`default`（默认）或 `ondemand`（按需） |
| `--debug` | `-d` | 启用调试模式 |
| `--fixed-params` | `-f` | 固定参数 (JSON 字符串或 `key=value` 格式)，这些参数会注入到每个 API 请求中，但不会暴露给 LLM |

### 配置文件

支持以下配置文件名:
- `api2mcp.json`
- `api2mcp.config.json`
- `.api2mcp.json`

配置文件示例:

```json
{
  "openapiUrl": "https://api.example.com/openapi.json",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "toolPrefix": "myapi",
  "mode": "default"
}
```

## 工作模式

api2mcp 支持两种工作模式：

### 默认模式 (default)

将所有 API 直接转换为 MCP 工具。适合 API 数量较少的场景。

```bash
npx api2mcp --url https://api.example.com/openapi.json --mode default
```

### 按需模式 (ondemand)

当 OpenAPI 文档包含大量端点（如数百或数千个）时，按需模式提供更好的体验：

- **减少上下文占用**: 不会预先注册所有工具，节省 LLM 上下文空间
- **按需发现**: LLM 可以搜索和浏览可用的 API
- **直接执行**: 找到需要的 API 后直接调用

```bash
npx api2mcp --url https://api.example.com/openapi.json --mode ondemand
```

#### 按需模式提供的工具

| 工具名 | 功能 |
|--------|------|
| `api_list` | 分页浏览所有 API，支持按标签过滤 |
| `api_search` | 模糊搜索 API（名称、摘要、描述、路径） |
| `api_detail` | 获取 API 的详细信息和参数 Schema |
| `api_execute` | 直接执行 API 调用 |

#### 使用示例

```
用户: 我需要查询用户信息

LLM 调用流程:
1. api_search(query="user") → 找到相关 API
2. api_detail(id="get_user") → 查看参数要求
3. api_execute(operationId="get_user", parameters={userId: 123}) → 执行调用
```

#### 推荐场景

- OpenAPI 文档包含 100+ 个端点
- API 数量众多但通常只需要少数几个
- 希望减少 MCP 客户端的加载时间

### 环境变量

| 环境变量 | 说明 |
|----------|------|
| `OPENAPI_URL` | OpenAPI 文档 URL |
| `API_BASE_URL` | API 基础 URL |
| `API_TIMEOUT` | 请求超时时间 (毫秒) |
| `API_HEADERS` | 自定义请求头 (JSON 字符串) |
| `API_FIXED_PARAMS` | 固定参数 (JSON 字符串或 `key=value` 格式)，这些参数会注入到每个 API 请求中，但不会暴露给 LLM |
| `DEBUG` | 启用调试模式 |

### 固定参数

固定参数是一种特殊的参数，会在每次 API 请求中自动注入，但不会暴露给 LLM。适用于 API 密钥、Token 等敏感信息。

#### 方式一：x-fixed 扩展字段（推荐）

在 OpenAPI 文档中为参数添加 `x-fixed: true` 扩展字段，系统会自动从**同名环境变量**读取值并注入到请求中。

**1. 在 OpenAPI 文档中标记参数**

```yaml
paths:
  /v3/geocode/geo:
    get:
      operationId: geocode
      parameters:
        - name: key           # 参数名
          in: query
          required: true
          x-fixed: true       # 标记为固定参数
          description: API 鉴权密钥
          schema:
            type: string
        - name: address
          in: query
          required: true
          description: 地址信息
          schema:
            type: string
```

**2. 在 MCP 客户端中通过环境变量传入值**

环境变量名必须与参数的 `name` 一致。例如参数名为 `key`，则环境变量名为 `key`：

```json
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": ["-y", "api2mcp", "--url", "https://api.example.com/openapi.json"],
      "env": {
        "key": "YOUR_API_KEY"
      }
    }
  }
}
```

> 完整示例参见 [`examples/amap-geo-assistant/`](examples/amap-geo-assistant/)。

#### 方式二：外部配置

不修改 OpenAPI 文档，通过外部配置传入固定参数：

- **CLI**: `--fixed-params 'key=YOUR_API_KEY'` 或 `--fixed-params '{"key":"YOUR_API_KEY"}'`
- **环境变量**: `API_FIXED_PARAMS='key=YOUR_API_KEY'` 或 `API_FIXED_PARAMS='{"key":"YOUR_API_KEY"}'`
- **配置文件**: `"fixedParams": {"key": "YOUR_API_KEY"}`

#### 优先级与合并

当同时使用 `x-fixed` 和外部配置时，合并策略如下：

1. 首先提取所有 `x-fixed` 参数，从同名环境变量读取值作为基础
2. 外部配置（CLI / 环境变量 `API_FIXED_PARAMS` / 配置文件 `fixedParams`）的值会覆盖 `x-fixed` 提取的值
3. 外部配置之间仍遵循全局优先级：CLI > 环境变量 > 配置文件

### 在 Claude Desktop 中使用

在 Claude Desktop 配置文件中添加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "api2mcp": {
      "command": "npx",
      "args": ["-y", "api2mcp", "--url", "https://api.example.com/openapi.json"]
    }
  }
}
```

> **注意**: 使用 `-y` 参数可以自动确认 npx 的安装提示，避免交互式确认。

### 使用环境变量传递敏感参数

> **提示**: 如果 OpenAPI 文档支持 `x-fixed` 扩展字段，推荐使用上述[固定参数](#固定参数)的方式一，无需额外配置即可自动注入。以下方式适用于无法修改 OpenAPI 文档的场景。

当 API 需要认证密钥等敏感参数时，推荐使用 MCP 客户端的 `env` 字段通过环境变量传递，而非 `--fixed-params` CLI 参数。这样可以避免密钥以明文形式出现在进程参数中（进程参数可通过 `ps` 等命令被其他用户查看）。

```json
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": [
        "-y",
        "api2mcp",
        "--url",
        "https://api.example.com/openapi.json"
      ],
      "env": {
        "API_FIXED_PARAMS": "appKey=YOUR_APP_KEY"
      }
    }
  }
}
```

`API_FIXED_PARAMS` 支持 `key=value` 格式（推荐，更简洁）或 JSON 字符串格式，其中的键值对会作为固定参数注入到每个 API 请求中。这些参数对 LLM 不可见，适合传递 API 密钥、token 等敏感信息。

## 配置优先级

配置加载优先级 (从高到低):

1. CLI 参数
2. 环境变量
3. 配置文件

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式 (监听文件变化)
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## 技术栈

- TypeScript
- Node.js (>=18)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) - MCP 协议实现
- [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser) - OpenAPI 解析
- [zod](https://github.com/colinhacks/zod) - Schema 定义
- [commander](https://github.com/tj/commander.js) - CLI 框架

## License

MIT