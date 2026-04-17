import { average } from '@graph-ts/vector2';
import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getEdgeSourcePortResolved } from '../../selectors/getEdgeSourcePortResolved';
import { getEdgeTargetPortResolved } from '../../selectors/getEdgeTargetPortResolved';
import { getEdgeLabel, RootState } from '../../store/store';
import { BoundEdgeID, EdgeLabelDef } from '../types';
import Label from './Label';
import { clamp, defaultTo } from 'lodash-es';

type EdgeLabelProps = BoundEdgeID & {
    labelPositions?: DOMPoint[]
}

const EdgeLabel: FC<EdgeLabelProps> = props => {

    const { edgeID } = props;

    // Get the label definition
    const labelDefs = useSelector((state: RootState) => getEdgeLabel(state, edgeID));

    // Get the source and target ports
    const source = useSelector((state: RootState) => getEdgeSourcePortResolved(state, edgeID));
    const target = useSelector((state: RootState) => getEdgeTargetPortResolved(state, edgeID));

    // Render nothing if there's no label
    if (!labelDefs) return null;

    // For now we'll just render right in the middle of the path
    const fallback = average(source, target);
    // const position = props.center || average(source, target);

    return <>{
        labelDefs.map((def, i) => {

            const position = props.labelPositions
                ? defaultTo(props.labelPositions[i], fallback)
                : fallback;

                return <Label
                    key={i}
                    x={position.x}
                    y={position.y}
                    {...def}/>
            }
        )
    }</>

}

/**
 * Given an edge label definition and a path on which the label should be rendered,
 * calculcate the DOMPoint where the label should be placed.
 *
 * @param labelDef An edge label definition
 * @param path An SVG Path Element
 */
export function resolveEdgeLabelPosition (labelDef: EdgeLabelDef, path: SVGPathElement): DOMPoint {

    // Get the total length of the path
    const length = path.getTotalLength();

    // If position is not defined, default to the center of the path
    if (labelDef.position === undefined)
        return path.getPointAtLength(length / 2);

    // If the position is a number, it's the percent distance along the path
    if (typeof labelDef.position === 'number') {
        const pct = clamp(labelDef.position, 0, 1);
        return path.getPointAtLength(pct * length);
    }

    // Otherwise it's an absolute distance in pixels from one of the ends
    const distance = clamp(labelDef.position.distance, 0, length);
    return labelDef.position.from === 'source'
        ? path.getPointAtLength(distance)
        : path.getPointAtLength(length - distance);

}

export default memo(EdgeLabel);