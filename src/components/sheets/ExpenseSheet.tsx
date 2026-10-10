import React, { useState, useEffect } from 'react';
import { Category, Expense, CategoryId, PaymentId } from '../../types.ts';
import { CAT_EMOJIS, PAYS } from '../../lib/constants.ts';
import { amtField, parseAmount } from '../../lib/money.ts';
import { isDate, todayStr } from '../../lib/dates.ts';

interface ExpenseSheetProps {
  expense: Expense | null;
  cats: Category[];
  onAddCat: (name: string, icon: string) => CategoryId;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: {
    id?: string;
    amt: number;
    cat: CategoryId;
    date: string;
    note: string;
    pay: PaymentId;
  }) => void;
  onDelete?: (id: string) => void;
}

export const ExpenseSheet: React.FC<ExpenseSheetProps> = ({
  expense,
  cats,
  onAddCat,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState<CategoryId>('food');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [pay, setPay] = useState<PaymentId>('cash');
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍕');

  useEffect(() => {
    if (expense) {
      setAmt(amtField(expense.amt));
      setCat(expense.cat);
      setDate(expense.date);
      setNote(expense.note);
      setPay(expense.pay);
    } else {
      setAmt('');
      setCat('food');
      setDate(todayStr());
      setNote('');
      setPay('cash');
    }
    setErr(null);
    setAdding(false);
    setNewName('');
    setNewIcon('🍕');
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleAddCat = () => {
    const n = newName.trim().slice(0, 24);
    const ic = Array.from(newIcon.trim()).slice(0, 2).join('');
    if (!n) {
      setErr('اكتب اسم المصروف');
      return;
    }
    if (!ic) {
      setErr('اختر إيموجي');
      return;
    }
    setCat(onAddCat(n, ic));
    setAdding(false);
    setNewName('');
    setErr(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseAmount(amt);
    if (!parsedAmt || parsedAmt <= 0) {
      setErr('اكتب مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!isDate(date)) {
      setErr('اختر التاريخ بشكل صحيح');
      return;
    }

    onSave({
      id: expense ? expense.id : undefined,
      amt: parsedAmt,
      cat,
      date,
      note: note.trim().slice(0, 80),
      pay,
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
        aria-label={expense ? 'تعديل المصروف' : 'إضافة مصروف'}
      >
        <div className="grab" />
        <div className="sheet-h">
          <h2>{expense ? 'تعديل المصروف' : 'إضافة مصروف'}</h2>
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
              autoFocus={!expense}
            />
          </label>

          <div className="fld">
            <span>التصنيف</span>
            <div className="grid4">
              {cats.map(c => (
                <label key={c.id} className="opt">
                  <input
                    type="radio"
                    name="cat"
                    value={c.id}
                    checked={cat === c.id}
                    onChange={() => setCat(c.id)}
                  />
                  <span>
                    <em aria-hidden="true">{c.icon}</em>
                    {c.name}
                  </span>
                </label>
              ))}
              <button
                type="button"
                className="opt"
                style={{ background: 'none', border: 0, padding: 0 }}
                onClick={() => setAdding(a => !a)}
                aria-expanded={adding}
              >
                <span>
                  <em aria-hidden="true">➕</em>
                  مصروف جديد
                </span>
              </button>
            </div>
          </div>

          {adding && (
            <div className="fld">
              <span>مصروف جديد (إيموجي + اسم)</span>
              <div className="chips">
                {CAT_EMOJIS.map(ic => (
                  <label key={ic} className="opt">
                    <input
                      type="radio"
                      name="newicon"
                      checked={newIcon === ic}
                      onChange={() => setNewIcon(ic)}
                    />
                    <span>
                      <em aria-hidden="true">{ic}</em>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  aria-label="إيموجي"
                  value={newIcon}
                  onChange={e => setNewIcon(e.target.value)}
                  style={{ width: 64, textAlign: 'center', fontSize: 22 }}
                />
                <input
                  type="text"
                  aria-label="اسم المصروف"
                  maxLength={24}
                  placeholder="مثلاً: حلاقة"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn primary" onClick={handleAddCat}>
                  إضافة
                </button>
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

          <label className="fld">
            <span>وصف / ملاحظة (اختياري)</span>
            <input
              type="text"
              name="note"
              maxLength={80}
              placeholder="مثلاً: غداء مع الشباب"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </label>

          <div className="fld">
            <span>طريقة الدفع</span>
            <div className="chips five">
              {PAYS.map(p => (
                <label key={p.id} className="opt">
                  <input
                    type="radio"
                    name="pay"
                    value={p.id}
                    checked={pay === p.id}
                    onChange={() => setPay(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}

          <div className={`actions ${expense && onDelete ? 'two' : ''}`}>
            <button className="btn primary block-btn" type="submit">
              حفظ
            </button>
            {expense && onDelete && (
              <button
                type="button"
                className="btn danger"
                onClick={() => onDelete(expense.id)}
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
