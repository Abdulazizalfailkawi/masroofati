import { supabase } from './supabase';

// الحصول على معرف فريد للمستخدم أو الجهاز وتخزينه محلياً
export function getCurrentUserId(): string {
  let userId = localStorage.getItem('masroofati_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('masroofati_user_id', userId);
  }
  return userId;
}

export async function syncToSupabase(data: any) {
  const userId = getCurrentUserId();
  
  const { error } = await supabase
    .from('masroofati_sync')
    .upsert([
      { 
        id: userId, // استخدام معرف فريد لكل مستخدم بدل default_user الثابت
        data: data,
        updated_at: new Date().toISOString()
      }
    ], { onConflict: 'id' });

  if (error) {
    console.error('Error syncing to Supabase:', error);
  }
}

// دالة لجلب بيانات المستخدم الحالي
export async function loadFromSupabase() {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from('masroofati_sync')
    .select('data')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error loading from Supabase:', error);
    return null;
  }

  return data?.data || null;
}