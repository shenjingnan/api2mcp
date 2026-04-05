/**
 * api_execute 工具单元测试
 */

import { describe, expect, it, vi } from 'vitest';
import type { Config } from '../../../src/config/types.js';
import type { OpenApiOperation } from '../../../src/parser/types.js';
import { ApiRegistry } from '../../../src/registry/api-registry.js';
import type { ApiEntry } from '../../../src/registry/types.js';
import { executeApiExecute } from '../../../src/tools/discovery/api-execute.js';

vi.mock('../../../src/executor/operation-executor.js', () => ({
  executeOperation: vi.fn().mockResolvedValue('Status: 200 OK\nBody: {"result": "success"}'),
}));

function createMockRegistry(entries: ApiEntry[]): ApiRegistry {
  const registry = new ApiRegistry();
  for (const entry of entries) {
    registry.register(entry);
  }
  return registry;
}

const mockOperation: OpenApiOperation = {
  method: 'GET',
  path: '/users/{id}',
  operationId: 'getUserById',
  summary: '获取用户详情',
};

function createApiEntry(overrides: Partial<ApiEntry> = {}): ApiEntry {
  return {
    id: 'getUserById',
    name: 'get_user_by_id',
    method: 'GET',
    path: '/users/{id}',
    summary: '获取用户详情',
    deprecated: false,
    operation: mockOperation,
    ...overrides,
  };
}

const mockConfig: Config = {
  openapiUrl: 'test.json',
  debug: false,
  baseUrl: 'https://api.example.com',
  timeout: 30000,
};

describe('api-execute', () => {
  describe('executeApiExecute', () => {
    it('通过 operationId 查找 API', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'getUserById',
        parameters: { id: 1 },
      });
      expect(result).toContain('success');
    });

    it('通过 name 回退查找 API', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'get_user_by_id',
        parameters: { id: 1 },
      });
      expect(result).toContain('success');
    });

    it('找不到 API 时返回错误信息', async () => {
      const registry = createMockRegistry([]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'nonexistent',
      });
      expect(result).toContain('找不到 API');
      expect(result).toContain('api_search');
    });

    it('废弃 API 应记录警告但仍执行', async () => {
      const registry = createMockRegistry([createApiEntry({ deprecated: true })]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'getUserById',
      });
      // 不应因为废弃而拒绝执行
      expect(result).toContain('success');
    });

    it('无 baseUrl 时返回错误信息', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const configWithoutBaseUrl: Config = {
        ...mockConfig,
        baseUrl: undefined,
      };
      const result = await executeApiExecute(registry, configWithoutBaseUrl, {
        operationId: 'getUserById',
      });
      expect(result).toContain('没有配置 base URL');
    });

    it('_baseUrl 参数覆盖配置', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = await executeApiExecute(
        registry,
        { ...mockConfig, baseUrl: undefined },
        {
          operationId: 'getUserById',
          _baseUrl: 'https://override.example.com',
        }
      );
      expect(result).toContain('success');
    });

    it('成功执行返回响应内容', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'getUserById',
        parameters: { id: 42 },
      });
      expect(result).toContain('Status: 200 OK');
      expect(result).toContain('success');
    });

    it('无参数时使用默认空参数', async () => {
      const registry = createMockRegistry([createApiEntry()]);
      const result = await executeApiExecute(registry, mockConfig, {
        operationId: 'getUserById',
      });
      expect(result).toContain('success');
    });
  });
});
