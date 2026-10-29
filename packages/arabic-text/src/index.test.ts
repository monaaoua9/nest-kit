import { describe, expect, it } from 'vitest';
import {
  normalizeArabic,
  normalizeSearch,
  stripTashkeel,
  toArabicDigits,
  toLatinDigits,
} from './index';

describe('arabic-text', () => {
  it('strips diacritics and tatweel', () => {
    expect(stripTashkeel('مُحَمَّد')).toBe('محمد');
    expect(stripTashkeel('الـــعربية')).toBe('العربية');
  });

  it('converts both digit sets to latin', () => {
    expect(toLatinDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(toLatinDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(toLatinDigits('رقم ٧٧٠ abc')).toBe('رقم 770 abc');
  });

  it('roundtrips digits', () => {
    expect(toArabicDigits('2026')).toBe('٢٠٢٦');
    expect(toLatinDigits(toArabicDigits('9081'))).toBe('9081');
  });

  it('unifies letter variants', () => {
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('مدرسة')).toBe('مدرسه');
    expect(normalizeArabic('على')).toBe('علي');
  });

  it('search normalization ignores case, spacing and digits style', () => {
    expect(normalizeSearch('  إِبراهيم   ٢  ')).toBe('ابراهيم 2');
    expect(normalizeSearch('Cafe  Ali')).toBe('cafe ali');
  });
});
