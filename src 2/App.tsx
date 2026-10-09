import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  RouteName,
  Expense,
  Obligation,
  Income,
  CategoryId,
  AuthUser,
} from './types.ts';
import {
  loadLocalState,
  saveLocalState,
  defaultState,
  normalizeState,
  uid,
} from './lib/storage.ts';
import { curMk, addMonths, todayStr } from './lib/dates.ts';
import { formatMoney } from './lib/money.ts';
import { CATS, PAYS } from './lib/constants.ts';
import {
  getStoredAuthUser,
  saveStoredAuthUser,
} from './lib/auth.ts';
import {
  getSupabaseClient,
  pushStateToSupabase,
  pullStateFromSupabase,
  supabaseAuthSignOut,
} from './lib/supabase.ts';

// Views
import { HomeView } from './views/HomeView.tsx';
import { ExpensesView } from './views/ExpensesView.tsx';
import { ObligationsView } from './views/ObligationsView.tsx';
import { BudgetView } from './views/BudgetView.tsx';
import { IncomeView } from './views/IncomeView.tsx';
import { MoreView } from './views/MoreView.tsx';
import { AdminView } from './views/AdminView.tsx';

// Components & Sheets
import { TabsNav } from './components/TabsNav.tsx';
import { FAB } from './components/FAB.tsx';
import { Toast } from './components/Toast.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { ExpenseSheet } from './components/sheets/ExpenseSheet.tsx';
import { ObligationSheet } from './components/sheets/ObligationSheet.tsx';
import { IncomeSheet } from './components/sheets/IncomeSheet.tsx';
import { BudgetSheet } from './components/sheets/BudgetSheet.tsx';
import { AuthSheet } from './components/sheets/AuthSheet.tsx';
import { InstallGuideSheet } from './components/sheets/InstallGuideSheet.tsx';
import { WelcomeModal } from './components/sheets/WelcomeModal.tsx';

const VALID_ROUTES: RouteName[] = ['home', 'exp', 'ob', 'budget', 'more', 'income', 'admin'];

function getRouteFromHash(): RouteName {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return VALID_ROUTES.includes(hash as RouteName) ? (hash as RouteName) : 'home';
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadLocalState().state);
  const [loadWarning] = useState<string | null>(() => loadLocalState().loadWarning);
  const [viewedMk, setViewedMk] = useState<string>(() => curMk());
  const [currentRoute, setCurrentRoute] = useState<RouteName>(getRouteFromHash);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredAuthUser);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  // Sheets state
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [obligationSheetOpen, setObligationSheetOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);

  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [selectedBudgetCat, setSelectedBudgetCat] = useState<CategoryId | null>(null);

  const [installGuideSheetOpen, setInstallGuideSheetOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState<boolean>(() => {
    return !sessionStorage.getItem('masroofati:welcome_dismissed');
  });

  // Confirm dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    okText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: RouteName) => {
    window.location.hash = '#/' + route;
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  // Theme application
  useEffect(() => {
    const theme = appState.settings.theme;
    const root = document.documentElement;
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    const dark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = dark ? '#14306F' : '#1E4FD8';
    document.head.appendChild(m);
  }, [appState.settings.theme]);

  // Persist to local storage and sync with Supabase in background
  const updateStateAndPersist = (newState: AppState) => {
    setAppState(newState);
    saveLocalState(newState);

    // Background push to Supabase for the current user
    const client = getSupabaseClient(newState);
    if (client) {
      pushStateToSupabase(newState, currentUser).catch(err => {
        console.warn('Background Supabase sync failed:', err);
      });
    }
  };

  // Attempt initial pull on mount if Supabase is configured
  useEffect(() => {
    const client = getSupabaseClient(appState);
    if (client) {
      pullStateFromSupabase(appState, currentUser).then(res => {
        if (res.ok && res.data) {
          if (
            res.data.expenses.length > appState.expenses.length ||
            res.data.incomes.length > appState.incomes.length
          ) {
            setAppState(res.data);
            saveLocalState(res.data);
            showToast('تمت المزامنة السحابية بحسابك');
          }
        }
      });
    }
  }, [currentUser?.id]);

  // Auth Handlers
  const handleLoginSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);

    // Pull private cloud data for this user
    const res = await pullStateFromSupabase(appState, user);
    if (res.ok && res.data) {
      setAppState(res.data);
      saveLocalState(res.data);
      showToast('تم استرجاع بياناتك السحابية بنجاح ✓');
    } else {
      // If user has local data, push it up to associate with their new account
      if (appState.expenses.length > 0 || appState.incomes.length > 0) {
        pushStateToSupabase(appState, user);
      }
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    saveStoredAuthUser(null);
    await supabaseAuthSignOut();
    if (currentRoute === 'admin') {
      navigateTo('home');
    }
  };

  // FAB / action dispatch
  const handleTriggerAction = (action: string) => {
    if (action === 'add-expense') {
      setEditingExpense(null);
      setExpenseSheetOpen(true);
    } else if (action === 'add-ob') {
      setEditingObligation(null);
      setObligationSheetOpen(true);
    } else if (action === 'add-inc') {
      setEditingIncome(null);
      setIncomeSheetOpen(true);
    }
  };

  // Expense Handlers
  const handleSaveExpense = (data: {
    id?: string;
    amt: number;
    cat: CategoryId;
    date: string;
    note: string;
    pay: any;
  }) => {
    let updatedExpenses = [...appState.expenses];
    if (data.id) {
      updatedExpenses = updatedExpenses.map(e =>
        e.id === data.id ? { ...e, ...data, ts: e.ts || Date.now() } : e
      );
    } else {
      updatedExpenses.push({
        id: uid(),
        amt: data.amt,
        cat: data.cat,
        date: data.date,
        note: data.note,
        pay: data.pay,
        ts: Date.now(),
      });
    }

    const updated = { ...appState, expenses: updatedExpenses };
    updateStateAndPersist(updated);
    showToast(data.id ? 'تم تعديل المصروف' : 'تم حفظ المصروف');
  };

  const handleDeleteExpense = (id: string) => {
    setDialogConfig({
      title: 'حذف المصروف؟',
      message: 'لا يمكن التراجع عن الحذف بعد تأكيده.',
      okText: 'احذف',
      isDanger: true,
      onConfirm: () => {
        const updated = {
          ...appState,
          expenses: appState.expenses.filter(e => e.id !== id),
        };
        updateStateAndPersist(updated);
        setExpenseSheetOpen(false);
        setDialogOpen(false);
        showToast('تم حذف المصروف');
      },
    });
    setDialogOpen(true);
  };

  // Obligation Handlers
  const handleSaveObligation = (data: {
    id?: string;
    name: string;
    amt: number;
    date: string;
    rec: boolean;
    count: number | null;
    icon: string;
  }) => {
    let updatedObs = [...appState.obligations];
    if (data.id) {
      updatedObs = updatedObs.map(o =>
        o.id === data.id ? { ...o, ...data } : o
      );
    } else {
      updatedObs.push({
        id: uid(),
        name: data.name,
        amt: data.amt,
        date: data.date,
        rec: data.rec,
        count: data.count,
        icon: data.icon,
        paid: {},
        ts: Date.now(),
      });
    }

    const updated = { ...appState, obligations: updatedObs };
    updateStateAndPersist(updated);
    showToast(data.id ? 'تم تعديل الالتزام' : 'تم حفظ الالتزام');
  };

  const handleDeleteObligation = (id: string) => {
    setDialogConfig({
      title: 'حذف الالتزام؟',
      message: 'سيتم حذف الالتزام من جميع الأشهر مع كامل سجل دفعاته.',
      okText: 'احذف',
      isDanger: true,
      onConfirm: () => {
        const updated = {
          ...appState,
          obligations: appState.obligations.filter(o => o.id !== id),
        };
        updateStateAndPersist(updated);
        setObligationSheetOpen(false);
        setDialogOpen(false);
        showToast('تم حذف الالتزام');
      },
    });
    setDialogOpen(true);
  };

  const handlePayObligation = (id: string, mk: string) => {
    const updatedObs = appState.obligations.map(o => {
      if (o.id === id) {
        return {
          ...o,
          paid: { ...o.paid, [mk]: todayStr() },
        };
      }
      return o;
    });
    const updated = { ...appState, obligations: updatedObs };
    updateStateAndPersist(updated);
    showToast('تم تسجيل الدفع ✓');
  };

  const handleUnpayObligation = (id: string, mk: string) => {
    const updatedObs = appState.obligations.map(o => {
      if (o.id === id) {
        const copyPaid = { ...o.paid };
        delete copyPaid[mk];
        return { ...o, paid: copyPaid };
      }
      return o;
    });
    const updated = { ...appState, obligations: updatedObs };
    updateStateAndPersist(updated);
    showToast('تم إلغاء الدفع');
  };

  // Income Handlers
  const handleSaveIncome = (data: {
    id?: string;
    amt: number;
    src: any;
    date: string;
    rec: boolean;
  }) => {
    let updatedIncomes = [...appState.incomes];
    if (data.id) {
      updatedIncomes = updatedIncomes.map(i =>
        i.id === data.id ? { ...i, ...data, ts: i.ts || Date.now() } : i
      );
    } else {
      updatedIncomes.push({
        id: uid(),
        amt: data.amt,
        src: data.src,
        date: data.date,
        rec: data.rec,
        ts: Date.now(),
      });
    }

    const updated = { ...appState, incomes: updatedIncomes };
    updateStateAndPersist(updated);
    showToast(data.id ? 'تم تعديل الدخل' : 'تم حفظ الدخل');
  };

  const handleDeleteIncome = (id: string) => {
    setDialogConfig({
      title: 'حذف الدخل؟',
      message: 'إذا كان شهرياً متكرراً فسيتم حذفه من كافة الأشهر.',
      okText: 'احذف',
      isDanger: true,
      onConfirm: () => {
        const updated = {
          ...appState,
          incomes: appState.incomes.filter(i => i.id !== id),
        };
        updateStateAndPersist(updated);
        setIncomeSheetOpen(false);
        setDialogOpen(false);
        showToast('تم حذف الدخل');
      },
    });
    setDialogOpen(true);
  };

  // Budget Handlers
  const handleSaveBudget = (catId: CategoryId, amount: number | null) => {
    const newBudgets = { ...appState.budgets };
    if (amount === null) {
      delete newBudgets[catId];
    } else {
      newBudgets[catId] = amount;
    }
    const updated = { ...appState, budgets: newBudgets };
    updateStateAndPersist(updated);
    showToast('تم حفظ الميزانية');
  };

  // Backup & CSV Handlers
  const handleExportBackup = async () => {
    const backupJson = JSON.stringify(
      {
        app: 'masroofati',
        version: 1,
        exportedAt: new Date().toISOString(),
        user: currentUser?.email || 'local',
        data: appState,
      },
      null,
      2
    );
    const fileName = `masroofati-backup-${todayStr()}.json`;

    try {
      const file = new File([backupJson], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'نسخة مصروفاتي الاحتياطية' });
        const updated = {
          ...appState,
          settings: { ...appState.settings, lastBackup: todayStr() },
        };
        updateStateAndPersist(updated);
        showToast('تم تصدير النسخة بنجاح');
        return;
      }
    } catch (e: any) {
      if (e && e.name === 'AbortError') return;
    }

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    const updated = {
      ...appState,
      settings: { ...appState.settings, lastBackup: todayStr() },
    };
    updateStateAndPersist(updated);
    showToast('تم تنزيل النسخة الاحتياطية');
  };

  const handleImportBackup = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const file = inp.files && inp.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const targetData =
            parsed && parsed.app === 'masroofati' && parsed.data ? parsed.data : parsed;
          const nextState = normalizeState(targetData);

          setDialogConfig({
            title: 'استيراد النسخة الاحتياطية؟',
            message: `سيتم استبدال البيانات الحالية بـ ${nextState.expenses.length} مصروف و ${nextState.incomes.length} دخل و ${nextState.obligations.length} التزام.`,
            okText: 'استبدل',
            isDanger: true,
            onConfirm: () => {
              nextState.settings.lastBackup = todayStr();
              updateStateAndPersist(nextState);
              setDialogOpen(false);
              showToast('تم استرجاع البيانات بنجاح');
            },
          });
          setDialogOpen(true);
        } catch (err) {
          showToast('الملف غير صالح أو تالف');
        }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  const handleExportCsv = () => {
    if (appState.expenses.length === 0) {
      showToast('لا توجد مصروفات لتصديرها');
      return;
    }

    const header = ['التاريخ', 'التصنيف', 'المبلغ (د.ك)', 'طريقة الدفع', 'الملاحظة'];
    const rows = appState.expenses.map(e => {
      const catObj = CATS.find(c => c.id === e.cat);
      const payObj = PAYS.find(p => p.id === e.pay);
      return [
        e.date,
        catObj?.name || e.cat,
        formatMoney(e.amt),
        payObj?.name || e.pay,
        `"${(e.note || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masroofati-expenses-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('تم تصدير ملف CSV بنجاح');
  };

  const handleWipeData = () => {
    setDialogConfig({
      title: 'مسح كل البيانات؟',
      message: 'ستُحذف جميع المصروفات والدخل والالتزامات والميزانيات من هذا الجهاز. يرجى أخذ نسخة احتياطية أولاً.',
      okText: 'امسح كل شيء',
      isDanger: true,
      onConfirm: () => {
        const fresh = defaultState();
        updateStateAndPersist(fresh);
        setDialogOpen(false);
        showToast('تم مسح جميع البيانات');
      },
    });
    setDialogOpen(true);
  };

  // Month navigation helpers
  const handlePrevMonth = () => setViewedMk(addMonths(viewedMk, -1));
  const handleNextMonth = () => setViewedMk(addMonths(viewedMk, 1));
  const handleCurMonth = () => setViewedMk(curMk());

  return (
    <div id="view" tabIndex={-1}>
      {/* Active View */}
      {currentRoute === 'home' && (
        <HomeView
          state={appState}
          viewedMk={viewedMk}
          currentUser={currentUser}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCurMonth={handleCurMonth}
          onNavigate={navigateTo}
          onTriggerAction={handleTriggerAction}
          loadWarning={loadWarning}
          onOpenAuth={() => setAuthSheetOpen(true)}
        />
      )}

      {currentRoute === 'exp' && (
        <ExpensesView
          state={appState}
          onEditExpense={exp => {
            setEditingExpense(exp);
            setExpenseSheetOpen(true);
          }}
        />
      )}

      {currentRoute === 'ob' && (
        <ObligationsView
          state={appState}
          viewedMk={viewedMk}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCurMonth={handleCurMonth}
          onEditObligation={ob => {
            setEditingObligation(ob);
            setObligationSheetOpen(true);
          }}
          onPayObligation={handlePayObligation}
          onUnpayObligation={handleUnpayObligation}
        />
      )}

      {currentRoute === 'budget' && (
        <BudgetView
          state={appState}
          viewedMk={viewedMk}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCurMonth={handleCurMonth}
          onSetBudget={catId => {
            setSelectedBudgetCat(catId);
            setBudgetSheetOpen(true);
          }}
        />
      )}

      {currentRoute === 'income' && (
        <IncomeView
          state={appState}
          viewedMk={viewedMk}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCurMonth={handleCurMonth}
          onNavigate={navigateTo}
          onEditIncome={inc => {
            setEditingIncome(inc);
            setIncomeSheetOpen(true);
          }}
        />
      )}

      {currentRoute === 'more' && (
        <MoreView
          state={appState}
          currentUser={currentUser}
          onNavigate={navigateTo}
          onUpdateState={updateStateAndPersist}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onExportCsv={handleExportCsv}
          onWipeData={handleWipeData}
          onToast={showToast}
          onOpenAuth={() => setAuthSheetOpen(true)}
          onOpenInstallGuide={() => setInstallGuideSheetOpen(true)}
          onOpenWelcome={() => setWelcomeModalOpen(true)}
        />
      )}

      {currentRoute === 'admin' && (
        <AdminView
          state={appState}
          currentUser={currentUser}
          onNavigate={navigateTo}
          onUpdateState={updateStateAndPersist}
          onToast={showToast}
        />
      )}

      {/* Floating Action Button */}
      {currentRoute !== 'admin' && (
        <FAB route={currentRoute} onAction={handleTriggerAction} />
      )}

      {/* Bottom Tabs Navigation */}
      {currentRoute !== 'admin' && (
        <TabsNav currentRoute={currentRoute} onNavigate={navigateTo} />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        okText={dialogConfig.okText}
        isDanger={dialogConfig.isDanger}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Sheets */}
      <ExpenseSheet
        expense={editingExpense}
        isOpen={expenseSheetOpen}
        onClose={() => setExpenseSheetOpen(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
      />

      <ObligationSheet
        obligation={editingObligation}
        isOpen={obligationSheetOpen}
        onClose={() => setObligationSheetOpen(false)}
        onSave={handleSaveObligation}
        onDelete={handleDeleteObligation}
      />

      <IncomeSheet
        income={editingIncome}
        isOpen={incomeSheetOpen}
        onClose={() => setIncomeSheetOpen(false)}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
      />

      <BudgetSheet
        categoryId={selectedBudgetCat}
        currentBudget={selectedBudgetCat ? appState.budgets[selectedBudgetCat] : undefined}
        isOpen={budgetSheetOpen}
        onClose={() => setBudgetSheetOpen(false)}
        onSave={handleSaveBudget}
      />

      <AuthSheet
        isOpen={authSheetOpen}
        onClose={() => setAuthSheetOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onToast={showToast}
      />

      <InstallGuideSheet
        isOpen={installGuideSheetOpen}
        onClose={() => setInstallGuideSheetOpen(false)}
      />

      <WelcomeModal
        isOpen={welcomeModalOpen}
        onClose={() => {
          sessionStorage.setItem('masroofati:welcome_dismissed', '1');
          setWelcomeModalOpen(false);
        }}
      />
    </div>
  );
}
