import { greet } from './greet.js';

// Simple test runner
function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exit(1);
  }
}

function assertEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}"`);
  }
}

// Tests
test('greet returns greeting with name', () => {
  assertEqual(greet('World'), 'Hello, World!');
});

test('greet works with different names', () => {
  assertEqual(greet('Alice'), 'Hello, Alice!');
  assertEqual(greet('Bob'), 'Hello, Bob!');
});

console.log('\nAll tests passed!');
