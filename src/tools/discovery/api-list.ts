/**
 * api_list 工具
 * 分页浏览所有 API
 */

import { z } from 'zod';
import type { ApiRegistry } from '../../registry/api-registry.js';
import { logger } from '../../utils/logger.js';

/**
 * 输入参数 Schema
 */
export const apiListSchema = z.object({
  page: z.number().int().min(1).default(1).describe('页码（从 1 开始）'),
  pageSize: z.number().int().min(1).max(100).default(20).describe('每页数量（1-100）'),
  tag: z.string().optional().describe('按标签过滤'),
});

export type ApiListInput = z.infer<typeof apiListSchema>;

/**
 * 工具定义
 */
export const apiListTool = {
  name: 'api_list',
  description: `分页浏览所有可用的 API。

使用场景：
- 查看有哪些 API 可用
- 按标签过滤 API
- 浏览 API 列表以找到需要的接口

返回内容包括：API ID、名称、HTTP 方法、路径、摘要、标签等。`,
  inputSchema: apiListSchema,
};

/**
 * 执行 api_list 工具
 */
export function executeApiList(registry: ApiRegistry, input: ApiListInput): string {
  const { page, pageSize, tag } = input;

  logger.debug(`Executing api_list: page=${page}, pageSize=${pageSize}, tag=${tag}`);

  const result = registry.list({ page, pageSize, tag });

  const lines: string[] = [];

  // 添加统计信息
  lines.push(`## API 列表 (${result.total} 个 API)`);
  lines.push(`页码: ${result.page}/${result.totalPages}`);
  if (tag) {
    lines.push(`标签过滤: ${tag}`);
  }
  lines.push('');

  if (result.items.length === 0) {
    lines.push('没有找到匹配的 API。');
    return lines.join('\n');
  }

  // 列出 API
  for (const item of result.items) {
    const methodBadge = `[${item.method.toUpperCase().padEnd(6)}]`;
    const deprecatedTag = item.deprecated ? ' [已废弃]' : '';
    const tags = item.tags ? ` (${item.tags.join(', ')})` : '';

    lines.push(`### ${item.id}`);
    lines.push(`${methodBadge} ${item.path}${deprecatedTag}${tags}`);
    if (item.summary) {
      lines.push(`${item.summary}`);
    }
    lines.push('');
  }

  // 添加分页提示
  if (result.totalPages > 1) {
    lines.push('---');
    if (result.page < result.totalPages) {
      lines.push(`使用 page=${result.page + 1} 查看下一页`);
    }
  }

  return lines.join('\n');
}

export default {
  tool: apiListTool,
  execute: executeApiList,
  schema: apiListSchema,
};
