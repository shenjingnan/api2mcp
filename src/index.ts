/**
 * 入口导出
 */

export { loadConfig } from './config/loader.js';
export type { ApiHeaders, ApiSourceConfig, Config, Mode } from './config/types.js';
export { convertSchema, createRefResolver } from './converter/schema-converter.js';
export type { GeneratedTool } from './converter/tool-generator.js';
export { generateTool, generateTools } from './converter/tool-generator.js';
export type { HttpResponse } from './executor/http-client.js';
export { executeRequest, formatResponse } from './executor/http-client.js';
export { getBaseUrl, parseOpenApi } from './parser/swagger.js';
export type {
  OpenApiOperation,
  OpenApiParameter,
  OpenApiSchema,
  ParsedOpenApiDoc,
} from './parser/types.js';

// Registry
export { ApiRegistry } from './registry/api-registry.js';
export type {
  ApiDetail,
  ApiEntry,
  ListItem,
  ListOptions,
  ListResult,
  RegistryStats,
  SearchOptions,
  SearchResultItem,
} from './registry/types.js';
export { createServer, startServer } from './server/index.js';
export { ToolManager } from './server/tool-manager.js';
export type {
  ApiDetailInput,
  ApiExecuteInput,
  ApiListInput,
  ApiSearchInput,
} from './tools/discovery/index.js';
// Discovery Tools
export {
  apiDetailSchema,
  apiDetailTool,
  apiExecuteSchema,
  apiExecuteTool,
  apiListSchema,
  apiListTool,
  apiSearchSchema,
  apiSearchTool,
  executeApiDetail,
  executeApiExecute,
  executeApiList,
  executeApiSearch,
} from './tools/discovery/index.js';

export {
  Api2McpError,
  ConfigurationError,
  HttpError,
  OpenApiParseError,
  ToolExecutionError,
} from './utils/error.js';

export { logger } from './utils/logger.js';
