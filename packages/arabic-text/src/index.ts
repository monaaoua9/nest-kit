const TASHKEEL = /[ً-ٰٟـ]/g; // includes tatweel

export function stripTashkeel(s: string): string {
  return s.replace(TASHKEEL, '');
}

export function toLatinDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0));
}

export function toArabicDigits(s: string): string {
  return s.replace(/\d/g, d => String.fromCharCode(0x0660 + Number(d)));
}

// for search and comparison, not for showing back to the user
export function normalizeArabic(s: string): string {
  return stripTashkeel(s)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

export function normalizeSearch(s: string): string {
  return normalizeArabic(toLatinDigits(s)).toLowerCase().replace(/\s+/g, ' ').trim();
}
