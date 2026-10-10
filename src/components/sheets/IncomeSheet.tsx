import React, { useState, useEffect } from 'react';
import { Income, IncomeSourceId } from '../../types.ts';
import { SOURCES, CAT_EMOJIS } from '../../lib/constants.ts';
import { amtField, parseAmount } from '../../lib/money.ts';
import { isDate, todayStr } from '../../lib/dates.ts';

interface IncomeSheetProps {
  income: Income | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: {
    id?: string;
    amt: number;
    src: IncomeSourceId;
    date: string;
    rec: boolean;
    ext?: boolean;
    name?: string;
    icon?: string;
  }) => void;
  onDelete?: (id: string) => void;
}

export const IncomeSheet: React.FC<IncomeSheetProps> = ({
  income,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [amt, setAmt] = useState('');
  const [src, setSrc] = useState<IncomeSourceId>('salary');
  const [date, setDate] = useState(todayStr());
  const [rec, setRec] = useState(true);
  const [ext, setExt] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (income) {
      setAmt(amtField(income.amt));
      setSrc(income.src);
      setDate(income.date);
      setRec(income.rec);
      setExt(!!income.ext);
      setName(income.name || '');
      setIcon(income.icon || '⭐');
    } else {
      setAmt('');
      setSrc('salary');
      setDate(todayStr());
      setRec(true);
      setExt(false);
      setName('');
      setIcon('⭐');
    }
    setErr(null);
  }, [income, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseAmount(amt);
    if (!parsedAmt || parsedAmt <= 0) {
      setErr('اكتب مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!isDate(date)) {
      setErr('اختر التاريخ');
      return;
    }

    const cleanName = name.trim().slice(0, 40);
    const cleanIcon = Array.from(icon.trim()).slice(0, 2).join('') || '⭐';
    if (ext && !cleanName) {
      setErr('اكتب اسم الدخل الإضافي (مثلاً: حق السيارة)');
      return;
    }

    onSave({
      id: income ? income.id : undefined,
      amt: parsedAmt,
      src: ext ? 'extra' : src,
      date,
      rec: ext ? false : rec,
      ...(ext ? { ext: true, name: cleanName, icon: cleanIcon } : {}),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={income ? 'تعديل الدخل' : 'إضافة دخل'}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>{income ? 'تعديل الدخل' : 'إضافة دخل'}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <form className="sheet-b" onSubmit={handleSubmit} noValidate>
          <label className="fld amt">
            <span>المبلغ (د.ك)</span>
            <input
              type="text"
              name="amt"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.000"
              value={amt}
              onChange={e => setAmt(e.target.value)}
              autoFocus={!income}
            />
          </label>

          <label className="swrow">
            <span>دخل إضافي خارج الميزانية</span>
            <input
              type="checkbox"
              role="switch"
              checked={ext}
              onChange={e => setExt(e.target.checked)}
              disabled={!!income}
            />
          </label>

          {ext && (
            <>
              <label className="fld">
                <span>اسم الدخل (له شنو؟)</span>
                <input
                  type="text"
                  name="name"
                  maxLength={40}
                  placeholder="مثلاً: حق السيارة"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </label>
              <div className="fld">
                <span>الإيموجي</span>
                <div className="chips">
                  {['🚗', '🏠', '✈️', '🎓', '💍', '⭐', ...CAT_EMOJIS.slice(0, 6)].map(ic => (
                    <label key={ic} className="opt">
                      <input type="radio" name="icon" checked={icon === ic} onChange={() => setIcon(ic)} />
                      <span>
                        <em aria-hidden="true">{ic}</em>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="hint muted" style={{ fontSize: 13 }}>
                هذا المبلغ ما يدخل بدخلك الشهري ولا بالميزانية. اربط فيه التزاماتك من شاشة الالتزامات وبيتخصم منه فقط.
              </p>
            </>
          )}

          {!ext && (
          <div className="fld">
            <span>المصدر</span>
            <div className="chips">
              {SOURCES.map(s => (
                <label key={s.id} className="opt">
                  <input
                    type="radio"
                    name="src"
                    value={s.id}
                    checked={src === s.id}
                    onChange={() => setSrc(s.id)}
                  />
                  <span>
                    {s.icon} {s.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          )}

          <label className="fld">
            <span>التاريخ</span>
            <input
              type="date"
              name="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>

          {!ext && (
            <>
              <label className="swrow">
                <span>يتكرر شهرياً</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={rec}
                  onChange={e => setRec(e.target.checked)}
                />
              </label>

              <p className="hint muted" style={{ fontSize: 13 }}>
                الدخل المتكرر يتحسب كل شهر من هذا التاريخ. إذا تغيّر راتبك، عدّل المبلغ أو أضف دخل جديد.
              </p>
            </>
          )}

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className={`actions ${income && onDelete ? 'two' : ''}`}>
            <button className="btn primary block-btn" type="submit">
              حفظ
            </button>
            {income && onDelete && (
              <button
                type="button"
                className="btn danger"
                onClick={() => onDelete(income.id)}
              >
                حذف
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
