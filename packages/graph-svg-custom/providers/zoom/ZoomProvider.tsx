import { Vector2 } from '@/vector2';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
  MouseEvent,
  WheelEvent,
  useCallback
} from 'react';
import { identity, Matrix } from 'transformation-matrix';
import { useDragHandler } from './useDragHandler';
import { useSpreadHandler } from './useSpreadHandler';
import { useToLocalCoordinates } from './useToLocalCoordinates';
import { useToSVGCoordinates } from './useToSVGCoordinates';
import { useZoomHandler } from './useZoomHandler';

interface ZoomContext {
  mouseDown: (event: MouseEvent) => void;
  mouseMove: (event: MouseEvent) => void;
  mouseUp: (event: MouseEvent) => void;
  spread: (event: WheelEvent) => void;
  spreadMatrix: Matrix;
  zoom: (event: WheelEvent) => void;
  zoomMatrix: Matrix;
}

const zoomContext = createContext<ZoomContext>(defaultZoomContext());

const useZoom = () => {
  return useContext(zoomContext);
};

const useZoomState = (svg: SVGSVGElement | null): ZoomContext => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spreadMatrix, setSpreadMatrix] = useState<Matrix>(identity());
  const [zoomMatrix, setZoomMatrix] = useState<Matrix>(identity());

  const mouseDown = useCallback(() => setIsDragging(true), []);
  const mouseMove = useCallback(() => {}, []);
  const mouseUp = useCallback(() => setIsDragging(false), []);
  const toSVGCoordinates = useToSVGCoordinates(svg);
  const toLocalCoordinates = useToLocalCoordinates(
    zoomMatrix,
    toSVGCoordinates
  );
  const spread = useSpreadHandler(
    spreadMatrix,
    zoomMatrix,
    toSVGCoordinates,
    setSpreadMatrix
  );
  const zoom = useZoomHandler(zoomMatrix, toLocalCoordinates, setZoomMatrix);

  return {
    mouseDown,
    mouseMove,
    mouseUp,
    spread,
    spreadMatrix,
    zoom,
    zoomMatrix
  };
};

const useControlledZoomState = (
  svg: SVGSVGElement | null,
  spreadMatrix: Matrix,
  zoomMatrix: Matrix,
  onSpreadMatrix: (matrix: Matrix) => void,
  onZoomMatrix: (matrix: Matrix) => void
): ZoomContext => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const toSVGCoordinates = useToSVGCoordinates(svg);
  const toLocalCoordinates = useToLocalCoordinates(
    zoomMatrix,
    toSVGCoordinates
  );

  const mouseDown = useCallback(() => setIsDragging(true), []);
  const mouseMove = useDragHandler(
    zoomMatrix,
    toLocalCoordinates,
    isDragging,
    onZoomMatrix
  );
  const mouseUp = useCallback(() => setIsDragging(false), []);
  const spread = useSpreadHandler(
    spreadMatrix,
    zoomMatrix,
    toSVGCoordinates,
    onSpreadMatrix
  );
  const zoom = useZoomHandler(zoomMatrix, toLocalCoordinates, onZoomMatrix);

  return {
    mouseDown,
    mouseMove,
    mouseUp,
    spreadMatrix,
    zoomMatrix,
    spread,
    zoom
  };
};

export interface ZoomProviderProps {
  svg: SVGSVGElement | null;
  spreadMatrix?: Matrix;
  zoomMatrix?: Matrix;
  onSpreadMatrix?: (matrix: Matrix) => void;
  onZoomMatrix?: (matrix: Matrix) => void;
}

const ZoomProvider = ({
  children,
  svg,
  spreadMatrix,
  zoomMatrix,
  onSpreadMatrix,
  onZoomMatrix
}: PropsWithChildren<ZoomProviderProps>) => {
  const isControlled =
    spreadMatrix !== undefined &&
    zoomMatrix !== undefined &&
    onSpreadMatrix !== undefined &&
    onZoomMatrix !== undefined;
  const zoomState = isControlled
    ? useControlledZoomState(
        svg,
        spreadMatrix,
        zoomMatrix,
        onSpreadMatrix,
        onZoomMatrix
      )
    : useZoomState(svg);
  return (
    <zoomContext.Provider value={zoomState}>{children}</zoomContext.Provider>
  );
};

function defaultZoomContext(): ZoomContext {
  return {
    mouseDown: () => {},
    mouseMove: () => {},
    mouseUp: () => {},
    spread: () => {},
    spreadMatrix: identity(),
    zoom: () => {},
    zoomMatrix: identity()
  };
}

export { ZoomProvider, useZoom };
