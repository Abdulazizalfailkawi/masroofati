import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AppState, AuthUser, AdminUserRecord } from '../types.ts';
import { normalizeState } from './storage.ts';

let clientInstance: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const DEFAULT_SUPABASE_URL = 'https://yzarewzaawgigkmsmojr.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_MKOVmHnEkPwj-7EN1RZBmw_bUOywDgT';

export function getEffectiveSupabaseConfig(state?: AppState): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const stateUrl = state?.settings?.supabaseUrl || '';
  const stateKey = state?.settings?.supabaseAnonKey || '';

  const url = (stateUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  const key = (stateKey || envKey || DEFAULT_SUPABASE_KEY).trim();

  return { url, key };
}

export function getSupabaseClient(state?: AppState): SupabaseClient | null {
  const { url, key } = getEffectiveSupabaseConfig(state);

  if (!url || !key) {
    clientInstance = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }

  if (clientInstance && cachedUrl === url && cachedKey === key) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return clientInstance;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    clientInstance = null;
    return null;
  }
}

export const SUPABASE_SQL_SCRIPT = `-- ==========================================
-- كود إنشاء جدول المزامنة لتطبيق مصروفاتي (آمن: كل مستخدم يرى بياناته فقط)
-- افتح Supabase -> SQL Editor والصق هذا الكود ثم اضغط Run
-- ==========================================

create table if not exists public.masroofati_sync (
  id text primary key,
  user_email text,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.masroofati_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.masroofati_admins enable row level security;

create or replace function public.is_masroofati_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.masroofati_admins a where a.user_id = auth.uid()); $$;
revoke all on function public.is_masroofati_admin() from public, anon;
grant execute on function public.is_masroofati_admin() to authenticated;

alter table public.masroofati_sync enable row level security;
drop policy if exists "Allow public access" on public.masroofati_sync;

create policy "own_or_admin_select" on public.masroofati_sync for select to authenticated
  using (id = (select auth.uid())::text or (select public.is_masroofati_admin()));
create policy "own_insert" on public.masroofati_sync for insert to authenticated
  with check (id = (select auth.uid())::text);
create policy "own_update" on public.masroofati_sync for update to authenticated
  using (id = (select auth.uid())::text) with check (id = (select auth.uid())::text);
create policy "own_or_admin_delete" on public.masroofati_sync for delete to authenticated
  using (id = (select auth.uid())::text or (select public.is_masroofati_admin()));

-- لتعيين المدير: أنشئ حسابك من التطبيق ثم شغّل:
-- insert into public.masroofati_admins (user_id) select id from auth.users where email = 'بريدك';
`;

export async function testSupabaseConnection(state?: AppState): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient(state);
  if (!client) {
    return { ok: false, message: 'بيانات الاتصال (URL والمفتاح) غير مكتملة.' };
  }

  try {
    const { data, error } = await client
      .from('masroofati_sync')
      .select('id, updated_at')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          ok: false,
          message: 'تم الاتصال بـ Supabase بنجاح، لكن جدول "masroofati_sync" غير موجود. يرجى تشغيل كود SQL من لوحة الإدارة.',
        };
      }
      return { ok: false, message: `خطأ من Supabase: ${error.message}` };
    }

    return { ok: true, message: 'تم الاتصال بنجاح بقاعدة بيانات Supabase وجدول المزامنة جاهز!' };
  } catch (err: any) {
    return { ok: false, message: `تعذّر الاتصال: ${err?.message || 'تحقق من الرابط والمفتاح'}` };
  }
}

// User-specific sync logic. Cloud sync requires a logged-in Supabase user;
// the row id is the auth user id, which is what the RLS policies check.
export async function pushStateToSupabase(
  state: AppState,
  user?: AuthUser | null
): Promise<{ ok: boolean; message: string }> {
  if (!user) {
    return { ok: false, message: 'البيانات محفوظة على جهازك. سجّل الدخول للمزامنة السحابية.' };
  }

  const client = getSupabaseClient(state);
  if (!client) {
    return { ok: false, message: 'Supabase غير مُهيأ' };
  }

  try {
    const targetId = user.id;
    const userEmail = user.email;

    const payload = {
      id: targetId,
      user_email: userEmail,
      data: {
        ...state,
        _syncMeta: {
          userEmail,
          updatedAt: new Date().toISOString(),
        },
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('masroofati_sync')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, message: 'تم رفع ومزامنة البيانات مع السحابة بنجاح' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'خطأ أثناء الرفع' };
  }
}

export async function pullStateFromSupabase(
  state?: AppState,
  user?: AuthUser | null
): Promise<{ ok: boolean; data?: AppState; message: string }> {
  if (!user) {
    return { ok: false, message: 'سجّل الدخول لجلب بياناتك السحابية' };
  }

  const client = getSupabaseClient(state);
  if (!client) {
    return { ok: false, message: 'Supabase غير مُهيأ' };
  }

  try {
    const targetId = user.id;

    const { data, error } = await client
      .from('masroofati_sync')
      .select('data, updated_at')
      .eq('id', targetId)
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }

    if (!data || !data.data) {
      return { ok: false, message: 'لا توجد بيانات سحابية محفوظة بعد لهذا الحساب.' };
    }

    const normalized = normalizeState(data.data);
    normalized.settings.lastSyncedAt = data.updated_at || new Date().toISOString();
    return { ok: true, data: normalized, message: 'تم استرجاع البيانات من السحابة بنجاح' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'خطأ أثناء الجلب' };
  }
}

// Authentication Helpers

// Admin status is decided by the database (masroofati_admins table), never by the client.
async function toAuthUser(client: SupabaseClient, user: User): Promise<AuthUser> {
  let isAdmin = false;
  try {
    const { data } = await client.rpc('is_masroofati_admin');
    isAdmin = data === true;
  } catch (_) {}
  return { id: user.id, email: user.email || '', isAdmin };
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (m.includes('email not confirmed')) return 'لم يتم تأكيد البريد بعد. افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.';
  if (m.includes('already registered')) return 'هذا البريد مسجّل مسبقاً. استخدم تسجيل الدخول.';
  if (m.includes('password')) return 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.';
  if (m.includes('rate limit')) return 'محاولات كثيرة، حاول بعد قليل.';
  return message;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    return user ? await toAuthUser(client, user) : null;
  } catch (_) {
    return null;
  }
}

export async function supabaseAuthSignUp(
  email: string,
  pass: string
): Promise<{ ok: boolean; user?: AuthUser; needsConfirmation?: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Supabase غير متصل' };

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) return { ok: false, message: translateAuthError(error.message) };
    if (!data.user) return { ok: false, message: 'فشل إنشاء الحساب' };

    // Email confirmation is enabled: no session until the user clicks the link
    if (!data.session) {
      return {
        ok: true,
        needsConfirmation: true,
        message: 'تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد، ثم سجّل الدخول.',
      };
    }

    return { ok: true, user: await toAuthUser(client, data.user), message: 'تم إنشاء الحساب بنجاح' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'خطأ في التسجيل' };
  }
}

export async function supabaseAuthSignIn(email: string, pass: string): Promise<{ ok: boolean; user?: AuthUser; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Supabase غير متصل' };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) return { ok: false, message: translateAuthError(error.message) };
    if (!data.user) return { ok: false, message: 'بيانات الدخول غير صحيحة' };

    return { ok: true, user: await toAuthUser(client, data.user), message: 'تم تسجيل الدخول بنجاح' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'خطأ أثناء تسجيل الدخول' };
  }
}

export async function supabaseAuthSignOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (_) {}
  }
}

// Admin Dashboard Queries
export async function fetchAdminRecords(): Promise<{ ok: boolean; records: AdminUserRecord[]; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, records: [], message: 'Supabase غير متصل' };

  try {
    const { data, error } = await client
      .from('masroofati_sync')
      .select('id, user_email, updated_at, data')
      .order('updated_at', { ascending: false });

    if (error) return { ok: false, records: [], message: error.message };

    const mapped: AdminUserRecord[] = (data || []).map((row: any) => {
      const stateData = row.data || {};
      const exps = Array.isArray(stateData.expenses) ? stateData.expenses : [];
      const incs = Array.isArray(stateData.incomes) ? stateData.incomes : [];
      const obs = Array.isArray(stateData.obligations) ? stateData.obligations : [];
      const totalExp = exps.reduce((acc: number, item: any) => acc + (Number(item.amt) || 0), 0);
      const email = row.user_email || stateData._syncMeta?.userEmail || (row.id === 'default_user' ? 'مستخدم عام (Guest)' : row.id);

      return {
        id: row.id,
        user_email: email,
        updated_at: row.updated_at,
        expenses_count: exps.length,
        incomes_count: incs.length,
        obligations_count: obs.length,
        total_expenses_amt: totalExp,
      };
    });

    return { ok: true, records: mapped };
  } catch (err: any) {
    return { ok: false, records: [], message: err.message || 'خطأ في جلب بيانات الإدارة' };
  }
}

export async function deleteAdminRecord(recordId: string): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Supabase غير متصل' };

  try {
    const { error } = await client
      .from('masroofati_sync')
      .delete()
      .eq('id', recordId);

    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'تم حذف السجل بنجاح' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'خطأ في الحذف' };
  }
}
