/**
 * api_list 工具单元测试
 */

import { describe, expect, it } from 'vitest';
import { ApiRegistry } from '../../../src/registry/api-registry.js';
import type { ApiEntry } from '../../../src/registry/types.js';
import { executeApiList } from '../../../src/tools/discovery/api-list.js';

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

describe('api-list', () => {
  describe('executeApiList', () => {
    it('基本的分页列表', () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        createApiEntry({
          id: `api${i}`,
          name: `api_${i}`,
          method: 'GET',
          path: `/api${i}`,
          summary: `API ${i}`,
        })
      );
      const registry = createMockRegistry(entries);
      const result = executeApiList(registry, { page: 1, pageSize: 3 });

      expect(result).toContain('5 个 API');
      expect(result).toContain('页码: 1/');
      expect(result).toContain('api0');
      expect(result).toContain('api1');
      expect(result).toContain('api2');
      expect(result).not.toContain('api3');
    });

    it('默认参数', () => {
      const entries = Array.from({ length: 25 }, (_, i) =>
        createApiEntry({
          id: `api${i}`,
          name: `api_${i}`,
          method: 'GET',
          path: `/api${i}`,
        })
      );
      const registry = createMockRegistry(entries);
      const result = executeApiList(registry, {});

      expect(result).toContain('25 个 API');
      expect(result).toContain('页码: 1/2');
    });

    it('按标签过滤', () => {
      const usersEntry = createApiEntry({ tags: ['users'] });
      const petsEntry = createApiEntry({
        id: 'getPets',
        name: 'get_pets',
        path: '/pets',
        tags: ['pets'],
      });
      const registry = createMockRegistry([usersEntry, petsEntry]);

      const result = executeApiList(registry, { page: 1, pageSize: 10, tag: 'users' });
      expect(result).toContain('1 个 API');
      expect(result).toContain(usersEntry.id);
      expect(result).not.toContain(petsEntry.id);
    });

    it('标签过滤 - 无匹配结果', () => {
      const entry = createApiEntry({ tags: ['users'] });
      const registry = createMockRegistry([entry]);

      const result = executeApiList(registry, { tag: 'nonexistent' });
      expect(result).toContain('没有找到匹配的 API');
    });

    it('分页提示', () => {
      const entries = Array.from({ length: 25 }, (_, i) =>
        createApiEntry({
          id: `api${i}`,
          name: `api_${i}`,
          method: 'GET',
          path: `/api${i}`,
        })
      );
      const registry = createMockRegistry(entries);

      const result = executeApiList(registry, { page: 1, pageSize: 10 });
      expect(result).toContain('使用 page=2 查看下一页');
    });

    it('最后一页不显示翻页提示', () => {
      const entries = Array.from({ length: 15 }, (_, i) =>
        createApiEntry({
          id: `api${i}`,
          name: `api_${i}`,
          method: 'GET',
          path: `/api${i}`,
        })
      );
      const registry = createMockRegistry(entries);

      const result = executeApiList(registry, { page: 2, pageSize: 10 });
      expect(result).not.toContain('查看下一页');
    });

    it('废弃标记显示', () => {
      const entry = createApiEntry({ deprecated: true });
      const registry = createMockRegistry([entry]);

      const result = executeApiList(registry, {});
      expect(result).toContain('[已废弃]');
    });

    it('空注册表', () => {
      const registry = createMockRegistry([]);

      const result = executeApiList(registry, {});
      expect(result).toContain('0 个 API');
      expect(result).toContain('没有找到匹配的 API');
    });
  });
});
