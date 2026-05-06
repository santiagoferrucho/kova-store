/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.js'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true } }] },
  forceExit: true,
  testTimeout: 20000,
};
