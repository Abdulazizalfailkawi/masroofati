import React, { useState } from 'react';
import { AppState, RouteName, ThemeMode, AuthUser } from '../types.ts';
import { amtField, parseAmount } from '../lib/money.ts';
import { fmtDate, curMk } from '../lib/dates.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface MoreViewProps {
  state: AppState;
  currentUser: AuthUser | null;
  onNavigate: (route: RouteName) => void;
  onUpdateState: (newState: AppState) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onExportCsv: () => void;
  onWipeData: () => void;
  onToast: (msg: string) => void;
  onOpenAuth: () => void;
  onOpenInstallGuide: () => void;
  onOpenWelcome?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  state,
  currentUser,
  onNavigate,
  onUpdateState,
  onExportBackup,
  onImportBackup,
  onExportCsv,
  onWipeData,
  onToast,
  onOpenAuth,
  onOpenInstallGuide,
  onOpenWelcome,
}) => {
  const [targetInput, setTargetInput] = useState(amtField(state.settings.saveTarget));

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmount(targetInput);
    const amount = parsed || 0;
    const updated: AppState = {
      ...state,
      settings: {
        ...state.settings,
        saveTarget: amount,
      },
    };
    onUpdateState(updated);
    onToast(amount > 0 ? 'تم حفظ هدف التوفير' : 'تم إلغاء هدف التوفير');
  };

  const handleThemeChange = (theme: ThemeMode) => {
    const updated: AppState = {
      ...state,
      settings: {
        ...state.settings,
        theme,
      },
    };
    onUpdateState(updated);
  };

  return (
    <div>
      <HeaderBand title="المزيد" viewedMk={curMk()} />

      <div className="wrap stack" style={{ marginTop: 14 }}>
        {/* Income Shortcut */}
        <div className="group">
          <button
            type="button"
            className="item"
            onClick={() => onNavigate('income')}
          >
            <span className="ico" aria-hidden="true">
              💼
            </span>
            <span className="t">
              الدخل
              <small>الراتب، البدلات، والدخل الإضافي</small>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        {/* User Account & Security Card */}
        <div className="group">
          <div className="block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>👤</span>
                <h3 style={{ margin: 0 }}>
                  {currentUser ? 'الحساب والأمان' : 'تسجيل الدخول'}
                </h3>
              </div>
              <span className={`chip ${currentUser ? 'good' : 'warn'}`}>
                {currentUser ? 'حساب نشط' : 'حساب محلي'}
              </span>
            </div>
            <p>
              {currentUser
                ? `مسجّل الدخول كـ: ${currentUser.email}. بياناتك مشفرة ومحفوظة سحابياً بحسابك الخاص.`
                : 'سجّل دخولك لحفظ بياناتك ومصروفاتك في السحابة بأمان وحمايتها من الضياع.'}
            </p>
            <button
              type="button"
              className="btn primary block-btn"
              onClick={onOpenAuth}
            >
              {currentUser ? '⚙️ إدارة الحساب / خروج' : '🔐 تسجيل الدخول أو إنشاء حساب'}
            </button>
          </div>
        </div>

        {/* Admin Dashboard Entry (Exclusive for Admin) */}
        {currentUser?.isAdmin && (
          <div className="group" style={{ border: '2px solid var(--good-bar)' }}>
            <div className="block">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>🛡️</span>
                  <h3 style={{ margin: 0, color: 'var(--good)' }}>لوحة تحكم المدير (Admin Dashboard)</h3>
                </div>
                <span className="chip good">خاص بالمدير</span>
              </div>
              <p>
                تحكم كامل في إعدادات Supabase، ومراقبة جميع المستخدمين والسجلات السحابية وصيانة النظام.
              </p>
              <button
                type="button"
                className="btn primary block-btn"
                style={{ background: 'var(--good)', color: '#fff' }}
                onClick={() => onNavigate('admin')}
              >
                🛡️ فتح لوحة تحكم المدير
              </button>
            </div>
          </div>
        )}

        {/* Install on Home Screen Card (Replaces Vercel card) */}
        <div className="group">
          <div className="block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📲</span>
              <h3 style={{ margin: 0 }}>تثبيت التطبيق على هاتفك</h3>
            </div>
            <p>
              اجعل «مصروفاتي» يظهر كأيقونة تطبيق كامل على شاشة هاتفك مع باقي تطبيقاتك، بدون شريط المتصفح وبسرعة فائقة.
            </p>
            <button
              type="button"
              className="btn primary block-btn"
              onClick={onOpenInstallGuide}
            >
              📲 طريقة الإضافة للشاشة الرئيسية (Add to Home)
            </button>
          </div>
        </div>

        {/* Savings Target */}
        <div className="group">
          <div className="block">
            <h3>هدف التوفير الشهري</h3>
            <p>المبلغ الذي تريد ادخاره شهرياً. يُخصم تلقائياً من حِسبة «تقدر تصرف».</p>
            <form className="inline" onSubmit={handleTargetSubmit}>
              <input
                className="inp"
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                aria-label="هدف التوفير بالدينار"
                autoComplete="off"
              />
              <button className="btn primary" type="submit">
                حفظ
              </button>
            </form>
          </div>
        </div>

        {/* Theme */}
        <div className="group">
          <div className="block">
            <h3>المظهر</h3>
            <div className="seg3 chips" role="radiogroup">
              {[
                ['auto', 'تلقائي'],
                ['light', 'فاتح'],
                ['dark', 'داكن'],
              ].map(([k, n]) => (
                <label key={k} className="opt">
                  <input
                    type="radio"
                    name="theme"
                    value={k}
                    checked={state.settings.theme === k}
                    onChange={() => handleThemeChange(k as ThemeMode)}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Backup and Export */}
        <div className="group">
          <div className="block">
            <h3>النسخ الاحتياطي والتصدير</h3>
            <p>
              {state.settings.lastBackup
                ? `آخر نسخة احتياطية: ${fmtDate(state.settings.lastBackup)}`
                : 'ما أخذت نسخة بعد.'}{' '}
              · لديك {state.expenses.length} مصروف و{state.incomes.length} دخل و
              {state.obligations.length} التزام.
            </p>
            <button
              type="button"
              className="btn primary block-btn"
              onClick={onExportBackup}
            >
              تصدير نسخة احتياطية (JSON)
            </button>
            <button
              type="button"
              className="btn block-btn"
              onClick={onImportBackup}
            >
              استيراد نسخة احتياطية
            </button>
            <button
              type="button"
              className="btn block-btn"
              onClick={onExportCsv}
            >
              تصدير المصروفات كملف Excel / CSV
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="group">
          <button
            type="button"
            className="item danger"
            onClick={onWipeData}
          >
            <span className="ico" aria-hidden="true">
              🗑️
            </span>
            <span className="t">
              مسح كل البيانات
              <small>يحذف جميع المصروفات والتسجيلات من هذا الجهاز</small>
            </span>
          </button>
        </div>

        {/* Author Credit & Welcome Trigger */}
        <div style={{ textAlign: 'center', margin: '12px 0 6px', padding: '14px 16px', background: 'var(--surface)', borderRadius: 16, boxShadow: 'var(--shadow)' }}>
          <p style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
            تم إنشاء هذا التطبيق بواسطة عبد العزيز الفيلكاوي، تحياتي.
          </p>
          <small style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
            مصروفاتي · النسخة التجريبية (Beta)
          </small>
          {onOpenWelcome && (
            <button
              type="button"
              className="linkbtn"
              onClick={onOpenWelcome}
              style={{ fontSize: 13, marginTop: 6 }}
            >
              ✨ عرض رسالة الترحيب
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
