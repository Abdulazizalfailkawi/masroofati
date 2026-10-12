import React from 'react';
import { AppState, Income, RouteName } from '../types.ts';
import { SOURCES } from '../lib/constants.ts';
import { formatMoney } from '../lib/money.ts';
import { fmtDate } from '../lib/dates.ts';
import { incomeItems } from '../lib/analytics.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface IncomeViewProps {
  state: AppState;
  viewedMk: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurMonth: () => void;
  onNavigate: (route: RouteName) => void;
  onEditIncome: (income: Income) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  state,
  viewedMk,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  onNavigate,
  onEditIncome,
}) => {
  const items = incomeItems(viewedMk, state);
  const total = items.reduce((acc, i) => acc + i.amt, 0);

  return (
    <div>
      <HeaderBand
        title="الدخل"
        back="more"
        onBack={() => onNavigate('more')}
        month
        viewedMk={viewedMk}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onCurMonth={onCurMonth}
      />

      <div className="wrap" style={{ marginTop: 14 }}>
        <section className="card sumcard">
          <div className="line">
            <span className="k">إجمالي الدخل</span>
            <span className="v">
              <span className="num">{formatMoney(total)}</span>
              <span className="cu">د.ك</span>
            </span>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="empty">
              <div className="e1" aria-hidden="true">
                💼
              </div>
              <b>ما سجّلت دخل هذا الشهر</b>
              <span>
                أضف الراتب أو أي دخل إضافي. الدخل الشهري المتكرر يتحسب كل شهر تلقائياً.
              </span>
            </div>
          </div>
        ) : (
          <div className="list" style={{ marginTop: 14 }}>
            {items.map(i => {
              const sr = SOURCES.find(s => s.id === i.src) || SOURCES[SOURCES.length - 1];

              return (
                <button
                  key={i.id}
                  type="button"
                  className="row"
                  onClick={() => onEditIncome(i)}
                >
                  <span className="ico" aria-hidden="true">
                    {sr.icon}
                  </span>
                  <span className="rmain">
                    <b>{sr.name}</b>
                    <span className="tags">
                      {i.rec && <span className="tag">شهري</span>}
                      {i.smsId && <span className="tag">📩 من الرسالة</span>}
                      {i.note && <span className="tag">{i.note}</span>}
                    </span>
                  </span>
                  <span className="ramt">
                    <b>
                      <span className="num">{formatMoney(i.amt)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                    <small>{fmtDate(i.shown)}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
