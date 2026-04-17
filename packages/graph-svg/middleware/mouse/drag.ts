import { throttle } from 'lodash-es';
import { AppDispatch } from '../../store/store';

const doDispatch = (dispatch: AppDispatch, action: any) => dispatch(action);
export const makeDragDispatcher = () => throttle(doDispatch, 16, {
    leading: true,
    trailing: false
});

export type DragDispatcher = ReturnType<typeof makeDragDispatcher>;