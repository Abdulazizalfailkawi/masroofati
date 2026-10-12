import React from 'react';
import { AppState, CategoryId } from '../types.ts';
import { CATS } from '../lib/constants.ts';
import { formatMoney } from '../lib/money.ts';
import { summary } from '../lib/analytics.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface BudgetViewProps {
  state: AppState;
  viewedMk: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurMonth: () => void;
  onSetBudget: (catId: CategoryId) => void;
  onOpenFunds: () => void;
  onAddFund: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  state,
  viewedMk,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  onSetBudget,
  onOpenFunds,
  onAddFund,
}) => {
  const s = summary(viewedMk, state);
  const funds = state.funds || [];
  const fundsSpent = funds.reduce((a, f) => a + f.items.reduce((x, it) => x + it.amt, 0), 0);
  const fundsTotal = funds.reduce((a, f) => a + f.amt, 0);

  const tb = CATS.reduce((acc, c) => acc + (state.budgets[c.id] || 0), 0);
  const tsp = CATS.filter(c => state.budgets[c.id]).reduce(
    (acc, c) => acc + (s.byCat[c.id] || 0),
    0
  );

  const pTotal = tb > 0 ? Math.min(100, Math.round((tsp / tb) * 100)) : 0;
  const totalCls = tsp > tb ? 'bad' : tsp >= tb * 0.8 ? 'warn' : 'good';

  return (
    <div>
      <HeaderBand
        title="الميزانية"
        month
        viewedMk={viewedMk}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onCurMonth={onCurMonth}
      />

      <div className="wrap" style={{ marginTop: 14 }}>
        <button type="button" className="btn primary block-btn" onClick={onAddFund}>
          ➕ إضافة ميزانية
        </button>

        <button type="button" className="brow" onClick={onOpenFunds} style={{ margin: '14px 0' }}>
          <div className="top">
            <span className="n">
              <span aria-hidden="true">🎯</span>
              ميزانياتي الخاصة
            </span>
            {funds.length > 0 && <span className="linkbtn">فتح</span>}
          </div>
          <div className="vals">
            {funds.length ? (
              <span>
                {funds.length} ميزانية · المصروف{' '}
                <b>
                  <span className="num">{formatMoney(fundsSpent)}</span>
                </b>{' '}
                من{' '}
                <b>
                  <span className="num">{formatMoney(fundsTotal)}</span>
                </b>{' '}
                د.ك
              </span>
            ) : (
              <span>ما عندك ميزانيات. حدد مبلغ لشي معيّن ووزّعه على بنود (أكل، عصير...).</span>
            )}
          </div>
        </button>

        {tb > 0 ? (
          <section className="card sumcard">
            <div className="line">
              <span className="k">إجمالي الميزانيات</span>
              <span className="v">
                <span className="num">{formatMoney(tb)}</span>
                <span className="cu">د.ك</span>
              </span>
            </div>
            <div className={`bar ${totalCls}`}>
              <i style={{ width: `${pTotal}%` }} />
            </div>
            <div className="line">
              <span className="k">
                صرفت{' '}
                <b>
                  <span className="num">{formatMoney(tsp)}</span>
                  <span className="cu">د.ك</span>
                </b>
              </span>
              <span className="k">
                {tsp > tb ? (
                  <>
                    تجاوز{' '}
                    <b className="neg">
                      <span className="num">{formatMoney(tsp - tb)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                  </>
                ) : (
                  <>
                    باقي{' '}
                    <b>
                      <span className="num">{formatMoney(tb - tsp)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                  </>
                )}
              </span>
            </div>
          </section>
        ) : (
          <section className="card">
            <p className="muted" style={{ fontSize: 15 }}>
              حدد مبلغاً شهرياً لكل تصنيف وراقب صرفك بحرص. اضغط على أي تصنيف بالأسفل للبدء.
            </p>
          </section>
        )}

        <div className="list" style={{ marginTop: 14 }}>
          {CATS.map(c => {
            const b = state.budgets[c.id] || 0;
            const sp = s.byCat[c.id] || 0;

            if (!b) {
              return (
                <button
                  key={c.id}
                  type="button"
                  className="brow"
                  onClick={() => onSetBudget(c.id)}
                >
                  <div className="top">
                    <span className="n">
                      <span aria-hidden="true">{c.icon}</span>
                      {c.name}
                    </span>
                    <span className="linkbtn">حدد ميزانية</span>
                  </div>
                  {sp > 0 && (
                    <div className="vals">
                      <span>
                        صرفت{' '}
                        <b>
                          <span className="num">{formatMoney(sp)}</span> د.ك
                        </b>
                      </span>
                    </div>
                  )}
                </button>
              );
            }

            const p = Math.min(100, Math.round((sp / b) * 100));
            const isOver = sp > b;
            const cls = isOver ? 'bad' : sp >= b * 0.8 ? 'warn' : 'good';

            return (
              <button
                key={c.id}
                type="button"
                className="brow"
                onClick={() => onSetBudget(c.id)}
              >
                <div className="top">
                  <span className="n">
                    <span aria-hidden="true">{c.icon}</span>
                    {c.name}
                  </span>
                  <span className="num">{Math.round((sp / b) * 100)}%</span>
                </div>

                <div className={`bar ${cls}`} role="img" aria-label={`${p}%`}>
                  <i style={{ width: `${p}%` }} />
                </div>

                <div className="vals">
                  <span>
                    الميزانية{' '}
                    <b>
                      <span className="num">{formatMoney(b)}</span>
                    </b>
                  </span>
                  <span>
                    المصروف{' '}
                    <b>
                      <span className="num">{formatMoney(sp)}</span>
                    </b>
                  </span>
                  <span>
                    {!isOver && (
                      <>
                        المتبقي{' '}
                        <b>
                          <span className="num">{formatMoney(b - sp)}</span>
                        </b>
                      </>
                    )}
                  </span>
                </div>

                {isOver ? (
                  <div className="warnline bad">
                    ⚠️ تجاوزت الميزانية بـ {formatMoney(sp - b)} د.ك
                  </div>
                ) : sp >= b * 0.8 ? (
                  <div className="warnline warn">قربت تخلص الميزانية</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
