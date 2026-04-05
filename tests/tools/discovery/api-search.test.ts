/**
 * api_search 工具单元测试
 */

import { describe, expect, it } from 'vitest';
import { ApiRegistry } from '../../../src/registry/api-registry.js';
import type { ApiEntry } from '../../../src/registry/types.js';
import { executeApiSearch } from '../../../src/tools/discovery/api-search.js';

function createMockRegistry(entries: ApiEntry[]): ApiRegistry {
  const registry = new ApiRegistry();
  for (const entry of entries) {
    registry.register(entry);
  }
  return registry;
}

function createApiEntry(overrides: Partial<ApiEntry> = {}): ApiEntry {
  return {
    id: 'getUsers',
    name: 'get_users',
    method: 'GET',
    path: '/users',
    summary: '获取用户列表',
    description: '返回所有用户',
    tags: ['users'],
    deprecated: false,
    operation: {
      method: 'GET',
      path: '/users',
      operationId: 'getUsers',
      summary: '获取用户列表',
    },
    ...overrides,
  };
}

describe('api-search', () => {
  describe('executeApiSearch', () => {
    it('按名称搜索', () => {
      const registry = createMockRegistry([
        createApiEntry(),
        createApiEntry({ id: 'createUser', name: 'create_user', method: 'POST' }),
      ]);
      const result = executeApiSearch(registry, { query: 'user' });
      expect(result).toContain('getUsers');
      expect(result).toContain('匹配字段: name');
    });

    it('按路径搜索', () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = executeApiSearch(registry, { query: '/users', searchIn: ['path'] });
      expect(result).toContain('getUsers');
      expect(result).toContain('匹配字段: path');
    });

    it('按摘要搜索', () => {
      const registry = createMockRegistry([createApiEntry({ summary: '获取用户详细信息' })]);
      const result = executeApiSearch(registry, { query: '详细', searchIn: ['summary'] });
      expect(result).toContain('匹配字段: summary');
    });

    it('按描述搜索', () => {
      const registry = createMockRegistry([
        createApiEntry({ description: '返回所有用户的详细信息' }),
      ]);
      const result = executeApiSearch(registry, { query: '所有用户', searchIn: ['description'] });
      expect(result).toContain('匹配字段: description');
    });

    it('无匹配结果时显示建议', () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = executeApiSearch(registry, { query: 'nonexistent' });
      expect(result).toContain('0 个匹配');
      expect(result).toContain('建议');
    });

    it('匹配字段显示', () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = executeApiSearch(registry, { query: 'users', searchIn: ['name', 'path'] });
      // 应同时匹配 name 和 path
      expect(result).toContain('匹配字段:');
    });

    it('相关度百分比显示', () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = executeApiSearch(registry, { query: 'users' });
      // 搜索 users 应该匹配到 name/path/summary 等字段并显示相关度
      expect(result).toContain('%');
    });

    it('limit 参数限制结果数量', () => {
      const registry = createMockRegistry([
        createApiEntry(),
        createApiEntry({ id: 'createUser', name: 'create_user', method: 'POST' }),
        createApiEntry({ id: 'deleteUser', name: 'delete_user', method: 'DELETE' }),
      ]);
      const result = executeApiSearch(registry, { query: 'user', limit: 2 });
      // 结果中包含最多 2 个
      const matches = result.match(/### \w+/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBeLessThanOrEqual(2);
    });

    it('自定义 searchIn 参数', () => {
      const registry = createMockRegistry([createApiEntry()]);
      // 只搜索路径，不搜索名称
      const result = executeApiSearch(registry, { query: 'users', searchIn: ['path'] });
      expect(result).toContain('匹配字段: path');
    });

    it('搜索结果包含使用提示', () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = executeApiSearch(registry, { query: 'users' });
      expect(result).toContain('api_detail');
      expect(result).toContain('api_execute');
    });
  });
});
