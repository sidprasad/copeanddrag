import { SterlingTheme } from '@/sterling-theme';
import { NodeDef } from 'graph-svg-custom/types';

export function defaultThemeNew(): SterlingTheme {
  return {
    hidden: {
      builtinDisconnected: true
    },
    nodes: [
      {
        shape: {
          shape: 'rectangle',
          width: 100,
          height: 60
        },
        styles: {
          node: {
            stroke: '#333',
            strokeWidth: 1,
            fill: '#ffffff'
          },
          label: {
            fontFamily: 'monospace',
            fontSize: '14px',
            textAnchor: 'middle',
            userSelect: 'none',
            fill: '#333'
          }
        },
        props: { label: { dy: '0.33em' } },
        targets: ['*']
      }
    ],
    edges: [
      {
        asAttribute: false,
        sourceIndex: 0,
        curve: {
          type: 'bspline'
        },
        styles: {
          edge: {
            stroke: '#333',
            strokeWidth: 1,
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

export function noAtomsBox(): NodeDef {
  return  {
    id: '0', 
    position: {x: 0, y:0},
    shape: { shape: 'rectangle', width: 550, height: 50},
    style: {fill: 'transparent', stroke: 'black'},
    labels: [{text: 'There are no atoms to display (or the current theme has hidden them)', style:{
      fontSize:12,textAnchor:"middle",fontFamily:"monospace",userSelect:"none"}}]
  }
}