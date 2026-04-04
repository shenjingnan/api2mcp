/**
 * MCP 工具生成器
 */

import { z } from 'zod';
import type { OpenApiOperation, OpenApiSchema } from '../parser/types.js';
import { logger } from '../utils/logger.js';
import { convertSchema, createRefResolver } from './schema-converter.js';

/**
 * 生成的工具定义
 */
export interface GeneratedTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 输入参数 Schema */
  inputSchema: z.ZodObject<Record<string, z.ZodType>>;
  /** 原始操作定义 */
  operation: OpenApiOperation;
}

/**
 * 生成工具名称
 */
function generateToolName(operation: OpenApiOperation, prefix?: string): string {
  // 优先使用 operationId
  if (operation.operationId) {
    const name = sanitizeToolName(operation.operationId);
    return prefix ? `${prefix}_${name}` : name;
  }

  // 否则使用 method + path
  const pathParts = operation.path
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[{}]/g, ''));

  const name = sanitizeToolName(`${operation.method.toLowerCase()}_${pathParts.join('_')}`);
  return prefix ? `${prefix}_${name}` : name;
}

/**
 * 清理工具名称
 */
function sanitizeToolName(name: string): string {
  // 替换非法字符为下划线
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

/**
 * 生成工具描述
 */
function generateToolDescription(operation: OpenApiOperation): string {
  const parts: string[] = [];

  if (operation.summary) {
    parts.push(operation.summary);
  }

  if (operation.description) {
    parts.push(operation.description);
  }

  if (operation.deprecated) {
    parts.push('[DEPRECATED]');
  }

  // 添加方法和路径信息
  parts.push(`\n\nHTTP ${operation.method} ${operation.path}`);

  // 添加标签
  if (operation.tags && operation.tags.length > 0) {
    parts.push(`\nTags: ${operation.tags.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * 构建参数 Schema
 */
function buildParametersSchema(
  operation: OpenApiOperation,
  refResolver: ReturnType<typeof createRefResolver>,
  fixedParams?: Record<string, string>
): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};

  // 处理路径参数、查询参数、头参数
  if (operation.parameters) {
    for (const param of operation.parameters) {
      const paramName = param.name;

      // 跳过固定参数（不暴露给 LLM）
      if (fixedParams && paramName in fixedParams) {
        continue;
      }
      let paramSchema = convertSchema(param.schema, refResolver);

      // 添加描述
      if (param.description) {
        paramSchema = paramSchema.describe(param.description);
      }

      // 处理可选参数
      if (!param.required) {
        paramSchema = z.optional(paramSchema);
      }

      // 使用参数名作为键，添加位置信息
      const key = paramName;
      shape[key] = paramSchema;
    }
  }

  // 处理请求体
  if (operation.requestBody) {
    // 优先使用 application/json
    const jsonContent = operation.requestBody.content['application/json'];
    if (jsonContent?.schema) {
      const bodySchema = convertSchema(jsonContent.schema, refResolver);

      if (operation.requestBody.description) {
        shape.body = bodySchema.describe(operation.requestBody.description);
      } else {
        shape.body = bodySchema.describe('Request body');
      }

      if (!operation.requestBody.required) {
        shape.body = z.optional(shape.body);
      }
    } else {
      // 尝试其他内容类型
      const contentTypes = Object.keys(operation.requestBody.content);
      if (contentTypes.length > 0) {
        const firstContent = operation.requestBody.content[contentTypes[0]];
        if (firstContent?.schema) {
          const bodySchema = convertSchema(firstContent.schema, refResolver);
          shape.body = bodySchema.describe(`Request body (${contentTypes[0]})`);

          if (!operation.requestBody.required) {
            shape.body = z.optional(shape.body);
          }
        }
      }
    }
  }

  // 添加可选的 _baseUrl 参数
  shape._baseUrl = z
    .string()
    .url()
    .optional()
    .describe('API base URL (overrides the default). Example: https://api.example.com');

  return shape;
}

/**
 * 从 OpenAPI 操作生成 MCP 工具
 */
export function generateTool(
  operation: OpenApiOperation,
  components?: Record<string, OpenApiSchema>,
  toolPrefix?: string,
  fixedParams?: Record<string, string>
): GeneratedTool {
  const refResolver = createRefResolver(components);

  const name = generateToolName(operation, toolPrefix);
  const description = generateToolDescription(operation);
  const parametersShape = buildParametersSchema(operation, refResolver, fixedParams);
  const inputSchema = z.object(parametersShape);

  logger.debug(`Generated tool: ${name}`);

  return {
    name,
    description,
    inputSchema,
    operation,
  };
}

/**
 * 批量生成工具
 */
export function generateTools(
  operations: OpenApiOperation[],
  components?: Record<string, OpenApiSchema>,
  toolPrefix?: string,
  fixedParams?: Record<string, string>
): GeneratedTool[] {
  const tools: GeneratedTool[] = [];
  const usedNames = new Set<string>();

  for (const operation of operations) {
    const tool = generateTool(operation, components, toolPrefix, fixedParams);

    // 处理名称冲突
    if (usedNames.has(tool.name)) {
      let counter = 1;
      let newName = `${tool.name}_${counter}`;
      while (usedNames.has(newName)) {
        counter++;
        newName = `${tool.name}_${counter}`;
      }
      logger.warn(`Tool name conflict: ${tool.name} renamed to ${newName}`);
      tool.name = newName;
    }

    usedNames.add(tool.name);
    tools.push(tool);
  }

  logger.info(`Generated ${tools.length} tools`);
  return tools;
}

export default {
  generateTool,
  generateTools,
};
