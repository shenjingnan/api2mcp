import { describe, expect, it } from 'vitest';
import { executeRequest } from '../../src/executor/http-client.js';
import type { OpenApiOperation } from '../../src/parser/types.js';
import { ToolExecutionError } from '../../src/utils/error.js';

describe('http-client', () => {
  describe('executeRequest', () => {
    it('should throw ToolExecutionError when no baseUrl is configured', async () => {
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

    it('should throw error with helpful message about _baseUrl parameter', async () => {
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
        expect.fail('Should have thrown an error');
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
