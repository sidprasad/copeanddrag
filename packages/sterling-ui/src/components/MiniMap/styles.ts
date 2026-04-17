import { LabelDef, ShapeDef } from '@/graph-svg';
import { CSSProperties } from 'react';

export const edgeStyle: CSSProperties = {
  stroke: '#4A5568',
  strokeWidth: 1,
  fill: 'none'
};

export const nodeLabel: Omit<LabelDef, 'text'> = {
  style: {
    fill: '#4A5568',
    fontFamily: 'monospace',
    fontSize: '10px',
    textAnchor: 'middle',
    userSelect: 'none',
    cursor: 'pointer'
  },
  props: {
    dy: '0.4em'
  }
};

export const nodeShape: ShapeDef = {
  shape: 'circle',
  radius: 10
};

export const nodeStyle: CSSProperties = {
  stroke: '#4A5568',
  strokeWidth: 1,
  fill: 'white',
  cursor: 'pointer'
};

export const selectedNodeLabel: Omit<LabelDef, 'text'> = {
  style: {
    fontFamily: 'monospace',
    fontSize: '10px',
    textAnchor: 'middle',
    userSelect: 'none',
    cursor: 'pointer'
  },
  props: {
    dy: '0.4em'
  }
};

export const selectedNodeStyle: CSSProperties = {
  stroke: '#333',
  strokeWidth: 1,
  fill: 'white',
  cursor: 'pointer'
};
