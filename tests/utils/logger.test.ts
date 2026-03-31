import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/utils/logger.js';

describe('logger', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
    logger.setLevel('info');
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('setLevel', () => {
    it('应该将日志级别切换为 debug', () => {
      logger.setLevel('debug');
      logger.debug('test message');
      expect(console.error).toHaveBeenCalled();
    });

    it('应该将日志级别切换为 error', () => {
      logger.setLevel('error');
      logger.info('info message');
      logger.warn('warn message');
      expect(console.error).not.toHaveBeenCalled();
      logger.error('error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('当日志级别为 info 时不应输出 debug 日志', () => {
      logger.setLevel('info');
      logger.debug('debug message');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('当日志级别为 debug 时应输出 debug 日志', () => {
      logger.setLevel('debug');
      logger.debug('debug message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[DEBUG]');
      expect(call[0]).toContain('debug message');
    });
  });

  describe('info', () => {
    it('当日志级别为 info 时应输出 info 日志', () => {
      logger.info('info message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('info message');
    });

    it('当日志级别为 warn 时不应输出 info 日志', () => {
      logger.setLevel('warn');
      logger.info('info message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('当日志级别为 info 时应输出 warn 日志', () => {
      logger.warn('warn message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[WARN]');
      expect(call[0]).toContain('warn message');
    });

    it('当日志级别为 error 时不应输出 warn 日志', () => {
      logger.setLevel('error');
      logger.warn('warn message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('error 级别日志应始终输出', () => {
      logger.setLevel('error');
      logger.error('error message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('error message');
    });
  });

  describe('formatMessage', () => {
    it('日志应包含时间戳', () => {
      logger.info('test');
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('附加参数', () => {
    it('应将附加参数传递给 console.error', () => {
      logger.setLevel('debug');
      logger.debug('message', 'arg1', 'arg2');
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toBe('arg1');
      expect(call[2]).toBe('arg2');
    });
  });
});
