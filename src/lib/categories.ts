import { AppState, Category } from '../types.ts';
import { CATS } from './constants.ts';

export const allCats = (state: Pick<AppState, 'customCats'>): Category[] => [
  ...CATS.slice(0, -1),
  ...(state.customCats || []),
  CATS[CATS.length - 1], // keep "other" last
];
