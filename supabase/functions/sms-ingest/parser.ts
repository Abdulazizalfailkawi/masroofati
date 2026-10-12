// Reads a bank SMS (Kuwaiti banks, Arabic or English) and works out what it is:
// an expense or an income, the amount in fils (1 KWD = 1000), the other party, etc.
// It is deliberately bank-agnostic: it keys on common wording rather than one bank's template.

// 'internal' = a transfer between the user's own accounts; it is not income or spending.
export type SmsKind = 'expense' | 'income' | 'unparsed' | 'internal';

export interface ParsedSms {
  kind: SmsKind;
  amount: number | null; // fils
  balance: number | null; // fils, balance after the operation when the SMS states it
  merchant: string;
  pay: 'cash' | 'knet' | 'card' | 'transfer' | 'other';
  cat: 'food' | 'transport' | 'shopping' | 'coffee' | 'fun' | 'bills' | 'subs' | 'other';
  src: 'salary' | 'allowance' | 'extra' | 'other';
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const IR_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeSms(input: string): string {
  return String(input || '')
    .replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, d => String(IR_DIGITS.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/[‎‏؜‪-‮]/g, '')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CUR = '(?:د\\s*\\.?\\s*ك|KWD|KD|دينار)';
const BALANCE_MARK = /(?:الرصيد(?:\s*المتوفر|\s*الحالي)?|available\s*balance|balance)/i;

const toFils = (s: string): number | null => {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : null;
};

const START = '(?:^|[\\s.,:،])';
const END = '(?=[\\s.,:،]|$)';
const HEAD_EXPENSE = /^(?:تم\s+)?(?:خصم|سحب|شراء|مشتريات|تحويل|دفع|سداد|purchase|debit|withdraw)/i;
const HEAD_INCOME = /^(?:تم\s+)?(?:استلام|إيداع|ايداع|وارد|راتب|رواتب|معاش|بدل|بدلات|مكافأ|استرجاع|استرداد|refund|credit|deposit|salary)/i;
const ANY_INCOME = new RegExp(
  START + '(?:استلام|إيداع|ايداع|تم\\s+ايداع|وارد|راتب|رواتب|معاش|بدل|بدلات|مكافأة|استرجاع|استرداد|refund|deposit|salary)' + END,
  'i'
);
const ANY_EXPENSE = new RegExp(
  START + '(?:خصم|سحب|شراء|مشتريات|تحويل|دفع|سداد|purchase|debit|withdraw|pos)' + END,
  'i'
);

function detectKind(t: string): SmsKind {
  if (HEAD_EXPENSE.test(t)) return 'expense';
  if (HEAD_INCOME.test(t)) return 'income';
  if (ANY_INCOME.test(t)) return 'income';
  if (ANY_EXPENSE.test(t)) return 'expense';
  return 'unparsed';
}

function cleanName(s: string | undefined): string {
  if (!s) return '';
  return s
    .replace(/\s*-\s*-+\s*$/g, '')
    .replace(/[\s.,:;،-]+$/g, '')
    .replace(/^[\s@.,:;،-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function findMerchant(t: string, kind: SmsKind): string {
  if (kind === 'expense') {
    // Transfer out: "... إلى NAME. الرصيد"
    let m = t.match(/إلى\s+(.+?)\s*(?:\.\s*)?(?:الرصيد|available|balance|$)/i);
    if (m) return cleanName(m[1]);
    // Point of sale: "... في @ MERCHANT - -. الرصيد"
    m = t.match(/\sفي\s+(?!حساب)@?\s*(.+?)\s*(?:-\s*-|\.\s*(?:الرصيد|available|balance)|(?:الرصيد|available|balance)|$)/i);
    if (m) return cleanName(m[1]);
    m = t.match(/(?:\bat\b|@)\s+(.+?)\s*(?:\bon\b|-\s*-|\.\s*(?:الرصيد|available|balance)|$)/i);
    if (m) return cleanName(m[1]);
    return '';
  }
  if (kind === 'income') {
    // Transfer in: "... من NAME. الرصيد" (not "من حساب 123")
    const m = t.match(/\sمن\s+(?!حساب)(.+?)\s*(?:\.\s*)?(?:الرصيد|available|balance|$)/i);
    if (m) return cleanName(m[1]);
    const e = t.match(/\bfrom\s+(.+?)\s*(?:\.\s*)?(?:available|balance|$)/i);
    if (e) return cleanName(e[1]);
  }
  return '';
}

function guessPay(t: string, kind: SmsKind): ParsedSms['pay'] {
  if (kind === 'income') return 'other';
  if (/ومض|wamd|تحويل|transfer|حوالة/i.test(t)) return 'transfer';
  if (/نقاط\s*البيع|\bpos\b|utap|knet|كي\s*نت|apple\s*pay/i.test(t)) return 'knet';
  if (/بطاقة\s*ائتمان|credit\s*card|visa|master\s*card/i.test(t)) return 'card';
  if (/سحب|\batm\b|صراف/i.test(t)) return 'cash';
  return 'other';
}

const CATEGORY_RULES: [ParsedSms['cat'], RegExp][] = [
  ['coffee', /coffee|caf[eé]|starbucks|costa|dunkin|tim\s*hortons?|caribou|espresso|roastery|قهوة|كافيه|كوفي|مقهى|بن\b/i],
  ['food', /\beat\b|food|restaurant|resto|burger|pizza|kitchen|grill|shawarma|bakery|sweets?|kfc|mcdonald|hardee|subway|مطعم|مطبخ|مطابخ|برجر|بيتزا|شاورما|مخبز|حلويات|وجبات/i],
  ['transport', /petrol|fuel|oula|alfa\b|knpc|ku\s*oil|energy|gas\s*station|uber|careem|taxi|parking|بنزين|وقود|أولى|اولى|ألفا|كريم|تكسي|موقف/i],
  ['subs', /netflix|spotify|apple\.com|itunes|google\s*(?:play|one|storage)|youtube|icloud|subscription|anghami|shahid|openai|chatgpt|اشتراك/i],
  ['bills', /zain|ooredoo|stc\b|viva\b|kuwait\s*telecom|\bmew\b|electricity|فاتورة|اتصالات|زين|أوريدو|اوريدو|فيفا|وزارة الكهرباء/i],
  ['fun', /cinema|vox|cinescape|playstation|steam|xbox|entertainment|bowling|game|سينما|ترفيه|ألعاب|العاب/i],
  ['shopping', /market|mart\b|co-?op|supermarket|hypermarket|lulu|carrefour|sultan|mall|store|shop|centrepoint|zara|h&m|ikea|xcite|noon|amazon|jarir|جمعية|سوق|هايبر|مول|متجر|تسوق|محل/i],
];

function guessCategory(merchant: string, t: string): ParsedSms['cat'] {
  const hay = merchant || t;
  for (const [cat, re] of CATEGORY_RULES) if (re.test(hay)) return cat;
  return 'other';
}

function guessSource(t: string): ParsedSms['src'] {
  if (/بدل|بدلات|allowance/i.test(t)) return 'allowance';
  if (/راتب|رواتب|معاش|salary/i.test(t)) return 'salary';
  return 'other';
}

export function parseSms(raw: string): ParsedSms {
  const t = normalizeSms(raw);
  const fail: ParsedSms = { kind: 'unparsed', amount: null, balance: null, merchant: '', pay: 'other', cat: 'other', src: 'other' };
  if (!t) return fail;

  const markIdx = t.search(BALANCE_MARK);
  const amounts: { fils: number | null; idx: number }[] = [];
  // "1.500 د.ك" / "1.500 KD"
  const after = new RegExp('(\\d[\\d,]*(?:\\.\\d{1,3})?)\\s*' + CUR, 'gi');
  let m: RegExpExecArray | null;
  while ((m = after.exec(t)) !== null) amounts.push({ fils: toFils(m[1]), idx: m.index });
  // "KD 1.500" (English style, currency first)
  const before = /(?:KWD|KD)\s*(\d[\d,]*(?:\.\d{1,3})?)/gi;
  while ((m = before.exec(t)) !== null) amounts.push({ fils: toFils(m[1]), idx: m.index });
  amounts.sort((a, b) => a.idx - b.idx);

  const txn = amounts.find(a => markIdx < 0 || a.idx < markIdx);
  const bal = markIdx >= 0 ? amounts.find(a => a.idx > markIdx) : undefined;
  if (!txn || !txn.fils) return fail;

  const isTransfer = /ومض|wamd|تحويل|transfer|حوالة/i.test(t);

  // Moving money between your own accounts changes nothing about what you earned or spent.
  // Recognised by wording ("between your accounts") or by account numbers on BOTH sides
  // ("from account 2001 to account 2002"), as opposed to a person's name on the other side.
  const accountNumbers = t.match(/حساب\s*\d{3,}|account\s*(?:no\.?\s*)?\d{3,}/gi) || [];
  const wordedInternal = /بين\s*(?:حساباتك|الحسابات)|تحويل\s*داخلي|between\s*(?:your\s*)?accounts|own\s*accounts?|internal\s*transfer/i.test(t);
  if (isTransfer && (wordedInternal || accountNumbers.length >= 2)) {
    return { ...fail, kind: 'internal', amount: txn.fils, balance: bal?.fils ?? null };
  }

  const kind = detectKind(t);
  if (kind === 'unparsed') return { ...fail, amount: txn.fils, balance: bal?.fils ?? null };

  // Person-to-person transfers never keep the other person's name (privacy): just the kind.
  // Shops keep their name, which is useful when reviewing spending.
  const merchant = isTransfer ? (/ومض|wamd/i.test(t) ? 'تحويل ومض' : 'تحويل') : findMerchant(t, kind);
  return {
    kind,
    amount: txn.fils,
    balance: bal?.fils ?? null,
    merchant,
    pay: guessPay(t, kind),
    cat: kind === 'expense' ? guessCategory(merchant, t) : 'other',
    src: kind === 'income' ? guessSource(t) : 'other',
  };
}
