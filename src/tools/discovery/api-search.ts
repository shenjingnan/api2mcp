/**
 * api_search 工具
 * 模糊搜索 API
 */

import { z } from 'zod';
import type { ApiRegistry } from '../../registry/api-registry.js';
import { logger } from '../../utils/logger.js';

/**
 * 输入参数 Schema
 */
export const apiSearchSchema = z.object({
  query: z.string().min(1).describe('搜索关键词'),
  searchIn: z
    .array(z.enum(['name', 'summary', 'description', 'path']))
    .optional()
    .default(['name', 'summary', 'description', 'path'])
    .describe('搜索范围（默认搜索所有字段）'),
  limit: z.number().int().min(1).max(100).optional().default(20).describe('最大返回数量（1-100）'),
});

export type ApiSearchInput = z.infer<typeof apiSearchSchema>;

/**
 * 工具定义
 */
export const apiSearchTool = {
  name: 'api_search',
  description: `搜索 API。

使用场景：
- 根据关键词快速找到相关 API
- 搜索特定功能或资源的接口
- 查找包含特定路径段的 API

搜索范围包括：API 名称、摘要、描述、路径。
结果按匹配度排序，最匹配的排在前面。`,
  inputSchema: apiSearchSchema,
};

/**
 * 执行 api_search 工具
 */
export function executeApiSearch(registry: ApiRegistry, input: ApiSearchInput): string {
  const { query, searchIn, limit } = input;

  logger.debug(
    `Executing api_search: query="${query}", searchIn=${searchIn?.join(',')}, limit=${limit}`
  );

  const results = registry.search({ query, searchIn, limit });

  const lines: string[] = [];

  lines.push(`## 搜索结果: "${query}"`);
  lines.push(`找到 ${results.length} 个匹配的 API`);
  lines.push('');

  if (results.length === 0) {
    lines.push('没有找到匹配的 API。');
    lines.push('');
    lines.push('建议：');
    lines.push('- 尝试使用不同的关键词');
    lines.push('- 检查拼写是否正确');
    lines.push('- 使用更通用的搜索词');
    return lines.join('\n');
  }

  // 列出搜索结果
  for (const item of results) {
    const methodBadge = `[${item.method.toUpperCase().padEnd(6)}]`;
    const matchInfo = `匹配字段: ${item.matchedFields.join(', ')}`;

    lines.push(`### ${item.id}`);
    lines.push(`${methodBadge} ${item.path}`);
    if (item.summary) {
      lines.push(`${item.summary}`);
    }
    lines.push(`_${matchInfo}_ (相关度: ${Math.round(item.score * 100)}%)`);
    lines.push('');
  }

  lines.push('---');
  lines.push('使用 api_detail <id> 查看 API 详情');
  lines.push('使用 api_execute <id> <parameters> 执行 API');

  return lines.join('\n');
}

export default {
  tool: apiSearchTool,
  execute: executeApiSearch,
  schema: apiSearchSchema,
};
