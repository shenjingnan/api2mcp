import { describe, expect, it } from 'vitest';
import { buildRequest } from '../../src/executor/request-builder.js';
import type { OpenApiOperation } from '../../src/parser/types.js';

describe('request-builder', () => {
  describe('buildRequest', () => {
    it('应该从输入中替换路径参数', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users/{id}',
        operationId: 'getUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      };

      const result = buildRequest(operation, { id: '123' });
      expect(result.path).toBe('/users/123');
    });

    it('缺少必需的路径参数时应抛出错误', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users/{id}',
        operationId: 'getUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      };

      expect(() => buildRequest(operation, {})).toThrow('Missing required path parameter: id');
    });
  });

  describe('buildRequest 配合 fixedParams', () => {
    it('应使用 fixedParams 作为路径参数的回退', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        parameters: [
          { name: 'appKey', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'location', in: 'path', required: true, schema: { type: 'string' } },
        ],
      };

      const result = buildRequest(
        operation,
        { location: '39.9:116.4' },
        {},
        { appKey: 'Se04nQMdbqD5IPLP' }
      );

      expect(result.path).toBe('/v2.6/Se04nQMdbqD5IPLP/39.9:116.4/weather');
    });

    it('当 input 和 fixedParams 同时存在时应优先使用 input', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        parameters: [
          { name: 'appKey', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'location', in: 'path', required: true, schema: { type: 'string' } },
        ],
      };

      const result = buildRequest(
        operation,
        { appKey: 'override-key', location: '39.9:116.4' },
        {},
        { appKey: 'Se04nQMdbqD5IPLP' }
      );

      expect(result.path).toBe('/v2.6/override-key/39.9:116.4/weather');
    });

    it('应使用 fixedParams 作为查询参数的回退', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        parameters: [
          { name: 'apiKey', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
        ],
      };

      const result = buildRequest(operation, { page: 2 }, {}, { apiKey: 'secret-key' });

      expect(result.query).toEqual({ apiKey: 'secret-key', page: '2' });
    });

    it('仅使用 fixedParams 而无 input 参数时应正常工作', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/weather',
        operationId: 'getWeather',
        parameters: [{ name: 'appKey', in: 'path', required: true, schema: { type: 'string' } }],
      };

      const result = buildRequest(operation, {}, {}, { appKey: 'Se04nQMdbqD5IPLP' });

      expect(result.path).toBe('/v2.6/Se04nQMdbqD5IPLP/weather');
    });

    it('当 input 和 fixedParams 都缺少必需参数时应抛出错误', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/{location}/weather',
        operationId: 'getWeather',
        parameters: [
          { name: 'appKey', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'location', in: 'path', required: true, schema: { type: 'string' } },
        ],
      };

      expect(() => buildRequest(operation, {}, {}, { appKey: 'Se04nQMdbqD5IPLP' })).toThrow(
        'Missing required path parameter: location'
      );
    });

    it('可选参数在 input 和 fixedParams 中都缺失时不应抛出错误', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users',
        operationId: 'getUsers',
        parameters: [
          { name: 'apiKey', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'lang', in: 'query', required: false, schema: { type: 'string' } },
        ],
      };

      const result = buildRequest(operation, {}, {}, { apiKey: 'secret-key' });

      expect(result.query).toEqual({ apiKey: 'secret-key' });
    });

    it('应使用 fixedParams 作为 header 参数的回退', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [
          { name: 'X-API-Key', in: 'header', required: true, schema: { type: 'string' } },
          { name: 'Accept', in: 'header', required: false, schema: { type: 'string' } },
        ],
      };

      const result = buildRequest(operation, {}, {}, { 'X-API-Key': 'header-secret' });

      expect(result.headers['X-API-Key']).toBe('header-secret');
      expect(result.headers.Accept).toBeUndefined();
    });

    it('对于 header 参数应优先使用 input 而非 fixedParams', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [
          { name: 'X-API-Key', in: 'header', required: true, schema: { type: 'string' } },
        ],
      };

      const result = buildRequest(
        operation,
        { 'X-API-Key': 'override-key' },
        {},
        { 'X-API-Key': 'fixed-key' }
      );

      expect(result.headers['X-API-Key']).toBe('override-key');
    });

    it('缺少必需的 header 参数且无 fixedParams 时应抛出错误', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/api/data',
        operationId: 'getData',
        parameters: [
          { name: 'X-API-Key', in: 'header', required: true, schema: { type: 'string' } },
        ],
      };

      expect(() => buildRequest(operation, {})).toThrow(
        'Missing required header parameter: X-API-Key'
      );
    });
  });
});
