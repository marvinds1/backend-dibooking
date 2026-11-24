const test = require('node:test');
const assert = require('node:assert');
const { parseSlot, totalPrice } = require('../scripts/utils/slot');

const now = new Date('2026-11-24T03:00:00Z');

test('parses frontend slot format in WIB', () => {
  const slot = parseSlot('Wednesday, November 25', '08:00 - 10:00', { now });
  assert.strictEqual(slot.startAt.toISOString(), '2026-11-25T01:00:00.000Z');
  assert.strictEqual(slot.endAt.toISOString(), '2026-11-25T03:00:00.000Z');
  assert.strictEqual(slot.hours, 2);
});

test('rolls over to next year for early-January slots booked in December', () => {
  const dec = new Date('2026-12-30T03:00:00Z');
  const slot = parseSlot('Saturday, January 2', '10:00 - 12:00', { now: dec });
  assert.strictEqual(slot.startAt.getUTCFullYear(), 2027);
});

test('rejects malformed or impossible input', () => {
  assert.strictEqual(parseSlot('Monday, Foo 1', '08:00 - 10:00', { now }), null);
  assert.strictEqual(parseSlot('Monday, February 31', '08:00 - 10:00', { now }), null);
  assert.strictEqual(parseSlot('Monday, November 30', '10:00 - 08:00', { now }), null);
  assert.strictEqual(parseSlot('Monday, November 30', '{"$gt":""}', { now }), null);
});

test('price is computed server-side from hourly rate', () => {
  assert.strictEqual(totalPrice(50000, 2), 100000);
});
