import { describe, expect, it } from 'vitest';
import {
  Api2McpError,
  ConfigurationError,
  HttpError,
  OpenApiParseError,
  ToolExecutionError,
} from '../../src/utils/error.js';

describe('Api2McpError', () => {
  it('should create an error with message and code', () => {
    const error = new Api2McpError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('Api2McpError');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new Api2McpError('Test error', 'TEST_CODE', cause);
    expect(error.cause).toBe(cause);
  });

  it('should be an instance of Error', () => {
    const error = new Api2McpError('Test error', 'TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ConfigurationError', () => {
  it('should create an error with CONFIGURATION_ERROR code', () => {
    const error = new ConfigurationError('Config error');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.name).toBe('ConfigurationError');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new ConfigurationError('Config error', cause);
    expect(error.cause).toBe(cause);
  });

  it('should extend Api2McpError', () => {
    const error = new ConfigurationError('Config error');
    expect(error).toBeInstanceOf(Api2McpError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('OpenApiParseError', () => {
  it('should create an error with OPENAPI_PARSE_ERROR code', () => {
    const error = new OpenApiParseError('Parse error');
    expect(error.code).toBe('OPENAPI_PARSE_ERROR');
    expect(error.name).toBe('OpenApiParseError');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new OpenApiParseError('Parse error', cause);
    expect(error.cause).toBe(cause);
  });

  it('should extend Api2McpError', () => {
    const error = new OpenApiParseError('Parse error');
    expect(error).toBeInstanceOf(Api2McpError);
  });
});

describe('ToolExecutionError', () => {
  it('should create an error with toolName', () => {
    const error = new ToolExecutionError('Execution failed', 'testTool');
    expect(error.toolName).toBe('testTool');
    expect(error.code).toBe('TOOL_EXECUTION_ERROR');
    expect(error.name).toBe('ToolExecutionError');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new ToolExecutionError('Execution failed', 'testTool', cause);
    expect(error.cause).toBe(cause);
  });

  it('should extend Api2McpError', () => {
    const error = new ToolExecutionError('Execution failed', 'testTool');
    expect(error).toBeInstanceOf(Api2McpError);
  });
});

describe('HttpError', () => {
  it('should create an error with statusCode', () => {
    const error = new HttpError('Request failed', 404);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.name).toBe('HttpError');
  });

  it('should create an error with responseBody', () => {
    const error = new HttpError('Request failed', 500, 'Internal Server Error');
    expect(error.responseBody).toBe('Internal Server Error');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new HttpError('Request failed', 500, undefined, cause);
    expect(error.cause).toBe(cause);
  });

  it('should extend Api2McpError', () => {
    const error = new HttpError('Request failed', 404);
    expect(error).toBeInstanceOf(Api2McpError);
  });
});
