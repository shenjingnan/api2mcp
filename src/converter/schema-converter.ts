/**
 * OpenAPI Schema 到 Zod Schema 转换器
 */

import { z } from 'zod';
import type { OpenApiSchema } from '../parser/types.js';
import { logger } from '../utils/logger.js';

/**
 * Schema 引用解析函数类型
 */
type RefResolver = (ref: string) => OpenApiSchema | undefined;

/**
 * 默认引用解析器（不支持 $ref）
 */
const defaultRefResolver: RefResolver = () => undefined;

/**
 * 将 OpenAPI Schema 转换为 Zod Schema
 */
export function convertSchema(
  schema: OpenApiSchema | undefined,
  refResolver: RefResolver = defaultRefResolver
): z.ZodType {
  if (!schema) {
    return z.unknown();
  }

  // 处理 $ref
  if (schema.$ref) {
    const resolved = refResolver(schema.$ref);
    if (resolved) {
      return convertSchema(resolved, refResolver);
    }
    logger.warn(`Unresolved $ref: ${schema.$ref}`);
    return z.unknown();
  }

  // 处理 allOf
  if (schema.allOf && schema.allOf.length > 0) {
    const schemas = schema.allOf.map((s) => convertSchema(s, refResolver));
    // allOf 表示所有 schema 的交集，这里用 intersection 实现
    if (schemas.length === 1) {
      return schemas[0];
    }
    return schemas.reduce((acc, s) => acc.and(s));
  }

  // 处理 oneOf
  if (schema.oneOf && schema.oneOf.length > 0) {
    const schemas = schema.oneOf.map((s) => convertSchema(s, refResolver));
    return z.union([schemas[0], schemas[1] || schemas[0], ...schemas.slice(2)] as [
      z.ZodType,
      z.ZodType,
      ...z.ZodType[],
    ]);
  }

  // 处理 anyOf
  if (schema.anyOf && schema.anyOf.length > 0) {
    const schemas = schema.anyOf.map((s) => convertSchema(s, refResolver));
    // anyOf 表示至少匹配一个，用 union 实现
    if (schemas.length === 1) {
      return schemas[0].optional();
    }
    return z.union([schemas[0], schemas[1] || schemas[0], ...schemas.slice(2)] as [
      z.ZodType,
      z.ZodType,
      ...z.ZodType[],
    ]);
  }

  // 处理 nullable
  const nullable = schema.nullable === true;

  // 根据 type 处理
  let zodSchema: z.ZodType;

  switch (schema.type) {
    case 'string':
      zodSchema = convertStringSchema(schema);
      break;

    case 'number':
    case 'integer':
      zodSchema = convertNumberSchema(schema);
      break;

    case 'boolean':
      zodSchema = z.boolean();
      break;

    case 'array':
      zodSchema = convertArraySchema(schema, refResolver);
      break;

    case 'object':
      zodSchema = convertObjectSchema(schema, refResolver);
      break;

    default:
      // 如果没有指定 type，但有 properties，当作 object 处理
      if (schema.properties) {
        zodSchema = convertObjectSchema(schema, refResolver);
      } else {
        zodSchema = z.unknown();
      }
  }

  // 处理 nullable
  if (nullable) {
    zodSchema = zodSchema.nullable();
  }

  // 处理默认值
  if (schema.default !== undefined) {
    zodSchema = zodSchema.default(schema.default);
  }

  // 添加描述
  if (schema.description) {
    zodSchema = zodSchema.describe(schema.description);
  }

  return zodSchema;
}

/**
 * 转换字符串 Schema
 */
function convertStringSchema(schema: OpenApiSchema): z.ZodString {
  let zodSchema = z.string();

  if (schema.minLength !== undefined) {
    zodSchema = zodSchema.min(schema.minLength);
  }

  if (schema.maxLength !== undefined) {
    zodSchema = zodSchema.max(schema.maxLength);
  }

  if (schema.pattern) {
    zodSchema = zodSchema.regex(new RegExp(schema.pattern));
  }

  if (schema.format) {
    switch (schema.format) {
      case 'email':
        zodSchema = zodSchema.email();
        break;
      case 'uri':
      case 'url':
        zodSchema = zodSchema.url();
        break;
      case 'uuid':
        zodSchema = zodSchema.uuid();
        break;
      case 'date':
        zodSchema = zodSchema.date();
        break;
      case 'date-time':
        zodSchema = zodSchema.datetime();
        break;
      // 其他 format 不特殊处理
    }
  }

  if (schema.enum) {
    // 使用 const assertion 确保 TypeScript 正确推断类型
    const enumValues = schema.enum as [string, ...string[]];
    zodSchema = z.enum(enumValues) as unknown as z.ZodString;
  }

  return zodSchema;
}

/**
 * 转换数字 Schema
 */
function convertNumberSchema(schema: OpenApiSchema): z.ZodNumber {
  let zodSchema = schema.type === 'integer' ? z.number().int() : z.number();

  if (schema.minimum !== undefined) {
    zodSchema = zodSchema.min(schema.minimum);
  }

  if (schema.maximum !== undefined) {
    zodSchema = zodSchema.max(schema.maximum);
  }

  if (schema.exclusiveMinimum === true && schema.minimum !== undefined) {
    zodSchema = zodSchema.min(schema.minimum + (schema.type === 'integer' ? 1 : Number.MIN_VALUE));
  } else if (typeof schema.exclusiveMinimum === 'number') {
    zodSchema = zodSchema.min(
      schema.exclusiveMinimum + (schema.type === 'integer' ? 1 : Number.MIN_VALUE)
    );
  }

  if (schema.exclusiveMaximum === true && schema.maximum !== undefined) {
    zodSchema = zodSchema.max(schema.maximum - (schema.type === 'integer' ? 1 : Number.MIN_VALUE));
  } else if (typeof schema.exclusiveMaximum === 'number') {
    zodSchema = zodSchema.max(
      schema.exclusiveMaximum - (schema.type === 'integer' ? 1 : Number.MIN_VALUE)
    );
  }

  if (schema.enum) {
    const enumValues = schema.enum as [number, ...number[]];
    zodSchema = z.enum(enumValues.map(String) as [string, ...string[]]) as unknown as z.ZodNumber;
  }

  return zodSchema;
}

/**
 * 转换数组 Schema
 */
function convertArraySchema(
  schema: OpenApiSchema,
  refResolver: RefResolver
): z.ZodArray<z.ZodType> {
  const itemSchema = schema.items ? convertSchema(schema.items, refResolver) : z.unknown();

  let zodSchema = z.array(itemSchema);

  if (schema.minItems !== undefined) {
    zodSchema = zodSchema.min(schema.minItems);
  }

  if (schema.maxItems !== undefined) {
    zodSchema = zodSchema.max(schema.maxItems);
  }

  return zodSchema;
}

/**
 * 转换对象 Schema
 */
function convertObjectSchema(schema: OpenApiSchema, refResolver: RefResolver): z.ZodType {
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);

  if (Object.keys(properties).length === 0) {
    // 空 object 或 additionalProperties
    if (schema.additionalProperties) {
      if (typeof schema.additionalProperties === 'boolean') {
        return z.record(z.string(), z.unknown());
      }
      return z.record(z.string(), convertSchema(schema.additionalProperties, refResolver));
    }
    return z.record(z.string(), z.unknown());
  }

  const zodProperties: Record<string, z.ZodType> = {};

  for (const [name, prop] of Object.entries(properties)) {
    let propSchema = convertSchema(prop, refResolver);

    if (!required.has(name)) {
      propSchema = propSchema.optional();
    }

    zodProperties[name] = propSchema;
  }

  let zodSchema: z.ZodType = z.object(zodProperties);

  // 处理 additionalProperties
  if (schema.additionalProperties) {
    if (typeof schema.additionalProperties === 'boolean') {
      zodSchema = z.object(zodProperties).passthrough();
    } else {
      // Zod 不直接支持 typed additionalProperties，这里用 passthrough 并记录日志
      logger.debug('Typed additionalProperties is not fully supported, using passthrough');
      zodSchema = z.object(zodProperties).passthrough();
    }
  } else {
    zodSchema = z.object(zodProperties).strict();
  }

  return zodSchema;
}

/**
 * 创建引用解析器
 */
export function createRefResolver(
  components: Record<string, OpenApiSchema> | undefined
): RefResolver {
  return (ref: string): OpenApiSchema | undefined => {
    // 解析 #/components/schemas/XXX 格式的引用
    const match = ref.match(/^#\/components\/schemas\/(.+)$/);
    if (match && components) {
      return components[match[1]];
    }
    return undefined;
  };
}

export default {
  convertSchema,
  createRefResolver,
};
