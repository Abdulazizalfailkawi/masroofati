export type CategoryId = 'food' | 'transport' | 'shopping' | 'coffee' | 'fun' | 'bills' | 'subs' | 'other';
export type PaymentId = 'cash' | 'knet' | 'card' | 'transfer' | 'other';
export type IncomeSourceId = 'salary' | 'allowance' | 'extra' | 'other';
export type ThemeMode = 'auto' | 'light' | 'dark';
export type RouteName = 'home' | 'exp' | 'ob' | 'budget' | 'more' | 'income' | 'admin';
export type PeriodType = 'day' | 'week' | 'month' | 'all' | 'range';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface PaymentMethod {
  id: PaymentId;
  name: string;
}

export interface IncomeSource {
  id: IncomeSourceId;
  name: string;
  icon: string;
}

export interface Expense {
  id: string;
  amt: number; // In fils (1 KWD = 1000 fils)
  cat: CategoryId;
  date: string; // YYYY-MM-DD
  note: string;
  pay: PaymentId;
  ts: number;
}

export interface Income {
  id: string;
  amt: number; // In fils
  src: IncomeSourceId;
  date: string; // YYYY-MM-DD
  rec: boolean; // recurring monthly
  ts: number;
}

export interface Obligation {
  id: string;
  name: string;
  amt: number; // In fils
  date: string; // YYYY-MM-DD
  rec: boolean; // recurring monthly
  count: number | null; // number of installments or null if indefinite
  icon: string;
  paid: Record<string, string>; // { "YYYY-MM": "YYYY-MM-DD" }
  ts: number;
}

export interface AppSettings {
  theme: ThemeMode;
  saveTarget: number; // In fils
  lastBackup: string | null;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  lastSyncedAt?: string | null;
}

export interface AppState {
  v: number;
  settings: AppSettings;
  expenses: Expense[];
  incomes: Income[];
  obligations: Obligation[];
  budgets: Partial<Record<CategoryId, number>>;
}

export interface ObligationItem {
  o: Obligation;
  due: string;
  paidOn: string | null;
  idx: number;
}

export interface IncomeItem extends Income {
  shown: string;
}

export interface MonthSummary {
  inc: number;
  exp: number;
  obl: number;
  oblPaid: number;
  rem: number;
  byCat: Partial<Record<CategoryId, number>>;
  incItems: IncomeItem[];
  exps: Expense[];
  obs: ObligationItem[];
}

export interface AlertItem {
  lv: 'bad' | 'warn' | 'info';
  ic: string;
  title: string;
  text: string;
  go?: RouteName;
}

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  name?: string;
}

export interface AdminUserRecord {
  id: string;
  user_email?: string;
  updated_at: string;
  expenses_count: number;
  incomes_count: number;
  obligations_count: number;
  total_expenses_amt: number;
}
