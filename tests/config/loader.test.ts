import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/loader.js';
import type { EnvConfig } from '../../src/config/types.js';

describe('config/loader', () => {
  describe('fixedParams', () => {
    it('should load fixedParams from CLI args', () => {
      const config = loadConfig(
        {
          url: 'test.json',
          fixedParams: '{"appKey":"secret123"}',
        },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'secret123' });
    });

    it('should load fixedParams from env var', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: '{"token":"abc"}' }
      );

      expect(config.fixedParams).toEqual({ token: 'abc' });
    });

    it('should return undefined fixedParams when not configured', () => {
      const config = loadConfig({ url: 'test.json' }, {} as EnvConfig);

      expect(config.fixedParams).toBeUndefined();
    });

    it('should throw error for invalid fixedParams format', () => {
      expect(() =>
        loadConfig({ url: 'test.json', fixedParams: 'not-valid' }, {} as EnvConfig)
      ).toThrow();
    });

    it('should parse single key=value format', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey=secret123' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'secret123' });
    });

    it('should parse multiple key=value pairs', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey=xxx,token=yyy' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'xxx', token: 'yyy' });
    });

    it('should parse key=value with spaces', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'appKey = xxx , token = yyy' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ appKey: 'xxx', token: 'yyy' });
    });

    it('should parse key=value where value contains equals sign', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: 'token=abc=def' },
        {} as EnvConfig
      );

      expect(config.fixedParams).toEqual({ token: 'abc=def' });
    });

    it('should parse key=value from env var', () => {
      const config = loadConfig(
        { url: 'test.json' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: 'appKey=env-key' }
      );

      expect(config.fixedParams).toEqual({ appKey: 'env-key' });
    });

    it('should prefer env fixedParams over CLI fixedParams (env takes precedence in merge order)', () => {
      const config = loadConfig(
        { url: 'test.json', fixedParams: '{"appKey":"cli-key"}' },
        { OPENAPI_URL: 'test.json', API_FIXED_PARAMS: '{"appKey":"env-key"}' }
      );

      // mergeConfigs(cliConfig, envConfig, fileConfig) - later overrides earlier
      // so env overrides CLI
      expect(config.fixedParams).toEqual({ appKey: 'env-key' });
    });
  });
});
