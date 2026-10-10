import React, { useState, useEffect } from 'react';
import { Category, CategoryId } from '../../types.ts';
import { amtField, parseAmount } from '../../lib/money.ts';

interface BudgetSheetProps {
  cats: Category[];
  categoryId: CategoryId | null;
  currentBudget: number | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (catId: CategoryId, amount: number | null) => void;
}

export const BudgetSheet: React.FC<BudgetSheetProps> = ({
  cats,
  categoryId,
  currentBudget,
  isOpen,
  onClose,
  onSave,
}) => {
  const [amt, setAmt] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const category = cats.find(c => c.id === categoryId);

  useEffect(() => {
    if (currentBudget) {
      setAmt(amtField(currentBudget));
    } else {
      setAmt('');
    }
    setErr(null);
  }, [currentBudget, isOpen, categoryId]);

  if (!isOpen || !categoryId || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = amt.trim();
    if (!raw) {
      onSave(categoryId, null);
      onClose();
      return;
    }

    const parsedAmt = parseAmount(raw);
    if (parsedAmt === null) {
      setErr('اكتب مبلغ صحيح');
      return;
    }

    onSave(categoryId, parsedAmt === 0 ? null : parsedAmt);
    onClose();
  };

  return (
    <div className="sheet-wrap">
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`ميزانية ${category.name}`}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>
            ميزانية {category.icon} {category.name}
          </h2>
          <button type="button" className="x" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <form className="sheet-b" onSubmit={handleSubmit} noValidate>
          <label className="fld amt">
            <span>الميزانية الشهرية (د.ك)</span>
            <input
              type="text"
              name="amt"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.000"
              value={amt}
              onChange={e => setAmt(e.target.value)}
              autoFocus
            />
          </label>

          <p className="hint muted" style={{ fontSize: 13 }}>
            تتكرر هذه الميزانية كل شهر. اترك الحقل فارغاً لإلغاء الميزانية لهذا التصنيف.
          </p>

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className="actions">
            <button className="btn primary block-btn" type="submit">
              حفظ الميزانية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
