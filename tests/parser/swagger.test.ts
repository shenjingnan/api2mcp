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

describe('x-fixed extension', () => {
  it('should parse x-fixed: true from parameter', async () => {
    const doc = await parseOpenApi('tests/fixtures/openapi/xfixed.json');
    const getDataOp = doc.operations.find((op) => op.operationId === 'getData');
    expect(getDataOp).toBeDefined();
    expect(getDataOp?.parameters).toBeDefined();

    const apiKeyParam = getDataOp?.parameters?.find((p) => p.name === 'apiKey');
    expect(apiKeyParam).toBeDefined();
    expect(apiKeyParam?.xFixed).toBe(true);

    const pageParam = getDataOp?.parameters?.find((p) => p.name === 'page');
    expect(pageParam).toBeDefined();
    expect(pageParam?.xFixed).toBeUndefined();
  });

  it('should parse x-fixed for parameters across multiple operations', async () => {
    const doc = await parseOpenApi('tests/fixtures/openapi/xfixed.json');
    const getItemsOp = doc.operations.find((op) => op.operationId === 'getItems');
    expect(getItemsOp).toBeDefined();

    const apiKeyParam = getItemsOp?.parameters?.find((p) => p.name === 'apiKey');
    expect(apiKeyParam?.xFixed).toBe(true);

    const projectIdParam = getItemsOp?.parameters?.find((p) => p.name === 'projectId');
    expect(projectIdParam?.xFixed).toBeUndefined();
  });

  it('should have xFixed as undefined when x-fixed is not present', async () => {
    const doc = await parseOpenApi('tests/fixtures/openapi/minimal.json');
    const getUsersOp = doc.operations.find((op) => op.operationId === 'getUsers');
    expect(getUsersOp?.parameters).toBeUndefined();
  });
});
