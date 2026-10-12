import React from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string | null;
  action?: ToastAction | null;
}

export const Toast: React.FC<ToastProps> = ({ message, action }) => {
  if (!message) return null;

  return (
    <div id="toast" className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      {action && (
        <button type="button" className="toast-act" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};
