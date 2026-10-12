import { AppState, Expense, Income, Obligation, Fund, FundItem, CategoryId, PaymentId, IncomeSourceId } from '../types.ts';
import { STORAGE_KEY, CATS, PAYS, SOURCES } from './constants.ts';
import { isDate, fmtLocal } from './dates.ts';
import { firstEmoji } from './emoji.ts';

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const defaultState = (): AppState => ({
  v: 1,
  settings: {
    theme: 'auto',
    saveTarget: 0,
    lastBackup: null,
    supabaseUrl: 'https://yzarewzaawgigkmsmojr.supabase.co',
    supabaseAnonKey: 'sb_publishable_MKOVmHnEkPwj-7EN1RZBmw_bUOywDgT',
    lastSyncedAt: null,
  },
  expenses: [],
  incomes: [],
  obligations: [],
  budgets: {},
  funds: [],
});

const cleanAmt = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n <= 999999999999 ? n : 0;
};

const cleanStr = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export function normalizeState(raw: any): AppState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid state data');
  }

  const out = defaultState();
  const seen = new Set<string>();
  const genId = (x: any): string => {
    let i = cleanStr(x && x.id, 40) || uid();
    while (seen.has(i)) i = uid();
    seen.add(i);
    return i;
  };

  const s = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  out.settings.theme = ['auto', 'light', 'dark'].includes(s.theme) ? s.theme : 'auto';
  out.settings.saveTarget = Math.max(0, Math.round(Number(s.saveTarget)) || 0);
  out.settings.lastBackup = isDate(s.lastBackup) ? s.lastBackup : null;
  out.settings.supabaseUrl = typeof s.supabaseUrl === 'string' && s.supabaseUrl ? s.supabaseUrl : 'https://yzarewzaawgigkmsmojr.supabase.co';
  out.settings.supabaseAnonKey = typeof s.supabaseAnonKey === 'string' && s.supabaseAnonKey ? s.supabaseAnonKey : 'sb_publishable_MKOVmHnEkPwj-7EN1RZBmw_bUOywDgT';
  out.settings.lastSyncedAt = typeof s.lastSyncedAt === 'string' ? s.lastSyncedAt : null;

  const catIds = CATS.map(c => c.id);
  const payIds = PAYS.map(p => p.id);
  const srcIds = SOURCES.map(src => src.id);

  const arr = (v: unknown) => (Array.isArray(v) ? v : []);

  out.expenses = arr(raw.expenses)
    .map((x: any): Expense | null => {
      if (!x || !isDate(x.date) || !cleanAmt(x.amt)) return null;
      return {
        id: genId(x),
        amt: cleanAmt(x.amt),
        cat: (catIds.includes(x.cat) ? x.cat : 'other') as CategoryId,
        date: x.date,
        note: cleanStr(x.note, 80),
        pay: (payIds.includes(x.pay) ? x.pay : 'cash') as PaymentId,
        ts: Number(x.ts) || Date.now(),
        ...(cleanStr(x.smsId, 40) ? { smsId: cleanStr(x.smsId, 40) } : {}),
      };
    })
    .filter((e): e is Expense => e !== null);

  out.incomes = arr(raw.incomes)
    .map((x: any): Income | null => {
      if (!x || !isDate(x.date) || !cleanAmt(x.amt)) return null;
      return {
        id: genId(x),
        amt: cleanAmt(x.amt),
        src: (srcIds.includes(x.src) ? x.src : 'other') as IncomeSourceId,
        date: x.date,
        rec: !!x.rec,
        ts: Number(x.ts) || Date.now(),
        ...(cleanStr(x.note, 80) ? { note: cleanStr(x.note, 80) } : {}),
        ...(cleanStr(x.smsId, 40) ? { smsId: cleanStr(x.smsId, 40) } : {}),
      };
    })
    .filter((i): i is Income => i !== null);

  out.obligations = arr(raw.obligations)
    .map((x: any): Obligation | null => {
      if (!x || !isDate(x.date) || !cleanAmt(x.amt) || !cleanStr(x.name, 40)) return null;
      const rec = !!x.rec;
      const c = Number(x.count);
      const paid: Record<string, string> = {};
      if (x.paid && typeof x.paid === 'object') {
        for (const k of Object.keys(x.paid)) {
          if (/^\d{4}-\d{2}$/.test(k) && isDate(x.paid[k])) {
            paid[k] = x.paid[k];
          }
        }
      }
      return {
        id: genId(x),
        name: cleanStr(x.name, 40),
        amt: cleanAmt(x.amt),
        date: x.date,
        rec,
        count: rec && Number.isInteger(c) && c >= 1 && c <= 600 ? c : null,
        icon: firstEmoji(x.icon) || '📌',
        paid,
        ts: Number(x.ts) || Date.now(),
      };
    })
    .filter((o): o is Obligation => o !== null);

  out.funds = arr(raw.funds)
    .map((x: any): Fund | null => {
      const name = cleanStr(x && x.name, 40);
      if (!x || !name || !cleanAmt(x.amt)) return null;
      const items = arr(x.items)
        .map((it: any): FundItem | null => {
          if (!it || !isDate(it.date) || !cleanAmt(it.amt)) return null;
          return {
            id: genId(it),
            name: cleanStr(it.name, 60),
            amt: cleanAmt(it.amt),
            date: it.date,
            ts: Number(it.ts) || Date.now(),
          };
        })
        .filter((i): i is FundItem => i !== null);
      const ts = Number(x.ts) || Date.now();
      return {
        id: genId(x),
        name,
        icon: firstEmoji(x.icon) || '🎯',
        amt: cleanAmt(x.amt),
        date: isDate(x.date) ? x.date : fmtLocal(new Date(ts)),
        items,
        ts,
      };
    })
    .filter((f): f is Fund => f !== null);

  if (raw.budgets && typeof raw.budgets === 'object') {
    for (const c of catIds) {
      const a = cleanAmt(raw.budgets[c]);
      if (a) out.budgets[c as CategoryId] = a;
    }
  }

  return out;
}

export function loadLocalState(): { state: AppState; loadWarning: string | null } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return { state: defaultState(), loadWarning: 'تعذّر الوصول إلى مساحة التخزين على هذا الجهاز.' };
  }

  if (!raw) return { state: defaultState(), loadWarning: null };

  try {
    const parsed = JSON.parse(raw);
    return { state: normalizeState(parsed), loadWarning: null };
  } catch (err) {
    try {
      localStorage.setItem(STORAGE_KEY + ':corrupt', raw);
    } catch (_) {}
    return {
      state: defaultState(),
      loadWarning: 'تعذّر قراءة البيانات السابقة. تم حفظ نسخة احتياطية وبدأنا من جديد.',
    };
  }
}

export function saveLocalState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}
