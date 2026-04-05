import { describe, expect, it } from 'vitest';
import type { SecurityScheme } from '../../src/parser/types.js';
import { resolveAuthentication } from '../../src/security/auth-resolver.js';

describe('auth-resolver', () => {
  const securitySchemes: Record<string, SecurityScheme> = {
    bearerAuth: { type: 'http', scheme: 'bearer' },
    basicAuth: { type: 'http', scheme: 'basic' },
    apiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    apiKeyQuery: { type: 'apiKey', in: 'query', name: 'api_key' },
    apiKeyCookie: { type: 'apiKey', in: 'cookie', name: 'session' },
    oauth2: { type: 'oauth2', flows: {} },
    openId: {
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  };

  describe('空凭据', () => {
    it('无凭据时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: undefined,
        globalSecurity: [{ bearerAuth: [] }],
      });
      expect(result.headers).toEqual({});
      expect(result.query).toEqual({});
      expect(result.cookies).toEqual({});
    });

    it('空凭据对象时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: {},
        globalSecurity: [{ bearerAuth: [] }],
      });
      expect(result.headers).toEqual({});
    });
  });

  describe('无安全方案', () => {
    it('无 securitySchemes 时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes: undefined,
        credentials: { bearerAuth: 'token123' },
        globalSecurity: [{ bearerAuth: [] }],
      });
      expect(result.headers).toEqual({});
    });

    it('空 securitySchemes 时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes: {},
        credentials: { bearerAuth: 'token123' },
        globalSecurity: [{ bearerAuth: [] }],
      });
      expect(result.headers).toEqual({});
    });
  });

  describe('无安全需求', () => {
    it('无 globalSecurity 和 operationSecurity 时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'token123' },
      });
      expect(result.headers).toEqual({});
    });

    it('空安全需求数组时返回空认证', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'token123' },
        globalSecurity: [],
      });
      expect(result.headers).toEqual({});
    });
  });

  describe('HTTP Bearer 认证', () => {
    it('应注入 Authorization: Bearer 复杂头', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'my-token' },
        globalSecurity: [{ bearerAuth: [] }],
      });
      expect(result.headers.Authorization).toBe('Bearer my-token');
    });
  });

  describe('HTTP Basic 认证', () => {
    it('username:password 格式应自动编码为 base64', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { basicAuth: 'user:pass' },
        globalSecurity: [{ basicAuth: [] }],
      });
      expect(result.headers.Authorization).toBe('Basic dXNlcjpwYXNz');
    });

    it('已编码的凭据应直接使用', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { basicAuth: 'dXNlcjpwYXNz=' },
        globalSecurity: [{ basicAuth: [] }],
      });
      expect(result.headers.Authorization).toBe('Basic dXNlcjpwYXNz=');
    });
  });

  describe('API Key 认证', () => {
    it('header 位置应注入到 headers', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { apiKeyHeader: 'my-key' },
        globalSecurity: [{ apiKeyHeader: [] }],
      });
      expect(result.headers['X-API-Key']).toBe('my-key');
    });

    it('query 位置应注入到 query', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { apiKeyQuery: 'my-key' },
        globalSecurity: [{ apiKeyQuery: [] }],
      });
      expect(result.query.api_key).toBe('my-key');
    });

    it('cookie 位置应注入到 cookies', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { apiKeyCookie: 'my-session' },
        globalSecurity: [{ apiKeyCookie: [] }],
      });
      expect(result.cookies.session).toBe('my-session');
    });
  });

  describe('OAuth2 / OpenID Connect', () => {
    it('OAuth2 应降级为 Bearer Token', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { oauth2: 'oauth-token' },
        globalSecurity: [{ oauth2: [] }],
      });
      expect(result.headers.Authorization).toBe('Bearer oauth-token');
    });

    it('OpenID Connect 应降级为 Bearer Token', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { openId: 'oidc-token' },
        globalSecurity: [{ openId: [] }],
      });
      expect(result.headers.Authorization).toBe('Bearer oidc-token');
    });
  });

  describe('优先级', () => {
    it('操作级 security 应优先于全局 security', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'global-token', apiKeyHeader: 'api-key' },
        globalSecurity: [{ bearerAuth: [] }],
        operationSecurity: [{ apiKeyHeader: [] }],
      });
      // 应使用操作级的 apiKeyHeader，而非全局的 bearerAuth
      expect(result.headers['X-API-Key']).toBe('api-key');
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('全局 security 作为回退', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'global-token' },
        globalSecurity: [{ bearerAuth: [] }],
        operationSecurity: undefined,
      });
      expect(result.headers.Authorization).toBe('Bearer global-token');
    });
  });

  describe('多方案匹配', () => {
    it('第一个匹配的需求应被应用', () => {
      const result = resolveAuthentication({
        securitySchemes,
        credentials: { bearerAuth: 'token' },
        globalSecurity: [{ apiKeyHeader: [] }, { bearerAuth: [] }],
      });
      // apiKeyHeader 没有凭据所以跳过，bearerAuth 有凭据所以匹配
      expect(result.headers.Authorization).toBe('Bearer token');
    });

    it('一个需求中的多个方案应同时应用', () => {
      const multiSchemes: Record<string, SecurityScheme> = {
        ...securitySchemes,
        anotherKey: { type: 'apiKey', in: 'header', name: 'X-Another-Key' },
      };
      const result = resolveAuthentication({
        securitySchemes: multiSchemes,
        credentials: { apiKeyHeader: 'key1', anotherKey: 'key2' },
        globalSecurity: [{ apiKeyHeader: [], anotherKey: [] }],
      });
      expect(result.headers['X-API-Key']).toBe('key1');
      expect(result.headers['X-Another-Key']).toBe('key2');
    });
  });
});
