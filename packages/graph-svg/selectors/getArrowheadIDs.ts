import { createSelector } from '@reduxjs/toolkit';
import { CSSProperties } from 'react';
import { ArrowHeadProps } from '../components/defs/arrowheads/ArrowHead';
import { arrowheadColor, arrowheadID } from '../components/defs/arrowheads/utilities';
import { Dict } from '../components/types';
import { getEdgeStyles } from '../store/store';
import { values } from 'lodash-es';

const combiner = (styles: Dict<CSSProperties>): ArrowHeadProps[] => {
    return values(styles).map(style => {
        return {
            id: arrowheadID(style),
            color: arrowheadColor(style),
            size: 10
        }
    });
}

export const getArrowheadIDs = createSelector(
    getEdgeStyles,
    combiner
);