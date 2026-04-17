import { Matrix } from "transformation-matrix";
import { spreadMatrixChanged } from '../../../store/graph/graphSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';

/**
 * The spread matrix has explicitly been set.
 */
const onSpreadSetHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, target: Matrix) => {
        next(spreadMatrixChanged(gesture.setSpread(target)));
    }
};

export default onSpreadSetHandler;