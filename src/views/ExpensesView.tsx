import React, { useState } from 'react';
import { AppState, CategoryId, PeriodType, Expense } from '../types.ts';
import { CATS, PAYS, PERIODS } from '../lib/constants.ts';
import { formatMoney, normDigits } from '../lib/money.ts';
import { addDays, curMk, dow, mkOf, relDate, todayStr } from '../lib/dates.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface ExpensesViewProps {
  state: AppState;
  onEditExpense: (expense: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ state, onEditExpense }) => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(100);

  const t = todayStr();

  // calculate date boundaries
  let filterFrom = '';
  let filterTo = '';
  if (period === 'day') {
    filterFrom = filterTo = t;
  } else if (period === 'week') {
    filterFrom = addDays(t, -dow(t));
    filterTo = addDays(filterFrom, 6);
  } else if (period === 'month') {
    filterFrom = mkOf(t) + '-01';
    filterTo = mkOf(t) + '-31';
  } else if (period === 'range') {
    filterFrom = from;
    filterTo = to;
  }

  const query = normDigits(q).trim().toLowerCase();

  const filtered = state.expenses
    .filter(e => {
      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;
      if (cat && e.cat !== cat) return false;
      if (query) {
        const catObj = CATS.find(c => c.id === e.cat);
        const payObj = PAYS.find(p => p.id === e.pay);
        const searchText = `${e.note} ${catObj?.name || ''} ${payObj?.name || ''} ${formatMoney(e.amt)} ${e.amt / 1000}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);

  const total = filtered.reduce((acc, e) => acc + e.amt, 0);
  const shown = filtered.slice(0, limit);

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
    setLimit(100);
    if (p === 'range' && !from) {
      setFrom(curMk() + '-01');
      setTo(todayStr());
    }
  };

  return (
    <div>
      <HeaderBand title="المصروفات" viewedMk={curMk()} />

      <div className="wrap">
        <div className="filters" style={{ marginTop: 14 }}>
          {/* Period pills */}
          <div className="pills" role="group" aria-label="الفترة">
            {PERIODS.map(([k, n]) => (
              <button
                key={k}
                type="button"
                className="pill"
                aria-pressed={period === k}
                onClick={() => handlePeriodChange(k)}
              >
                {n}
              </button>
            ))}
          </div>

          {period === 'range' && (
            <div className="frow">
              <label className="fld">
                <span>من</span>
                <input
                  type="date"
                  value={from}
                  onChange={e => {
                    setFrom(e.target.value);
                    setLimit(100);
                  }}
                />
              </label>
              <label className="fld">
                <span>إلى</span>
                <input
                  type="date"
                  value={to}
                  onChange={e => {
                    setTo(e.target.value);
                    setLimit(100);
                  }}
                />
              </label>
            </div>
          )}

          <div className="frow">
            <input
              className="inp"
              type="search"
              placeholder="ابحث…"
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setLimit(100);
              }}
              aria-label="بحث في المصروفات"
            />
            <select
              className="sel"
              value={cat}
              onChange={e => {
                setCat(e.target.value);
                setLimit(100);
              }}
              aria-label="التصنيف"
            >
              <option value="">كل التصنيفات</option>
              {CATS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty">
                <div className="e1" aria-hidden="true">
                  🧾
                </div>
                <b>
                  {state.expenses.length ? 'ما لقينا نتائج' : 'ما فيه مصروفات بعد'}
                </b>
                <span>
                  {state.expenses.length
                    ? 'غيّر الفترة أو التصنيف أو كلمة البحث.'
                    : 'اضغط «إضافة مصروف» وسجّل أول عملية.'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="totalline">
                <span>{filtered.length} عملية</span>
                <b>
                  <span className="num">{formatMoney(total)}</span>
                  <span className="cu">د.ك</span>
                </b>
              </div>

              <div className="list" style={{ marginTop: 10 }}>
                {shown.map(e => {
                  const c = CATS.find(catItem => catItem.id === e.cat) || CATS[CATS.length - 1];
                  const p = PAYS.find(payItem => payItem.id === e.pay) || PAYS[0];

                  return (
                    <button
                      key={e.id}
                      type="button"
                      className="row"
                      onClick={() => onEditExpense(e)}
                    >
                      <span className="ico" aria-hidden="true">
                        {c.icon}
                      </span>
                      <span className="rmain">
                        <b>{e.note || c.name}</b>
                        <small>
                          {c.name} · {p.name}
                          {e.smsId ? ' · 📩 من الرسالة' : ''}
                        </small>
                      </span>
                      <span className="ramt">
                        <b>
                          <span className="num">{formatMoney(e.amt)}</span>
                          <span className="cu">د.ك</span>
                        </b>
                        <small>{relDate(e.date)}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              {filtered.length > shown.length && (
                <button
                  type="button"
                  className="more-btn"
                  onClick={() => setLimit(l => l + 100)}
                >
                  عرض المزيد ({filtered.length - shown.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
