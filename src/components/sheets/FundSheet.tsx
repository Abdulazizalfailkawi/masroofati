import React, { useState, useEffect } from 'react';
import { Fund } from '../../types.ts';
import { FUND_ICONS } from '../../lib/constants.ts';
import { amtField, parseAmount } from '../../lib/money.ts';
import { EmojiPicker } from '../EmojiPicker.tsx';

interface FundSheetProps {
  fund: Fund | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; amt: number; icon: string }) => void;
  onDelete?: (id: string) => void;
}

export const FundSheet: React.FC<FundSheetProps> = ({ fund, isOpen, onClose, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (fund) {
      setName(fund.name);
      setAmt(amtField(fund.amt));
      setIcon(fund.icon);
    } else {
      setName('');
      setAmt('');
      setIcon('🎯');
    }
    setErr(null);
  }, [fund, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) {
      setErr('اكتب اسم الميزانية');
      return;
    }
    const parsed = parseAmount(amt);
    if (!parsed || parsed <= 0) {
      setErr('اكتب مبلغ صحيح أكبر من صفر');
      return;
    }
    onSave({ id: fund ? fund.id : undefined, name: cleanName, amt: parsed, icon });
    onClose();
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={fund ? 'تعديل الميزانية' : 'ميزانية جديدة'}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>{fund ? 'تعديل الميزانية' : 'ميزانية جديدة'}</h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <form className="sheet-b" onSubmit={handleSubmit} noValidate>
          <label className="fld">
            <span>اسم الميزانية</span>
            <input
              type="text"
              maxLength={40}
              placeholder="مثلاً: البحر أو رحلة الصيد"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus={!fund}
            />
          </label>

          <label className="fld amt">
            <span>المبلغ المخصص (د.ك)</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.000"
              value={amt}
              onChange={e => setAmt(e.target.value)}
            />
            <span className="hint">هذا المبلغ خارج دخلك الشهري، ولا ينخصم من المتبقي.</span>
          </label>

          <EmojiPicker name="fund-icon" value={icon} presets={FUND_ICONS} onChange={setIcon} />

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className={`actions ${fund && onDelete ? 'two' : ''}`}>
            <button className="btn primary block-btn" type="submit">
              حفظ
            </button>
            {fund && onDelete && (
              <button type="button" className="btn danger" onClick={() => onDelete(fund.id)}>
                حذف
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
