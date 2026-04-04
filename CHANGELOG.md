# Changelog

## [0.7.2](https://github.com/shenjingnan/api2mcp/compare/v0.7.1...v0.7.2) (2026-04-04)

### Code Refactoring

* 将 Claude Code 配置迁移至 AGENTS.md 并重组目录结构 ([#54](https://github.com/shenjingnan/api2mcp/issues/54)) ([38f52a2](https://github.com/shenjingnan/api2mcp/commit/38f52a297f71ba9459ac5e53b8e410ed3f1fad62))

### Documentation

* 添加项目 CLAUDE.md 指导文件 ([#53](https://github.com/shenjingnan/api2mcp/issues/53)) ([b4dc80b](https://github.com/shenjingnan/api2mcp/commit/b4dc80b1983dd990bde42a702fe40bacdcd10fe7))

## [0.7.1](https://github.com/shenjingnan/api2mcp/compare/v0.7.0...v0.7.1) (2026-04-04)

### Code Refactoring

* **ci:** 简化发版流程，从 PR 模式改为直接发版模式 ([#52](https://github.com/shenjingnan/api2mcp/issues/52)) ([0c3cfc9](https://github.com/shenjingnan/api2mcp/commit/0c3cfc9373dc187eda35d03217e40f174e4d9023))

# 更新日志

本文档记录项目的所有重要变更。

# [0.7.0](https://github.com/shenjingnan/api2mcp/compare/v0.6.0...v0.7.0) (2026-04-04)


### Bug Fixes

* **lint:** 统一 spellcheck 在 commit lint 和 CI 中的行为 ([#39](https://github.com/shenjingnan/api2mcp/issues/39)) ([5277007](https://github.com/shenjingnan/api2mcp/commit/5277007f05a20e2d6ebdde4add962aaf51d44a11))


### Code Refactoring

* 移除 x-fixed 扩展字段，统一使用 API_FIXED_PARAMS ([#34](https://github.com/shenjingnan/api2mcp/issues/34)) ([bef8310](https://github.com/shenjingnan/api2mcp/commit/bef8310c94eadef28c454c6625a508f0bb92069c)), closes [#32](https://github.com/shenjingnan/api2mcp/issues/32)


### Features

* **config:** headers 支持 key=value 格式解析 ([#37](https://github.com/shenjingnan/api2mcp/issues/37)) ([f880350](https://github.com/shenjingnan/api2mcp/commit/f88035034ba720fe530433466978c9504a876420))
* **config:** 支持 key=value 格式的固定参数解析 ([#33](https://github.com/shenjingnan/api2mcp/issues/33)) ([1da4f9e](https://github.com/shenjingnan/api2mcp/commit/1da4f9e5f702631cbf4a438f3efd6d83b9d7863d))
* **examples:** 添加高德地图地理编码助手示例配置 ([#30](https://github.com/shenjingnan/api2mcp/issues/30)) ([6d24721](https://github.com/shenjingnan/api2mcp/commit/6d24721c6d159843897102c4ef808aff33fa2e3c))
* 支持 OpenAPI x-fixed 扩展字段替代 API_FIXED_PARAMS ([#32](https://github.com/shenjingnan/api2mcp/issues/32)) ([8b98405](https://github.com/shenjingnan/api2mcp/commit/8b984056783dcb0b8401bdfbea06b617cd0f06a8))


### BREAKING CHANGES

* 不再支持 OpenAPI x-fixed 扩展字段，请使用 API_FIXED_PARAMS 环境变量或 --fixed-params CLI 参数替代

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-authored-by: GLM-5.1 <noreply@bigmodel.cn>

# [Unreleased]

### Breaking Changes

* **parser:** 移除 `x-fixed` OpenAPI 扩展字段支持，统一使用 `API_FIXED_PARAMS` 环境变量或 `--fixed-params` CLI 参数配置固定参数

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



All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-03-24

### Features

- Initial release of api2mcp
- Convert OpenAPI specifications to MCP tools dynamically
- Support for both YAML and JSON OpenAPI formats
- Command-line interface for easy usage
- Automatic parameter validation using Zod schemas
- Support for REST API operations (GET, POST, PUT, DELETE, PATCH)
