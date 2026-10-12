import React, { useEffect, useState } from 'react';
import { AppState, AuthUser } from '../../types.ts';
import { createSmsToken, fetchUnparsed, deleteUnparsed, SMS_ENDPOINT } from '../../lib/inbox.ts';

interface SmsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  currentUser: AuthUser | null;
  onToast: (msg: string) => void;
}

const copy = async (text: string, onToast: (m: string) => void, done: string) => {
  try {
    await navigator.clipboard.writeText(text);
    onToast(done);
  } catch (_) {
    onToast('تعذّر النسخ، انسخه يدوياً');
  }
};

export const SmsSheet: React.FC<SmsSheetProps> = ({ isOpen, onClose, state, currentUser, onToast }) => {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [unparsed, setUnparsed] = useState<{ id: string; raw: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setToken(null);
      setErr(null);
      return;
    }
    if (currentUser) fetchUnparsed(state).then(setUnparsed);
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setBusy(true);
    setErr(null);
    const res = await createSmsToken(state);
    setBusy(false);
    if (res.ok && res.token) setToken(res.token);
    else setErr(res.message);
  };

  const handleClearUnparsed = async () => {
    await deleteUnparsed(state);
    setUnparsed([]);
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="الربط مع رسائل البنك">
        <div className="grab" />
        <div className="sheet-h">
          <h2>📩 الربط مع رسائل البنك</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="sheet-b">
          <p className="muted" style={{ fontSize: 14 }}>
            أي رسالة خصم أو إيداع توصلك من البنك تنضاف تلقائياً: الخصم مصروف والإيداع دخل. التطبيق ما يقدر يقرأ
            رسائلك بنفسه، فنسوي اختصار على الآيفون يرسل رسائل البنك لحسابك.
          </p>

          {!currentUser ? (
            <p className="err" role="alert">
              سجّل دخولك أول، لأن الرسائل تنربط بحسابك.
            </p>
          ) : (
            <>
              <div className="block" style={{ padding: 0 }}>
                <h3>١. أنشئ مفتاح الربط</h3>
                <p>
                  {token
                    ? 'انسخ المفتاح الحين. ما يظهر مرة ثانية، وإذا ضاع أنشئ مفتاح جديد.'
                    : 'المفتاح سرّي وخاص فيك، ما تعطيه أحد. إذا أنشأت مفتاح جديد يبطل القديم.'}
                </p>
                {token ? (
                  <>
                    <div
                      dir="ltr"
                      style={{
                        background: 'var(--inset)',
                        border: '1px solid var(--line)',
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        wordBreak: 'break-all',
                        userSelect: 'all',
                      }}
                    >
                      {token}
                    </div>
                    <button
                      type="button"
                      className="btn primary block-btn"
                      onClick={() => copy(token, onToast, 'تم نسخ المفتاح')}
                    >
                      📋 نسخ المفتاح
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn primary block-btn" disabled={busy} onClick={handleCreate}>
                    {busy ? 'جاري الإنشاء…' : '🔑 إنشاء مفتاح الربط'}
                  </button>
                )}
                {err && (
                  <p className="err" role="alert">
                    {err}
                  </p>
                )}
              </div>

              <div className="block" style={{ padding: 0 }}>
                <h3>٢. رابط الإرسال</h3>
                <div
                  dir="ltr"
                  style={{
                    background: 'var(--inset)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 12,
                    wordBreak: 'break-all',
                  }}
                >
                  {SMS_ENDPOINT}
                </div>
                <button type="button" className="btn block-btn" onClick={() => copy(SMS_ENDPOINT, onToast, 'تم نسخ الرابط')}>
                  📋 نسخ الرابط
                </button>
              </div>

              <div className="block" style={{ padding: 0 }}>
                <h3>٣. اختصار الآيفون</h3>
                <ol style={{ margin: 0, paddingInlineStart: 20, display: 'grid', gap: 8, fontSize: 14 }}>
                  <li>افتح تطبيق «الاختصارات» (Shortcuts)، ثم تبويب «الأتمتة» (Automation)، واضغط ➕.</li>
                  <li>
                    اختر «رسالة» (Message). في «الرسالة تحتوي على» اكتب <b>د.ك</b>، واضغط التالي.
                  </li>
                  <li>
                    أضف الإجراء «الحصول على محتويات عنوان URL» (Get Contents of URL). في الرابط الصق رابط الإرسال.
                  </li>
                  <li>
                    اضغط «إظهار المزيد»: الطريقة <b>POST</b>، وجسم الطلب <b>JSON</b>. أضف حقل نص اسمه <b>token</b>{' '}
                    وقيمته المفتاح، وحقل نص ثاني اسمه <b>text</b> وقيمته «إدخال الاختصار» (Shortcut Input).
                  </li>
                  <li>
                    في آخر خطوة اختر «تشغيل فوري» (Run Immediately) وأطفئ «إشعار عند التشغيل».
                  </li>
                </ol>
                <p className="muted" style={{ fontSize: 13 }}>
                  بعدها أي رسالة فيها «د.ك» توصل التطبيق. أول ما تفتحه تلقى العملية مضافة، وعليها علامة 📩.
                </p>
              </div>

              {unparsed.length > 0 && (
                <div className="block" style={{ padding: 0 }}>
                  <h3>رسائل ما قدرنا نفهمها ({unparsed.length})</h3>
                  <p>مثل رموز التحقق والعروض. ما انضاف منها شي. إذا فيها عملية حقيقية ابعثها لي أحسّن القراءة.</p>
                  {unparsed.map(u => (
                    <div
                      key={u.id}
                      style={{ background: 'var(--inset)', borderRadius: 10, padding: 10, fontSize: 12, color: 'var(--muted)' }}
                    >
                      {u.raw.slice(0, 160)}
                    </div>
                  ))}
                  <button type="button" className="btn block-btn" onClick={handleClearUnparsed}>
                    مسح هالقائمة
                  </button>
                </div>
              )}
            </>
          )}

          <div className="actions">
            <button type="button" className="btn block-btn" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
