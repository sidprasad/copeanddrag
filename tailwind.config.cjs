module.exports = {
  content: [
    './packages/sterling/**/*.{tsx,jsx}',
    './packages/sterling-ui/**/*.{tsx,jsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
  important: true
};
