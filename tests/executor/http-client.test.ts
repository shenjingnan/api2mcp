import { describe, expect, it } from 'vitest';
import { executeRequest } from '../../src/executor/http-client.js';
import type { OpenApiOperation } from '../../src/parser/types.js';
import { ToolExecutionError } from '../../src/utils/error.js';

describe('http-client', () => {
  describe('executeRequest', () => {
    it('未配置 baseUrl 时应抛出 ToolExecutionError', async () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get all users',
      };

      const config = {
        debug: false,
        openapiUrl: 'test.json',
        baseUrl: undefined,
        timeout: 30000,
      };

      await expect(executeRequest(operation, {}, config)).rejects.toThrow(ToolExecutionError);

      await expect(executeRequest(operation, {}, config)).rejects.toThrow('No base URL configured');
    });

    it('错误信息中应包含 _baseUrl 参数的使用提示', async () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        summary: 'Get all users',
      };

      const config = {
        debug: false,
        openapiUrl: 'test.json',
        baseUrl: undefined,
        timeout: 30000,
      };

      try {
        await executeRequest(operation, {}, config);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(ToolExecutionError);
        if (error instanceof ToolExecutionError) {
          expect(error.message).toContain('--base-url');
          expect(error.message).toContain('_baseUrl');
        }
      }
    });
  });
});
