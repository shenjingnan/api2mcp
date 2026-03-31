import { describe, expect, it } from 'vitest';
import type { OpenApiOperation } from '../../src/parser/types.js';
import { extractXFixedParams } from '../../src/server/index.js';

describe('extractXFixedParams', () => {
  it('should extract x-fixed param value from env', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [
          { name: 'apiKey', in: 'query', xFixed: true, required: true },
          { name: 'page', in: 'query', required: false },
        ],
      },
    ];

    const result = extractXFixedParams(operations, { apiKey: 'secret-key' });
    expect(result).toEqual({ apiKey: 'secret-key' });
  });

  it('should skip x-fixed param when env has no value', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [{ name: 'apiKey', in: 'query', xFixed: true, required: true }],
      },
    ];

    const result = extractXFixedParams(operations, {});
    expect(result).toEqual({});
  });

  it('should only extract each x-fixed param once across multiple operations', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [{ name: 'apiKey', in: 'query', xFixed: true, required: true }],
      },
      {
        method: 'GET',
        path: '/api/items',
        operationId: 'getItems',
        parameters: [{ name: 'apiKey', in: 'query', xFixed: true, required: true }],
      },
    ];

    const result = extractXFixedParams(operations, { apiKey: 'secret-key' });
    expect(result).toEqual({ apiKey: 'secret-key' });
  });

  it('should not extract non-x-fixed params', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [
          { name: 'apiKey', in: 'query', xFixed: true, required: true },
          { name: 'page', in: 'query', required: false },
        ],
      },
    ];

    const result = extractXFixedParams(operations, { apiKey: 'key123', page: '2' });
    expect(result).toEqual({ apiKey: 'key123' });
  });

  it('should handle operations without parameters', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
      },
    ];

    const result = extractXFixedParams(operations, { apiKey: 'secret-key' });
    expect(result).toEqual({});
  });

  it('should extract multiple different x-fixed params', () => {
    const operations: OpenApiOperation[] = [
      {
        method: 'GET',
        path: '/api/{projectId}/data',
        operationId: 'getData',
        parameters: [
          { name: 'projectId', in: 'path', xFixed: true, required: true },
          { name: 'apiKey', in: 'header', xFixed: true, required: true },
        ],
      },
    ];

    const result = extractXFixedParams(operations, { projectId: 'p1', apiKey: 'key123' });
    expect(result).toEqual({ projectId: 'p1', apiKey: 'key123' });
  });
});
