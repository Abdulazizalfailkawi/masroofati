import React from 'react';
import { RouteName } from '../types.ts';

interface FABProps {
  route: RouteName;
  onAction: (action: string) => void;
}

const FAB_CONFIG: Partial<Record<RouteName, { action: string; label: string }>> = {
  ob: { action: 'add-ob', label: 'إضافة التزام' },
  income: { action: 'add-inc', label: 'إضافة دخل' },
};

export const FAB: React.FC<FABProps> = ({ route, onAction }) => {
  const conf = FAB_CONFIG[route];
  if (!conf) return null;

  return (
    <button
      id="fab"
      className="fab"
      type="button"
      onClick={() => onAction(conf.action)}
      aria-label={conf.label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span>{conf.label}</span>
    </button>
  );
};
