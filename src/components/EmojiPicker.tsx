import React, { useState } from 'react';
import { firstEmoji } from '../lib/emoji.ts';

interface EmojiPickerProps {
  name: string;
  value: string;
  presets: string[];
  onChange: (icon: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ name, value, presets, onChange }) => {
  const [draft, setDraft] = useState('');

  // A custom pick that isn't one of the presets is shown as an extra selected chip
  const options = presets.includes(value) ? presets : [value, ...presets];

  const handleDraft = (text: string) => {
    const e = firstEmoji(text);
    if (e) {
      onChange(e);
      setDraft('');
    } else {
      setDraft(text.slice(0, 4));
    }
  };

  return (
    <div className="fld">
      <span>الأيقونة</span>
      <div className="chips">
        {options.map(ic => (
          <label key={ic} className="opt">
            <input
              type="radio"
              name={name}
              value={ic}
              checked={value === ic}
              onChange={() => onChange(ic)}
            />
            <span>
              <em aria-hidden="true">{ic}</em>
            </span>
          </label>
        ))}
      </div>
      <input
        className="inp"
        type="text"
        value={draft}
        onChange={e => handleDraft(e.target.value)}
        placeholder="أو اختر إيموجي من كيبوردك 😀"
        aria-label="إيموجي مخصص"
        autoComplete="off"
        style={{ marginTop: 8 }}
      />
      {draft && <span className="hint">اختر إيموجي من لوحة المفاتيح (مو حروف أو أرقام).</span>}
    </div>
  );
};
