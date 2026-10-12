import React from 'react';
import { RouteName } from '../types.ts';

interface TabsNavProps {
  currentRoute: RouteName;
  onNavigate: (route: RouteName) => void;
  onQuickAdd: () => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({ currentRoute, onNavigate, onQuickAdd }) => {
  const activeTab = currentRoute === 'funds' ? 'budget' : currentRoute;

  return (
    <nav className="tabs" aria-label="التنقل الرئيسي">
      <button
        type="button"
        data-tab="home"
        aria-current={activeTab === 'home' ? 'page' : undefined}
        onClick={() => onNavigate('home')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />
        </svg>
        <span>الرئيسية</span>
      </button>

      <button
        type="button"
        data-tab="exp"
        aria-current={activeTab === 'exp' ? 'page' : undefined}
        onClick={() => onNavigate('exp')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />
        </svg>
        <span>المصروفات</span>
      </button>

      <div className="plus-slot">
        <button type="button" className="plus" onClick={onQuickAdd} aria-label="إضافة مصروف">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        data-tab="ob"
        aria-current={activeTab === 'ob' ? 'page' : undefined}
        onClick={() => onNavigate('ob')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
        </svg>
        <span>الالتزامات</span>
      </button>

      <button
        type="button"
        data-tab="budget"
        aria-current={activeTab === 'budget' ? 'page' : undefined}
        onClick={() => onNavigate('budget')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v9l6.4 6.4" />
        </svg>
        <span>الميزانية</span>
      </button>
    </nav>
  );
};
