import React, { useState } from 'react';
import { AppState, RouteName, AuthUser } from '../types.ts';
import { CATS } from '../lib/constants.ts';
import { curMk, dim, daysPhrase, splitD, todayStr } from '../lib/dates.ts';
import { formatMoney, parts, sizeClass } from '../lib/money.ts';
import { summary, statusOf, balanceNow, buildAlerts } from '../lib/analytics.ts';
import { HeaderBand } from '../components/HeaderBand.tsx';

interface HomeViewProps {
  state: AppState;
  viewedMk: string;
  currentUser: AuthUser | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurMonth: () => void;
  onNavigate: (route: RouteName) => void;
  onTriggerAction: (action: string) => void;
  loadWarning: string | null;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  viewedMk,
  currentUser,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  onNavigate,
  onTriggerAction,
  loadWarning,
  onOpenAuth,
}) => {
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const currentMonth = curMk();
  const s = summary(viewedMk, state);
  const [y, m] = viewedMk.split('-').map(Number);
  const isPast = viewedMk < currentMonth;
  const isCur = viewedMk === currentMonth;
  const todayDay = +todayStr().slice(8, 10);
  const st = statusOf(s);
  const total = Math.max(s.inc, s.exp + s.obl);
  const isOver = s.rem < 0;

  const pct = (x: number) => (total > 0 ? (x / total) * 100 : 0);
  const isEmpty =
    state.expenses.length === 0 &&
    state.incomes.length === 0 &&
    state.obligations.length === 0;

  const target = state.settings.saveTarget;
  const bal = balanceNow(viewedMk, state);
  const alerts = buildAlerts(state, viewedMk, loadWarning, !!currentUser?.isAdmin);
  const shownAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

  const pRem = parts(s.rem);

  // Cloud sync indicator
  const hasSupabase = !!(state.settings.supabaseUrl && state.settings.supabaseAnonKey);

  const renderSpendCard = () => {
    if (isPast) {
      const good = s.rem >= 0;
      const pAbs = parts(Math.abs(s.rem));
      return (
        <section className={`card spend ${good ? 'good' : 'bad'}`}>
          <div className="t">
            <span>نتيجة الشهر</span>
          </div>
          <div className={`big ${sizeClass(s.rem)}`}>
            <span className="num">
              {pAbs.neg ? '−' : ''}
              {pAbs.w}
              <small>.{pAbs.fr}</small>
            </span>
            <span className="cu">د.ك</span>
          </div>
          <p className="note">
            {good ? 'وفّرت هالمبلغ بنهاية الشهر' : 'تجاوزت دخلك بهالمبلغ'}
          </p>
        </section>
      );
    }

    const spendable = s.rem - target;
    const daysLeft = isCur ? dim(y, m) - todayDay + 1 : dim(y, m);
    let cls: 'good' | 'warn' | 'bad';
    let note: React.ReactNode;

    if (spendable > 0) {
      cls = s.inc && spendable / s.inc < 0.1 ? 'warn' : 'good';
      const perDay = Math.floor(spendable / daysLeft);
      note = (
        <>
          تقريباً <span className="num">{formatMoney(perDay)}</span><span className="cu">د.ك</span> باليوم · باقي {daysPhrase(daysLeft)}
          {target > 0 && (
            <>
              <br />
              بعد حجز هدف التوفير <span className="num">{formatMoney(target)}</span><span className="cu">د.ك</span>
            </>
          )}
        </>
      );
    } else if (s.rem >= 0 && target > 0) {
      cls = 'warn';
      note = `وصلت لهدف التوفير (${formatMoney(target)} د.ك) — أي صرف إضافي سيقلل من توفيرك`;
    } else {
      cls = 'bad';
      note = 'ما عندك مجال إضافي للصرف هذا الشهر';
    }

    const pSpendable = parts(Math.max(0, spendable));

    return (
      <section className={`card spend ${cls}`} aria-label="تقدر تصرف">
        <div className="t">
          <span>تقدر تصرف</span>
          <span>بأمان لين نهاية الشهر</span>
        </div>
        <div className={`big ${sizeClass(Math.max(0, spendable))}`}>
          <span className="num">
            {pSpendable.w}
            <small>.{pSpendable.fr}</small>
          </span>
          <span className="cu">د.ك</span>
        </div>
        <p className="note">{note}</p>
      </section>
    );
  };

  const rows = CATS.map(c => ({
    c,
    a: s.byCat[c.id] || 0,
  }))
    .filter(x => x.a > 0)
    .sort((a, b) => b.a - a.a);

  return (
    <div>
      <HeaderBand
        title="مصروفاتي"
        month
        tall
        viewedMk={viewedMk}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onCurMonth={onCurMonth}
        rightAction={
          currentUser?.isAdmin ? (
            <button
              type="button"
              className="iconbtn"
              onClick={() => onNavigate('admin')}
              title="لوحة تحكم المدير"
              style={{
                fontSize: 13,
                background: 'rgba(255,255,255,0.25)',
                width: 'auto',
                padding: '0 12px',
                borderRadius: 99,
                fontWeight: 700,
              }}
            >
              🛡️ الأدمن
            </button>
          ) : (
            <button
              type="button"
              className="iconbtn"
              onClick={onOpenAuth}
              title={currentUser ? currentUser.email : 'تسجيل الدخول'}
              style={{
                fontSize: 13,
                background: 'rgba(255,255,255,0.18)',
                width: 'auto',
                padding: '0 12px',
                borderRadius: 99,
              }}
            >
              {currentUser ? '👤 حسابي' : '👤 دخول'}
            </button>
          )
        }
      />

      <div className="wrap stack up">
        {/* Hero Card */}
        <section className="card hero" aria-label="ملخص الشهر">
          <div className="hl">
            <span>المتبقي</span>
            {st && <span className={`chip ${st.c}`}>{st.t}</span>}
          </div>
          <div className={`big ${sizeClass(s.rem)} ${isOver ? 'neg' : ''}`}>
            <span className="num">
              {pRem.neg ? '−' : ''}
              {pRem.w}
              <small>.{pRem.fr}</small>
            </span>
            <span className="cu">د.ك</span>
          </div>

          <div
            className={`split ${isOver ? 'over' : ''}`}
            role="img"
            aria-label="توزيع الدخل بين المصروفات والالتزامات والمتبقي"
          >
            <i className="seg e" style={{ width: `${pct(s.exp)}%` }} />
            <i className="seg o" style={{ width: `${pct(s.obl)}%` }} />
            <i className="seg r" style={{ width: `${pct(Math.max(0, s.rem))}%` }} />
          </div>

          <div className="trio">
            <button
              type="button"
              className="stat"
              onClick={() => onNavigate('income')}
            >
              <span className="k">الدخل</span>
              <span className="v">
                <span className="num">{formatMoney(s.inc)}</span>
              </span>
            </button>
            <button
              type="button"
              className="stat"
              onClick={() => onNavigate('exp')}
            >
              <span className="k">
                <i className="dot e" />
                المصروفات
              </span>
              <span className="v">
                <span className="num">{formatMoney(s.exp)}</span>
              </span>
            </button>
            <button
              type="button"
              className="stat"
              onClick={() => onNavigate('ob')}
            >
              <span className="k">
                <i className="dot o" />
                الالتزامات
              </span>
              <span className="v">
                <span className="num">{formatMoney(s.obl)}</span>
              </span>
            </button>
          </div>
        </section>

        {/* Onboarding steps if empty */}
        {isEmpty ? (
          <section className="card">
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>ابدأ بثلاث خطوات بسيطة</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              بياناتك تبقى على جهازك، ويمكنك حفظها سحابياً في أي وقت.
            </p>
            <div className="steps">
              <button
                type="button"
                className="step"
                onClick={() => onTriggerAction('add-inc')}
              >
                سجّل دخلك الشهري
              </button>
              <button
                type="button"
                className="step"
                onClick={() => onTriggerAction('add-ob')}
              >
                أضف التزاماتك (إيجار، أقساط، فواتير)
              </button>
              <button
                type="button"
                className="step"
                onClick={() => onTriggerAction('add-expense')}
              >
                سجّل أول مصروف
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Can Spend Card */}
            {renderSpendCard()}

            {/* Alerts */}
            {alerts.length > 0 && (
              <section className="alerts" aria-label="تنبيهات">
                {shownAlerts.map((a, idx) => {
                  const content = (
                    <>
                      <span className="ai" aria-hidden="true">
                        {a.ic}
                      </span>
                      <span>
                        <b>{a.title}</b>
                        {a.text}
                      </span>
                    </>
                  );

                  return a.go ? (
                    <button
                      key={idx}
                      type="button"
                      className={`alert ${a.lv}`}
                      onClick={() => a.go && onNavigate(a.go)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={idx} className={`alert ${a.lv}`}>
                      {content}
                    </div>
                  );
                })}
                {alerts.length > 3 && (
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                  >
                    {showAllAlerts ? 'إخفاء' : `عرض الكل (${alerts.length})`}
                  </button>
                )}
              </section>
            )}

            {/* Minis */}
            <div className="minis">
              <div className="mini">
                <span className="k">الرصيد الفعلي</span>
                <span className="v">
                  {bal === null ? '—' : <span className="num">{formatMoney(bal)}</span>}
                </span>
                <span className="s">بعد اللي اندفع</span>
              </div>
              <div className="mini">
                <span className="k">نسبة الصرف</span>
                <span className="v">
                  {s.inc ? (
                    <span className="num">
                      {Math.round((s.exp / s.inc) * 100)}%
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
                <span className="s">من الدخل</span>
              </div>
              <div className="mini">
                <span className="k">تقدر توفّر</span>
                <span className="v">
                  <span className="num">{formatMoney(Math.max(0, s.rem))}</span>
                </span>
                <span className="s">
                  {target ? `هدفك ${formatMoney(target)}` : 'لو وقفت الصرف'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="wrap">
        <div className="sec">
          <h2>وين راحت فلوسي؟</h2>
          <span className="meta">
            {s.exp > 0 && (
              <>
                <span className="num">{formatMoney(s.exp)}</span>
                <span className="cu">د.ك</span>
              </>
            )}
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="card cats">
            {rows.map(r => {
              const p = Math.round((r.a / s.exp) * 100);
              return (
                <div key={r.c.id} className="cat">
                  <div className="top">
                    <span className="n">
                      <span aria-hidden="true">{r.c.icon}</span>
                      {r.c.name}
                    </span>
                    <span className="a">
                      <span className="num">{formatMoney(r.a)}</span>
                      <span className="cu">د.ك</span>
                      <span className="pc">
                        <span className="num">{p}%</span>
                      </span>
                    </span>
                  </div>
                  <div className="bar" role="img" aria-label={`${p}%`}>
                    <i style={{ width: `${Math.max(p, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <div className="empty">
              <div className="e1" aria-hidden="true">
                🧾
              </div>
              <b>ما فيه مصروفات هذا الشهر</b>
              <span>اضغط «إضافة مصروف» وسجّل أول عملية.</span>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 22, paddingBottom: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            تم إنشاء هذا التطبيق بواسطة عبد العزيز الفيلكاوي، تحياتي.
          </p>
        </div>
      </div>
    </div>
  );
};
