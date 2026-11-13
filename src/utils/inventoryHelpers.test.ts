import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStockInput } from './inventoryHelpers';

test('parseStockInput parses integers, decimals, and Indonesian comma decimals', () => {
  assert.deepEqual(parseStockInput('25'), { valid: true, value: 25 });
  assert.deepEqual(parseStockInput('14.5'), { valid: true, value: 14.5 });
  assert.deepEqual(parseStockInput('12,75'), { valid: true, value: 12.75 });
  assert.deepEqual(parseStockInput('0'), { valid: true, value: 0 });
});

test('parseStockInput rejects empty, non-numeric, and negative inputs', () => {
  assert.equal(parseStockInput('').valid, false);
  assert.equal(parseStockInput('   ').valid, false);
  assert.equal(parseStockInput('abc').valid, false);
  assert.equal(parseStockInput('-5').valid, false);
});
