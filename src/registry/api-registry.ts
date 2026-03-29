/**
 * API 注册表
 * 用于存储、搜索和管理 API
 */

import { logger } from '../utils/logger.js';
import type {
  ApiDetail,
  ApiEntry,
  ListItem,
  ListOptions,
  ListResult,
  RegistryStats,
  SearchOptions,
  SearchResultItem,
} from './types.js';

/**
 * 默认每页数量
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * 默认搜索限制
 */
const DEFAULT_SEARCH_LIMIT = 50;

/**
 * API 注册表实现
 */
export class ApiRegistry {
  private apis: Map<string, ApiEntry> = new Map();
  private nameIndex: Map<string, string> = new Map(); // name -> id
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> set of ids

  /**
   * 注册 API
   */
  register(entry: ApiEntry): void {
    if (this.apis.has(entry.id)) {
      logger.warn(`API already registered: ${entry.id}, overwriting`);
    }

    this.apis.set(entry.id, entry);
    this.nameIndex.set(entry.name, entry.id);

    // 更新标签索引
    if (entry.tags) {
      for (const tag of entry.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)?.add(entry.id);
      }
    }

    logger.debug(`Registered API: ${entry.id}`);
  }

  /**
   * 批量注册 API
   */
  registerAll(entries: ApiEntry[]): void {
    for (const entry of entries) {
      this.register(entry);
    }
    logger.info(`Registered ${entries.length} APIs in registry`);
  }

  /**
   * 获取单个 API
   */
  get(id: string): ApiEntry | undefined {
    return this.apis.get(id);
  }

  /**
   * 通过名称获取 API
   */
  getByName(name: string): ApiEntry | undefined {
    const id = this.nameIndex.get(name);
    return id ? this.apis.get(id) : undefined;
  }

  /**
   * 检查 API 是否存在
   */
  has(id: string): boolean {
    return this.apis.has(id);
  }

  /**
   * 搜索 API
   */
  search(options: SearchOptions): SearchResultItem[] {
    const {
      query,
      searchIn = ['name', 'summary', 'description', 'path'],
      limit = DEFAULT_SEARCH_LIMIT,
    } = options;

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];

    for (const entry of this.apis.values()) {
      const matchedFields: string[] = [];
      let score = 0;

      // 搜索名称
      if (searchIn.includes('name') && entry.name) {
        const nameLower = entry.name.toLowerCase();
        if (nameLower.includes(normalizedQuery)) {
          matchedFields.push('name');
          // 精确匹配得分更高
          score += nameLower === normalizedQuery ? 1.0 : 0.8;
        }
      }

      // 搜索摘要
      if (searchIn.includes('summary') && entry.summary) {
        const summaryLower = entry.summary.toLowerCase();
        if (summaryLower.includes(normalizedQuery)) {
          matchedFields.push('summary');
          score += 0.6;
        }
      }

      // 搜索描述
      if (searchIn.includes('description') && entry.description) {
        const descLower = entry.description.toLowerCase();
        if (descLower.includes(normalizedQuery)) {
          matchedFields.push('description');
          score += 0.4;
        }
      }

      // 搜索路径
      if (searchIn.includes('path') && entry.path) {
        const pathLower = entry.path.toLowerCase();
        if (pathLower.includes(normalizedQuery)) {
          matchedFields.push('path');
          score += 0.5;
        }
      }

      if (matchedFields.length > 0) {
        results.push({
          id: entry.id,
          name: entry.name,
          method: entry.method,
          path: entry.path,
          summary: entry.summary,
          matchedFields,
          score: Math.min(score, 1.0),
        });
      }
    }

    // 按分数排序并限制数量
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * 分页列出 API
   */
  list(options: ListOptions = {}): ListResult {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, tag } = options;

    // 获取过滤后的 API 列表
    let entries: ApiEntry[];
    if (tag) {
      const ids = this.tagIndex.get(tag);
      entries = ids
        ? Array.from(ids)
            .map((id) => this.apis.get(id))
            .filter((entry): entry is ApiEntry => entry !== undefined)
        : [];
    } else {
      entries = Array.from(this.apis.values());
    }

    const total = entries.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // 分页
    const pageEntries = entries.slice(startIndex, endIndex);

    const items: ListItem[] = pageEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      method: entry.method,
      path: entry.path,
      summary: entry.summary,
      tags: entry.tags,
      deprecated: entry.deprecated,
    }));

    return {
      page,
      pageSize,
      total,
      totalPages,
      items,
    };
  }

  /**
   * 获取所有标签
   */
  getTags(): string[] {
    return Array.from(this.tagIndex.keys()).sort();
  }

  /**
   * 获取 API 详情
   */
  getDetail(id: string): ApiDetail | undefined {
    const entry = this.apis.get(id);
    if (!entry) {
      return undefined;
    }

    return {
      ...entry,
      parameterSchema: this.buildParameterSchema(entry),
      requestBodySchema: this.buildRequestBodySchema(entry),
      responseSchemas: this.buildResponseSchemas(entry),
    };
  }

  /**
   * 获取统计信息
   */
  getStats(): RegistryStats {
    const byMethod: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    for (const entry of this.apis.values()) {
      // 按方法统计
      const method = entry.method.toUpperCase();
      byMethod[method] = (byMethod[method] || 0) + 1;

      // 按标签统计
      if (entry.tags) {
        for (const tag of entry.tags) {
          byTag[tag] = (byTag[tag] || 0) + 1;
        }
      }
    }

    return {
      totalApis: this.apis.size,
      tags: this.getTags(),
      byMethod,
      byTag,
    };
  }

  /**
   * 获取 API 数量
   */
  get size(): number {
    return this.apis.size;
  }

  /**
   * 构建参数 Schema
   */
  private buildParameterSchema(entry: ApiEntry): Record<string, unknown> | undefined {
    const { operation } = entry;
    if (!operation.parameters || operation.parameters.length === 0) {
      return undefined;
    }

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of operation.parameters) {
      const paramName = param.name;
      properties[paramName] = {
        ...param.schema,
        description: param.description,
        in: param.in,
      };

      if (param.required) {
        required.push(paramName);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * 构建请求体 Schema
   */
  private buildRequestBodySchema(entry: ApiEntry): Record<string, unknown> | undefined {
    const { operation } = entry;
    if (!operation.requestBody) {
      return undefined;
    }

    const jsonContent = operation.requestBody.content['application/json'];
    if (!jsonContent?.schema) {
      return undefined;
    }

    return {
      ...jsonContent.schema,
      description: operation.requestBody.description,
      bodyRequired: operation.requestBody.required,
    };
  }

  /**
   * 构建响应 Schema
   */
  private buildResponseSchemas(
    entry: ApiEntry
  ): Record<string, { description?: string; schema?: Record<string, unknown> }> | undefined {
    const { operation } = entry;
    if (!operation.responses) {
      return undefined;
    }

    const schemas: Record<string, { description?: string; schema?: Record<string, unknown> }> = {};

    for (const [status, response] of Object.entries(operation.responses)) {
      const jsonContent = response.content?.['application/json'];
      schemas[status] = {
        description: response.description,
        schema: jsonContent?.schema as Record<string, unknown> | undefined,
      };
    }

    return schemas;
  }
}

export default ApiRegistry;
