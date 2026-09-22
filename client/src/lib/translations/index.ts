import { uz } from './uz';
import { ru } from './ru';

export type Language = 'uz' | 'ru';
export type TranslationDict = typeof uz;

export const translations: Record<Language, TranslationDict> = {
  uz,
  ru,
};

export { uz, ru };
