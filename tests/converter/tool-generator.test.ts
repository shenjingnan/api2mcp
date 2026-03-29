import { describe, expect, it } from 'vitest';
import { generateTool } from '../../src/converter/tool-generator.js';
import type { OpenApiOperation } from '../../src/parser/types.js';

describe('tool-generator', () => {
  describe('_baseUrl parameter', () => {
    it('should include _baseUrl parameter in generated tool', () => {
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

    it('should make _baseUrl parameter optional', () => {
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

    it('should validate _baseUrl as URL format', () => {
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
    it('should exclude fixed params from tool schema', () => {
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

      // appKey should be hidden from LLM
      expect(tool.inputSchema.shape).not.toHaveProperty('appKey');
      // location should still be present
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });

    it('should exclude fixed query params from tool schema', () => {
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

      // apiKey should be hidden
      expect(tool.inputSchema.shape).not.toHaveProperty('apiKey');
      // page should still be present
      expect(tool.inputSchema.shape).toHaveProperty('page');
    });

    it('should include all params when no fixedParams provided', () => {
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

      // All params should be present
      expect(tool.inputSchema.shape).toHaveProperty('appKey');
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });

    it('should not exclude params that are not in fixedParams', () => {
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

      // Neither appKey nor location is in fixedParams, so both should be present
      expect(tool.inputSchema.shape).toHaveProperty('appKey');
      expect(tool.inputSchema.shape).toHaveProperty('location');
    });
  });
});
