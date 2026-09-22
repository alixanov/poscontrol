import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguageStore } from '@/stores/language.store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | undefined | null,
  languageOverride?: 'uz' | 'ru',
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    const lang = languageOverride || (typeof window !== 'undefined' ? useLanguageStore.getState().language : 'uz');
    return lang === 'ru' ? '0 ₽' : "0 so'm";
  }

  const lang = languageOverride || (typeof window !== 'undefined' ? useLanguageStore.getState().language : 'uz');

  if (lang === 'ru') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Uzbek format: 150 000 so'm
  const formattedNumber = new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: 0,
  }).format(amount).replace(/,/g, ' ');

  return `${formattedNumber} so'm`;
}

export function formatDate(
  dateString: string | Date | undefined,
  languageOverride?: 'uz' | 'ru',
): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  const lang = languageOverride || (typeof window !== 'undefined' ? useLanguageStore.getState().language : 'uz');

  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
