/**
 * api_detail 工具
 * 获取 API 详情
 */

import { z } from 'zod';
import type { ApiRegistry } from '../../registry/api-registry.js';
import { logger } from '../../utils/logger.js';

/**
 * 输入参数 Schema
 */
export const apiDetailSchema = z.object({
  id: z.string().min(1).describe('API ID（operationId 或工具名称）'),
});

export type ApiDetailInput = z.infer<typeof apiDetailSchema>;

/**
 * 工具定义
 */
export const apiDetailTool = {
  name: 'api_detail',
  description: `获取 API 的详细信息。

使用场景：
- 查看某个 API 的完整参数定义
- 了解请求体和响应的结构
- 在调用 API 前了解需要哪些参数

返回内容包括：
- API 基本信息（方法、路径、描述）
- 参数 Schema（路径参数、查询参数、头参数）
- 请求体 Schema
- 响应 Schema`,
  inputSchema: apiDetailSchema,
};

/**
 * 格式化 JSON Schema 为可读文本
 */
function formatSchema(schema: Record<string, unknown> | undefined, indent = 0): string {
  if (!schema) return '无';

  const spaces = '  '.repeat(indent);
  const lines: string[] = [];

  if (schema.type) {
    lines.push(`${spaces}类型: ${schema.type}`);
  }

  if (schema.description) {
    lines.push(`${spaces}描述: ${schema.description}`);
  }

  if (schema.properties) {
    lines.push(`${spaces}属性:`);
    const props = schema.properties as Record<string, Record<string, unknown>>;
    const required = (schema.required as string[]) || [];

    for (const [name, prop] of Object.entries(props)) {
      const isRequired = required.includes(name);
      const reqTag = isRequired ? ' (必填)' : ' (可选)';
      const propType = (prop.type as string) || 'unknown';
      const propDesc = prop.description ? ` - ${prop.description as string}` : '';
      lines.push(`${spaces}  - ${name}${reqTag}: ${propType}${propDesc}`);

      // 如果是嵌套对象，递归处理
      if (prop.properties) {
        lines.push(formatSchema(prop, indent + 2));
      }
    }
  }

  if (schema.enum) {
    lines.push(`${spaces}枚举值: ${(schema.enum as string[]).join(', ')}`);
  }

  if (schema.example !== undefined) {
    lines.push(`${spaces}示例: ${JSON.stringify(schema.example)}`);
  }

  return lines.join('\n');
}

/**
 * 执行 api_detail 工具
 */
export function executeApiDetail(registry: ApiRegistry, input: ApiDetailInput): string {
  const { id } = input;

  logger.debug(`Executing api_detail: id=${id}`);

  const detail = registry.getDetail(id);

  if (!detail) {
    // 尝试通过名称查找
    const byName = registry.getByName(id);
    if (byName) {
      return executeApiDetail(registry, { id: byName.id });
    }

    return `错误: 找不到 API "${id}"\n\n请使用 api_search 搜索可用的 API。`;
  }

  const lines: string[] = [];

  // 基本信息
  lines.push(`## API: ${detail.name}`);
  lines.push('');

  const methodBadge = `[${detail.method.toUpperCase()}]`;
  const deprecatedTag = detail.deprecated ? ' ⚠️ 已废弃' : '';
  lines.push(`**${methodBadge}** \`${detail.path}\`${deprecatedTag}`);
  lines.push('');

  if (detail.summary) {
    lines.push(`**摘要**: ${detail.summary}`);
    lines.push('');
  }

  if (detail.description) {
    lines.push(`**描述**: ${detail.description}`);
    lines.push('');
  }

  if (detail.tags && detail.tags.length > 0) {
    lines.push(`**标签**: ${detail.tags.map((t) => `\`${t}\``).join(', ')}`);
    lines.push('');
  }

  // 参数
  lines.push('### 参数');
  lines.push('');
  if (detail.parameterSchema) {
    lines.push(formatSchema(detail.parameterSchema));
  } else {
    lines.push('无参数');
  }
  lines.push('');

  // 请求体
  if (detail.requestBodySchema) {
    lines.push('### 请求体');
    lines.push('');
    lines.push(formatSchema(detail.requestBodySchema));
    lines.push('');
  }

  // 响应
  if (detail.responseSchemas && Object.keys(detail.responseSchemas).length > 0) {
    lines.push('### 响应');
    lines.push('');
    for (const [status, resp] of Object.entries(detail.responseSchemas)) {
      lines.push(`#### 状态码: ${status}`);
      if (resp.description) {
        lines.push(`${resp.description}`);
      }
      if (resp.schema) {
        lines.push(formatSchema(resp.schema, 1));
      }
      lines.push('');
    }
  }

  // 使用提示
  lines.push('---');
  lines.push('### 调用方式');
  lines.push('');
  lines.push('使用 api_execute 工具调用此 API:');
  lines.push('```');
  lines.push(`api_execute(operationId="${detail.id}", parameters={...})`);
  lines.push('```');

  return lines.join('\n');
}

export default {
  tool: apiDetailTool,
  execute: executeApiDetail,
  schema: apiDetailSchema,
};
