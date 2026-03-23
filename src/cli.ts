#!/usr/bin/env node

/**
 * CLI 入口
 */

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
  .version('0.1.0')
  .option('-u, --url <url>', 'OpenAPI document URL or file path')
  .option('-b, --base-url <url>', 'API base URL (overrides OpenAPI servers)')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', parseInt)
  .option('-h, --headers <json>', 'Custom headers as JSON string')
  .option('-p, --prefix <prefix>', 'Tool name prefix')
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
        prefix: options.prefix,
        debug: options.debug,
      });

      logger.info(`Starting api2mcp...`);
      logger.info(`OpenAPI URL: ${config.openapiUrl}`);
      if (config.baseUrl) {
        logger.info(`Base URL: ${config.baseUrl}`);
      }

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
