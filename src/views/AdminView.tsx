import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AdminView() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب كافة المستخدمين المسجلين في النظام لعرضهم في لوحة التحكم
  async function fetchAllUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('masroofati_sync')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin data:', error);
    } else {
      setUsersList(data || []);
    }
    setLoading(true); // تم التصحيح لإيقاف التحميل
    setLoading(false);
  }

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">لوحة تحكم المدير</h1>
        <button 
          onClick={fetchAllUsers}
          className="bg-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          تحديث البيانات
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl mb-4">
        <p className="text-sm text-slate-300">إجمالي المستخدمين بالسحابة:</p>
        <p className="text-2xl font-bold mt-1">{usersList.length} حسابات نشطة</p>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">مستخدمو التطبيق والسجلات السحابية</h2>
        {loading ? (
          <p className="text-slate-400 text-center py-6">جاري التحميل...</p>
        ) : usersList.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>لا توجد سجلات بعد</p>
            <p className="text-xs mt-1">ستظهر هنا تلقائياً عند قيام أي مستخدم بالمزامنة.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usersList.map((user) => (
              <div key={user.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="font-mono text-sm text-blue-400">{user.id}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    آخر تحديث: {new Date(user.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                  {Object.keys(user.data || {}).length} حقول بيانات
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}