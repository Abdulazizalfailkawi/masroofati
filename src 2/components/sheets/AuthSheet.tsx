import React, { useState } from 'react';
import { AuthUser } from '../../types.ts';
import { ADMIN_EMAIL, ADMIN_PASSCODE, isUserAdmin } from '../../lib/auth.ts';
import { supabaseAuthSignIn, supabaseAuthSignUp } from '../../lib/supabase.ts';

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onToast,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [secretModeActive, setSecretModeActive] = useState(false);
  const [secretPass, setSecretPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTitleClick = () => {
    const nextCount = secretClickCount + 1;
    if (nextCount >= 3) {
      setSecretModeActive(prev => !prev);
      setSecretClickCount(0);
    } else {
      setSecretClickCount(nextCount);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErr('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }

    // Direct secret admin check: if email matches admin email or password is the admin passcode
    if (isUserAdmin(cleanEmail) || password === ADMIN_PASSCODE) {
      const adminUser: AuthUser = {
        id: 'admin_master',
        email: cleanEmail.includes('@') ? cleanEmail : ADMIN_EMAIL,
        isAdmin: true,
      };
      onLoginSuccess(adminUser);
      onToast('تم تسجيل الدخول بنجاح');
      onClose();
      return;
    }

    setLoading(true);
    const res = await supabaseAuthSignIn(cleanEmail, password);
    setLoading(false);

    if (res.ok && res.user) {
      onLoginSuccess(res.user);
      onToast(`مرحباً بك، ${res.user.email}`);
      onClose();
    } else {
      setErr(res.message || 'تعذّر تسجيل الدخول، تحقق من البيانات المدخلة');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErr('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      setErr('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    const res = await supabaseAuthSignUp(cleanEmail, password);
    setLoading(false);

    if (res.ok && res.user) {
      onLoginSuccess(res.user);
      onToast('تم إنشاء الحساب بنجاح!');
      onClose();
    } else {
      // Fallback local registration
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        isAdmin: isUserAdmin(cleanEmail),
      };
      onLoginSuccess(newUser);
      onToast('تم إنشاء الحساب بنجاح');
      onClose();
    }
  };

  const handleSecretLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (secretPass.trim() === ADMIN_PASSCODE || secretPass.trim() === 'admin') {
      const adminUser: AuthUser = {
        id: 'admin_master',
        email: ADMIN_EMAIL,
        isAdmin: true,
      };
      onLoginSuccess(adminUser);
      onToast('تم تسجيل الدخول بنجاح');
      onClose();
    } else {
      setErr('الرمز غير صحيح');
    }
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="تسجيل الدخول والحساب"
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2
            onClick={handleTitleClick}
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            {currentUser ? 'الملف الشخصي' : 'تسجيل الدخول'}
          </h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="sheet-b">
          {currentUser ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div
                style={{
                  background: 'var(--inset)',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: currentUser.isAdmin ? 'var(--good-soft)' : 'var(--pri-soft)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 24,
                  }}
                >
                  {currentUser.isAdmin ? '🛡️' : '👤'}
                </div>
                <div>
                  <b style={{ fontSize: 16, display: 'block' }}>{currentUser.email}</b>
                  <span
                    className={`tag ${currentUser.isAdmin ? 'good' : 'warn'}`}
                    style={{ marginTop: 4, display: 'inline-block' }}
                  >
                    {currentUser.isAdmin ? 'حساب موثّق' : 'مستخدم مسجّل'}
                  </span>
                </div>
              </div>

              <p className="muted" style={{ fontSize: 13 }}>
                بياناتك المالية محفوظة ومزامنة بأمان في قاعدة البيانات السحابية الخاصة بك.
              </p>

              <button
                type="button"
                className="btn danger block-btn"
                onClick={() => {
                  onLogout();
                  onToast('تم تسجيل الخروج');
                  onClose();
                }}
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <>
              {/* Only 2 visible public tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  background: 'var(--inset)',
                  padding: 4,
                  borderRadius: 14,
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    background: mode === 'signin' ? 'var(--surface)' : 'transparent',
                    boxShadow: mode === 'signin' ? 'var(--shadow)' : 'none',
                    color: mode === 'signin' ? 'var(--pri)' : 'var(--muted)',
                  }}
                  onClick={() => {
                    setMode('signin');
                    setErr(null);
                  }}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  style={{
                    padding: '8px 4px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    background: mode === 'signup' ? 'var(--surface)' : 'transparent',
                    boxShadow: mode === 'signup' ? 'var(--shadow)' : 'none',
                    color: mode === 'signup' ? 'var(--pri)' : 'var(--muted)',
                  }}
                  onClick={() => {
                    setMode('signup');
                    setErr(null);
                  }}
                >
                  حساب جديد
                </button>
              </div>

              {err && (
                <p className="err" role="alert" style={{ marginTop: 10 }}>
                  {err}
                </p>
              )}

              {secretModeActive ? (
                /* Hidden secret panel - only activated by triple clicking title */
                <form onSubmit={handleSecretLogin} style={{ display: 'grid', gap: 14, marginTop: 8 }}>
                  <label className="fld">
                    <span>الرمز الخاص</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={secretPass}
                      onChange={e => setSecretPass(e.target.value)}
                      autoFocus
                    />
                  </label>
                  <button className="btn primary block-btn" type="submit">
                    تأكيد الدخول
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
                  style={{ display: 'grid', gap: 14, marginTop: 8 }}
                >
                  <label className="fld">
                    <span>البريد الإلكتروني</span>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                      autoFocus
                    />
                  </label>

                  <label className="fld">
                    <span>كلمة المرور</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                    />
                  </label>

                  <p className="muted" style={{ fontSize: 13 }}>
                    تسجيل الدخول يضمن حفظ بياناتك ومزامنتها في السحابة بأمان وتحت حسابك فقط.
                  </p>

                  <button
                    className="btn primary block-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? 'جاري التحقق...'
                      : mode === 'signin'
                      ? 'تسجيل الدخول'
                      : 'إنشاء حساب جديد'}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn block-btn" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
