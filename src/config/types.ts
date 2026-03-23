/**
 * 配置类型定义
 */

import { z } from 'zod';

/**
 * API 请求头配置
 */
export type ApiHeaders = Record<string, string>;

/**
 * 单个 API 源配置
 */
export interface ApiSourceConfig {
  /** OpenAPI 文档 URL 或本地文件路径 */
  openapiUrl: string;
  /** API 基础 URL（可选，默认从 OpenAPI 文档中提取） */
  baseUrl?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 自定义请求头 */
  headers?: ApiHeaders;
  /** 工具名前缀 */
  toolPrefix?: string;
}

/**
 * 完整配置
 */
export interface Config extends ApiSourceConfig {
  /** 调试模式 */
  debug: boolean;
}

/**
 * CLI 参数 Schema
 */
export const CliArgsSchema = z.object({
  url: z.string().optional(),
  baseUrl: z.string().optional(),
  timeout: z.coerce.number().positive().optional(),
  headers: z.string().optional(),
  prefix: z.string().optional(),
  debug: z.boolean().optional(),
});

export type CliArgs = z.infer<typeof CliArgsSchema>;

/**
 * 环境变量配置
 */
export interface EnvConfig {
  OPENAPI_URL?: string;
  API_BASE_URL?: string;
  API_TIMEOUT?: string;
  API_HEADERS?: string;
  DEBUG?: string;
}

/**
 * 配置文件 Schema
 */
export const ConfigFileSchema = z.object({
  openapiUrl: z.string(),
  baseUrl: z.string().optional(),
  timeout: z.number().positive().optional(),
  headers: z.record(z.string()).optional(),
  toolPrefix: z.string().optional(),
  debug: z.boolean().optional(),
});

export type ConfigFile = z.infer<typeof ConfigFileSchema>;
