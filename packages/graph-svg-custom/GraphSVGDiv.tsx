import { useDimensions } from '@/sterling-hooks';
import { PropsWithChildren, useMemo, useRef, HTMLAttributes } from 'react';
import { GraphSVG } from './GraphSVG';
import { WithInteractionCallbacks } from './providers/interaction/interactionCallbacks';

export type GraphSVGDivProps = PropsWithChildren<
  WithInteractionCallbacks<HTMLAttributes<HTMLDivElement>>
>;

const GraphSVGDiv = (props: GraphSVGDivProps) => {
  const { callbacks, children, ...rest } = props;
  const ref = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(ref);
  const width = useMemo(() => dimensions?.width, [dimensions]);
  const height = useMemo(() => dimensions?.height, [dimensions]);
  const viewBox = useMemo(() => {
    return width && height
      ? `${-width / 2} ${-height / 2} ${width} ${height}`
      : undefined;
  }, [width, height]);

  return (
    <div ref={ref} {...rest}>
      <GraphSVG callbacks={callbacks} viewBox={viewBox}>
        {children}
      </GraphSVG>
    </div>
  );
};

export { GraphSVGDiv };
