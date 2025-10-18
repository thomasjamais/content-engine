/**
 * Jest setup file for TypeScript tests
 */

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress console.error and console.warn in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.expectNonEmptyString = (value) => {
  expect(typeof value).toBe('string');
  expect(value.length).toBeGreaterThan(0);
};

global.expectValidHashtag = (hashtag) => {
  expect(typeof hashtag).toBe('string');
  expect(hashtag).toMatch(/^#\w+$/);
};

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';
process.env.TTS_PROVIDER = 'mock';