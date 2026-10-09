import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstallGuide?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenInstallGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="box"
        role="dialog"
        aria-modal="true"
        aria-label="مرحباً بك في مصروفاتي"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 430,
          padding: '26px 20px 20px',
          textAlign: 'center',
          borderRadius: 26,
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Top Icon Badge */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--pri-soft)',
            color: 'var(--pri)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 32,
            margin: '0 auto 12px',
            boxShadow: '0 8px 20px -6px rgba(30, 79, 216, .35)',
          }}
        >
          ✨
        </div>

        <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)' }}>
          أهلاً بك في مصروفاتي 👋
        </h2>

        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
          مساحتك المالية الخاصة لإدارة دخلك، مصروفاتك، والتزاماتك الشهرية بكل ثقة ودقة بالدينار الكويتي.
        </p>

        {/* Home Screen Installation Instruction Card */}
        <div
          style={{
            background: 'var(--pri-soft)',
            border: '1.5px solid var(--pri)',
            borderRadius: 18,
            padding: '14px',
            margin: '16px 0 12px',
            textAlign: 'start',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>📲</span>
            <b style={{ color: 'var(--pri)', fontSize: 14.5 }}>
              خطوة مهمة: ثبّت التطبيق على شاشة هاتفك
            </b>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>
            لتجربة كاملة كأي تطبيق رسمي، اضغط على <b>الزر المربع أسفل الشاشة</b> (زر المشاركة <span style={{ fontSize: 16 }}>📤</span> أو <span style={{ fontSize: 16 }}>⎋</span>)، ثم انزل قليلاً واضغط على:
          </p>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 10,
              padding: '6px 12px',
              textAlign: 'center',
              fontWeight: 800,
              color: 'var(--pri)',
              fontSize: 13.5,
              border: '1px solid var(--line)',
            }}
          >
            ➕ إضافة إلى الصفحة الرئيسية (Add to Home Screen)
          </div>
          <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>
            وسيظهر التطبيق مباشرة في قائمة تطبيقات هاتفك!
          </small>
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            background: 'var(--inset)',
            borderRadius: 16,
            padding: '12px 14px',
            margin: '10px 0 14px',
            textAlign: 'start',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>
              <b>حِسبة يومية دقيقة:</b> تعرف كم تقدر تصرف باليوم بأمان حتى الراتب.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>
              <b>تتبّع الأقساط والالتزامات:</b> تنبيهات مبكرة بمواعيد الاستحقاق.
            </span>
          </div>
        </div>

        {/* Signature */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 10,
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700 }}>
            تم إنشاء هذا التطبيق بواسطة عبد العزيز الفيلكاوي، تحياتي.
          </p>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>
            مصروفاتي · النسخة التجريبية (Beta)
          </small>
        </div>

        {/* Start Button */}
        <button
          type="button"
          className="btn primary block-btn"
          style={{ minHeight: 48, fontSize: 16, borderRadius: 14 }}
          onClick={onClose}
        >
          ابدأ الآن 🚀
        </button>
      </div>
    </div>
  );
};
