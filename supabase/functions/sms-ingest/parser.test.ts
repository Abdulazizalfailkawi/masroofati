// Run with: npx tsx supabase/functions/sms-ingest/parser.test.ts
//
// Rule: any message with a debit (خصم), a transfer (تحويل) or a receipt (استلام / إيداع) is
// added. Only that word is kept as the label; no names of people, shops or accounts.
import assert from 'node:assert/strict';
import { parseSms } from './parser.ts';

const cases: [string, Partial<ReturnType<typeof parseSms>>][] = [
  // The four real messages
  [
    'بدلات 200.000 د.ك. في حساب 2002.الرصيد 277.868 د.ك. تنزل غالبا كل تاريخ 15 الشهر',
    { kind: 'income', amount: 200000, balance: 277868, merchant: 'إيداع', src: 'allowance' },
  ],
  [
    'تحويل ومض 1.000 د.ك. من حساب  2001 إلى OTHMAN J A ALENEZI. الرصيد المتوفر 0.618 د.ك.',
    { kind: 'expense', amount: 1000, balance: 618, merchant: 'تحويل', pay: 'transfer', cat: 'other' },
  ],
  [
    'استلام تحويل ومض 1.000 د.ك. في حساب 2001 من  OTHMAN J A ALENEZI. الرصيد المتوفر 1.618 د.ك.',
    { kind: 'income', amount: 1000, balance: 1618, merchant: 'استلام', src: 'other' },
  ],
  [
    'خصم من حساب 2002 مبلغ 1.500 د.ك.  باستخدام UTap بجهاز نقاط البيع في  @ EAT SMART,JABRIYA BRNC - -. الرصيد 48.587 د.ك.',
    { kind: 'expense', amount: 1500, balance: 48587, merchant: 'خصم', pay: 'knet', cat: 'food' },
  ],
  // Every transfer is added, whatever the accounts say
  ['تحويل 50.000 د.ك. من حساب 2001 إلى حساب 2002. الرصيد المتوفر 10.000 د.ك.', { kind: 'expense', amount: 50000, merchant: 'تحويل' }],
  ['استلام تحويل 50.000 د.ك. في حساب 2002 من حساب 2001. الرصيد 60.000 د.ك.', { kind: 'income', amount: 50000, merchant: 'استلام' }],
  ['تحويل بين حساباتك 20.000 د.ك. الرصيد 5.000 د.ك.', { kind: 'expense', merchant: 'تحويل' }],
  ['Transfer between your accounts KD 20.000. Balance KD 5.000', { kind: 'expense', amount: 20000, merchant: 'تحويل' }],
  ['استلام تحويل بنكي 25.000 د.ك. في حساب 2001 من AHMED ALI. الرصيد المتوفر 30.000 د.ك.', { kind: 'income', amount: 25000, merchant: 'استلام' }],
  // Other wordings, Arabic-Indic digits and English
  ['خصم من حساب ٢٠٠٢ مبلغ ١٢٫٥٠٠ د.ك. في STARBUCKS KUWAIT. الرصيد ٤٨٫٠٠٠ د.ك.', { kind: 'expense', amount: 12500, merchant: 'خصم', cat: 'coffee' }],
  ['Purchase of KD 5.250 at ALFA PETROL on card 1234. Balance KD 10.000', { kind: 'expense', amount: 5250, balance: 10000, merchant: 'خصم', cat: 'transport' }],
  // Not a transaction: an OTP must never create anything
  ['رمز التحقق الخاص بك هو 483920. لا تشاركه مع أحد', { kind: 'unparsed', amount: null }],
  ['', { kind: 'unparsed' }],
];

// No name may ever leak into what is stored
const NAMES = /OTHMAN|ALENEZI|AHMED|ALI\b|EAT SMART|JABRIYA|STARBUCKS|ALFA/i;

let failed = 0;
for (const [text, want] of cases) {
  const got = parseSms(text);
  try {
    assert.deepEqual(Object.fromEntries(Object.keys(want).map(k => [k, (got as any)[k]])), want);
    assert.doesNotMatch(JSON.stringify(got), NAMES);
    console.log('ok  ', text.slice(0, 60));
  } catch (e) {
    failed++;
    console.log('FAIL', text.slice(0, 60), '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want));
  }
}
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
