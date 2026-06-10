// Semantic colors resolve to the CSS-variable layer in
// `packages/sterling-ui/src/themeVars.css`, so a single `data-theme` flip on
// <html> re-themes every utility — no `dark:` variants needed. The default
// Tailwind palette stays available alongside these.
module.exports = {
  content: [
    './packages/sterling/**/*.{tsx,jsx}',
    './packages/sterling-ui/**/*.{tsx,jsx}'
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: 'var(--ccd-bg)',
        surface: 'var(--ccd-surface)',
        'surface-muted': 'var(--ccd-surface-muted)',
        'surface-sunken': 'var(--ccd-surface-sunken)',
        // Ink (text)
        ink: 'var(--ccd-ink)',
        'ink-muted': 'var(--ccd-ink-muted)',
        'ink-faint': 'var(--ccd-ink-faint)',
        'ink-decorative': 'var(--ccd-ink-decorative)',
        // Rules
        rule: 'var(--ccd-rule)',
        'rule-strong': 'var(--ccd-rule-strong)',
        // Accent
        accent: 'var(--ccd-accent)',
        'accent-bg': 'var(--ccd-accent-bg)',
        'accent-border': 'var(--ccd-accent-border)',
        'accent-ink': 'var(--ccd-accent-ink)',
        'on-accent': 'var(--ccd-on-accent)',
        // Status
        success: 'var(--ccd-success)',
        'success-bg': 'var(--ccd-success-bg)',
        'success-border': 'var(--ccd-success-border)',
        danger: 'var(--ccd-danger)',
        'danger-bg': 'var(--ccd-danger-bg)',
        'danger-border': 'var(--ccd-danger-border)',
        warning: 'var(--ccd-warning)',
        'warning-bg': 'var(--ccd-warning-bg)',
        'warning-border': 'var(--ccd-warning-border)',
        info: 'var(--ccd-info)',
        'info-bg': 'var(--ccd-info-bg)',
        'info-border': 'var(--ccd-info-border)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
  important: true
};
