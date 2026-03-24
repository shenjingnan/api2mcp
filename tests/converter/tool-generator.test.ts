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
});
