import { describe, expect, it } from 'vitest';
import {
  Api2McpError,
  ConfigurationError,
  HttpError,
  OpenApiParseError,
  ToolExecutionError,
} from '../../src/utils/error.js';

describe('Api2McpError', () => {
  it('应该创建包含消息和错误码的错误', () => {
    const error = new Api2McpError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('Api2McpError');
  });

  it('应该创建包含原因的错误', () => {
    const cause = new Error('Original error');
    const error = new Api2McpError('Test error', 'TEST_CODE', cause);
    expect(error.cause).toBe(cause);
  });

  it('应该是 Error 的实例', () => {
    const error = new Api2McpError('Test error', 'TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ConfigurationError', () => {
  it('应该创建带有 CONFIGURATION_ERROR 错误码的错误', () => {
    const error = new ConfigurationError('Config error');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.name).toBe('ConfigurationError');
  });

  it('应该创建包含原因的错误', () => {
    const cause = new Error('Original error');
    const error = new ConfigurationError('Config error', cause);
    expect(error.cause).toBe(cause);
  });

  it('应该继承 Api2McpError', () => {
    const error = new ConfigurationError('Config error');
    expect(error).toBeInstanceOf(Api2McpError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('OpenApiParseError', () => {
  it('应该创建带有 OPENAPI_PARSE_ERROR 错误码的错误', () => {
    const error = new OpenApiParseError('Parse error');
    expect(error.code).toBe('OPENAPI_PARSE_ERROR');
    expect(error.name).toBe('OpenApiParseError');
  });

  it('应该创建包含原因的错误', () => {
    const cause = new Error('Original error');
    const error = new OpenApiParseError('Parse error', cause);
    expect(error.cause).toBe(cause);
  });

  it('应该继承 Api2McpError', () => {
    const error = new OpenApiParseError('Parse error');
    expect(error).toBeInstanceOf(Api2McpError);
  });
});

describe('ToolExecutionError', () => {
  it('应该创建包含 toolName 的错误', () => {
    const error = new ToolExecutionError('Execution failed', 'testTool');
    expect(error.toolName).toBe('testTool');
    expect(error.code).toBe('TOOL_EXECUTION_ERROR');
    expect(error.name).toBe('ToolExecutionError');
  });

  it('应该创建包含原因的错误', () => {
    const cause = new Error('Original error');
    const error = new ToolExecutionError('Execution failed', 'testTool', cause);
    expect(error.cause).toBe(cause);
  });

  it('应该继承 Api2McpError', () => {
    const error = new ToolExecutionError('Execution failed', 'testTool');
    expect(error).toBeInstanceOf(Api2McpError);
  });
});

describe('HttpError', () => {
  it('应该创建包含状态码的错误', () => {
    const error = new HttpError('Request failed', 404);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.name).toBe('HttpError');
  });

  it('应该创建包含响应体的错误', () => {
    const error = new HttpError('Request failed', 500, 'Internal Server Error');
    expect(error.responseBody).toBe('Internal Server Error');
  });

  it('应该创建包含原因的错误', () => {
    const cause = new Error('Original error');
    const error = new HttpError('Request failed', 500, undefined, cause);
    expect(error.cause).toBe(cause);
  });

  it('应该继承 Api2McpError', () => {
    const error = new HttpError('Request failed', 404);
    expect(error).toBeInstanceOf(Api2McpError);
  });
});
