import React, { useState } from 'react';
import {
  testSupabaseConnection,
  pushStateToSupabase,
  pullStateFromSupabase,
  SUPABASE_SQL_SCRIPT,
  getEffectiveSupabaseConfig,
} from '../../lib/supabase.ts';
import { AppState } from '../../types.ts';

interface SupabaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onToast: (msg: string) => void;
}

export const SupabaseSheet: React.FC<SupabaseSheetProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onToast,
}) => {
  const currentConfig = getEffectiveSupabaseConfig(state);
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'good' | 'bad'>('info');
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    const updated: AppState = {
      ...state,
      settings: {
        ...state.settings,
        supabaseUrl: url.trim(),
        supabaseAnonKey: anonKey.trim(),
      },
    };
    onUpdateState(updated);
    onToast('تم حفظ إعدادات Supabase');
    return updated;
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setStatusMsg('جاري الاتصال والتحقق من Supabase...');
    setStatusType('info');

    const updated = handleSaveConfig();
    const res = await testSupabaseConnection(updated);

    setLoading(false);
    if (res.ok) {
      setStatusType('good');
      setStatusMsg(res.message);
    } else {
      setStatusType('bad');
      setStatusMsg(res.message);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    const updated = handleSaveConfig();
    const res = await pushStateToSupabase(updated);
    setLoading(false);

    if (res.ok) {
      setStatusType('good');
      setStatusMsg(res.message);
      onToast(res.message);
      onUpdateState({
        ...updated,
        settings: {
          ...updated.settings,
          lastSyncedAt: new Date().toISOString(),
        },
      });
    } else {
      setStatusType('bad');
      setStatusMsg(res.message);
      onToast('فشل الرفع للسحابة: ' + res.message);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    const updated = handleSaveConfig();
    const res = await pullStateFromSupabase(updated);
    setLoading(false);

    if (res.ok && res.data) {
      onUpdateState(res.data);
      setStatusType('good');
      setStatusMsg(res.message);
      onToast(res.message);
    } else {
      setStatusType('bad');
      setStatusMsg(res.message);
      onToast('فشل الاستيراد: ' + res.message);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT).then(() => {
      setCopiedSql(true);
      onToast('تم نسخ كود SQL إلى الحافظة');
      setTimeout(() => setCopiedSql(false), 2500);
    });
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="الربط السحابي مع Supabase"
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>⚡ الربط السحابي (Supabase)</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="sheet-b">
          <p className="muted" style={{ fontSize: 14 }}>
            اربط تطبيقك بقاعدة بيانات <b>Supabase PostgreSQL</b> لمزامنة مصروفاتك والتزاماتك تلقائياً عبر جميع أجهزتك بأمان تام.
          </p>

          <label className="fld">
            <span>رابط المشروع (Project URL)</span>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </label>

          <label className="fld">
            <span>مفتاح الوصول العام (Anon Public Key)</span>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </label>

          {statusMsg && (
            <div
              className={`alert ${statusType}`}
              style={{ padding: '10px 12px', fontSize: 14 }}
            >
              <span>{statusMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn primary"
              onClick={handleTestConnection}
              disabled={loading || !url || !anonKey}
            >
              {loading ? 'جاري التحقق...' : 'اختبار الاتصال'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleSaveConfig}
            >
              حفظ الإعدادات
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              المزامنة السحابية:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={handlePush}
                disabled={loading || !url || !anonKey}
              >
                ☁️ رفع البيانات للسحابة
              </button>
              <button
                type="button"
                className="btn"
                onClick={handlePull}
                disabled={loading || !url || !anonKey}
              >
                📥 سحب من السحابة
              </button>
            </div>
            {state.settings.lastSyncedAt && (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                آخر مزامنة ناجحة: {new Date(state.settings.lastSyncedAt).toLocaleString('ar')}
              </p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                كود إنشاء جدول قاعدة البيانات (SQL)
              </h3>
              <button
                type="button"
                className="linkbtn"
                onClick={() => setShowSql(!showSql)}
              >
                {showSql ? 'إخفاء الكود' : 'عرض الكود'}
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              إذا كان هذا أول ربط، افتح <b>SQL Editor</b> في لوحة تحكم Supabase والصق هذا الكود لإنشاء جدول <code>masroofati_sync</code> بضغطة زر.
            </p>

            {showSql && (
              <div style={{ marginTop: 8 }}>
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
                  className="btn primary block-btn"
                  style={{ marginTop: 8 }}
                  onClick={handleCopySql}
                >
                  {copiedSql ? '✓ تم النسخ!' : '📋 نسخ كود SQL'}
                </button>
              </div>
            )}
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn block-btn"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
