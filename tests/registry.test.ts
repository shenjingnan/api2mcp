/**
 * ApiRegistry 单元测试
 */

import { describe, expect, it } from 'vitest';
import { ApiRegistry } from '../src/registry/api-registry.js';
import type { ApiEntry } from '../src/registry/types.js';

describe('ApiRegistry', () => {
  // 创建测试数据
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

  describe('register', () => {
    it('should register an API entry', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('test-api');

      registry.register(entry);

      expect(registry.size).toBe(1);
      expect(registry.get('test-api')).toEqual(entry);
    });

    it('should overwrite existing entry', () => {
      const registry = new ApiRegistry();
      const entry1 = createTestEntry('test-api', { summary: 'First' });
      const entry2 = createTestEntry('test-api', { summary: 'Second' });

      registry.register(entry1);
      registry.register(entry2);

      expect(registry.size).toBe(1);
      expect(registry.get('test-api')?.summary).toBe('Second');
    });

    it('should index by name', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('test-id', { name: 'test-name' });

      registry.register(entry);

      expect(registry.getByName('test-name')).toEqual(entry);
    });

    it('should index tags', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('test-api', { tags: ['users', 'admin'] });

      registry.register(entry);

      expect(registry.getTags()).toEqual(['admin', 'users']);
    });
  });

  describe('registerAll', () => {
    it('should register multiple entries', () => {
      const registry = new ApiRegistry();
      const entries = [createTestEntry('api1'), createTestEntry('api2'), createTestEntry('api3')];

      registry.registerAll(entries);

      expect(registry.size).toBe(3);
    });
  });

  describe('search', () => {
    it('should search by name', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('get-users'),
        createTestEntry('get-products'),
        createTestEntry('create-user'),
      ]);

      const results = registry.search({ query: 'user' });

      expect(results.length).toBe(2);
      expect(results.map((r) => r.id)).toContain('get-users');
      expect(results.map((r) => r.id)).toContain('create-user');
    });

    it('should search by summary', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1', { summary: 'Get user information' }),
        createTestEntry('api2', { summary: 'Get product list' }),
      ]);

      const results = registry.search({ query: 'user', searchIn: ['summary'] });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('api1');
      expect(results[0].matchedFields).toContain('summary');
    });

    it('should search by path', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1', { path: '/users/{id}' }),
        createTestEntry('api2', { path: '/products/{id}' }),
      ]);

      const results = registry.search({ query: 'users', searchIn: ['path'] });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('api1');
    });

    it('should respect limit', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('user-api-1'),
        createTestEntry('user-api-2'),
        createTestEntry('user-api-3'),
      ]);

      const results = registry.search({ query: 'user', limit: 2 });

      expect(results.length).toBe(2);
    });

    it('should return empty array for no matches', () => {
      const registry = new ApiRegistry();
      registry.register(createTestEntry('test-api'));

      const results = registry.search({ query: 'nonexistent' });

      expect(results.length).toBe(0);
    });
  });

  describe('list', () => {
    it('should list all APIs with pagination', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1'),
        createTestEntry('api2'),
        createTestEntry('api3'),
      ]);

      const result = registry.list({ page: 1, pageSize: 2 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.items.length).toBe(2);
    });

    it('should return correct page', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1'),
        createTestEntry('api2'),
        createTestEntry('api3'),
      ]);

      const result = registry.list({ page: 2, pageSize: 2 });

      expect(result.items.length).toBe(1);
    });

    it('should filter by tag', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1', { tags: ['users'] }),
        createTestEntry('api2', { tags: ['products'] }),
        createTestEntry('api3', { tags: ['users'] }),
      ]);

      const result = registry.list({ tag: 'users' });

      expect(result.total).toBe(2);
    });

    it('should return empty for non-existent tag', () => {
      const registry = new ApiRegistry();
      registry.register(createTestEntry('api1', { tags: ['users'] }));

      const result = registry.list({ tag: 'nonexistent' });

      expect(result.total).toBe(0);
      expect(result.items.length).toBe(0);
    });
  });

  describe('getDetail', () => {
    it('should return API detail with schemas', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('test-api', {
        operation: {
          method: 'POST',
          path: '/users',
          operationId: 'test-api',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
          responses: {
            '200': {
              description: 'Success',
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
      const detail = registry.getDetail('test-api');

      expect(detail).toBeDefined();
      expect(detail?.parameterSchema).toBeDefined();
      expect(detail?.requestBodySchema).toBeDefined();
      expect(detail?.responseSchemas).toBeDefined();
    });

    it('should preserve schema.required array and add bodyRequired in requestBodySchema', () => {
      const registry = new ApiRegistry();
      const entry = createTestEntry('pet-api', {
        operation: {
          method: 'PUT',
          path: '/pet',
          operationId: 'pet-api',
          requestBody: {
            required: true,
            description: 'Pet object',
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
      const detail = registry.getDetail('pet-api');

      expect(detail).toBeDefined();
      const bodySchema = detail!.requestBodySchema!;
      // schema.required 应保留为数组
      expect(bodySchema.required).toEqual(['name', 'photoUrls']);
      // requestBody.required 应保存在 bodyRequired 字段中
      expect(bodySchema.bodyRequired).toBe(true);
      // description 应保留
      expect(bodySchema.description).toBe('Pet object');
    });

    it('should return undefined for non-existent API', () => {
      const registry = new ApiRegistry();

      const detail = registry.getDetail('nonexistent');

      expect(detail).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', () => {
      const registry = new ApiRegistry();
      registry.registerAll([
        createTestEntry('api1', { method: 'GET', tags: ['users'] }),
        createTestEntry('api2', { method: 'POST', tags: ['users'] }),
        createTestEntry('api3', { method: 'GET', tags: ['products'] }),
      ]);

      const stats = registry.getStats();

      expect(stats.totalApis).toBe(3);
      expect(stats.tags).toEqual(['products', 'users']);
      expect(stats.byMethod.GET).toBe(2);
      expect(stats.byMethod.POST).toBe(1);
      expect(stats.byTag.users).toBe(2);
      expect(stats.byTag.products).toBe(1);
    });
  });
});
