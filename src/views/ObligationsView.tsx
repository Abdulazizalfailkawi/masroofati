import React from 'react';
import { AppState, Obligation } from '../types.ts';
import { curMk, dayDiff, daysPhrase, fmtDate, todayStr } from '../lib/dates.ts';
import { formatMoney } from '../lib/money.ts';
import { obligationItems } from '../lib/analytics.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface ObligationsViewProps {
  state: AppState;
  viewedMk: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurMonth: () => void;
  onEditObligation: (obligation: Obligation) => void;
  onPayObligation: (id: string, mk: string) => void;
  onUnpayObligation: (id: string, mk: string) => void;
}

export const ObligationsView: React.FC<ObligationsViewProps> = ({
  state,
  viewedMk,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  onEditObligation,
  onPayObligation,
  onUnpayObligation,
}) => {
  const currentMonth = curMk();
  const t = todayStr();
  const items = obligationItems(viewedMk, state);

  const budgetItems = items.filter(x => !x.o.fund);
  const total = budgetItems.reduce((acc, x) => acc + x.o.amt, 0);
  const paid = budgetItems.filter(x => x.paidOn).reduce((acc, x) => acc + x.o.amt, 0);
  const left = total - paid;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div>
      <HeaderBand
        title="الالتزامات"
        month
        viewedMk={viewedMk}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onCurMonth={onCurMonth}
      />

      <div className="wrap" style={{ marginTop: 14 }}>
        <section className="card sumcard">
          <div className="line">
            <span className="k">إجمالي الالتزامات</span>
            <span className="v">
              <span className="num">{formatMoney(total)}</span>
              <span className="cu">د.ك</span>
            </span>
          </div>
          <div className="bar good" role="img" aria-label={`مدفوع ${pct}%`}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="line">
            <span className="k">
              مدفوع{' '}
              <b className="pos">
                <span className="num">{formatMoney(paid)}</span>
                <span className="cu">د.ك</span>
              </b>
            </span>
            <span className="k">
              باقي{' '}
              <b>
                <span className="num">{formatMoney(left)}</span>
                <span className="cu">د.ك</span>
              </b>
            </span>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="empty">
              <div className="e1" aria-hidden="true">
                📅
              </div>
              <b>ما فيه التزامات هذا الشهر</b>
              <span>أضف الإيجار أو الأقساط أو الفواتير وحدد يوم الاستحقاق.</span>
            </div>
          </div>
        ) : (
          <div className="list" style={{ marginTop: 14 }}>
            {items.map(it => {
              const o = it.o;
              const d = dayDiff(t, it.due);
              let tagClass = '';
              let tagText = '';

              if (it.paidOn) {
                tagClass = 'good';
                tagText = `مدفوع ✓ ${fmtDate(it.paidOn)}`;
              } else if (viewedMk < currentMonth) {
                tagClass = 'bad';
                tagText = `غير مدفوع · كان ${fmtDate(it.due)}`;
              } else if (d < 0) {
                tagClass = 'bad';
                tagText = `متأخر ${daysPhrase(-d)}`;
              } else if (d === 0) {
                tagClass = 'warn';
                tagText = 'يستحق اليوم';
              } else if (d === 1) {
                tagClass = 'warn';
                tagText = 'يستحق باكر';
              } else if (d <= 3) {
                tagClass = 'warn';
                tagText = `بعد ${daysPhrase(d)}`;
              } else {
                tagClass = '';
                tagText = `يستحق ${fmtDate(it.due)}`;
              }

              return (
                <div
                  key={o.id}
                  className={`obrow ${it.paidOn ? 'paid' : ''}`}
                >
                  <button
                    type="button"
                    className="row"
                    onClick={() => onEditObligation(o)}
                  >
                    <span className="ico" aria-hidden="true">
                      {o.icon}
                    </span>
                    <span className="rmain">
                      <b>{o.name}</b>
                      <span className="tags">
                        <span className={`tag ${tagClass}`}>{tagText}</span>
                        {o.fund && (
                          <span className="tag">
                            {(state.incomes.find(i => i.id === o.fund)?.name) || 'دخل إضافي'} · خارج الميزانية
                          </span>
                        )}
                        {o.rec && <span className="tag">شهري</span>}
                        {o.rec && o.count && (
                          <span className="tag">
                            قسط {it.idx} من {o.count}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="ramt">
                      <b>
                        <span className="num">{formatMoney(o.amt)}</span>
                        <span className="cu">د.ك</span>
                      </b>
                    </span>
                  </button>

                  {it.paidOn ? (
                    <button
                      type="button"
                      className="undo"
                      onClick={() => onUnpayObligation(o.id, viewedMk)}
                    >
                      إلغاء الدفع
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="paybtn"
                      onClick={() => onPayObligation(o.id, viewedMk)}
                    >
                      ✓ تم الدفع
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
