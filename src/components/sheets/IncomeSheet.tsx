import React, { useState, useEffect } from 'react';
import { Income, IncomeSourceId } from '../../types.ts';
import { SOURCES } from '../../lib/constants.ts';
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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (income) {
      setAmt(amtField(income.amt));
      setSrc(income.src);
      setDate(income.date);
      setRec(income.rec);
    } else {
      setAmt('');
      setSrc('salary');
      setDate(todayStr());
      setRec(true);
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

    onSave({
      id: income ? income.id : undefined,
      amt: parsedAmt,
      src,
      date,
      rec,
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

          <label className="fld">
            <span>التاريخ</span>
            <input
              type="date"
              name="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>

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
