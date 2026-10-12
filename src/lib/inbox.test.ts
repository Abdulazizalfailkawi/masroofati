// Run with: npx tsx src/lib/inbox.test.ts
import assert from 'node:assert/strict';
import { applyInbox, InboxRow } from './inbox.ts';
import { defaultState } from './storage.ts';

const row = (over: Partial<InboxRow>): InboxRow => ({
  id: 'r1',
  kind: 'expense',
  status: 'new',
  amount: 1500,
  merchant: 'EAT SMART,JABRIYA BRNC',
  pay: 'knet',
  cat: 'food',
  src: 'other',
  occurred_on: '2026-10-12',
  raw: '',
  created_at: '2026-10-12T10:00:00Z',
  ...over,
});

// expense + income are imported with their details
let r = applyInbox(defaultState(), [
  row({}),
  row({ id: 'r2', kind: 'income', amount: 200000, merchant: '', src: 'allowance', cat: 'other', pay: 'other' }),
  row({ id: 'r3', kind: 'income', amount: 1000, merchant: 'OTHMAN J A ALENEZI', src: 'other' }),
]);
assert.equal(r.added, 3);
assert.deepEqual(
  r.state.expenses.map(e => [e.amt, e.cat, e.pay, e.note, e.date, e.smsId]),
  [[1500, 'food', 'knet', 'EAT SMART,JABRIYA BRNC', '2026-10-12', 'r1']]
);
assert.deepEqual(
  r.state.incomes.map(i => [i.amt, i.src, i.note ?? null, i.rec, i.smsId]),
  [[200000, 'allowance', null, false, 'r2'], [1000, 'other', 'OTHMAN J A ALENEZI', false, 'r3']]
);

// importing the same rows again never duplicates (e.g. marking them imported failed last time)
const again = applyInbox(r.state, [row({}), row({ id: 'r2', kind: 'income', src: 'allowance' })]);
assert.equal(again.added, 0);
assert.equal(again.state, r.state);

// bad / unknown values fall back safely; empty amounts are skipped
const odd = applyInbox(defaultState(), [
  row({ id: 'x1', cat: 'nonsense', pay: 'nonsense', occurred_on: 'garbage' }),
  row({ id: 'x2', amount: null }),
  row({ id: 'x3', amount: 0 }),
  row({ id: 'x4', kind: 'unparsed' }),
]);
assert.equal(odd.added, 1);
assert.equal(odd.state.expenses[0].cat, 'other');
assert.equal(odd.state.expenses[0].pay, 'other');
assert.match(odd.state.expenses[0].date, /^\d{4}-\d{2}-\d{2}$/);

console.log('inbox import: all passed');
