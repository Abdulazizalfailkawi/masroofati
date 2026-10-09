export const normDigits = (s: string | number): string =>
  String(s == null ? '' : s)
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

/**
 * Parses a user input string into integer fils (1 KWD = 1000 fils).
 * Accepts Arabic-Indic or Western digits, with '.', '،', '٫', or ',' separators.
 */
export function parseAmount(str: string | null | undefined): number | null {
  let s = normDigits(str == null ? '' : str)
    .trim()
    .replace(/\s/g, '')
    .replace(/[٫،]/g, '.')
    .replace(/٬/g, ',');

  if (!s.includes('.')) {
    const m = s.match(/^(\d+),(\d{1,2})$/);
    if (m) s = m[1] + '.' + m[2];
  }
  s = s.replace(/,/g, '');

  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;

  let [w, f = ''] = s.split('.');
  w = w || '0';
  if (w.length > 9) return null;

  f = (f + '000').slice(0, 3);
  return parseInt(w, 10) * 1000 + parseInt(f, 10);
}

export interface MoneyParts {
  neg: boolean;
  w: string;
  fr: string;
}

export function parts(fils: number): MoneyParts {
  const neg = fils < 0;
  const a = Math.abs(fils);
  return {
    neg,
    w: Math.floor(a / 1000).toLocaleString('en-US'),
    fr: String(a % 1000).padStart(3, '0'),
  };
}

export function formatMoney(fils: number): string {
  const p = parts(fils);
  return (p.neg ? '−' : '') + p.w + '.' + p.fr;
}

export function sizeClass(fils: number): string {
  const len = formatMoney(fils).length;
  return len <= 9 ? '' : len <= 11 ? ' s2' : ' s3';
}

export function amtField(fils: number): string {
  return fils ? String(fils / 1000) : '';
}
