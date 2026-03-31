import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/loader.js';
import type { EnvConfig } from '../../src/config/types.js';

describe('config/loader', () => {
  describe('headers', () => {
    it('应从 CLI 参数加载 JSON 格式的 headers', () => {
      const config = loadConfig(
        {
          url: 'test.json',
          headers: '{"Authorization":"Bearer token123"}',
        },
        {} as EnvConfig
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer token123' });
    });

    it('应从环境变量加载 JSON 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_HEADERS: '{"X-Custom":"value"}' }
      );

      expect(config.headers).toEqual({ 'X-Custom': 'value' });
    });

    it('未配置 headers 时应返回 undefined', () => {
      const config = loadConfig({ url: 'test.json' }, {} as EnvConfig);

      expect(config.headers).toBeUndefined();
    });

    it('headers 格式无效时应抛出错误', () => {
      expect(() =>
        loadConfig({ url: 'test.json', headers: 'not-valid' }, {} as EnvConfig)
      ).toThrow();
    });

    it('应解析单个 key=value 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json', headers: 'Authorization=Bearer token123' },
        {} as EnvConfig
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer token123' });
    });

    it('应解析多个 key=value 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json', headers: 'Authorization=Bearer xxx,X-Api-Key=yyy' },
        {} as EnvConfig
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer xxx', 'X-Api-Key': 'yyy' });
    });

    it('应解析带空格的 key=value 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json', headers: 'Authorization = Bearer xxx , X-Api-Key = yyy' },
        {} as EnvConfig
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer xxx', 'X-Api-Key': 'yyy' });
    });

    it('应解析值中包含等号的 key=value 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json', headers: 'Authorization=Bearer abc=def' },
        {} as EnvConfig
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer abc=def' });
    });

    it('应从环境变量解析 key=value 格式的 headers', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_HEADERS: 'Authorization=Bearer env-token' }
      );

      expect(config.headers).toEqual({ Authorization: 'Bearer env-token' });
    });

    it('环境变量 headers 应优先于 CLI headers', () => {
      const config = loadConfig(
        { url: 'test.json', headers: '{"Authorization":"cli-token"}' },
        { OPENAPI_URL: 'test.json', API_HEADERS: '{"Authorization":"env-token"}' }
      );

      expect(config.headers).toEqual({ Authorization: 'env-token' });
    });
  });

  describe('fixedParams', () => {
    it('应从 CLI 参数加载 fixedParams', () => {
      const config = loadConfig(
        {
          url: 'test.json',
          fixedParams: '{"appKey":"secret123"}',
        },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'secret123' });
    });

    it('应从环境变量加载 fixedParams', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: '{"token":"abc"}' }
      );

      expect(config.fixedParams).toEqual({ token: 'abc' });
    });

    it('未配置 fixedParams 时应返回 undefined', () => {
      const config = loadConfig({ url: 'test.json' }, {} as EnvConfig);

      expect(config.fixedParams).toBeUndefined();
    });

    it('fixedParams 格式无效时应抛出错误', () => {
      expect(() =>
        loadConfig({ url: 'test.json', fixedParams: 'not-valid' }, {} as EnvConfig)
      ).toThrow();
    });

    it('应解析单个 key=value 格式', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey=secret123' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'secret123' });
    });

    it('应解析多个 key=value 键值对', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey=xxx,token=yyy' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'xxx', token: 'yyy' });
    });

    it('应解析带空格的 key=value 格式', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey = xxx , token = yyy' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'xxx', token: 'yyy' });
    });

    it('应解析值中包含等号的 key=value 格式', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'token=abc=def' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ token: 'abc=def' });
    });

    it('应从环境变量解析 key=value 格式', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: 'appKey=env-key' }
      );

      expect(config.fixedParams).toEqual({ appKey: 'env-key' });
    });

    it('环境变量 fixedParams 应优先于 CLI fixedParams（合并顺序中后者覆盖前者）', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: '{"appKey":"cli-key"}' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: '{"appKey":"env-key"}' }
      );

      // mergeConfigs(cliConfig, envConfig, fileConfig) - 后者覆盖前者
      // 因此 env 覆盖 CLI
      expect(config.fixedParams).toEqual({ appKey: 'env-key' });
    });
  });
});
