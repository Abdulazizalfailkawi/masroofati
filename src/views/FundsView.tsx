import React from 'react';
import { AppState, Fund, FundItem, RouteName } from '../types.ts';
import { formatMoney } from '../lib/money.ts';
import { curMk, fmtDate } from '../lib/dates.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface FundsViewProps {
  state: AppState;
  selectedFundId: string | null;
  onSelectFund: (id: string | null) => void;
  onNavigate: (route: RouteName) => void;
  onAddFund: () => void;
  onEditFund: (fund: Fund) => void;
  onAddItem: (fundId: string) => void;
  onEditItem: (fundId: string, item: FundItem) => void;
}

const spentOf = (f: Fund): number => f.items.reduce((acc, it) => acc + it.amt, 0);

const barClass = (spent: number, budget: number): 'good' | 'warn' | 'bad' =>
  spent > budget ? 'bad' : spent >= budget * 0.8 ? 'warn' : 'good';

export const FundsView: React.FC<FundsViewProps> = ({
  state,
  selectedFundId,
  onSelectFund,
  onNavigate,
  onAddFund,
  onEditFund,
  onAddItem,
  onEditItem,
}) => {
  const funds = state.funds || [];
  const fund = selectedFundId ? funds.find(f => f.id === selectedFundId) || null : null;

  // ---------- Detail of one budget ----------
  if (fund) {
    const spent = spentOf(fund);
    const left = fund.amt - spent;
    const p = Math.min(100, Math.round((spent / fund.amt) * 100));
    const cls = barClass(spent, fund.amt);
    const items = [...fund.items].sort((a, b) =>
      a.date === b.date ? b.ts - a.ts : a.date < b.date ? 1 : -1
    );

    return (
      <div>
        <HeaderBand
          title={`${fund.icon} ${fund.name}`}
          sub={`بدأت ${fmtDate(fund.date)}`}
          back="funds"
          onBack={() => onSelectFund(null)}
          viewedMk={curMk()}
        />

        <div className="wrap" style={{ marginTop: 14 }}>
          <section className="card sumcard">
            <div className="line">
              <span className="k">المبلغ المخصص</span>
              <span className="v">
                <span className="num">{formatMoney(fund.amt)}</span>
                <span className="cu">د.ك</span>
              </span>
            </div>
            <div className={`bar ${cls}`} role="img" aria-label={`${p}%`}>
              <i style={{ width: `${p}%` }} />
            </div>
            <div className="line">
              <span className="k">
                صرفت{' '}
                <b>
                  <span className="num">{formatMoney(spent)}</span>
                  <span className="cu">د.ك</span>
                </b>
              </span>
              <span className="k">
                {left < 0 ? (
                  <>
                    تجاوز{' '}
                    <b className="neg">
                      <span className="num">{formatMoney(-left)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                  </>
                ) : (
                  <>
                    باقي{' '}
                    <b>
                      <span className="num">{formatMoney(left)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                  </>
                )}
              </span>
            </div>
            {left < 0 ? (
              <div className="warnline bad" style={{ fontWeight: 700, color: 'var(--bad)' }}>
                ⚠️ تجاوزت الميزانية
              </div>
            ) : spent >= fund.amt * 0.8 && spent > 0 ? (
              <div className="warnline warn" style={{ fontWeight: 700, color: 'var(--warn)' }}>
                قربت تخلص الميزانية
              </div>
            ) : null}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn primary" onClick={() => onAddItem(fund.id)}>
              ➕ إضافة بند
            </button>
            <button type="button" className="btn" onClick={() => onEditFund(fund)}>
              ✏️ تعديل
            </button>
          </div>

          {items.length === 0 ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="empty">
                <div className="e1" aria-hidden="true">
                  🧾
                </div>
                <b>ما وزّعت شي للحين</b>
                <span>اضغط «إضافة بند» وخصص جزء من الميزانية، مثلاً 20 للأكل و20 للعصير.</span>
              </div>
            </div>
          ) : (
            <div className="list" style={{ marginTop: 14 }}>
              {items.map(it => (
                <button
                  key={it.id}
                  type="button"
                  className="row"
                  onClick={() => onEditItem(fund.id, it)}
                >
                  <span className="ico" aria-hidden="true">
                    🧾
                  </span>
                  <span className="rmain">
                    <b>{it.name || 'بند'}</b>
                    <small>{fmtDate(it.date)}</small>
                  </span>
                  <span className="ramt">
                    <b>
                      <span className="num">{formatMoney(it.amt)}</span>
                      <span className="cu">د.ك</span>
                    </b>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- List of all budgets ----------
  return (
    <div>
      <HeaderBand
        title="ميزانيات خاصة"
        sub="مبالغ من خارج دخلك الشهري، ما تأثر على المتبقي"
        back="budget"
        onBack={() => onNavigate('budget')}
        viewedMk={curMk()}
      />

      <div className="wrap" style={{ marginTop: 14 }}>
        {funds.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="e1" aria-hidden="true">
                🎣
              </div>
              <b>ما عندك ميزانيات خاصة</b>
              <span>
                مثلاً خصص 100 د.ك لشي معيّن، ووزّعها على بنود: 20 أكل، 20 عصير...، وشوف كم باقي لك.
              </span>
            </div>
          </div>
        ) : (
          <div className="list">
            {funds.map(f => {
              const spent = spentOf(f);
              const p = Math.min(100, Math.round((spent / f.amt) * 100));
              const cls = barClass(spent, f.amt);
              return (
                <button key={f.id} type="button" className="brow" onClick={() => onSelectFund(f.id)}>
                  <div className="top">
                    <span className="n">
                      <span aria-hidden="true">{f.icon}</span>
                      {f.name}
                    </span>
                    <span className="num">{Math.round((spent / f.amt) * 100)}%</span>
                  </div>
                  <div className={`bar ${cls}`} role="img" aria-label={`${p}%`}>
                    <i style={{ width: `${p}%` }} />
                  </div>
                  <div className="vals">
                    <span>
                      المخصص{' '}
                      <b>
                        <span className="num">{formatMoney(f.amt)}</span>
                      </b>
                    </span>
                    <span>
                      المصروف{' '}
                      <b>
                        <span className="num">{formatMoney(spent)}</span>
                      </b>
                    </span>
                    <span>
                      {spent > f.amt ? (
                        <>
                          تجاوز{' '}
                          <b>
                            <span className="num">{formatMoney(spent - f.amt)}</span>
                          </b>
                        </>
                      ) : (
                        <>
                          المتبقي{' '}
                          <b>
                            <span className="num">{formatMoney(f.amt - spent)}</span>
                          </b>
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="btn primary block-btn"
          style={{ marginTop: 14 }}
          onClick={onAddFund}
        >
          ➕ ميزانية جديدة
        </button>
      </div>
    </div>
  );
};
