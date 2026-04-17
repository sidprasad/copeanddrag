import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Cope and Drag',
  description: 'Diagramming by spatial refinement — the CnD language and Sterling-based visualizer.',
  base: '/copeanddrag/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/copeanddrag/favicon.ico' }],
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
          ],
        },
      ],
      '/cnd/': [
        {
          text: 'CnD Language',
          items: [
            { text: 'Overview', link: '/cnd/' },
            { text: 'YAML Specification', link: '/cnd/yaml-spec' },
            { text: 'Evaluators', link: '/cnd/evaluators' },
            { text: 'Field-Based Selectors', link: '/cnd/field-selectors' },
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
