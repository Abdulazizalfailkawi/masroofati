import { MONTHS } from './constants.ts';

export const pad = (n: number): string => String(n).padStart(2, '0');

export const fmtLocal = (d: Date): string =>
  d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

export const todayStr = (): string => fmtLocal(new Date());

export const mkOf = (ds: string): string => ds.slice(0, 7);

export const curMk = (): string => mkOf(todayStr());

export const dim = (y: number, m: number): number => new Date(y, m, 0).getDate();

export const splitD = (ds: string): [number, number, number] =>
  ds.split('-').map(Number) as [number, number, number];

export const addDays = (ds: string, n: number): string => {
  const [y, m, d] = splitD(ds);
  return fmtLocal(new Date(y, m - 1, d + n));
};

export const dow = (ds: string): number => {
  const [y, m, d] = splitD(ds);
  return new Date(y, m - 1, d).getDay();
};

export const utc = (ds: string): number => {
  const [y, m, d] = splitD(ds);
  return Date.UTC(y, m - 1, d);
};

export const dayDiff = (a: string, b: string): number =>
  Math.round((utc(b) - utc(a)) / 864e5);

export const addMonths = (mk: string, n: number): string => {
  const [y, m] = mk.split('-').map(Number);
  const t = (y * 12 + (m - 1)) + n;
  return Math.floor(t / 12) + '-' + pad((t % 12) + 1);
};

export const monthDiff = (a: string, b: string): number => {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
};

export const dateIn = (mk: string, day: number): string => {
  const [y, m] = mk.split('-').map(Number);
  return mk + '-' + pad(Math.min(day, dim(y, m)));
};

export const isDate = (s: unknown): s is string => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = splitD(s);
  return y >= 1990 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= dim(y, m);
};

export function fmtDate(ds: string): string {
  if (!isDate(ds)) return ds;
  const [y, m, d] = splitD(ds);
  return d + ' ' + MONTHS[m - 1] + (y !== new Date().getFullYear() ? ' ' + y : '');
}

export function relDate(ds: string): string {
  const t = todayStr();
  if (ds === t) return 'اليوم';
  if (ds === addDays(t, -1)) return 'أمس';
  return fmtDate(ds);
}

export const daysPhrase = (n: number): string => {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومين';
  if (n <= 10) return n + ' أيام';
  return n + ' يوم';
};
