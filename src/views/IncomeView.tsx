import React from 'react';
import { AppState, Income, RouteName } from '../types.ts';
import { SOURCES } from '../lib/constants.ts';
import { formatMoney } from '../lib/money.ts';
import { fmtDate } from '../lib/dates.ts';
import { incomeItems, fundSummaries } from '../lib/analytics.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface IncomeViewProps {
  state: AppState;
  viewedMk: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurMonth: () => void;
  onNavigate: (route: RouteName) => void;
  onEditIncome: (income: Income) => void;
  onAddObligation: () => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  state,
  viewedMk,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  onNavigate,
  onEditIncome,
  onAddObligation,
}) => {
  const funds = fundSummaries(state);
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

        <h3 style={{ margin: '22px 4px 8px' }}>دخل إضافي (خارج الميزانية)</h3>
        {funds.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ fontSize: 14 }}>
              جاك مبلغ لغرض معين (مثلاً حق السيارة)؟ اضغط + وفعّل «دخل إضافي خارج الميزانية» وما بيتحسب بدخلك الشهري.
            </p>
          </div>
        ) : (
          <div className="list">
            {funds.map(f => (
              <div key={f.income.id} className="card" style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  className="row"
                  onClick={() => onEditIncome(f.income)}
                >
                  <span className="ico" aria-hidden="true">{f.income.icon || '⭐'}</span>
                  <span className="rmain">
                    <b>{f.income.name || 'دخل إضافي'}</b>
                    <span className="tags">
                      <span className="tag">{fmtDate(f.income.date)}</span>
                    </span>
                  </span>
                  <span className="ramt">
                    <b>
                      <span className="num">{formatMoney(f.balance)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                    <small>المتبقي من {formatMoney(f.income.amt)}</small>
                  </span>
                </button>
                {f.obligations.length > 0 && (
                  <p className="muted" style={{ fontSize: 13, margin: '6px 4px 0' }}>
                    {f.obligations.map(o => `${o.icon} ${o.name}`).join(' · ')}
                    {f.plannedLeft > 0 && ` — باقي عليها ${formatMoney(f.plannedLeft)} د.ك`}
                    {f.plannedLeft > f.balance && ' ⚠️ أكثر من المتوفر'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn block-btn" style={{ marginTop: 6 }} onClick={onAddObligation}>
          + أضف التزام (تقدر تربطه بدخل إضافي)
        </button>
      </div>
    </div>
  );
};
