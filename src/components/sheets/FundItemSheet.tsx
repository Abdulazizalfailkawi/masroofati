import React, { useState, useEffect } from 'react';
import { FundItem } from '../../types.ts';
import { amtField, parseAmount } from '../../lib/money.ts';
import { isDate, todayStr } from '../../lib/dates.ts';

interface FundItemSheetProps {
  item: FundItem | null;
  fundName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; amt: number; date: string }) => void;
  onDelete?: (id: string) => void;
}

export const FundItemSheet: React.FC<FundItemSheetProps> = ({
  item,
  fundName,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(todayStr());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setAmt(amtField(item.amt));
      setDate(item.date);
    } else {
      setName('');
      setAmt('');
      setDate(todayStr());
    }
    setErr(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmount(amt);
    if (!parsed || parsed <= 0) {
      setErr('اكتب مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!isDate(date)) {
      setErr('اختر التاريخ بشكل صحيح');
      return;
    }
    onSave({
      id: item ? item.id : undefined,
      name: name.trim().slice(0, 60),
      amt: parsed,
      date,
    });
    onClose();
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item ? 'تعديل المشترى' : 'إضافة مشترى'}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>{item ? 'تعديل المشترى' : `إضافة مشترى — ${fundName}`}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <form className="sheet-b" onSubmit={handleSubmit} noValidate>
          <label className="fld">
            <span>شنو اشتريت؟</span>
            <input
              type="text"
              maxLength={60}
              placeholder="مثلاً: سنارة أو خيط"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus={!item}
            />
          </label>

          <label className="fld amt">
            <span>المبلغ (د.ك)</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.000"
              value={amt}
              onChange={e => setAmt(e.target.value)}
            />
          </label>

          <label className="fld">
            <span>التاريخ</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className={`actions ${item && onDelete ? 'two' : ''}`}>
            <button className="btn primary block-btn" type="submit">
              حفظ
            </button>
            {item && onDelete && (
              <button type="button" className="btn danger" onClick={() => onDelete(item.id)}>
                حذف
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
