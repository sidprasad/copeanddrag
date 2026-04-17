import { forwardRef, PropsWithChildren, SVGAttributes, useRef } from 'react';
import { toString } from 'transformation-matrix';
import { WithInteractionCallbacks } from './providers/interaction/interactionCallbacks';
import {
  InteractionProvider,
  useInteraction
} from './providers/interaction/InteractionProvider';

const SVG = forwardRef<SVGSVGElement>(
  (props: PropsWithChildren<SVGAttributes<SVGSVGElement>>, ref) => {
    const { children, ...rest } = props;
    const { onMouseDown, onMouseMove, onMouseUp, onWheel, zoomMatrix } =
      useInteraction();
    return (
      <svg
        ref={ref}
        preserveAspectRatio='xMidYMid slice'
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        {...rest}
      >
        <g transform={toString(zoomMatrix)}>{children}</g>
      </svg>
    );
  }
);

export type GraphSVGProps = PropsWithChildren<
  WithInteractionCallbacks<SVGAttributes<SVGSVGElement>>
>;

const GraphSVG = (props: GraphSVGProps) => {
  const { callbacks, ...rest } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  return (
    <InteractionProvider svg={svgRef.current} {...callbacks}>
      <SVG ref={svgRef} {...rest} />
    </InteractionProvider>
  );
};

export { GraphSVG };
