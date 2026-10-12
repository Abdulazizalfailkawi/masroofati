import { AppState, CategoryId, IncomeItem, MonthSummary, ObligationItem, AlertItem } from '../types.ts';
import { CATS } from './constants.ts';
import { addDays, addMonths, curMk, dateIn, dayDiff, daysPhrase, dim, fmtDate, mkOf, monthDiff, splitD, todayStr } from './dates.ts';
import { formatMoney } from './money.ts';

export function incomeItems(mk: string, state: AppState): IncomeItem[] {
  return state.incomes
    .filter(i => (i.rec ? mkOf(i.date) <= mk : mkOf(i.date) === mk))
    .map(i => ({
      ...i,
      shown: i.rec ? dateIn(mk, +i.date.slice(8, 10)) : i.date,
    }))
    .sort((a, b) => a.shown.localeCompare(b.shown));
}

export function obligationItems(mk: string, state: AppState): ObligationItem[] {
  const out: ObligationItem[] = [];
  for (const o of state.obligations) {
    const n = monthDiff(mkOf(o.date), mk);
    if (n < 0) continue;
    if (!o.rec && n !== 0) continue;
    if (o.rec && o.count && n >= o.count) continue;
    out.push({
      o,
      due: dateIn(mk, +o.date.slice(8, 10)),
      paidOn: o.paid[mk] || null,
      idx: n + 1,
    });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due) || a.o.name.localeCompare(b.o.name, 'ar'));
}

export function summary(mk: string, state: AppState): MonthSummary {
  const incList = incomeItems(mk, state);
  const exps = state.expenses.filter(e => mkOf(e.date) === mk);
  const obs = obligationItems(mk, state);

  const inc = incList.reduce((acc, i) => acc + i.amt, 0);
  const exp = exps.reduce((acc, e) => acc + e.amt, 0);
  const obl = obs.reduce((acc, x) => acc + x.o.amt, 0);
  const oblPaid = obs.filter(x => x.paidOn).reduce((acc, x) => acc + x.o.amt, 0);

  const byCat: Partial<Record<CategoryId, number>> = {};
  exps.forEach(e => {
    byCat[e.cat] = (byCat[e.cat] || 0) + e.amt;
  });

  return {
    inc,
    exp,
    obl,
    oblPaid,
    rem: inc - exp - obl,
    byCat,
    incItems: incList,
    exps,
    obs,
  };
}

export function balanceNow(mk: string, state: AppState): number | null {
  const t = todayStr();
  const currentMonth = curMk();
  if (mk > currentMonth) return null;

  const inc = incomeItems(mk, state)
    .filter(i => i.shown <= t)
    .reduce((acc, i) => acc + i.amt, 0);

  const exp = state.expenses
    .filter(e => mkOf(e.date) === mk && e.date <= t)
    .reduce((acc, e) => acc + e.amt, 0);

  const paid = obligationItems(mk, state)
    .filter(x => x.paidOn)
    .reduce((acc, x) => acc + x.o.amt, 0);

  return inc - exp - paid;
}

export function statusOf(s: MonthSummary): { c: 'good' | 'warn' | 'bad'; t: string } | null {
  if (!s.inc && !s.exp && !s.obl) return null;
  if (!s.inc) return { c: 'warn', t: 'سجّل دخلك' };
  if (s.rem < 0) return { c: 'bad', t: 'تجاوزت دخلك' };
  if (s.rem / s.inc < 0.1) return { c: 'warn', t: 'انتبه' };
  return { c: 'good', t: 'وضعك زين' };
}

export function buildAlerts(state: AppState, viewedMk: string, loadWarn: string | null): AlertItem[] {
  const out: AlertItem[] = [];
  const t = todayStr();
  const current = curMk();

  if (loadWarn) {
    out.push({ lv: 'bad', ic: '⚠️', title: 'مشكلة في البيانات', text: loadWarn });
  }

  if (viewedMk !== current) return out;

  const tomorrow = addDays(t, 1);
  const items = obligationItems(current, state).concat(
    mkOf(tomorrow) !== current ? obligationItems(mkOf(tomorrow), state) : []
  );

  items
    .filter(x => !x.paidOn)
    .forEach(x => {
      const a = formatMoney(x.o.amt) + ' د.ك';
      if (x.due < t) {
        out.push({
          lv: 'bad',
          ic: '⏰',
          title: `متأخر: ${x.o.name}`,
          text: `${a} — كان يستحق ${fmtDate(x.due)}`,
          go: 'ob',
        });
      } else if (x.due === t) {
        out.push({
          lv: 'warn',
          ic: '⏰',
          title: `${x.o.name} يستحق اليوم`,
          text: a,
          go: 'ob',
        });
      } else if (x.due === tomorrow) {
        out.push({
          lv: 'warn',
          ic: '⏰',
          title: `${x.o.name} يستحق باكر`,
          text: a,
          go: 'ob',
        });
      }
    });

  const s = summary(current, state);
  CATS.forEach(c => {
    const b = state.budgets[c.id];
    const sp = s.byCat[c.id] || 0;
    if (!b) return;
    if (sp > b) {
      out.push({
        lv: 'bad',
        ic: c.icon,
        title: `تجاوزت ميزانية ${c.name}`,
        text: `زايد بـ ${formatMoney(sp - b)} د.ك`,
        go: 'budget',
      });
    } else if (sp >= b * 0.8) {
      out.push({
        lv: 'warn',
        ic: c.icon,
        title: `قربت تخلص ميزانية ${c.name}`,
        text: `صرفت ${Math.round((sp / b) * 100)}% منها`,
        go: 'budget',
      });
    }
  });

  const day = +t.slice(8, 10);
  const prev = addMonths(current, -1);
  const prevSp = state.expenses
    .filter(e => mkOf(e.date) === prev && +e.date.slice(8, 10) <= day)
    .reduce((acc, e) => acc + e.amt, 0);

  if (prevSp > 0 && s.exp > prevSp * 1.25 && s.exp - prevSp >= 10000) {
    out.push({
      lv: 'warn',
      ic: '📈',
      title: 'انتبه — صرفك أعلى من المعتاد',
      text: `${formatMoney(s.exp)} د.ك هالشهر مقابل ${formatMoney(prevSp)} د.ك بنفس الفترة من الشهر الماضي`,
      go: 'exp',
    });
  }

  if (s.inc || s.exp || s.obl) {
    if (s.rem < 0) {
      out.push({
        lv: 'bad',
        ic: '🚨',
        title: 'صرفك والتزاماتك أعلى من دخلك',
        text: `العجز ${formatMoney(-s.rem)} د.ك هالشهر`,
      });
      const [curY, curM] = current.split('-').map(Number);
      const remainingDays = dim(curY, curM) - day + 1;
      out.push({
        lv: 'warn',
        ic: '🪫',
        title: 'باقي لك أقل من 10% من دخلك',
        text: `المتبقي ${formatMoney(s.rem)} د.ك وباقي ${daysPhrase(remainingDays)} على نهاية الشهر`,
      });
    }
  }

  const rank = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.lv] - rank[b.lv]);
}
