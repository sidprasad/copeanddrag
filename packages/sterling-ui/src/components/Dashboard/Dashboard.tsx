import { Box, useStyleConfig } from '@chakra-ui/react';
import { clamp, throttle } from 'lodash-es';
import {
  Children,
  CSSProperties,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import sizes from '../../sizes';
import { HANDLE_PAD } from './constants';
import { DragHandle } from './DragHandle';

interface DashboardProps {
  bottomPaneCollapsed: boolean;
  bottomPaneInitialHeight: number;
  bottomPaneMinHeight: number;
  bottomPaneMaxHeight: number;
}

// The dashboard splits its two children vertically: the main stage fills the
// top, the drawer docks to the bottom (VS Code "bottom panel" style). The seam
// between them is a horizontal, row-resize drag handle. A collapsed drawer
// slides fully below the viewport edge so the stage takes the full height.
const Dashboard = (props: PropsWithChildren<DashboardProps>) => {
  const {
    children,
    bottomPaneCollapsed,
    bottomPaneInitialHeight,
    bottomPaneMinHeight,
    bottomPaneMaxHeight
  } = props;

  const ref = useRef<HTMLDivElement | null>(null);
  const styles = useStyleConfig('Dashboard');

  const [clickOffset, setClickOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(bottomPaneInitialHeight);

  // Height the drawer actually occupies (0 when collapsed)...
  const bottomH = useMemo(
    () => (bottomPaneCollapsed ? 0 : height),
    [bottomPaneCollapsed, height]
  );
  // ...and how far it is translated below the bottom edge when collapsed.
  const bottomB = useMemo(
    () => (bottomPaneCollapsed ? -height : 0),
    [bottomPaneCollapsed, height]
  );

  const topStyle = useMemo<CSSProperties>(
    () => style(undefined, 0, bottomH, dragging),
    [bottomH, dragging]
  );

  const bottomStyle = useMemo<CSSProperties>(
    () => style(height, undefined, bottomB, dragging),
    [height, bottomB, dragging]
  );

  const handleStyle = useMemo<CSSProperties>(
    () => style(undefined, undefined, bottomB + height, dragging),
    [bottomB, height, dragging]
  );

  const onMouseDown = useCallback((event: any) => {
    const rect = event.target.getBoundingClientRect();
    setClickOffset(event.clientY - rect.top);
    setDragging(true);
  }, []);

  const onMouseMove = useCallback(
    throttle((event) => {
      if (dragging) {
        const current = ref.current;
        if (current) {
          window.getSelection()?.empty();
          const bbox = current.getBoundingClientRect();
          const h = bbox.bottom - event.clientY + clickOffset - HANDLE_PAD;
          setHeight(clamp(h, bottomPaneMinHeight, bottomPaneMaxHeight));
        }
      }
    }, 16),
    [clickOffset, dragging, bottomPaneMinHeight, bottomPaneMaxHeight]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const definedChildren = Children.toArray(children).filter((c) => c);

  return definedChildren.length === 2 ? (
    <Box ref={ref} __css={styles}>
      <div style={topStyle}>{definedChildren[0]}</div>
      <div style={bottomStyle}>{definedChildren[1]}</div>

      {!bottomPaneCollapsed && (
        <div style={handleStyle} onMouseDown={onMouseDown}>
          <DragHandle />
        </div>
      )}
    </Box>
  ) : null;
};

const DashboardTheme = {
  baseStyle: {
    position: 'fixed',
    top: `${sizes.navBarSize}px`,
    right: '0',
    bottom: '0',
    left: '0'
  }
};

// Each child spans the full width and is anchored vertically: pass `top` for
// the stage and `bottom` (+ a fixed `height`) for the drawer.
function style(
  height?: number,
  top?: number,
  bottom?: number,
  noTransitions?: boolean
): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    left: '0',
    right: '0',
    transition: noTransitions
      ? undefined
      : 'all 200ms cubic-bezier(0.85, 0, 0.15, 1)'
  };
  if (height !== undefined) style.height = `${height}px`;
  if (top !== undefined) style.top = `${top}px`;
  if (bottom !== undefined) style.bottom = `${bottom}px`;
  return style;
}

export { Dashboard, DashboardTheme };
