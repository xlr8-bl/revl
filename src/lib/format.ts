/**
 * Sentence case for course/paper titles: first word capitalized, the rest
 * lowered. Roman numerals and coded tokens (anything with a digit) keep
 * their original casing — "Circuit Analysis II" → "Circuit analysis II".
 */
export function sentenceCase(s: string) {
  return s
    .split(' ')
    .map((word, i) => {
      if (/^[IVX]+$/.test(word) || /\d/.test(word)) return word;
      const lower = word.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}
