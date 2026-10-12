import { AppState, Expense, Income, CategoryId, PaymentId, IncomeSourceId } from '../types.ts';
import { CATS, PAYS, SOURCES } from './constants.ts';
import { isDate, todayStr } from './dates.ts';
import { uid } from './storage.ts';
import { getSupabaseClient } from './supabase.ts';

/** A bank SMS already read by the sms-ingest edge function (see supabase/functions). */
export interface InboxRow {
  id: string;
  kind: 'expense' | 'income' | 'unparsed';
  status: 'new' | 'imported' | 'ignored';
  amount: number | null;
  merchant: string;
  pay: string;
  cat: string;
  src: string;
  occurred_on: string;
  raw: string;
  created_at: string;
}

/**
 * Turns new inbox rows into expenses / incomes. Rows already imported (same smsId)
 * are skipped, so a retry after a failed "mark as imported" can never duplicate.
 */
export function applyInbox(state: AppState, rows: InboxRow[]): { state: AppState; added: number } {
  const known = new Set<string>([
    ...state.expenses.map(e => e.smsId || ''),
    ...state.incomes.map(i => i.smsId || ''),
  ]);
  const catIds = CATS.map(c => c.id);
  const payIds = PAYS.map(p => p.id);
  const srcIds = SOURCES.map(s => s.id);

  const expenses: Expense[] = [];
  const incomes: Income[] = [];

  for (const r of rows) {
    if (known.has(r.id) || !r.amount || r.amount <= 0) continue;
    const date = isDate(r.occurred_on) ? r.occurred_on : todayStr();
    const name = (r.merchant || '').trim().slice(0, 80);

    if (r.kind === 'expense') {
      expenses.push({
        id: uid(),
        amt: r.amount,
        cat: (catIds.includes(r.cat as CategoryId) ? r.cat : 'other') as CategoryId,
        date,
        note: name,
        pay: (payIds.includes(r.pay as PaymentId) ? r.pay : 'other') as PaymentId,
        ts: Date.now(),
        smsId: r.id,
      });
    } else if (r.kind === 'income') {
      incomes.push({
        id: uid(),
        amt: r.amount,
        src: (srcIds.includes(r.src as IncomeSourceId) ? r.src : 'other') as IncomeSourceId,
        date,
        rec: false,
        ts: Date.now(),
        ...(name ? { note: name } : {}),
        smsId: r.id,
      });
    }
  }

  const added = expenses.length + incomes.length;
  if (!added) return { state, added: 0 };
  return {
    state: {
      ...state,
      expenses: [...state.expenses, ...expenses],
      incomes: [...state.incomes, ...incomes],
    },
    added,
  };
}

export async function fetchNewInbox(state?: AppState): Promise<InboxRow[]> {
  const client = getSupabaseClient(state);
  if (!client) return [];
  const { data, error } = await client
    .from('masroofati_inbox')
    .select('id, kind, status, amount, merchant, pay, cat, src, occurred_on, raw, created_at')
    .eq('status', 'new')
    .in('kind', ['expense', 'income'])
    .order('created_at', { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data as InboxRow[];
}

export async function markInboxImported(ids: string[], state?: AppState): Promise<void> {
  const client = getSupabaseClient(state);
  if (!client || ids.length === 0) return;
  await client.from('masroofati_inbox').update({ status: 'imported' }).in('id', ids);
}

/** Messages the reader couldn't turn into a transaction (OTP codes, offers, odd formats). */
export async function fetchUnparsed(state?: AppState): Promise<{ id: string; raw: string; created_at: string }[]> {
  const client = getSupabaseClient(state);
  if (!client) return [];
  const { data } = await client
    .from('masroofati_inbox')
    .select('id, raw, created_at')
    .eq('kind', 'unparsed')
    .order('created_at', { ascending: false })
    .limit(8);
  return data || [];
}

export async function deleteUnparsed(state?: AppState): Promise<void> {
  const client = getSupabaseClient(state);
  if (!client) return;
  await client.from('masroofati_inbox').delete().eq('kind', 'unparsed');
}

/** Creates the user's webhook token. It is returned once; a new one replaces the old. */
export async function createSmsToken(state?: AppState): Promise<{ ok: boolean; token?: string; message: string }> {
  const client = getSupabaseClient(state);
  if (!client) return { ok: false, message: 'Supabase غير متصل' };
  const { data, error } = await client.rpc('create_sms_token');
  if (error || typeof data !== 'string') {
    return { ok: false, message: 'تعذّر إنشاء المفتاح. سجّل خروج وادخل من جديد، وحاول مرة ثانية.' };
  }
  return { ok: true, token: data, message: 'تم إنشاء المفتاح' };
}

export const SMS_ENDPOINT = 'https://yzarewzaawgigkmsmojr.supabase.co/functions/v1/sms-ingest';
