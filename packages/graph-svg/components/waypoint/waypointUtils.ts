import { CSSProperties } from 'react';
import { DynamicStyles } from '../types';
import { merge } from 'lodash-es';

export function createWaypointID (edgeID: string, index: number): string {
    return `${edgeID}:${index}`;
}

export function parseWaypointID (waypointID: string): [string, number] {
    const index = waypointID.lastIndexOf(':');
    if (index === -1) throw Error('Waypoint ID not associated with an index');
    return [waypointID.substring(0, index), +waypointID.substring(index+1)];
}

export function createWaypointStyle (styles: DynamicStyles, selected: boolean, hovered: boolean): CSSProperties {
    return merge({}, styles.style, selected ? styles.selected : {}, hovered ? styles.hovered : {});
}