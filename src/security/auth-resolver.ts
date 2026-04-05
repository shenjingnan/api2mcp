/**
 * 认证解析器
 * 根据安全方案和凭据，解析出需要注入到请求中的认证信息
 */

import type { SecurityCredentials } from '../config/types.js';
import type { SecurityRequirement, SecurityScheme } from '../parser/types.js';
import { logger } from '../utils/logger.js';
import type { ResolvedAuthentication } from './types.js';

/**
 * 解析认证信息
 * @param securitySchemes - OpenAPI 文档中定义的安全方案
 * @param credentials - 用户提供的凭据（key 为方案名称，value 为凭据值）
 * @param operationSecurity - 操作级安全需求
 * @param globalSecurity - 全局安全需求
 * @returns 解析后的认证信息
 */
export function resolveAuthentication(options: {
  securitySchemes?: Record<string, SecurityScheme>;
  credentials?: SecurityCredentials;
  operationSecurity?: SecurityRequirement[];
  globalSecurity?: SecurityRequirement[];
}): ResolvedAuthentication {
  const { securitySchemes, credentials, operationSecurity, globalSecurity } = options;
  const result: ResolvedAuthentication = {
    headers: {},
    query: {},
    cookies: {},
  };

  // 没有凭据则不注入任何认证
  if (!credentials || Object.keys(credentials).length === 0) {
    return result;
  }

  // 没有安全方案定义则不注入
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return result;
  }

  // 优先使用操作级 security，回退到全局 security
  const securityRequirements = operationSecurity ?? globalSecurity;

  // 没有安全需求则不注入
  if (!securityRequirements || securityRequirements.length === 0) {
    return result;
  }

  // 遍历安全需求，找到第一个匹配的方案并应用
  for (const requirement of securityRequirements) {
    const schemeNames = Object.keys(requirement);
    let allMatched = true;

    for (const schemeName of schemeNames) {
      const scheme = securitySchemes[schemeName];
      const credential = credentials[schemeName];

      if (!scheme || credential === undefined) {
        allMatched = false;
        break;
      }
    }

    if (allMatched) {
      // 应用此安全需求中的所有方案
      for (const schemeName of schemeNames) {
        const scheme = securitySchemes[schemeName];
        const credential = credentials[schemeName];
        applyScheme(result, scheme, credential);
      }
      return result;
    }
  }

  // 如果没有安全需求匹配，但有凭据，尝试按方案名称直接匹配
  logger.debug('No security requirement matched, skipping authentication');
  return result;
}

/**
 * 应用单个安全方案
 */
function applyScheme(
  result: ResolvedAuthentication,
  scheme: SecurityScheme,
  credential: string
): void {
  switch (scheme.type) {
    case 'apiKey':
      applyApiKeyScheme(result, scheme, credential);
      break;

    case 'http':
      applyHttpScheme(result, scheme, credential);
      break;

    case 'oauth2':
    case 'openIdConnect':
      // 降级为 Bearer Token
      result.headers.Authorization = `Bearer ${credential}`;
      break;

    default:
      logger.warn(`Unsupported security scheme type: ${scheme.type}`);
  }
}

/**
 * 应用 API Key 方案
 */
function applyApiKeyScheme(
  result: ResolvedAuthentication,
  scheme: SecurityScheme,
  credential: string
): void {
  const location = scheme.in || 'header';
  const name = scheme.name || 'X-API-Key';

  switch (location) {
    case 'header':
      result.headers[name] = credential;
      break;
    case 'query':
      result.query[name] = credential;
      break;
    case 'cookie':
      result.cookies[name] = credential;
      break;
  }
}

/**
 * 应用 HTTP 认证方案
 */
function applyHttpScheme(
  result: ResolvedAuthentication,
  scheme: SecurityScheme,
  credential: string
): void {
  const httpScheme = (scheme.scheme || 'bearer').toLowerCase();

  switch (httpScheme) {
    case 'bearer':
      result.headers.Authorization = `Bearer ${credential}`;
      break;

    case 'basic': {
      // credential 可能已经是 base64 编码的，也可能是 "username:password" 格式
      const encoded = credential.includes(':')
        ? Buffer.from(credential).toString('base64')
        : credential;
      result.headers.Authorization = `Basic ${encoded}`;
      break;
    }

    default:
      // 其他 HTTP 方案直接使用
      result.headers.Authorization = `${httpScheme} ${credential}`;
  }
}
