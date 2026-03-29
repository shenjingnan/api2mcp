# 更新日志

本文档记录项目的所有重要变更。

# [0.6.0](https://github.com/shenjingnan/api2mcp/compare/v0.5.0...v0.6.0) (2026-03-29)


### Features

* **config:** 支持固定参数（fixedParams）功能 ([#26](https://github.com/shenjingnan/api2mcp/issues/26)) ([a4e5e9e](https://github.com/shenjingnan/api2mcp/commit/a4e5e9e13b158df538175be30d14acc8590ff01a))

# [0.5.0](https://github.com/shenjingnan/api2mcp/compare/v0.4.0...v0.5.0) (2026-03-29)


### Features

* **build:** 从 package.json 动态读取版本号，移除硬编码版本 ([#24](https://github.com/shenjingnan/api2mcp/issues/24)) ([b8c136d](https://github.com/shenjingnan/api2mcp/commit/b8c136d62182f72c250891de7c2f753fd12769e2))

# [0.4.0](https://github.com/shenjingnan/api2mcp/compare/v0.4.0-beta.0...v0.4.0) (2026-03-29)


### Bug Fixes

* **registry:** 修复 requestBodySchema 中 required 字段被布尔值覆盖的 bug ([#22](https://github.com/shenjingnan/api2mcp/issues/22)) ([ab64e89](https://github.com/shenjingnan/api2mcp/commit/ab64e89f09f3f7c301476318e2a7b7208a12713a))

# [0.4.0-beta.0](https://github.com/shenjingnan/api2mcp/compare/v0.3.2...v0.4.0-beta.0) (2026-03-29)


### Features

* 新增按需模式 (ondemand)，支持大型 OpenAPI 文档的高效使用 ([#20](https://github.com/shenjingnan/api2mcp/issues/20)) ([8c29817](https://github.com/shenjingnan/api2mcp/commit/8c2981781c1f845f2a7d41ec68405a951cb28b0f))

## [0.3.2](https://github.com/shenjingnan/api2mcp/compare/v0.3.1...v0.3.2) (2026-03-26)

## [0.3.1](https://github.com/shenjingnan/api2mcp/compare/v0.3.0...v0.3.1) (2026-03-25)

# [0.3.0](https://github.com/shenjingnan/api2mcp/compare/v0.2.0...v0.3.0) (2026-03-24)


### Features

* 支持运行时覆盖 API base URL ([#12](https://github.com/shenjingnan/api2mcp/issues/12)) ([bfe2c88](https://github.com/shenjingnan/api2mcp/commit/bfe2c88df76b3b1bbc6a0bc5a4aa2c3112315226))

# [0.2.0](https://github.com/shenjingnan/api2mcp/compare/v0.2.0-beta.1...v0.2.0) (2026-03-24)

# [0.2.0-beta.1](https://github.com/shenjingnan/api2mcp/compare/v0.2.0-beta.0...v0.2.0-beta.1) (2026-03-24)

# [0.2.0-beta.0](https://github.com/shenjingnan/api2mcp/compare/v0.1.0...v0.2.0-beta.0) (2026-03-24)


### Features

* 改进发布流程和工作流配置 ([#8](https://github.com/shenjingnan/api2mcp/issues/8)) ([bb5c464](https://github.com/shenjingnan/api2mcp/commit/bb5c464a40b0763f2df3e5318f34460b34026597))

# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-03-24

### Features

- Initial release of api2mcp
- Convert OpenAPI specifications to MCP tools dynamically
- Support for both YAML and JSON OpenAPI formats
- Command-line interface for easy usage
- Automatic parameter validation using Zod schemas
- Support for REST API operations (GET, POST, PUT, DELETE, PATCH)
