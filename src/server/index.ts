/**
 * MCP 服务器
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Config } from '../config/types.js';
import { generateTools } from '../converter/tool-generator.js';
import { getBaseUrl, parseOpenApi } from '../parser/swagger.js';
import { logger } from '../utils/logger.js';
import { ToolManager } from './tool-manager.js';

/**
 * 创建并启动 MCP 服务器
 */
export async function createServer(config: Config): Promise<McpServer> {
  logger.info('Creating MCP server...');

  // 创建 MCP 服务器实例
  const server = new McpServer({
    name: 'api2mcp',
    version: '0.1.0',
  });

  // 解析 OpenAPI 文档
  const openApiDoc = await parseOpenApi(config.openapiUrl);

  // 获取基础 URL
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl(openApiDoc, config.baseUrl);
  } catch (error) {
    if (config.baseUrl) {
      baseUrl = config.baseUrl;
    } else {
      throw error;
    }
  }

  // 更新配置中的 baseUrl
  const effectiveConfig: Config = {
    ...config,
    baseUrl,
  };

  // 生成工具
  const tools = generateTools(
    openApiDoc.operations,
    openApiDoc.components?.schemas,
    config.toolPrefix
  );

  // 创建工具管理器并注册工具
  const toolManager = new ToolManager(server, effectiveConfig);
  toolManager.registerTools(tools);

  logger.info(`Server ready with ${toolManager.getToolCount()} tools`);

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
