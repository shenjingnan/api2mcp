# api2mcp

将 OpenAPI 规范动态转换为 MCP (Model Context Protocol) 工具。

## 特性

- 🔧 **动态转换**: 只需配置 OpenAPI 文档 URL，自动将每个 API endpoint 转换为 MCP 工具
- 📝 **完整支持**: 支持 OpenAPI 3.x 规范，包括路径参数、查询参数、请求体等
- 🚀 **简单易用**: 通过 CLI 或配置文件快速启动
- 🔌 **MCP 兼容**: 完全兼容 MCP 协议，可在 Claude Desktop 等 MCP 客户端中使用

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
| `--debug` | `-d` | 启用调试模式 |

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
  "toolPrefix": "myapi"
}
```

### 环境变量

| 环境变量 | 说明 |
|----------|------|
| `OPENAPI_URL` | OpenAPI 文档 URL |
| `API_BASE_URL` | API 基础 URL |
| `API_TIMEOUT` | 请求超时时间 (毫秒) |
| `API_HEADERS` | 自定义请求头 (JSON 字符串) |
| `DEBUG` | 启用调试模式 |

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