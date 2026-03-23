/**
 * 错误类定义
 */

export class Api2McpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'Api2McpError';
  }
}

export class ConfigurationError extends Api2McpError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIGURATION_ERROR', cause);
    this.name = 'ConfigurationError';
  }
}

export class OpenApiParseError extends Api2McpError {
  constructor(message: string, cause?: Error) {
    super(message, 'OPENAPI_PARSE_ERROR', cause);
    this.name = 'OpenApiParseError';
  }
}

export class ToolExecutionError extends Api2McpError {
  constructor(message: string, public readonly toolName: string, cause?: Error) {
    super(message, 'TOOL_EXECUTION_ERROR', cause);
    this.name = 'ToolExecutionError';
  }
}

export class HttpError extends Api2McpError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
    cause?: Error
  ) {
    super(message, 'HTTP_ERROR', cause);
    this.name = 'HttpError';
  }
}