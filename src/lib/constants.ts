import { Category, PaymentMethod, IncomeSource, PeriodType } from '../types.ts';

export const STORAGE_KEY = 'masroofati:v1';

export const CATS: Category[] = [
  { id: 'food',      name: 'أكل',             icon: '🍔' },
  { id: 'transport', name: 'مواصلات / بنزين', icon: '⛽' },
  { id: 'shopping',  name: 'تسوق',            icon: '🛍️' },
  { id: 'coffee',    name: 'قهوة',            icon: '☕' },
  { id: 'fun',       name: 'ترفيه',           icon: '🎬' },
  { id: 'bills',     name: 'فواتير',          icon: '🧾' },
  { id: 'subs',      name: 'اشتراكات',        icon: '🔁' },
  { id: 'other',     name: 'أخرى',            icon: '📌' },
];

export const PAYS: PaymentMethod[] = [
  { id: 'cash', name: 'كاش' },
  { id: 'knet', name: 'KNET' },
  { id: 'card', name: 'بطاقة' },
  { id: 'transfer', name: 'تحويل' },
  { id: 'other', name: 'أخرى' },
];

export const SOURCES: IncomeSource[] = [
  { id: 'salary', name: 'الراتب', icon: '💼' },
  { id: 'allowance', name: 'بدل', icon: '🎁' },
  { id: 'extra', name: 'دخل إضافي', icon: '⭐' },
  { id: 'other', name: 'أخرى', icon: '📌' },
];

export const OB_ICONS: string[] = ['🏠', '📱', '🌐', '🚗', '💳', '💡', '🎓', '🛡️', '📌'];

export const OB_GUESS: [RegExp, string][] = [
  [/إيجار|ايجار|سكن|بيت/, '🏠'],
  [/هاتف|جوال|موبايل|خط\b|اتصال|زين|ooredoo|stc/i, '📱'],
  [/إنترنت|انترنت|واي|\bنت\b/, '🌐'],
  [/سيارة|سياره|مركبة/, '🚗'],
  [/بطاق|فيزا|كريدت|ائتمان/, '💳'],
  [/كهرباء|ماء|فاتورة|خدمات/, '💡'],
  [/دراس|جامع|مدرس|رسوم/, '🎓'],
  [/تأمين|تامين/, '🛡️'],
  [/قسط|قرض|دين|سلفة/, '💳'],
];

export const MONTHS: string[] = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const WEEKDAYS: string[] = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

export const PERIODS: [PeriodType, string][] = [
  ['day', 'اليوم'],
  ['week', 'هذا الأسبوع'],
  ['month', 'هذا الشهر'],
  ['all', 'الكل'],
  ['range', 'تاريخ محدد'],
];

export const CAT_EMOJIS: string[] = [
  '🍕', '🛒', '🚗', '🏥', '🎮', '📚', '✈️', '🐾',
  '👕', '💄', '🎁', '🏋️', '🔧', '🍼', '🕌', '💸',
];
