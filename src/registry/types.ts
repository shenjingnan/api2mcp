/**
 * Registry 类型定义
 */

import type { OpenApiOperation, OpenApiSchema } from '../parser/types.js';

/**
 * API 条目 - 存储在 Registry 中的 API 信息
 */
export interface ApiEntry {
  /** 唯一标识符（通常是 operationId 或生成的 ID） */
  id: string;
  /** 工具名称（带前缀） */
  name: string;
  /** HTTP 方法 */
  method: string;
  /** API 路径 */
  path: string;
  /** 简短描述 */
  summary?: string;
  /** 详细描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 是否废弃 */
  deprecated?: boolean;
  /** 原始 OpenAPI 操作定义 */
  operation: OpenApiOperation;
  /** 组件 Schema（用于参数解析） */
  components?: Record<string, OpenApiSchema>;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索关键词 */
  query: string;
  /** 搜索范围：name、summary、description、path */
  searchIn?: ('name' | 'summary' | 'description' | 'path')[];
  /** 最大返回数量 */
  limit?: number;
}

/**
 * 列表选项
 */
export interface ListOptions {
  /** 页码（从 1 开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 按标签过滤 */
  tag?: string;
}

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  /** API ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** HTTP 方法 */
  method: string;
  /** API 路径 */
  path: string;
  /** 简短描述 */
  summary?: string;
  /** 匹配字段 */
  matchedFields: string[];
  /** 匹配度分数（0-1） */
  score: number;
}

/**
 * 列表结果项
 */
export interface ListItem {
  /** API ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** HTTP 方法 */
  method: string;
  /** API 路径 */
  path: string;
  /** 简短描述 */
  summary?: string;
  /** 标签 */
  tags?: string[];
  /** 是否废弃 */
  deprecated?: boolean;
}

/**
 * 分页列表结果
 */
export interface ListResult {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** API 列表 */
  items: ListItem[];
}

/**
 * API 详情
 */
export interface ApiDetail extends ApiEntry {
  /** 参数 Schema（JSON Schema 格式） */
  parameterSchema?: Record<string, unknown>;
  /** 请求体 Schema（JSON Schema 格式） */
  requestBodySchema?: Record<string, unknown>;
  /** 响应 Schema */
  responseSchemas?: Record<string, { description?: string; schema?: Record<string, unknown> }>;
}

/**
 * Registry 统计信息
 */
export interface RegistryStats {
  /** API 总数 */
  totalApis: number;
  /** 标签列表 */
  tags: string[];
  /** 按方法统计 */
  byMethod: Record<string, number>;
  /** 按标签统计 */
  byTag: Record<string, number>;
}

/**
 * 工作模式
 */
export type Mode = 'default' | 'ondemand';
