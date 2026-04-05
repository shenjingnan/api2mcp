#!/usr/bin/env node

/**
 * CLI 入口
 */

declare const VERSION: string;

import { Command } from 'commander';
import { loadConfig } from './config/loader.js';
import type { Config } from './config/types.js';
import { startServer } from './server/index.js';
import { ConfigurationError, OpenApiParseError } from './utils/error.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('api2mcp')
  .description('Convert OpenAPI specifications to MCP tools')
  .version(VERSION)
  .option('-u, --url <url>', 'OpenAPI document URL or file path')
  .option('-b, --base-url <url>', 'API base URL (overrides OpenAPI servers)')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', parseInt)
  .option('-h, --headers <json>', 'Custom headers as JSON string')
  .option(
    '-f, --fixed-params <params>',
    'Fixed parameters as JSON string or key=value pairs (pre-filled, hidden from LLM)'
  )
  .option('-p, --prefix <prefix>', 'Tool name prefix')
  .option(
    '-m, --mode <mode>',
    'Working mode: default (all APIs as tools) or ondemand (discovery tools)',
    'default'
  )
  .option(
    '-s, --security <credentials>',
    'Security credentials as JSON or key=value pairs (e.g. \'{"bearerAuth":"token123"}\' or bearerAuth=token123)'
  )
  .option('-d, --debug', 'Enable debug mode', false)
  .action(async (options) => {
    let config: Config | undefined;
    try {
      // 加载配置
      config = loadConfig({
        url: options.url,
        baseUrl: options.baseUrl,
        timeout: options.timeout,
        headers: options.headers,
        fixedParams: options.fixedParams,
        prefix: options.prefix,
        mode: options.mode,
        security: options.security,
        debug: options.debug,
      });

      logger.info(`Starting api2mcp...`);
      logger.info(`OpenAPI URL: ${config.openapiUrl}`);
      if (config.baseUrl) {
        logger.info(`Base URL: ${config.baseUrl}`);
      }
      logger.info(`Mode: ${config.mode || 'default'}`);

      // 启动服务器
      await startServer(config);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error(`Configuration error: ${error.message}`);
        process.exit(1);
      }

      if (error instanceof OpenApiParseError) {
        console.error(`OpenAPI parse error: ${error.message}`);
        process.exit(1);
      }

      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (config?.debug && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse();
