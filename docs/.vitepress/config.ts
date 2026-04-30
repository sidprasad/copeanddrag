import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Cope and Drag',
  description: 'Diagramming by spatial refinement — the CnD language and Sterling-based visualizer.',
  base: '/copeanddrag/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/copeanddrag/favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400;500&display=swap',
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'CnD Language', link: '/cnd/' },
      { text: 'GitHub', link: 'https://github.com/sidprasad/copeanddrag' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'The Views', link: '/guide/views' },
            { text: 'Edit Mode (experimental)', link: '/guide/edit-mode' },
          ],
        },
      ],
      '/cnd/': [
        {
          text: 'CnD Language',
          items: [
            { text: 'Overview', link: '/cnd/' },
            { text: 'YAML Specification', link: '/cnd/yaml-spec' },
            { text: 'Selectors', link: '/cnd/evaluators' },
            { text: 'Field-Based Selectors', link: '/cnd/field-selectors' },
            { text: 'Projections', link: '/cnd/projections' },
            { text: 'Temporal Mode', link: '/cnd/temporal' },
            { text: 'Selector Synthesis', link: '/cnd/selector-synthesis' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sidprasad/copeanddrag' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Siddhartha Prasad',
    },
  },
});
