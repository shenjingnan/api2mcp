import { describe, expect, it } from 'vitest';
import { getBaseUrl, parseOpenApi } from '../../src/parser/swagger.js';
import type { ParsedOpenApiDoc } from '../../src/parser/types.js';

describe('getBaseUrl', () => {
  it('提供了覆盖 URL 时应返回覆盖 URL', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      operations: [],
    };
    const result = getBaseUrl(doc, 'https://override.example.com');
    expect(result).toBe('https://override.example.com');
  });

  it('应从 servers 数组中返回 URL', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBe('https://api.example.com');
  });

  it('文档中没有 servers 时应返回 undefined', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });

  it('servers 数组为空时应返回 undefined', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [],
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });

  it('应替换服务器 URL 中的变量', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: { default: 'api' },
          },
        },
      ],
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBe('https://api.example.com');
  });

  it('OpenAPI 文档无 servers 字段时应返回 undefined', async () => {
    const doc = await parseOpenApi('tests/fixtures/openapi/minimal.json');
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });
});
