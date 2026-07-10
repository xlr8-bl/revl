/**
 * MathRichText — renders question/answer text (markdown + inline LaTeX).
 *
 * Supports: **bold**, *italic*, `code`, "- " bullets, blank-line
 * paragraphs, and $...$ inline math. Math is prettified to Unicode
 * (fractions, sub/superscripts, Greek, operators) and set in a serif so
 * equations read as typeset maths, never as raw `$\frac{a}{b}$`.
 *
 * NOTE for the backend wiring pass: for full LaTeX coverage swap the
 * <MathSpan/> below for a KaTeX-backed renderer (e.g. react-native-katex)
 * — the parsing/segmentation here stays identical.
 */
import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, fonts, themedStyleSheet } from '../theme';

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', i: 'ⁱ', n: 'ⁿ', '+': '⁺', '-': '⁻' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', i: 'ᵢ', j: 'ⱼ', n: 'ₙ', a: 'ₐ', v: 'ᵥ', x: 'ₓ', '+': '₊', '-': '₋' };

const toScript = (s: string, map: Record<string, string>) =>
  [...s].every((c) => map[c]) ? [...s].map((c) => map[c]).join('') : null;

/** Convert a small, common subset of LaTeX to readable Unicode. */
export function latexToPretty(src: string): string {
  let s = src;
  // \frac{a}{b} → a∕b (repeat for nesting)
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${a}∕${b}`);
  }
  const symbols: Array<[RegExp, string]> = [
    [/\\sum/g, 'Σ'], [/\\prod/g, 'Π'], [/\\int/g, '∫'], [/\\infty/g, '∞'],
    [/\\log/g, 'log'], [/\\ln/g, 'ln'], [/\\times/g, '×'], [/\\cdot/g, '·'],
    [/\\Rightarrow/g, '⇒'], [/\\rightarrow/g, '→'], [/\\leq?\b/g, '≤'], [/\\geq?\b/g, '≥'],
    [/\\neq?\b/g, '≠'], [/\\approx/g, '≈'], [/\\pm/g, '±'], [/\\cup/g, '∪'], [/\\cap/g, '∩'],
    [/\\in\b/g, '∈'], [/\\subseteq/g, '⊆'], [/\\pi/g, 'π'], [/\\theta/g, 'θ'], [/\\alpha/g, 'α'],
    [/\\beta/g, 'β'], [/\\sigma/g, 'σ'], [/\\mu/g, 'μ'], [/\\lambda/g, 'λ'], [/\\delta/g, 'δ'],
    [/\\%/g, '%'], [/\\\{/g, '{'], [/\\\}/g, '}'], [/\\,/g, ' '], [/\\;/g, ' '], [/\\ /g, ' '],
  ];
  symbols.forEach(([re, rep]) => (s = s.replace(re, rep)));
  // ^{..} / _{..} and single-char ^x / _x → unicode scripts when possible
  s = s.replace(/\^\{([^{}]+)\}/g, (_, g) => toScript(g, SUP) ?? `^(${g})`);
  s = s.replace(/_\{([^{}]+)\}/g, (_, g) => toScript(g, SUB) ?? `_(${g})`);
  s = s.replace(/\^(.)/g, (_, c) => SUP[c] ?? `^${c}`);
  s = s.replace(/_(.)/g, (_, c) => SUB[c] ?? `_${c}`);
  return s.replace(/\s+/g, ' ').trim();
}

type Segment =
  | { kind: 'text'; value: string; bold?: boolean; italic?: boolean; code?: boolean }
  | { kind: 'math'; value: string };

/** Tokenize one line into text/bold/italic/code/math segments. */
function parseInline(line: string): Segment[] {
  const out: Segment[] = [];
  // Order matters: math first, then code, bold, italic.
  const re = /(\$[^$]+\$)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ kind: 'text', value: line.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('$')) out.push({ kind: 'math', value: latexToPretty(tok.slice(1, -1)) });
    else if (tok.startsWith('`')) out.push({ kind: 'text', value: tok.slice(1, -1), code: true });
    else if (tok.startsWith('**')) out.push({ kind: 'text', value: tok.slice(2, -2), bold: true });
    else out.push({ kind: 'text', value: tok.slice(1, -1), italic: true });
    last = m.index + tok.length;
  }
  if (last < line.length) out.push({ kind: 'text', value: line.slice(last) });
  return out;
}

type Props = {
  children: string;
  /** Base text style (font family/size/color). */
  style?: TextStyle;
  /** Style applied to math spans on top of the serif default. */
  mathColor?: string;
};

export function MathRichText({ children, style, mathColor }: Props) {
  const base: TextStyle = { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.text, ...style };
  const paragraphs = children.split(/\n\s*\n/);

  return (
    <View>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        return (
          <View key={pi} style={pi > 0 ? styles.paraGap : undefined}>
            {lines.map((line, li) => {
              const bullet = line.startsWith('- ');
              const content = bullet ? line.slice(2) : line;
              const segments = parseInline(content);
              const text = (
                <Text key={li} style={base}>
                  {segments.map((seg, si) =>
                    seg.kind === 'math' ? (
                      <Text
                        key={si}
                        style={{
                          fontFamily: fonts.serif,
                          fontStyle: 'italic',
                          fontSize: (base.fontSize ?? 15) + 1,
                          color: mathColor ?? base.color,
                        }}>
                        {seg.value}
                      </Text>
                    ) : (
                      <Text
                        key={si}
                        style={{
                          fontFamily: seg.bold ? fonts.bold : base.fontFamily,
                          fontStyle: seg.italic ? 'italic' : 'normal',
                          ...(seg.code ? { fontFamily: 'Courier', backgroundColor: colors.surface } : null),
                        }}>
                        {seg.value}
                      </Text>
                    )
                  )}
                </Text>
              );
              return bullet ? (
                <View key={li} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, base]}>•</Text>
                  <View style={styles.bulletBody}>{text}</View>
                </View>
              ) : (
                text
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  paraGap: { marginTop: 10 },
  bulletRow: { flexDirection: 'row', marginTop: 2 },
  bulletDot: { marginRight: 8, color: colors.textSecondary },
  bulletBody: { flex: 1 },
});
const styles = themedStyleSheet(makeStyles);
