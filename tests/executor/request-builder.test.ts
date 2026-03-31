import { describe, expect, it } from 'vitest';
import { buildRequest } from '../../src/executor/request-builder.js';
import type { OpenApiOperation } from '../../src/parser/types.js';

describe('request-builder', () => {
  describe('buildRequest', () => {
    it('should replace path params from input', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users/{id}',
        operationId: 'getUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      };

      const result = buildRequest(operation, { id: '123' });
      expect(result.path).toBe('/users/123');
    });

    it('should throw error for missing required path param', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/users/{id}',
        operationId: 'getUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      };

      expect(() => buildRequest(operation, {})).toThrow('Missing required path parameter: id');
    });
  });

  describe('buildRequest with fixedParams', () => {
    it('should use fixedParams as fallback for path params', () => {
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

    it('should prefer input over fixedParams when both are present', () => {
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

    it('should use fixedParams as fallback for query params', () => {
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

    it('should work with only fixedParams and no input params', () => {
      const operation: OpenApiOperation = {
        method: 'GET',
        path: '/v2.6/{appKey}/weather',
        operationId: 'getWeather',
        parameters: [{ name: 'appKey', in: 'path', required: true, schema: { type: 'string' } }],
      };

      const result = buildRequest(operation, {}, {}, { appKey: 'Se04nQMdbqD5IPLP' });

      expect(result.path).toBe('/v2.6/Se04nQMdbqD5IPLP/weather');
    });

    it('should throw error when param is missing from both input and fixedParams', () => {
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

    it('should not throw for optional params missing from both input and fixedParams', () => {
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

    it('should use fixedParams as fallback for header params', () => {
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

    it('should prefer input over fixedParams for header params', () => {
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

    it('should throw error for missing required header param without fixedParams', () => {
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
