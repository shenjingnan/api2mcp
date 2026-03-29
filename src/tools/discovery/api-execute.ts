/**
 * api_execute 工具
 * 直接执行 API 调用
 */

import { z } from 'zod';
import type { Config } from '../../config/types.js';
import { executeRequest, formatResponse } from '../../executor/http-client.js';
import type { ApiRegistry } from '../../registry/api-registry.js';
import { ToolExecutionError } from '../../utils/error.js';
import { logger } from '../../utils/logger.js';

/**
 * 输入参数 Schema
 */
export const apiExecuteSchema = z.object({
  operationId: z.string().min(1).describe('API ID（operationId 或工具名称）'),
  parameters: z.record(z.unknown()).optional().describe('API 参数（路径参数、查询参数、请求体等）'),
  _baseUrl: z.string().url().optional().describe('API base URL（可选，覆盖默认配置）'),
});

export type ApiExecuteInput = z.infer<typeof apiExecuteSchema>;

/**
 * 工具定义
 */
export const apiExecuteTool = {
  name: 'api_execute',
  description: `执行 API 调用。

使用场景：
- 直接调用已知的 API
- 使用 api_search 或 api_list 找到 API 后执行调用

使用步骤：
1. 先使用 api_search 或 api_list 找到需要的 API
2. 使用 api_detail 查看参数要求
3. 使用 api_execute 执行调用

参数说明：
- operationId: API 的唯一标识符
- parameters: 包含路径参数、查询参数、请求体等
  - 路径参数: URL 路径中的参数 (如 /users/{id} 中的 id)
  - 查询参数: URL 问号后的参数
  - body: 请求体（JSON 对象）`,
  inputSchema: apiExecuteSchema,
};

/**
 * 执行 api_execute 工具
 */
export async function executeApiExecute(
  registry: ApiRegistry,
  config: Config,
  input: ApiExecuteInput
): Promise<string> {
  const { operationId, parameters = {}, _baseUrl } = input;

  logger.debug(`Executing api_execute: operationId=${operationId}`);

  // 从 Registry 获取 API 定义
  let apiEntry = registry.get(operationId);

  // 尝试通过名称查找
  if (!apiEntry) {
    apiEntry = registry.getByName(operationId);
  }

  if (!apiEntry) {
    return `错误: 找不到 API "${operationId}"\n\n请使用 api_search 搜索可用的 API。`;
  }

  // 检查是否废弃
  if (apiEntry.deprecated) {
    logger.warn(`API ${operationId} is deprecated`);
  }

  try {
    // 创建临时配置，优先使用参数中的 _baseUrl
    const executionConfig: Config = {
      ...config,
      baseUrl: _baseUrl || config.baseUrl,
    };

    // 检查是否有 base URL
    if (!executionConfig.baseUrl) {
      return `错误: 没有配置 base URL

请通过以下方式之一提供 base URL:
1. 在配置文件中设置 baseUrl
2. 启动时使用 --base-url 参数
3. 调用时提供 _baseUrl 参数`;
    }

    logger.info(`Executing API: ${apiEntry.method} ${apiEntry.path}`);

    // 执行请求
    const response = await executeRequest(apiEntry.operation, parameters, executionConfig);
    const formattedResponse = formatResponse(response);

    return formattedResponse;
  } catch (error) {
    const errorMessage =
      error instanceof ToolExecutionError
        ? `错误: ${error.message}`
        : `错误: ${error instanceof Error ? error.message : '未知错误'}`;

    logger.error(`API execution failed: ${operationId}`, error);

    return errorMessage;
  }
}

export default {
  tool: apiExecuteTool,
  execute: executeApiExecute,
  schema: apiExecuteSchema,
};
