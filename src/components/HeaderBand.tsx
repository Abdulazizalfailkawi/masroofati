import React from 'react';
import { MONTHS } from '../lib/constants.ts';
import { curMk } from '../lib/dates.ts';
import { RouteName } from '../types.ts';

interface HeaderBandProps {
  title: string;
  sub?: string;
  back?: RouteName;
  onBack?: () => void;
  month?: boolean;
  tall?: boolean;
  viewedMk: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onCurMonth?: () => void;
  rightAction?: React.ReactNode;
}

export const HeaderBand: React.FC<HeaderBandProps> = ({
  title,
  sub,
  back,
  onBack,
  month = false,
  tall = false,
  viewedMk,
  onPrevMonth,
  onNextMonth,
  onCurMonth,
  rightAction,
}) => {
  const [y, m] = viewedMk.split('-').map(Number);
  const isCur = viewedMk === curMk();

  return (
    <header className={`band ${tall ? 'tall' : ''}`}>
      <div className="wrap">
        <div className="band-top">
          {back && onBack && (
            <button
              type="button"
              className="iconbtn"
              onClick={onBack}
              aria-label="رجوع"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          )}
          <h1>{title}</h1>
          {rightAction}
        </div>

        {sub && <p className="sub">{sub}</p>}

        {month && onPrevMonth && onNextMonth && onCurMonth && (
          <div className="msw">
            <button
              type="button"
              className="iconbtn"
              onClick={onPrevMonth}
              aria-label="الشهر السابق"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`mlabel ${isCur ? '' : 'off'}`}
              onClick={onCurMonth}
              aria-label={isCur ? 'الشهر الحالي' : 'الرجوع للشهر الحالي'}
            >
              {MONTHS[m - 1]} {y}
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={onNextMonth}
              aria-label="الشهر التالي"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
