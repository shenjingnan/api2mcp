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
    it('should change log level to debug', () => {
      logger.setLevel('debug');
      logger.debug('test message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should change log level to error', () => {
      logger.setLevel('error');
      logger.info('info message');
      logger.warn('warn message');
      expect(console.error).not.toHaveBeenCalled();
      logger.error('error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should not log when level is info', () => {
      logger.setLevel('info');
      logger.debug('debug message');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log when level is debug', () => {
      logger.setLevel('debug');
      logger.debug('debug message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[DEBUG]');
      expect(call[0]).toContain('debug message');
    });
  });

  describe('info', () => {
    it('should log when level is info', () => {
      logger.info('info message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('info message');
    });

    it('should not log when level is warn', () => {
      logger.setLevel('warn');
      logger.info('info message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log when level is info', () => {
      logger.warn('warn message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[WARN]');
      expect(call[0]).toContain('warn message');
    });

    it('should not log when level is error', () => {
      logger.setLevel('error');
      logger.warn('warn message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should always log', () => {
      logger.setLevel('error');
      logger.error('error message');
      expect(console.error).toHaveBeenCalled();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('error message');
    });
  });

  describe('formatMessage', () => {
    it('should include timestamp', () => {
      logger.info('test');
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('additional arguments', () => {
    it('should pass additional arguments to console.error', () => {
      logger.setLevel('debug');
      logger.debug('message', 'arg1', 'arg2');
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toBe('arg1');
      expect(call[2]).toBe('arg2');
    });
  });
});
