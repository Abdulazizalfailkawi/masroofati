import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  okText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  okText = 'تأكيد',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog" onClick={onCancel}>
      <div
        className="box"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn" type="button" onClick={onCancel}>
            إلغاء
          </button>
          <button
            className={`btn ${isDanger ? 'danger' : 'primary'}`}
            type="button"
            onClick={onConfirm}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
};
