/**
 * OpenAPI 类型定义
 */

/**
 * OpenAPI 参数位置
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';

/**
 * API Key 位置
 */
export type ApiKeyLocation = 'query' | 'header' | 'cookie';

/**
 * 安全方案类型
 */
export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

/**
 * 安全方案定义
 */
export interface SecurityScheme {
  /** 安全方案类型 */
  type: SecuritySchemeType;
  /** 方案描述 */
  description?: string;
  /** API Key 的位置（apiKey 类型） */
  in?: ApiKeyLocation;
  /** API Key 的字段名（apiKey 类型） */
  name?: string;
  /** HTTP 认证方案（http 类型），如 basic、bearer */
  scheme?: string;
  /** Bearer Token 格式（http/bearer 类型） */
  bearerFormat?: string;
  /** OAuth2 流程配置（oauth2 类型） */
  flows?: Record<string, unknown>;
  /** OpenID Connect URL（openIdConnect 类型） */
  openIdConnectUrl?: string;
}

/**
 * 安全需求
 */
export interface SecurityRequirement {
  /** 安全方案名称到所需 scope 的映射 */
  [schemeName: string]: string[];
}

/**
 * OpenAPI 参数
 */
export interface OpenApiParameter {
  name: string;
  in: ParameterLocation;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
  deprecated?: boolean;
}

/**
 * OpenAPI Schema
 */
export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  additionalProperties?: boolean | OpenApiSchema;
  required?: string[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  nullable?: boolean;
  deprecated?: boolean;
  example?: unknown;
  $ref?: string;
}

/**
 * OpenAPI 请求体
 */
export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<
    string,
    {
      schema?: OpenApiSchema;
      example?: unknown;
      examples?: Record<string, unknown>;
    }
  >;
}

/**
 * OpenAPI 响应
 */
export interface OpenApiResponse {
  description?: string;
  content?: Record<
    string,
    {
      schema?: OpenApiSchema;
      example?: unknown;
    }
  >;
}

/**
 * OpenAPI 操作
 */
export interface OpenApiOperation {
  /** HTTP 方法 */
  method: string;
  /** API 路径 */
  path: string;
  /** 操作 ID */
  operationId?: string;
  /** 摘要 */
  summary?: string;
  /** 详细描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 参数列表 */
  parameters?: OpenApiParameter[];
  /** 请求体 */
  requestBody?: OpenApiRequestBody;
  /** 响应 */
  responses?: Record<string, OpenApiResponse>;
  /** 操作级安全需求 */
  security?: SecurityRequirement[];
  /** 是否废弃 */
  deprecated?: boolean;
}

/**
 * OpenAPI 文档信息
 */
export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

/**
 * OpenAPI 服务器
 */
export interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<
    string,
    {
      default: string;
      enum?: string[];
      description?: string;
    }
  >;
}

/**
 * 解析后的 OpenAPI 文档
 */
export interface ParsedOpenApiDoc {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  operations: OpenApiOperation[];
  /** 安全方案定义 */
  securitySchemes?: Record<string, SecurityScheme>;
  /** 全局安全需求 */
  security?: SecurityRequirement[];
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    parameters?: Record<string, OpenApiParameter>;
    requestBodies?: Record<string, OpenApiRequestBody>;
    responses?: Record<string, OpenApiResponse>;
  };
}
