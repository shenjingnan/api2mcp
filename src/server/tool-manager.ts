/**
 * MCP 工具管理器
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from '../config/types.js';
import type { GeneratedTool } from '../converter/tool-generator.js';
import { executeOperation } from '../executor/operation-executor.js';
import type { SecurityRequirement, SecurityScheme } from '../parser/types.js';
import { ToolExecutionError } from '../utils/error.js';
import { logger } from '../utils/logger.js';

/**
 * 工具管理器
 */
export class ToolManager {
  private tools: Map<string, GeneratedTool> = new Map();
  private config: Config;
  private server: McpServer;
  private securitySchemes?: Record<string, SecurityScheme>;
  private globalSecurity?: SecurityRequirement[];

  constructor(
    server: McpServer,
    config: Config,
    securitySchemes?: Record<string, SecurityScheme>,
    globalSecurity?: SecurityRequirement[]
  ) {
    this.server = server;
    this.config = config;
    this.securitySchemes = securitySchemes;
    this.globalSecurity = globalSecurity;
  }

  /**
   * 注册工具
   */
  registerTool(tool: GeneratedTool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool already registered: ${tool.name}, overwriting`);
    }

    this.tools.set(tool.name, tool);

    // 使用 server.tool() 注册工具
    this.server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.shape,
      async (args: Record<string, unknown>) => {
        return this.executeTool(tool.name, args);
      }
    );

    logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * 批量注册工具
   */
  registerTools(tools: GeneratedTool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
    logger.info(`Registered ${tools.length} tools`);
  }

  /**
   * 获取工具
   */
  getTool(name: string): GeneratedTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 通过 operationId 获取工具
   */
  getToolByOperationId(operationId: string): GeneratedTool | undefined {
    for (const tool of this.tools.values()) {
      if (tool.operation.operationId === operationId) {
        return tool;
      }
    }
    return undefined;
  }

  /**
   * 执行工具
   */
  private async executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Tool not found: ${toolName}`,
          },
        ],
      };
    }

    try {
      logger.debug(`Executing tool: ${toolName}`, args);

      const formattedResponse = await executeOperation({
        operation: tool.operation,
        input: args,
        config: this.config,
        securitySchemes: this.securitySchemes,
        globalSecurity: this.globalSecurity,
      });

      return {
        content: [
          {
            type: 'text',
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof ToolExecutionError
          ? `Error: ${error.message}`
          : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      logger.error(`Tool execution failed: ${toolName}`, error);

      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
      };
    }
  }

  /**
   * 获取所有已注册的工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取工具数量
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * 获取配置
   */
  getConfig(): Config {
    return this.config;
  }
}

export default ToolManager;
