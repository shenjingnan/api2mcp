/**
 * api_detail 工具单元测试
 */

import { describe, expect, it } from 'vitest';
import { ApiRegistry } from '../../../src/registry/api-registry.js';
import type { ApiEntry } from '../../../src/registry/types.js';
import { executeApiDetail } from '../../../src/tools/discovery/api-detail.js';

describe('executeApiDetail', () => {
  const createTestEntry = (id: string, overrides: Partial<ApiEntry> = {}): ApiEntry => ({
    id,
    name: id,
    method: 'GET',
    path: `/api/${id}`,
    operation: {
      method: 'GET',
      path: `/api/${id}`,
      operationId: id,
    },
    ...overrides,
  });

  describe('formatSchema（通过 executeApiDetail 间接测试）', () => {
    it('基本属性显示 — 包含 type、properties 的 schema', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('test-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/users',
          operationId: 'test-api',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: '用户名' },
                    age: { type: 'integer', description: '年龄' },
                  },
                  required: ['name'],
                },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'test-api' });

      expect(result).toContain('类型: object');
      expect(result).toContain('name (必填): string');
      expect(result).toContain('age (可选): integer');
      expect(result).toContain('用户名');
      expect(result).toContain('年龄');
    });

    it('schema.required 为数组时正确标记必填（核心回归测试）', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('pet-api', {
        method: 'PUT',
        operation: {
          method: 'PUT',
          path: '/pet',
          operationId: 'pet-api',
          requestBody: {
            required: true,
            description: 'Pet object that needs to be updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    photoUrls: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string' },
                  },
                  required: ['name', 'photoUrls'],
                },
              },
            },
          },
        },
      });

      registry.register(entry);

      // 不应抛出 "required.includes is not a function" 错误
      expect(() => executeApiDetail(registry, { id: 'pet-api' })).not.toThrow();

      const result = executeApiDetail(registry, { id: 'pet-api' });
      expect(result).toContain('name (必填): string');
      expect(result).toContain('photoUrls (必填): array');
      expect(result).toContain('status (可选): string');
    });

    it('嵌套对象递归', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('nested-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/orders',
          operationId: 'nested-api',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shipping: {
                      type: 'object',
                      properties: {
                        city: { type: 'string' },
                        zip: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'nested-api' });

      expect(result).toContain('shipping (可选): object');
      expect(result).toContain('city');
      expect(result).toContain('zip');
    });

    it('枚举值显示', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('enum-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/status',
          operationId: 'enum-api',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  enum: ['active', 'inactive', 'pending'],
                },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'enum-api' });

      expect(result).toContain('枚举值: active, inactive, pending');
    });

    it('示例值显示', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('example-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/items',
          operationId: 'example-api',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: 'hello-world',
                },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'example-api' });

      expect(result).toContain('示例: "hello-world"');
    });

    it('schema 为空时显示"无参数"', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('no-param-api', {
        method: 'GET',
        operation: {
          method: 'GET',
          path: '/health',
          operationId: 'no-param-api',
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'no-param-api' });

      expect(result).toContain('无参数');
    });
  });

  describe('executeApiDetail 函数', () => {
    it('通过 id 获取详情 — 完整输出包含方法、路径、参数、请求体、响应', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('full-api', {
        method: 'POST',
        path: '/users',
        summary: '创建用户',
        description: '创建一个新用户',
        tags: ['users'],
        operation: {
          method: 'POST',
          path: '/users',
          operationId: 'full-api',
          parameters: [
            { name: 'X-Token', in: 'header', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            description: '用户信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'full-api' });

      expect(result).toContain('## API: full-api');
      expect(result).toContain('[POST]');
      expect(result).toContain('`/users`');
      expect(result).toContain('创建用户');
      expect(result).toContain('创建一个新用户');
      expect(result).toContain('`users`');
      expect(result).toContain('### 参数');
      expect(result).toContain('X-Token');
      expect(result).toContain('### 请求体');
      expect(result).toContain('### 响应');
      expect(result).toContain('状态码: 200');
      expect(result).toContain('api_execute(operationId="full-api"');
    });

    it('通过 name 降级查找', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('my-api-id', {
        name: 'my-api-name',
        method: 'GET',
        path: '/test',
        operation: {
          method: 'GET',
          path: '/test',
          operationId: 'my-api-id',
        },
      });

      registry.register(entry);

      // 通过 name 查找（不是 id）
      const result = executeApiDetail(registry, { id: 'my-api-name' });

      expect(result).toContain('## API: my-api-name');
      expect(result).toContain('`/test`');
    });

    it('id 和 name 都找不到时返回错误信息', () => {
      const registry = new ApiRegistry();
      // 注册一个不相关的 API
      registry.register(createTestEntry('other-api'));

      const result = executeApiDetail(registry, { id: 'nonexistent' });

      expect(result).toContain('错误: 找不到 API "nonexistent"');
      expect(result).toContain('api_search');
    });

    it('bodyRequired 为 true 时显示必填标记', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('required-body-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/data',
          operationId: 'required-body-api',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { key: { type: 'string' } } },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'required-body-api' });

      expect(result).toContain('**必填**: 是');
    });

    it('bodyRequired 为 false/undefined 时不显示必填标记', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('optional-body-api', {
        method: 'POST',
        operation: {
          method: 'POST',
          path: '/optional',
          operationId: 'optional-body-api',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { key: { type: 'string' } } },
              },
            },
          },
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'optional-body-api' });

      expect(result).not.toContain('**必填**: 是');
    });

    it('deprecated API 显示废弃标记', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('old-api', {
        method: 'GET',
        deprecated: true,
        operation: {
          method: 'GET',
          path: '/old',
          operationId: 'old-api',
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'old-api' });

      expect(result).toContain('⚠️ 已废弃');
    });

    it('无参数时显示"无参数"', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('no-params', {
        method: 'GET',
        operation: {
          method: 'GET',
          path: '/ping',
          operationId: 'no-params',
        },
      });

      registry.register(entry);
      const result = executeApiDetail(registry, { id: 'no-params' });

      expect(result).toContain('无参数');
    });
  });
});
