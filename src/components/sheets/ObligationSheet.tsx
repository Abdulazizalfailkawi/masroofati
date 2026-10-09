import React, { useState, useEffect } from 'react';
import { Obligation } from '../../types.ts';
import { OB_ICONS, OB_GUESS } from '../../lib/constants.ts';
import { amtField, parseAmount, normDigits } from '../../lib/money.ts';
import { isDate, todayStr } from '../../lib/dates.ts';

interface ObligationSheetProps {
  obligation: Obligation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (obData: {
    id?: string;
    name: string;
    amt: number;
    date: string;
    rec: boolean;
    count: number | null;
    icon: string;
  }) => void;
  onDelete?: (id: string) => void;
}

export const ObligationSheet: React.FC<ObligationSheetProps> = ({
  obligation,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(todayStr());
  const [rec, setRec] = useState(true);
  const [count, setCount] = useState('');
  const [icon, setIcon] = useState('📌');
  const [err, setErr] = useState<string | null>(null);
  const [iconTouched, setIconTouched] = useState(false);

  useEffect(() => {
    if (obligation) {
      setName(obligation.name);
      setAmt(amtField(obligation.amt));
      setDate(obligation.date);
      setRec(obligation.rec);
      setCount(obligation.count ? String(obligation.count) : '');
      setIcon(obligation.icon);
      setIconTouched(true);
    } else {
      setName('');
      setAmt('');
      setDate(todayStr());
      setRec(true);
      setCount('');
      setIcon('📌');
      setIconTouched(false);
    }
    setErr(null);
  }, [obligation, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!iconTouched) {
      const match = OB_GUESS.find(([re]) => re.test(val));
      if (match) {
        setIcon(match[1]);
      }
    }
  };

  const handleIconChange = (ic: string) => {
    setIcon(ic);
    setIconTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) {
      setErr('اكتب اسم الالتزام');
      return;
    }
    const parsedAmt = parseAmount(amt);
    if (!parsedAmt || parsedAmt <= 0) {
      setErr('اكتب مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!isDate(date)) {
      setErr('اختر تاريخ الاستحقاق');
      return;
    }

    let parsedCount: number | null = null;
    const rawCount = normDigits(count).trim();
    if (rec && rawCount) {
      parsedCount = parseInt(rawCount, 10);
      if (!/^\d+$/.test(rawCount) || parsedCount < 1 || parsedCount > 600) {
        setErr('عدد الأقساط لازم يكون رقم من 1 إلى 600');
        return;
      }
    }

    onSave({
      id: obligation ? obligation.id : undefined,
      name: cleanName,
      amt: parsedAmt,
      date,
      rec,
      count: parsedCount,
      icon,
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
        aria-label={obligation ? 'تعديل الالتزام' : 'إضافة التزام'}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>{obligation ? 'تعديل الالتزام' : 'إضافة التزام'}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <form className="sheet-b" onSubmit={handleSubmit} noValidate>
          <label className="fld">
            <span>اسم الالتزام</span>
            <input
              type="text"
              name="name"
              maxLength={40}
              placeholder="مثلاً: الإيجار أو قسط السيارة"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              autoFocus={!obligation}
            />
          </label>

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
            />
          </label>

          <label className="fld">
            <span>تاريخ الاستحقاق</span>
            <input
              type="date"
              name="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <span className="hint">إذا شهري، يتكرر نفس اليوم كل شهر</span>
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

          {rec && (
            <label className="fld">
              <span>عدد الأقساط (اختياري)</span>
              <input
                type="text"
                inputMode="numeric"
                value={count}
                placeholder="مثلاً 12 — اتركه فاضي إذا مستمر"
                onChange={e => setCount(e.target.value)}
              />
            </label>
          )}

          <div className="fld">
            <span>الأيقونة</span>
            <div className="chips">
              {OB_ICONS.map(ic => (
                <label key={ic} className="opt">
                  <input
                    type="radio"
                    name="icon"
                    value={ic}
                    checked={icon === ic}
                    onChange={() => handleIconChange(ic)}
                  />
                  <span>
                    <em aria-hidden="true">{ic}</em>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className={`actions ${obligation && onDelete ? 'two' : ''}`}>
            <button className="btn primary block-btn" type="submit">
              حفظ
            </button>
            {obligation && onDelete && (
              <button
                type="button"
                className="btn danger"
                onClick={() => onDelete(obligation.id)}
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
