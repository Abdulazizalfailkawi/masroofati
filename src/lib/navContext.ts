import { createContext } from 'react';

/** Opens the "More" page. Provided by App so any page header can show a shortcut to it. */
export const MoreNavContext = createContext<(() => void) | null>(null);
