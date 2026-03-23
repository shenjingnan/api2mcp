/**
 * HTTP 请求构建器
 */

import type { OpenApiOperation, OpenApiParameter, ParameterLocation } from '../parser/types.js';
import { logger } from '../utils/logger.js';

/**
 * 构建后的请求参数
 */
export interface BuiltRequest {
  /** 请求路径（已替换路径参数） */
  path: string;
  /** 查询参数 */
  query: Record<string, string | string[]>;
  /** 请求头 */
  headers: Record<string, string>;
  /** 请求体 */
  body?: unknown;
}

/**
 * 根据参数位置分组
 */
function groupParametersByLocation(
  parameters: OpenApiParameter[] | undefined
): Record<ParameterLocation, OpenApiParameter[]> {
  const groups: Record<ParameterLocation, OpenApiParameter[]> = {
    path: [],
    query: [],
    header: [],
    cookie: [],
  };

  if (parameters) {
    for (const param of parameters) {
      groups[param.in].push(param);
    }
  }

  return groups;
}

/**
 * 构建请求
 */
export function buildRequest(
  operation: OpenApiOperation,
  input: Record<string, unknown>,
  defaultHeaders: Record<string, string> = {}
): BuiltRequest {
  const groupedParams = groupParametersByLocation(operation.parameters);

  // 构建路径
  let path = operation.path;
  for (const param of groupedParams.path) {
    const value = input[param.name];
    if (value !== undefined) {
      path = path.replace(`{${param.name}}`, String(value));
    } else if (param.required) {
      throw new Error(`Missing required path parameter: ${param.name}`);
    }
  }

  // 构建查询参数
  const query: Record<string, string | string[]> = {};
  for (const param of groupedParams.query) {
    const value = input[param.name];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        query[param.name] = value.map(String);
      } else {
        query[param.name] = String(value);
      }
    } else if (param.required) {
      throw new Error(`Missing required query parameter: ${param.name}`);
    }
  }

  // 构建请求头
  const headers: Record<string, string> = { ...defaultHeaders };
  for (const param of groupedParams.header) {
    const value = input[param.name];
    if (value !== undefined) {
      headers[param.name] = String(value);
    } else if (param.required) {
      throw new Error(`Missing required header parameter: ${param.name}`);
    }
  }

  // 处理请求体
  const body = input.body;

  // 设置 Content-Type（如果有请求体）
  if (body !== undefined && !headers['Content-Type']) {
    if (operation.requestBody?.content) {
      // 使用 OpenAPI 文档中定义的第一个内容类型
      const contentTypes = Object.keys(operation.requestBody.content);
      if (contentTypes.length > 0) {
        headers['Content-Type'] = contentTypes[0];
      }
    } else {
      headers['Content-Type'] = 'application/json';
    }
  }

  logger.debug(`Built request: ${operation.method} ${path}`, {
    query,
    headers,
    body: body ? '(body present)' : '(no body)',
  });

  return {
    path,
    query,
    headers,
    body,
  };
}

/**
 * 将查询参数追加到 URL
 */
export function appendQueryString(url: string, query: Record<string, string | string[]>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, v);
      }
    } else {
      params.append(key, value);
    }
  }

  const queryString = params.toString();
  if (queryString) {
    return `${url}?${queryString}`;
  }

  return url;
}

export default {
  buildRequest,
  appendQueryString,
};
