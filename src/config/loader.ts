/**
 * 配置加载器
 * 优先级: CLI 参数 > 环境变量 > 配置文件
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigurationError } from '../utils/error.js';
import { logger } from '../utils/logger.js';
import type { CliArgs, Config, ConfigFile, EnvConfig } from './types.js';

const DEFAULT_TIMEOUT = 30000;
const CONFIG_FILE_NAMES = ['api2mcp.json', 'api2mcp.config.json', '.api2mcp.json'];

/**
 * 解析 JSON 格式的请求头字符串
 */
function parseHeaders(headersStr: string | undefined): Record<string, string> | undefined {
  if (!headersStr) return undefined;

  // 1. 先尝试 JSON 格式
  try {
    const parsed = JSON.parse(headersStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    throw new Error('Headers must be a JSON object');
  } catch (jsonError) {
    // 2. JSON 失败，尝试 key=value 格式
    try {
      return parseKeyValueFormat(headersStr);
    } catch {
      throw new ConfigurationError(
        `Invalid headers: expected JSON object or "key=value" format. ${
          jsonError instanceof Error ? jsonError.message : 'Unknown error'
        }`
      );
    }
  }
}

/**
 * 解析 key=value 格式的字符串
 */
function parseKeyValueFormat(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = str.split(',');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid key=value pair: "${trimmed}"`);
    }
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (!key) {
      throw new Error(`Empty key in pair: "${trimmed}"`);
    }
    result[key] = value;
  }
  if (Object.keys(result).length === 0) {
    throw new Error('No valid key=value pairs found');
  }
  return result;
}

/**
 * 解析固定参数字符串，支持 JSON 和 key=value 格式
 */
function parseFixedParams(paramsStr: string | undefined): Record<string, string> | undefined {
  if (!paramsStr) return undefined;

  // 1. 先尝试 JSON 格式
  try {
    const parsed = JSON.parse(paramsStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    throw new Error('Fixed params must be a JSON object');
  } catch (jsonError) {
    // 2. JSON 失败，尝试 key=value 格式
    try {
      return parseKeyValueFormat(paramsStr);
    } catch {
      // 两种格式都失败，抛出错误
      throw new ConfigurationError(
        `Invalid fixedParams: expected JSON object or "key=value" format. ${
          jsonError instanceof Error ? jsonError.message : 'Unknown error'
        }`
      );
    }
  }
}

/**
 * 解析安全凭据字符串，支持 JSON 和 key=value 格式
 */
function parseSecurity(securityStr: string | undefined): Record<string, string> | undefined {
  if (!securityStr) return undefined;

  // 1. 先尝试 JSON 格式
  try {
    const parsed = JSON.parse(securityStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    throw new Error('Security must be a JSON object');
  } catch (jsonError) {
    // 2. JSON 失败，尝试 key=value 格式
    try {
      return parseKeyValueFormat(securityStr);
    } catch {
      throw new ConfigurationError(
        `Invalid security: expected JSON object or "key=value" format. ${
          jsonError instanceof Error ? jsonError.message : 'Unknown error'
        }`
      );
    }
  }
}

/**
 * 从环境变量加载配置
 */
function loadFromEnv(env: EnvConfig): Partial<Config> {
  const config: Partial<Config> = {};

  if (env.OPENAPI_URL) {
    config.openapiUrl = env.OPENAPI_URL;
  }

  if (env.API_BASE_URL) {
    config.baseUrl = env.API_BASE_URL;
  }

  if (env.API_TIMEOUT) {
    const timeout = parseInt(env.API_TIMEOUT, 10);
    if (!Number.isNaN(timeout) && timeout > 0) {
      config.timeout = timeout;
    }
  }

  if (env.API_HEADERS) {
    config.headers = parseHeaders(env.API_HEADERS);
  }

  if (env.API_FIXED_PARAMS) {
    config.fixedParams = parseFixedParams(env.API_FIXED_PARAMS);
  }

  if (env.API_SECURITY) {
    config.security = parseSecurity(env.API_SECURITY);
  }

  if (env.DEBUG) {
    config.debug = env.DEBUG === 'true' || env.DEBUG === '1';
  }

  return config;
}

/**
 * 从配置文件加载配置
 */
function loadFromFile(workingDir: string = process.cwd()): Partial<Config> | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = resolve(workingDir, fileName);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content) as ConfigFile;
        logger.info(`Loaded configuration from ${filePath}`);
        return {
          openapiUrl: parsed.openapiUrl,
          baseUrl: parsed.baseUrl,
          timeout: parsed.timeout,
          headers: parsed.headers,
          fixedParams: parsed.fixedParams,
          toolPrefix: parsed.toolPrefix,
          debug: parsed.debug,
          mode: parsed.mode,
          security: parsed.security,
        };
      } catch (error) {
        throw new ConfigurationError(
          `Failed to load config file ${filePath}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }
  return null;
}

/**
 * 从 CLI 参数加载配置
 */
function loadFromCli(args: CliArgs): Partial<Config> {
  const config: Partial<Config> = {};

  if (args.url) {
    config.openapiUrl = args.url;
  }

  if (args.baseUrl) {
    config.baseUrl = args.baseUrl;
  }

  if (args.timeout) {
    config.timeout = args.timeout;
  }

  if (args.headers) {
    config.headers = parseHeaders(args.headers);
  }

  if (args.fixedParams) {
    config.fixedParams = parseFixedParams(args.fixedParams);
  }

  if (args.prefix) {
    config.toolPrefix = args.prefix;
  }

  if (args.debug !== undefined) {
    config.debug = args.debug;
  }

  if (args.mode) {
    config.mode = args.mode;
  }

  if (args.security) {
    config.security = parseSecurity(args.security);
  }

  return config;
}

/**
 * 合并配置（后面的配置覆盖前面的）
 */
function mergeConfigs(...configs: Array<Partial<Config>>): Config {
  const merged: Config = {
    openapiUrl: '',
    debug: false,
  };

  for (const config of configs) {
    if (config.openapiUrl !== undefined) merged.openapiUrl = config.openapiUrl;
    if (config.baseUrl !== undefined) merged.baseUrl = config.baseUrl;
    if (config.timeout !== undefined) merged.timeout = config.timeout;
    if (config.headers !== undefined) merged.headers = config.headers;
    if (config.fixedParams !== undefined) merged.fixedParams = config.fixedParams;
    if (config.toolPrefix !== undefined) merged.toolPrefix = config.toolPrefix;
    if (config.debug !== undefined) merged.debug = config.debug;
    if (config.mode !== undefined) merged.mode = config.mode;
    if (config.security !== undefined) merged.security = config.security;
  }

  // 设置默认值
  if (merged.timeout === undefined) {
    merged.timeout = DEFAULT_TIMEOUT;
  }

  return merged;
}

/**
 * 加载配置
 * 优先级: CLI 参数 > 环境变量 > 配置文件
 */
export function loadConfig(cliArgs: CliArgs = {}, env: EnvConfig = process.env): Config {
  const fileConfig = loadFromFile() ?? {};
  const envConfig = loadFromEnv(env);
  const cliConfig = loadFromCli(cliArgs);

  const config = mergeConfigs(cliConfig, envConfig, fileConfig);

  // 验证必要配置
  if (!config.openapiUrl) {
    throw new ConfigurationError(
      'OpenAPI URL is required. Provide it via --url, OPENAPI_URL env, or config file.'
    );
  }

  // 设置日志级别
  if (config.debug) {
    logger.setLevel('debug');
  }

  logger.debug('Loaded configuration:', {
    openapiUrl: config.openapiUrl,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    toolPrefix: config.toolPrefix,
    mode: config.mode,
    debug: config.debug,
  });

  return config;
}

export default loadConfig;
