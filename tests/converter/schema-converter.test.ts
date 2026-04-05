import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { convertSchema, createRefResolver } from '../../src/converter/schema-converter.js';
import type { OpenApiSchema } from '../../src/parser/types.js';

describe('schema-converter', () => {
  describe('convertSchema', () => {
    it('undefined schema 应返回 z.unknown()', () => {
      const result = convertSchema(undefined);
      expect(result).toBeInstanceOf(z.ZodUnknown);
    });

    describe('$ref 引用', () => {
      it('可解析的 $ref 应递归解析', () => {
        const components = {
          User: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
        };
        const refResolver = createRefResolver(components);

        const schema: OpenApiSchema = { $ref: '#/components/schemas/User' };
        const result = convertSchema(schema, refResolver);

        expect(result).toBeInstanceOf(z.ZodObject);
        // 验证解析后的 required 字段
        const parsed = result.safeParse({ id: 1, name: 'test' });
        expect(parsed.success).toBe(true);
      });

      it('不可解析的 $ref 应返回 z.unknown()', () => {
        const schema: OpenApiSchema = { $ref: '#/components/schemas/Unknown' };
        const result = convertSchema(schema);
        expect(result).toBeInstanceOf(z.ZodUnknown);
      });
    });

    describe('基础类型', () => {
      it('string 类型', () => {
        const schema: OpenApiSchema = { type: 'string' };
        const result = convertSchema(schema);
        expect(result.safeParse('hello').success).toBe(true);
      });

      it('number 类型', () => {
        const schema: OpenApiSchema = { type: 'number' };
        const result = convertSchema(schema);
        expect(result.safeParse(42).success).toBe(true);
        expect(result.safeParse('hello').success).toBe(false);
      });

      it('integer 类型', () => {
        const schema: OpenApiSchema = { type: 'integer' };
        const result = convertSchema(schema);
        expect(result.safeParse(42).success).toBe(true);
        expect(result.safeParse(42.5).success).toBe(false);
      });

      it('boolean 类型', () => {
        const schema: OpenApiSchema = { type: 'boolean' };
        const result = convertSchema(schema);
        expect(result.safeParse(true).success).toBe(true);
        expect(result.safeParse('yes').success).toBe(false);
      });

      it('未指定 type 但有 properties 应作为 object 处理', () => {
        const schema: OpenApiSchema = {
          properties: {
            name: { type: 'string' },
          },
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ name: 'test' }).success).toBe(true);
      });

      it('未指定 type 且无 properties 应返回 z.unknown()', () => {
        const result = convertSchema({});
        expect(result).toBeInstanceOf(z.ZodUnknown);
      });
    });

    describe('字符串约束', () => {
      it('minLength', () => {
        const schema: OpenApiSchema = { type: 'string', minLength: 3 };
        const result = convertSchema(schema);
        expect(result.safeParse('abc').success).toBe(true);
        expect(result.safeParse('ab').success).toBe(false);
      });

      it('maxLength', () => {
        const schema: OpenApiSchema = { type: 'string', maxLength: 5 };
        const result = convertSchema(schema);
        expect(result.safeParse('hello').success).toBe(true);
        expect(result.safeParse('toolong').success).toBe(false);
      });

      it('pattern', () => {
        const schema: OpenApiSchema = { type: 'string', pattern: '^\\d+$' };
        const result = convertSchema(schema);
        expect(result.safeParse('123').success).toBe(true);
        expect(result.safeParse('abc').success).toBe(false);
      });

      it('format: email', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'email' };
        const result = convertSchema(schema);
        expect(result.safeParse('test@example.com').success).toBe(true);
        expect(result.safeParse('not-email').success).toBe(false);
      });

      it('format: url', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'url' };
        const result = convertSchema(schema);
        expect(result.safeParse('https://example.com').success).toBe(true);
        expect(result.safeParse('not-a-url').success).toBe(false);
      });

      it('format: uri', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'uri' };
        const result = convertSchema(schema);
        expect(result.safeParse('https://example.com').success).toBe(true);
      });

      it('format: uuid', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'uuid' };
        const result = convertSchema(schema);
        expect(result.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      });

      it('format: date', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'date' };
        const result = convertSchema(schema);
        // z.string().date() 验证 ISO 8601 日期格式字符串
        expect(result.safeParse('2024-01-15').success).toBe(true);
        expect(result.safeParse('invalid').success).toBe(false);
      });

      it('format: date-time', () => {
        const schema: OpenApiSchema = { type: 'string', format: 'date-time' };
        const result = convertSchema(schema);
        // z.datetime() 接受 ISO 8601 字符串
        expect(result.safeParse('2024-01-01T00:00:00Z').success).toBe(true);
      });

      it('enum', () => {
        const schema: OpenApiSchema = {
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
        };
        const result = convertSchema(schema);
        expect(result.safeParse('active').success).toBe(true);
        expect(result.safeParse('other').success).toBe(false);
      });
    });

    describe('数字约束', () => {
      it('minimum', () => {
        const schema: OpenApiSchema = { type: 'integer', minimum: 0 };
        const result = convertSchema(schema);
        expect(result.safeParse(0).success).toBe(true);
        expect(result.safeParse(-1).success).toBe(false);
      });

      it('maximum', () => {
        const schema: OpenApiSchema = { type: 'integer', maximum: 100 };
        const result = convertSchema(schema);
        expect(result.safeParse(100).success).toBe(true);
        expect(result.safeParse(101).success).toBe(false);
      });

      it('exclusiveMinimum 为 true', () => {
        const schema: OpenApiSchema = { type: 'integer', minimum: 0, exclusiveMinimum: true };
        const result = convertSchema(schema);
        expect(result.safeParse(0).success).toBe(false);
        expect(result.safeParse(1).success).toBe(true);
      });

      it('exclusiveMinimum 为数字', () => {
        const schema: OpenApiSchema = { type: 'integer', exclusiveMinimum: 5 };
        const result = convertSchema(schema);
        expect(result.safeParse(5).success).toBe(false);
        expect(result.safeParse(6).success).toBe(true);
      });

      it('exclusiveMaximum 为 true', () => {
        const schema: OpenApiSchema = { type: 'integer', maximum: 10, exclusiveMaximum: true };
        const result = convertSchema(schema);
        expect(result.safeParse(10).success).toBe(false);
        expect(result.safeParse(9).success).toBe(true);
      });

      it('exclusiveMaximum 为数字', () => {
        const schema: OpenApiSchema = { type: 'integer', exclusiveMaximum: 5 };
        const result = convertSchema(schema);
        expect(result.safeParse(5).success).toBe(false);
        expect(result.safeParse(4).success).toBe(true);
      });

      it('数字枚举', () => {
        const schema: OpenApiSchema = { type: 'integer', enum: [1, 2, 3] };
        const result = convertSchema(schema);
        expect(result.safeParse('1').success).toBe(true);
        expect(result.safeParse('4').success).toBe(false);
      });
    });

    describe('数组', () => {
      it('基本数组', () => {
        const schema: OpenApiSchema = {
          type: 'array',
          items: { type: 'string' },
        };
        const result = convertSchema(schema);
        expect(result.safeParse(['a', 'b']).success).toBe(true);
        expect(result.safeParse('not-array').success).toBe(false);
      });

      it('无 items 的数组', () => {
        const schema: OpenApiSchema = { type: 'array' };
        const result = convertSchema(schema);
        expect(result.safeParse([1, 2]).success).toBe(true);
      });

      it('minItems', () => {
        const schema: OpenApiSchema = {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
        };
        const result = convertSchema(schema);
        expect(result.safeParse(['a', 'b']).success).toBe(true);
        expect(result.safeParse(['a']).success).toBe(false);
      });

      it('maxItems', () => {
        const schema: OpenApiSchema = {
          type: 'array',
          items: { type: 'string' },
          maxItems: 2,
        };
        const result = convertSchema(schema);
        expect(result.safeParse(['a', 'b']).success).toBe(true);
        expect(result.safeParse(['a', 'b', 'c']).success).toBe(false);
      });
    });

    describe('对象', () => {
      it('基本对象', () => {
        const schema: OpenApiSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
          },
          required: ['name'],
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ name: 'test', age: 20 }).success).toBe(true);
        expect(result.safeParse({ name: 'test' }).success).toBe(true);
        expect(result.safeParse({ age: 20 }).success).toBe(false);
      });

      it('空对象 + additionalProperties: true', () => {
        const schema: OpenApiSchema = {
          type: 'object',
          additionalProperties: true,
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ any: 'value' }).success).toBe(true);
      });

      it('空对象 + typed additionalProperties', () => {
        const schema: OpenApiSchema = {
          type: 'object',
          additionalProperties: { type: 'string' },
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ key: 'value' }).success).toBe(true);
      });

      it('空对象无 additionalProperties', () => {
        const schema: OpenApiSchema = { type: 'object' };
        const result = convertSchema(schema);
        expect(result.safeParse({ key: 'value' }).success).toBe(true);
      });

      it('strict 模式（无 additionalProperties）应拒绝额外字段', () => {
        const schema: OpenApiSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ name: 'test' }).success).toBe(true);
        expect(result.safeParse({ name: 'test', extra: 'field' }).success).toBe(false);
      });

      it('passthrough 模式应允许额外字段', () => {
        const schema: OpenApiSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          additionalProperties: true,
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ name: 'test', extra: 'field' }).success).toBe(true);
      });
    });

    describe('组合类型', () => {
      it('allOf - 交集', () => {
        const schema: OpenApiSchema = {
          allOf: [
            {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
            {
              type: 'object',
              properties: { age: { type: 'integer' } },
            },
          ],
        };
        const result = convertSchema(schema);
        expect(result.safeParse({ name: 'test', age: 20 }).success).toBe(true);
      });

      it('allOf 单个元素', () => {
        const schema: OpenApiSchema = {
          allOf: [{ type: 'string' }],
        };
        const result = convertSchema(schema);
        expect(result.safeParse('hello').success).toBe(true);
      });

      it('oneOf - 联合类型', () => {
        const schema: OpenApiSchema = {
          oneOf: [{ type: 'string' }, { type: 'number' }],
        };
        const result = convertSchema(schema);
        expect(result.safeParse('hello').success).toBe(true);
        expect(result.safeParse(42).success).toBe(true);
      });

      it('anyOf - 至少匹配一个', () => {
        const schema: OpenApiSchema = {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        };
        const result = convertSchema(schema);
        expect(result.safeParse('hello').success).toBe(true);
        expect(result.safeParse(42).success).toBe(true);
      });

      it('anyOf 单个元素应为 optional', () => {
        const schema: OpenApiSchema = {
          anyOf: [{ type: 'string' }],
        };
        const result = convertSchema(schema);
        expect(result.safeParse(undefined).success).toBe(true);
        expect(result.safeParse('hello').success).toBe(true);
      });
    });

    describe('修饰符', () => {
      it('nullable', () => {
        const schema: OpenApiSchema = { type: 'string', nullable: true };
        const result = convertSchema(schema);
        expect(result.safeParse(null).success).toBe(true);
        expect(result.safeParse('hello').success).toBe(true);
      });

      it('default', () => {
        const schema: OpenApiSchema = { type: 'string', default: 'hello' };
        const result = convertSchema(schema);
        const parsed = result.safeParse(undefined);
        expect(parsed.success).toBe(true);
        expect(parsed.data).toBe('hello');
      });

      it('description', () => {
        const schema: OpenApiSchema = { type: 'string', description: '用户名' };
        const result = convertSchema(schema);
        expect(result.description).toBe('用户名');
      });
    });
  });

  describe('createRefResolver', () => {
    it('解析 #/components/schemas/ 格式的引用', () => {
      const components = {
        User: { type: 'object', properties: { id: { type: 'integer' } } },
      };
      const resolver = createRefResolver(components);
      const result = resolver('#/components/schemas/User');
      expect(result).toBeDefined();
      expect(result?.type).toBe('object');
    });

    it('不匹配的格式返回 undefined', () => {
      const resolver = createRefResolver({});
      const result = resolver('#/other/path');
      expect(result).toBeUndefined();
    });

    it('不存在的组件名返回 undefined', () => {
      const resolver = createRefResolver({ User: { type: 'string' } });
      const result = resolver('#/components/schemas/Unknown');
      expect(result).toBeUndefined();
    });

    it('无 components 时返回 undefined', () => {
      const resolver = createRefResolver(undefined);
      const result = resolver('#/components/schemas/User');
      expect(result).toBeUndefined();
    });
  });
});
