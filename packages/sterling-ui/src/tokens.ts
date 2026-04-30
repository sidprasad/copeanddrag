// Design tokens for the Sterling app shell.
// Mirrors Spytial-core's palette so the two products feel like one family.
// Tufte-leaning: paper surfaces, hairline rules, sparing accent use.
//
// Contrast notes (WCAG 2.1 AA):
//   ink (#1f2937) on bg (#fdfdfb)         — 14.6:1 (AAA)
//   inkMuted (#475569) on surface (#fff)   —  7.5:1 (AAA)
//   inkFaint (#64748b) on surface (#fff)   —  4.5:1 (AA, decorative use only)
//   accent (#5a3d8a) on surface (#fff)     —  8.6:1 (AAA)
//   white on accent (#5a3d8a)              —  8.6:1 (AAA, button text)
//   accent on accentBg (#f0eef8)           —  7.5:1 (AAA)
//
// Focus indicator: 2px solid accent at element edge, plus a 1px outer
// halo against adjacent surfaces (WCAG 2.2 SC 2.4.11, 2.4.13).

export const tokens = {
  fonts: {
    body: '"Atkinson Hyperlegible", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code VF", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  },
  color: {
    bg: '#fdfdfb',
    surface: '#ffffff',
    surfaceMuted: '#f4f3ef',

    ink: '#1f2937',
    inkMuted: '#475569',
    inkFaint: '#64748b',
    inkDecorative: '#adb5bd',

    rule: '#e9ecef',
    ruleStrong: '#dee2e6',

    accent: '#5a3d8a',
    accentBg: '#f0eef8',
    accentBorder: '#c4b8e0',
    accentInk: '#3d2a5e',

    codeBg: '#1e1e1e',
    codeFg: '#d4d4d4',
    codeMuted: '#9b9b9b',

    success: '#1b5e20',
    error: '#a31515',
    warning: '#8a6d00'
  },
  focus: {
    width: '2px',
    halo: '1px'
  }
} as const;

export type Tokens = typeof tokens;
