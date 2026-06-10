import { LabelDef, ShapeDef } from '@/graph-svg';
import { CSSProperties } from 'react';

export const edgeStyle: CSSProperties = {
  stroke: 'var(--ccd-minimap-edge)',
  strokeWidth: 1,
  fill: 'none'
};

export const nodeLabel: Omit<LabelDef, 'text'> = {
  style: {
    fill: 'var(--ccd-minimap-node-stroke)',
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
  stroke: 'var(--ccd-minimap-node-stroke)',
  strokeWidth: 1,
  fill: 'var(--ccd-minimap-node-fill)',
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
  stroke: 'var(--ccd-minimap-selected-stroke)',
  strokeWidth: 1,
  fill: 'var(--ccd-minimap-node-fill)',
  cursor: 'pointer'
};
