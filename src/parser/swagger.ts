/**
 * OpenAPI 解析器
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';
import type {
  ParsedOpenApiDoc,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiSchema,
  OpenApiRequestBody,
  ParameterLocation,
} from './types.js';
import { OpenApiParseError } from '../utils/error.js';
import { logger } from '../utils/logger.js';

/**
 * 判断是否为 OpenAPI v3 文档
 */
function isOpenAPIV3(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return 'openapi' in doc;
}

/**
 * 转换 OpenAPI 参数
 */
function convertParameter(param: OpenAPIV3.ParameterObject): OpenApiParameter {
  return {
    name: param.name,
    in: param.in as ParameterLocation,
    required: param.required,
    description: param.description,
    schema: param.schema as OpenApiSchema | undefined,
    deprecated: param.deprecated,
  };
}

/**
 * 转换 OpenAPI Schema
 */
function convertSchema(schema: OpenAPIV3.SchemaObject | undefined): OpenApiSchema | undefined {
  if (!schema) return undefined;
  return schema as OpenApiSchema;
}

/**
 * 转换请求体
 */
function convertRequestBody(
  requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined
): OpenApiRequestBody | undefined {
  if (!requestBody) return undefined;

  // 处理 $ref
  if ('$ref' in requestBody) {
    return undefined; // $ref 将在解析后被解析
  }

  const content: OpenApiRequestBody['content'] = {};
  for (const [contentType, mediaType] of Object.entries(requestBody.content || {})) {
    const mt = mediaType as OpenAPIV3.MediaTypeObject;
    content[contentType] = {
      schema: convertSchema(mt.schema as OpenAPIV3.SchemaObject | undefined),
      example: mt.example,
    };
  }

  return {
    description: requestBody.description,
    required: requestBody.required,
    content,
  };
}

/**
 * 提取 API 操作
 */
function extractOperations(doc: OpenAPIV3.Document): OpenApiOperation[] {
  const operations: OpenApiOperation[] = [];

  if (!doc.paths) return operations;

  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem) continue;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      // 收集参数（路径级 + 操作级）
      const parameters: OpenApiParameter[] = [];

      // 路径级参数
      if (pathItem.parameters) {
        for (const param of pathItem.parameters) {
          if (!('$ref' in param)) {
            parameters.push(convertParameter(param));
          }
        }
      }

      // 操作级参数
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (!('$ref' in param)) {
            parameters.push(convertParameter(param));
          }
        }
      }

      const op: OpenApiOperation = {
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags,
        parameters: parameters.length > 0 ? parameters : undefined,
        requestBody: convertRequestBody(
          operation.requestBody as OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined
        ),
        deprecated: operation.deprecated,
      };

      operations.push(op);
    }
  }

  return operations;
}

/**
 * 解析 OpenAPI 文档
 */
export async function parseOpenApi(source: string): Promise<ParsedOpenApiDoc> {
  try {
    logger.info(`Parsing OpenAPI document from: ${source}`);

    // 使用 SwaggerParser 解析和验证
    const api = await SwaggerParser.validate(source);

    // 检查版本
    if (!isOpenAPIV3(api)) {
      // 尝试转换 v2 到 v3
      if ('swagger' in api) {
        throw new OpenApiParseError(
          'OpenAPI v2 (Swagger) is not supported. Please convert to OpenAPI v3 first.'
        );
      }
      throw new OpenApiParseError('Unsupported OpenAPI format');
    }

    const info: ParsedOpenApiDoc['info'] = {
      title: api.info.title,
      version: api.info.version,
      description: api.info.description,
    };

    const servers: ParsedOpenApiDoc['servers'] = api.servers?.map((s) => ({
      url: s.url,
      description: s.description,
      variables: s.variables,
    }));

    const operations = extractOperations(api);

    const components = api.components
      ? {
          schemas: api.components.schemas as Record<string, OpenApiSchema> | undefined,
          parameters: api.components.parameters as Record<string, OpenApiParameter> | undefined,
          requestBodies: api.components.requestBodies as Record<string, OpenApiRequestBody> | undefined,
        }
      : undefined;

    logger.info(`Parsed ${operations.length} API operations`);

    return {
      openapi: api.openapi,
      info,
      servers,
      operations,
      components,
    };
  } catch (error) {
    if (error instanceof OpenApiParseError) {
      throw error;
    }
    throw new OpenApiParseError(
      `Failed to parse OpenAPI document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * 获取基础 URL
 */
export function getBaseUrl(doc: ParsedOpenApiDoc, overrideUrl?: string): string {
  if (overrideUrl) {
    logger.debug(`Using override base URL: ${overrideUrl}`);
    return overrideUrl;
  }

  if (doc.servers && doc.servers.length > 0) {
    const server = doc.servers[0];
    let url = server.url;

    // 处理变量替换
    if (server.variables) {
      for (const [name, variable] of Object.entries(server.variables)) {
        url = url.replace(`{${name}}`, variable.default);
      }
    }

    logger.debug(`Using base URL from OpenAPI servers: ${url}`);
    return url;
  }

  throw new OpenApiParseError(
    'No base URL found in OpenAPI document. Please specify --base-url.'
  );
}

/**
 * 获取所有 API 操作
 */
export function getOperations(doc: ParsedOpenApiDoc): OpenApiOperation[] {
  return doc.operations;
}

export default {
  parseOpenApi,
  getBaseUrl,
  getOperations,
};