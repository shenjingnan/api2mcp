/**
 * MCP 服务器
 */

declare const VERSION: string;

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Config } from '../config/types.js';
import { generateTools } from '../converter/tool-generator.js';
import { getBaseUrl, parseOpenApi } from '../parser/swagger.js';
import { ApiRegistry } from '../registry/api-registry.js';
import type { ApiEntry } from '../registry/types.js';
import {
  apiDetailSchema,
  apiDetailTool,
  apiExecuteSchema,
  apiExecuteTool,
  apiListSchema,
  apiListTool,
  apiSearchSchema,
  apiSearchTool,
  executeApiDetail,
  executeApiExecute,
  executeApiList,
  executeApiSearch,
} from '../tools/discovery/index.js';
import { logger } from '../utils/logger.js';
import { ToolManager } from './tool-manager.js';

/**
 * 创建 API Registry 并注册所有 API
 */
function createRegistry(
  operations: ReturnType<typeof generateTools>,
  components?: Record<string, unknown>
): ApiRegistry {
  const registry = new ApiRegistry();

  for (const tool of operations) {
    const entry: ApiEntry = {
      id: tool.operation.operationId || tool.name,
      name: tool.name,
      method: tool.operation.method,
      path: tool.operation.path,
      summary: tool.operation.summary,
      description: tool.operation.description,
      tags: tool.operation.tags,
      deprecated: tool.operation.deprecated,
      operation: tool.operation,
      components: components as
        | Record<string, import('../parser/types.js').OpenApiSchema>
        | undefined,
    };
    registry.register(entry);
  }

  return registry;
}

/**
 * 注册按需模式的 discovery tools
 */
function registerOndemandTools(server: McpServer, registry: ApiRegistry, config: Config): void {
  // api_list
  server.tool(
    apiListTool.name,
    apiListTool.description,
    apiListSchema.shape,
    async (args: Record<string, unknown>) => {
      const result = executeApiList(registry, args as Parameters<typeof executeApiList>[1]);
      return { content: [{ type: 'text', text: result }] };
    }
  );

  // api_search
  server.tool(
    apiSearchTool.name,
    apiSearchTool.description,
    apiSearchSchema.shape,
    async (args: Record<string, unknown>) => {
      const result = executeApiSearch(registry, args as Parameters<typeof executeApiSearch>[1]);
      return { content: [{ type: 'text', text: result }] };
    }
  );

  // api_detail
  server.tool(
    apiDetailTool.name,
    apiDetailTool.description,
    apiDetailSchema.shape,
    async (args: Record<string, unknown>) => {
      const result = executeApiDetail(registry, args as Parameters<typeof executeApiDetail>[1]);
      return { content: [{ type: 'text', text: result }] };
    }
  );

  // api_execute
  server.tool(
    apiExecuteTool.name,
    apiExecuteTool.description,
    apiExecuteSchema.shape,
    async (args: Record<string, unknown>) => {
      const result = await executeApiExecute(
        registry,
        config,
        args as Parameters<typeof executeApiExecute>[2]
      );
      return { content: [{ type: 'text', text: result }] };
    }
  );

  logger.info('Registered 4 discovery tools (ondemand mode)');
}

/**
 * 创建并启动 MCP 服务器
 */
export async function createServer(config: Config): Promise<McpServer> {
  logger.info('Creating MCP server...');
  logger.info(`Mode: ${config.mode || 'default'}`);

  // 创建 MCP 服务器实例
  const server = new McpServer({
    name: 'api2mcp',
    version: VERSION,
  });

  // 解析 OpenAPI 文档
  const openApiDoc = await parseOpenApi(config.openapiUrl);

  // 获取基础 URL（可能为 undefined）
  const baseUrl = getBaseUrl(openApiDoc, config.baseUrl);

  // 更新配置中的 baseUrl
  const effectiveConfig: Config = {
    ...config,
    baseUrl,
  };

  // 生成工具（用于获取操作定义）
  const tools = generateTools(
    openApiDoc.operations,
    openApiDoc.components?.schemas,
    config.toolPrefix,
    effectiveConfig.fixedParams
  );

  // 根据模式选择初始化路径
  if (config.mode === 'ondemand') {
    // 按需模式：创建 Registry，注册 discovery tools
    const registry = createRegistry(tools, openApiDoc.components?.schemas);
    registerOndemandTools(server, registry, effectiveConfig);

    const stats = registry.getStats();
    logger.info(`Server ready with ${stats.totalApis} APIs in registry`);
    logger.info(`Tags: ${stats.tags.slice(0, 5).join(', ')}${stats.tags.length > 5 ? '...' : ''}`);
  } else {
    // 默认模式：直接注册所有工具
    const toolManager = new ToolManager(server, effectiveConfig);
    toolManager.registerTools(tools);

    logger.info(`Server ready with ${toolManager.getToolCount()} tools`);
  }

  return server;
}

/**
 * 启动服务器（使用 stdio 传输）
 */
export async function startServer(config: Config): Promise<void> {
  const server = await createServer(config);

  // 使用 stdio 传输
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Server started (stdio mode)');
}

export default {
  createServer,
  startServer,
};
