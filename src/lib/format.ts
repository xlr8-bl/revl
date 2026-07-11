/**
 * Title case for course/paper titles: every word's first letter capitalized
 * — "data mining" → "Data Mining". Roman numerals and coded tokens
 * (anything with a digit) keep their original casing, so "circuit analysis
 * II" → "Circuit Analysis II" and "CEC420" stays put.
 */
export function sentenceCase(s: string) {
  return s
    .split(' ')
    .map((word) => {
      if (/^[IVX]+$/.test(word) || /\d/.test(word)) return word;
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
