import React from 'react';

interface InstallGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideSheet: React.FC<InstallGuideSheetProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="تثبيت التطبيق على الشاشة الرئيسية"
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>📲 تثبيت التطبيق على هاتفك</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="sheet-b">
          <p className="muted" style={{ fontSize: 14 }}>
            يمكنك تثبيت «مصروفاتي» ليظهر كأيقونة تطبيق كامل على شاشة هاتفك الرئيسية، ويعمل بملء الشاشة بدون شريط المتصفح وبشكل سريع!
          </p>

          {/* iOS Instructions */}
          <div
            style={{
              background: 'var(--inset)',
              borderRadius: 18,
              padding: 16,
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>🍏</span>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>لمستخدمي آيفون (Safari):</h3>
            </div>

            <div className="steps" style={{ marginTop: 6 }}>
              <div className="step">
                <div>
                  <b>1. اضغط على زر المشاركة المربع بالأسفل</b>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    ستجد في شريط Safari بالأسفل زراً مربعاً يخرج منه سهم للأعلى ( <span style={{ fontSize: 16, fontWeight: 800 }}>⎋</span> أو <span style={{ fontSize: 16 }}>📤</span> ).
                  </p>
                </div>
              </div>

              <div className="step">
                <div>
                  <b>2. انزل قليلاً في القائمة</b>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    مرر القائمة لأسفل حتى تجد خيار:
                    <br />
                    <b style={{ color: 'var(--pri)' }}>«إضافة إلى الصفحة الرئيسية»</b>
                    <br />
                    <span style={{ fontSize: 12 }}>(Add to Home Screen ⊞)</span>
                  </p>
                </div>
              </div>

              <div className="step">
                <div>
                  <b>3. اضغط «إضافة» (Add)</b>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    اضغط زر «إضافة» في الزاوية العلوية وسيظهر التطبيق فوراً في شاشتك الرئيسية كأي تطبيق رسمي!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Android Instructions */}
          <div
            style={{
              background: 'var(--inset)',
              borderRadius: 18,
              padding: 16,
              border: '1px solid var(--line)',
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>لمستخدمي أندرويد (Chrome):</h3>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              اضغط على زر الخيارات (الثلاث نقاط <b>⋮</b>) في أعلى المتصفح، ثم اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.
            </p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn primary block-btn"
              onClick={onClose}
            >
              فهمت ذلك، تم!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
