/**
 * HTTP 客户端
 */

import type { Config } from '../config/types.js';
import type { OpenApiOperation } from '../parser/types.js';
import { HttpError, ToolExecutionError } from '../utils/error.js';
import { logger } from '../utils/logger.js';
import { appendQueryString, buildRequest } from './request-builder.js';

/**
 * HTTP 响应
 */
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * 执行 HTTP 请求
 */
export async function executeRequest(
  operation: OpenApiOperation,
  input: Record<string, unknown>,
  config: Config
): Promise<HttpResponse> {
  const baseUrl = config.baseUrl;

  // 如果没有 base URL，提供友好的错误提示
  if (!baseUrl) {
    throw new ToolExecutionError(
      'No base URL configured. Please specify --base-url when starting the server, or provide _baseUrl parameter when calling the tool.',
      operation.operationId || operation.path
    );
  }

  try {
    // 构建请求
    const built = buildRequest(operation, input, config.headers || {}, config.fixedParams || {});

    // 构建完整 URL
    let url = `${baseUrl}${built.path}`;
    url = appendQueryString(url, built.query);

    logger.info(`Executing: ${operation.method} ${url}`);

    // 构建请求选项
    const requestInit: RequestInit = {
      method: operation.method,
      headers: built.headers,
    };

    // 添加请求体
    if (built.body !== undefined && !['GET', 'HEAD'].includes(operation.method.toUpperCase())) {
      requestInit.body = typeof built.body === 'string' ? built.body : JSON.stringify(built.body);
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    requestInit.signal = controller.signal;

    // 执行请求
    const response = await fetch(url, requestInit);
    clearTimeout(timeoutId);

    // 解析响应头
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 解析响应体
    let body: unknown;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
    } else if (contentType.includes('text/')) {
      body = await response.text();
    } else {
      // 尝试解析为 JSON，失败则返回文本
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
    }

    logger.debug(`Response status: ${response.status}`);

    // 检查 HTTP 错误
    if (!response.ok) {
      throw new HttpError(
        `HTTP ${response.status} ${response.statusText}`,
        response.status,
        typeof body === 'string' ? body : JSON.stringify(body)
      );
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ToolExecutionError(
          `Request timeout after ${config.timeout}ms`,
          operation.operationId || operation.path
        );
      }
      throw new ToolExecutionError(
        `Request failed: ${error.message}`,
        operation.operationId || operation.path,
        error
      );
    }

    throw new ToolExecutionError(
      'Unknown error during request execution',
      operation.operationId || operation.path
    );
  }
}

/**
 * 格式化响应为字符串
 */
export function formatResponse(response: HttpResponse): string {
  const lines: string[] = [];

  lines.push(`Status: ${response.status} ${response.statusText}`);

  if (Object.keys(response.headers).length > 0) {
    lines.push('Headers:');
    for (const [key, value] of Object.entries(response.headers)) {
      lines.push(`  ${key}: ${value}`);
    }
  }

  lines.push('Body:');
  if (typeof response.body === 'object' && response.body !== null) {
    lines.push(JSON.stringify(response.body, null, 2));
  } else {
    lines.push(String(response.body));
  }

  return lines.join('\n');
}

export default {
  executeRequest,
  formatResponse,
};
