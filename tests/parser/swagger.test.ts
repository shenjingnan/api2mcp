import { describe, expect, it } from 'vitest';
import { getBaseUrl, parseOpenApi } from '../../src/parser/swagger.js';
import type { ParsedOpenApiDoc } from '../../src/parser/types.js';

describe('getBaseUrl', () => {
  it('should return override URL when provided', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      operations: [],
    };
    const result = getBaseUrl(doc, 'https://override.example.com');
    expect(result).toBe('https://override.example.com');
  });

  it('should return URL from servers array', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBe('https://api.example.com');
  });

  it('should return undefined when no servers in document', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });

  it('should return undefined when servers array is empty', () => {
    const doc: ParsedOpenApiDoc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [],
      operations: [],
    };
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });

  it('should substitute variables in server URL', () => {
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

  it('should return undefined for OpenAPI without servers field', async () => {
    const doc = await parseOpenApi('tests/fixtures/openapi/minimal.json');
    const result = getBaseUrl(doc);
    expect(result).toBeUndefined();
  });
});
