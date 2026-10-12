import React, { useState, useEffect } from 'react';
import { CategoryId, PaymentId } from '../../types.ts';
import { CATS, PAYS } from '../../lib/constants.ts';
import { parseAmount } from '../../lib/money.ts';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { amt: number; cat: CategoryId; pay: PaymentId }) => void;
  onOpenFull: () => void;
}

const PAY_KEY = 'masroofati:quick_pay';

const readPay = (): PaymentId => {
  try {
    const v = localStorage.getItem(PAY_KEY);
    if (v && PAYS.some(p => p.id === v)) return v as PaymentId;
  } catch (_) {}
  return 'cash';
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({ isOpen, onClose, onAdd, onOpenFull }) => {
  const [digits, setDigits] = useState('');
  const [pay, setPay] = useState<PaymentId>('cash');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDigits('');
      setErr(null);
      setPay(readPay());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const press = (k: string) => {
    setErr(null);
    setDigits(cur => {
      if (k === 'del') return cur.slice(0, -1);
      if (k === '.') {
        if (cur.includes('.')) return cur;
        return cur === '' ? '0.' : cur + '.';
      }
      const [w, f] = cur.split('.');
      if (cur.includes('.')) return f.length >= 3 ? cur : cur + k;
      if (w.length >= 7) return cur;
      return cur === '0' ? k : cur + k;
    });
  };

  const choosePay = (p: PaymentId) => {
    setPay(p);
    try {
      localStorage.setItem(PAY_KEY, p);
    } catch (_) {}
  };

  const addTo = (cat: CategoryId) => {
    const amt = parseAmount(digits);
    if (!amt || amt <= 0) {
      setErr('اكتب المبلغ أول، بعدين اضغط على القسم');
      return;
    }
    onAdd({ amt, cat, pay });
    onClose();
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div className="sheet quick" role="dialog" aria-modal="true" aria-label="إضافة مصروف سريع">
        <div className="grab" />
        <div className="sheet-h">
          <h2>إضافة مصروف</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="sheet-b">
          <div className="qamt" aria-live="polite">
            <span className="num">{digits || '0'}</span>
            <span className="cu">د.ك</span>
          </div>

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className="keypad" role="group" aria-label="لوحة الأرقام">
            {KEYS.map(k => (
              <button
                key={k}
                type="button"
                className={`key ${k === 'del' ? 'del' : ''}`}
                onClick={() => press(k)}
                aria-label={k === 'del' ? 'مسح' : k === '.' ? 'فاصلة' : k}
              >
                {k === 'del' ? '⌫' : k}
              </button>
            ))}
          </div>

          <div className="fld">
            <span>اضغط على القسم وينضاف المصروف مباشرة</span>
            <div className="grid4">
              {CATS.map(c => (
                <button key={c.id} type="button" className="catkey" onClick={() => addTo(c.id)}>
                  <em aria-hidden="true">{c.icon}</em>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="qfoot">
            <div className="chips five" role="radiogroup" aria-label="طريقة الدفع">
              {PAYS.map(p => (
                <label key={p.id} className="opt">
                  <input
                    type="radio"
                    name="quick-pay"
                    value={p.id}
                    checked={pay === p.id}
                    onChange={() => choosePay(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <button type="button" className="linkbtn" onClick={onOpenFull}>
              إضافة بتفاصيل أكثر (تاريخ وملاحظة)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
