# @monaaoua9/arabic-text

Small helpers for Arabic text: remove diacritics, convert digits, normalize for search.

```ts
normalizeSearch('  إِبراهيم   ٢  '); // 'ابراهيم 2'
toLatinDigits('٠٧٧٠١٢٣٤٥٦٧');       // '07701234567'
```

`normalizeArabic` folds أ إ آ to ا, ى to ي, ة to ه, ؤ to و and ئ to ي. It loses information, so use it to build a search column, not to rewrite what the user typed.
