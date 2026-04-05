/**
 * 统一的 API 操作执行入口
 * 提取自 ToolManager.executeTool() 和 executeApiExecute() 的公共逻辑
 */

import type { Config } from '../config/types.js';
import type { OpenApiOperation, SecurityRequirement, SecurityScheme } from '../parser/types.js';
import { resolveAuthentication } from '../security/auth-resolver.js';
import type { ResolvedAuthentication } from '../security/types.js';
import { executeRequest, formatResponse } from './http-client.js';

/**
 * 执行操作选项
 */
export interface ExecuteOperationOptions {
  /** OpenAPI 操作定义 */
  operation: OpenApiOperation;
  /** 输入参数 */
  input: Record<string, unknown>;
  /** 配置 */
  config: Config;
  /** 安全方案定义 */
  securitySchemes?: Record<string, SecurityScheme>;
  /** 全局安全需求 */
  globalSecurity?: SecurityRequirement[];
}

/**
 * 解析认证并构建认证信息
 */
export function resolveAuth(options: ExecuteOperationOptions): ResolvedAuthentication {
  return resolveAuthentication({
    securitySchemes: options.securitySchemes,
    credentials: options.config.security,
    operationSecurity: options.operation.security,
    globalSecurity: options.globalSecurity,
  });
}

/**
 * 统一的执行入口
 * 处理 _baseUrl 提取、临时配置构建、请求执行、响应格式化
 */
export async function executeOperation(options: ExecuteOperationOptions): Promise<string> {
  const { operation, input, config } = options;

  // 提取 _baseUrl 参数
  const { _baseUrl, ...restArgs } = input;

  // 创建临时配置，优先使用参数中的 _baseUrl
  const executionConfig: Config = {
    ...config,
    baseUrl: typeof _baseUrl === 'string' ? _baseUrl : config.baseUrl,
  };

  // 解析认证信息
  const auth = resolveAuth(options);

  const response = await executeRequest(operation, restArgs, executionConfig, auth);
  return formatResponse(response);
}
