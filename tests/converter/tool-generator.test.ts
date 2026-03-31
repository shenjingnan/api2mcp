import { describe, expect, it } from 'vitest';
import { generateTool } from '../../src/converter/tool-generator.js';
import type { OpenApiOperation } from '../../src/parser/types.js';

describe('tool-generator', () => {
  describe('_baseUrl 参数', () => {
    it('生成的工具应包含 _baseUrl 参数', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get all users',
      };

      const tool = generateTool(operation);

      // 检查 inputSchema 中是否包含 _baseUrl 参数
      expect(tool.inputSchema.shape).toHaveProperty('_baseUrl');
    });

    it('_baseUrl 参数应为可选的', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get all users',
      };

      const tool = generateTool(operation);
      const baseUrlSchema = tool.inputSchema.shape._baseUrl;

      // 验证 _baseUrl 是可选的（可以解析 undefined）
      const result = baseUrlSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('_baseUrl 应验证为 URL 格式', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get all users',
      };

      const tool = generateTool(operation);
      const baseUrlSchema = tool.inputSchema.shape._baseUrl;

      // 验证有效的 URL
      const validResult = baseUrlSchema.safeParse('https://api.example.com');
      expect(validResult.success).toBe(true);

      // 验证无效的 URL
      const invalidResult = baseUrlSchema.safeParse('not-a-url');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('fixedParams', () => {
    it('应将固定参数从工具 schema 中排除', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        summary: 'Get weather',
        parameters: [
          {
            name: 'appKey',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'location',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      const tool = generateTool(operation, undefined, undefined, { appKey: 'secret123' });

      // appKey 应对 LLM 隐藏
      expect(tool.inputSchema.shape).not.toHaveProperty('appKey');
      // location 应保留
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });

    it('应将固定的查询参数从工具 schema 中排除', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get users',
        parameters: [
          {
            name: 'apiKey',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
      };

      const tool = generateTool(operation, undefined, undefined, { apiKey: 'secret-key' });

      // apiKey 应被隐藏
      expect(tool.inputSchema.shape).not.toHaveProperty('apiKey');
      // page 应保留
      expect(tool.inputSchema.shape).toHaveProperty('page');
    });

    it('未提供 fixedParams 时应包含所有参数', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        summary: 'Get weather',
        parameters: [
          {
            name: 'appKey',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'location',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      const tool = generateTool(operation);

      // 所有参数都应存在
      expect(tool.inputSchema.shape).toHaveProperty('appKey');
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });

    it('不应排除不在 fixedParams 中的参数', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        summary: 'Get weather',
        parameters: [
          {
            name: 'appKey',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'location',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      const tool = generateTool(operation, undefined, undefined, { token: 'other-value' });

      // appKey 和 location 都不在 fixedParams 中，因此都应保留
      expect(tool.inputSchema.shape).toHaveProperty('appKey');
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });
  });
});
