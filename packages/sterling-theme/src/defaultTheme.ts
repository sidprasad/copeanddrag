import { SterlingThemeOld } from './theme';

export function defaultTheme(): SterlingThemeOld {
  return {
    sterling: 'v0',
    nodes: [
      {
        styles: {
          node: {
            stroke: '#333',
            fill: 'white'
          },
          label: {
            fontFamily: 'monospace',
            fontSize: '14px',
            textAnchor: 'middle',
            userSelect: 'none',
            cursor: 'pointer'
          }
        },
        props: { label: { dy: '0.33em' } },
        targets: ['*']
      }
    ],
    edges: [
      {
        styles: {
          edge: {
            stroke: '#333',
            strokeWidth: 2,
            fill: 'none'
          },
          label: {
            fontFamily: 'monospace',
            fontSize: '12px',
            textAnchor: 'middle',
            userSelect: 'none'
          }
        },
        targets: ['*']
      }
    ]
  };
}
