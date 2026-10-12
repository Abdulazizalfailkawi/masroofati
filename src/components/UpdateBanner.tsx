import React, { useEffect, useRef, useState } from 'react';
import { isUpdateAvailable, applyUpdate } from '../lib/update.ts';

const CHECK_EVERY_MS = 5 * 60 * 1000;

export const UpdateBanner: React.FC = () => {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    const check = async () => {
      lastCheck.current = Date.now();
      if (await isUpdateAvailable()) setAvailable(true);
    };

    const first = window.setTimeout(check, 4000);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > 30000) check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!available || dismissed) return null;

  return (
    <div className="updatebar" role="alert">
      <span className="t">
        <b>يوجد تحديث جديد</b>
        <small>اضغط تحديث عشان تحصل على آخر نسخة. بياناتك ما تتأثر.</small>
      </span>
      <button
        type="button"
        className="btn primary"
        disabled={updating}
        onClick={() => {
          setUpdating(true);
          applyUpdate();
        }}
      >
        {updating ? 'جاري التحديث…' : 'تحديث'}
      </button>
      <button type="button" className="x" onClick={() => setDismissed(true)} aria-label="لاحقاً">
        ×
      </button>
    </div>
  );
};
