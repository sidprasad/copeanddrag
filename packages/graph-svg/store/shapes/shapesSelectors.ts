import { PortSet } from '../../components/types';
import { ShapesState } from './shapes';

const EMPTY_PORTS: PortSet = {};

export const getDefaultShape = (state: ShapesState) =>
    state.defaultShape;
export const getShape = (state: ShapesState, nodeID: string) =>
    state.byID[nodeID] || getDefaultShape(state);
export const getPorts = (state: ShapesState, nodeID: string) =>
    getShape(state, nodeID).ports || EMPTY_PORTS;