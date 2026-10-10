import React, { useState, useEffect } from 'react';
import { AppState, AuthUser, AdminUserRecord, RouteName } from '../types.ts';
import {
  fetchAdminRecords,
  deleteAdminRecord,
  testSupabaseConnection,
  SUPABASE_SQL_SCRIPT,
  getEffectiveSupabaseConfig,
} from '../lib/supabase.ts';
import { formatMoney } from '../lib/money.ts';
import { fmtDate, curMk } from '../lib/dates.ts';
import { ADMIN_EMAIL } from '../lib/auth.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface AdminViewProps {
  state: AppState;
  currentUser: AuthUser | null;
  onNavigate: (route: RouteName) => void;
  onUpdateState: (newState: AppState) => void;
  onToast: (msg: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  state,
  currentUser,
  onNavigate,
  onUpdateState,
  onToast,
}) => {
  const [records, setRecords] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingConn, setTestingConn] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Supabase config state (admin only)
  const currentConfig = getEffectiveSupabaseConfig(state);
  const [supaUrl, setSupaUrl] = useState(currentConfig.url);
  const [supaKey, setSupaKey] = useState(currentConfig.key);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchAdminRecords();
    setLoading(false);
    if (res.ok) {
      setRecords(res.records);
    } else {
      onToast(res.message || 'تعذّر جلب سجلات الإدارة');
    }
  };

  useEffect(() => {
    loadData();
    testSupabaseConnection(state).then(setConnStatus);
  }, []);

  const handleTestConnection = async () => {
    setTestingConn(true);
    const res = await testSupabaseConnection(state);
    setTestingConn(false);
    setConnStatus(res);
    onToast(res.message);
  };

  const handleSaveSupabaseConfig = () => {
    const updated: AppState = {
      ...state,
      settings: {
        ...state.settings,
        supabaseUrl: supaUrl.trim(),
        supabaseAnonKey: supaKey.trim(),
      },
    };
    onUpdateState(updated);
    onToast('تم تحديث إعدادات Supabase من قبل المدير');
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف سجل المستخدم (${id}) من السحابة؟`)) return;
    const res = await deleteAdminRecord(id);
    if (res.ok) {
      onToast('تم حذف السجل');
      setRecords(prev => prev.filter(r => r.id !== id));
    } else {
      onToast(res.message);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT).then(() => {
      setCopiedSql(true);
      onToast('تم نسخ كود SQL');
      setTimeout(() => setCopiedSql(false), 2000);
    });
  };

  const totalUsers = records.length;
  const totalOperations = records.reduce((acc, r) => acc + r.expenses_count + r.incomes_count + r.obligations_count, 0);
  const totalExpensesSum = records.reduce((acc, r) => acc + r.total_expenses_amt, 0);

  return (
    <div>
      <HeaderBand
        title="🛡️ لوحة تحكم المدير"
        back="more"
        onBack={() => onNavigate('more')}
        viewedMk={curMk()}
      />

      <div className="wrap stack" style={{ marginTop: 14 }}>
        {/* Admin Identity Card */}
        <div className="card" style={{ borderInlineStart: '5px solid var(--good-bar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span className="chip good">حساب المدير المعتمد</span>
              <h2 style={{ fontSize: 18, marginTop: 4 }}>{currentUser?.email || ADMIN_EMAIL}</h2>
            </div>
            <button
              type="button"
              className="btn"
              style={{ fontSize: 13, minHeight: 36, padding: '0 12px' }}
              onClick={loadData}
              disabled={loading}
            >
              🔄 {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="minis">
          <div className="mini">
            <span className="k">المستخدمين بالسحابة</span>
            <span className="v">{totalUsers}</span>
            <span className="s">حسابات نشطة</span>
          </div>
          <div className="mini">
            <span className="k">إجمالي العمليات</span>
            <span className="v">{totalOperations}</span>
            <span className="s">مصروفات والتزامات</span>
          </div>
          <div className="mini">
            <span className="k">إجمالي المصروفات</span>
            <span className="v">
              <span className="num">{formatMoney(totalExpensesSum)}</span>
            </span>
            <span className="s">دينار كويتي</span>
          </div>
        </div>

        {/* Database Connection Status */}
        <div className="group">
          <div className="block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3>⚡ حالة اتصال Supabase السحابي</h3>
              <span className={`chip ${connStatus?.ok ? 'good' : 'bad'}`}>
                {connStatus?.ok ? 'متصل وشغال ✓' : 'غير متصل ⚠️'}
              </span>
            </div>
            <p>{connStatus?.message || 'جاري الفحص...'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleTestConnection}
                disabled={testingConn}
              >
                {testingConn ? 'جاري الفحص...' : 'فحص الاتصال'}
              </button>
            </div>
          </div>
        </div>

        {/* Cloud Records Table */}
        <div className="group">
          <div className="block">
            <h3>👥 مستخدمو التطبيق والسجلات السحابية</h3>
            <p>جميع الحسابات التي قامت بالمزامنة مع قاعدة بيانات Supabase الخاصة بك:</p>

            {loading ? (
              <p className="muted" style={{ textAlign: 'center', padding: 20 }}>
                جاري تحميل السجلات من السحابة...
              </p>
            ) : records.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="e1">📂</div>
                <b>لا توجد سجلات بعد</b>
                <span>ستظهر هنا تلقائياً عند قيام أي مستخدم بالمزامنة.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                {records.map(rec => (
                  <div
                    key={rec.id}
                    style={{
                      background: 'var(--inset)',
                      borderRadius: 14,
                      padding: 12,
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <b style={{ fontSize: 15 }}>{rec.user_email}</b>
                      <button
                        type="button"
                        className="linkbtn"
                        style={{ color: 'var(--bad)', fontSize: 13, padding: 0 }}
                        onClick={() => handleDeleteRecord(rec.id)}
                      >
                        حذف السجل
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                      <span>🧾 المصروفات: <b>{rec.expenses_count}</b></span>
                      <span>💼 الدخل: <b>{rec.incomes_count}</b></span>
                      <span>📅 الالتزامات: <b>{rec.obligations_count}</b></span>
                      <span>💰 المجموع: <b>{formatMoney(rec.total_expenses_amt)} د.ك</b></span>
                    </div>

                    <small className="muted">
                      آخر مزامنة: {new Date(rec.updated_at).toLocaleString('ar')}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exclusive Cloud & Supabase Settings for Admin */}
        <div className="group">
          <div className="block">
            <h3>⚙️ إعدادات وتكوين Supabase (خاص بالمدير)</h3>
            <p>هذه الإعدادات محجوبة تماماً عن المستخدمين العاديين ومتاحة هنا فقط:</p>

            <label className="fld">
              <span>رابط المشروع (Project URL)</span>
              <input
                type="text"
                value={supaUrl}
                onChange={e => setSupaUrl(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
            </label>

            <label className="fld">
              <span>المفتاح العام (Publishable / Anon Key)</span>
              <input
                type="password"
                value={supaKey}
                onChange={e => setSupaKey(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleSaveSupabaseConfig}
              >
                حفظ الإعدادات
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowSql(!showSql)}
              >
                {showSql ? 'إخفاء كود SQL' : 'عرض كود SQL'}
              </button>
            </div>

            {showSql && (
              <div style={{ marginTop: 10 }}>
                <pre
                  dir="ltr"
                  style={{
                    background: 'var(--inset)',
                    padding: 12,
                    borderRadius: 12,
                    fontSize: 12,
                    overflowX: 'auto',
                    border: '1px solid var(--line)',
                  }}
                >
                  {SUPABASE_SQL_SCRIPT}
                </pre>
                <button
                  type="button"
                  className="btn block-btn"
                  style={{ marginTop: 8 }}
                  onClick={handleCopySql}
                >
                  {copiedSql ? '✓ تم النسخ!' : '📋 نسخ كود SQL'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back to App */}
        <div className="actions">
          <button
            type="button"
            className="btn block-btn"
            onClick={() => onNavigate('home')}
          >
            الرجوع إلى التطبيق
          </button>
        </div>
      </div>
    </div>
  );
};
