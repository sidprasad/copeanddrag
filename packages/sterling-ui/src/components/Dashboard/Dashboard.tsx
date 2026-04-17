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
  rightPaneCollapsed: boolean;
  rightPaneInitialWidth: number;
  rightPaneMinWidth: number;
  rightPaneMaxWidth: number;
}

const Dashboard = (props: PropsWithChildren<DashboardProps>) => {
  const {
    children,
    rightPaneCollapsed,
    rightPaneInitialWidth,
    rightPaneMinWidth,
    rightPaneMaxWidth
  } = props;

  const ref = useRef<HTMLDivElement | null>(null);
  const styles = useStyleConfig('Dashboard');

  const [rightClickOffset, setRightClickOffset] = useState<number>(0);
  const [rightDragging, setRightDragging] = useState<boolean>(false);
  const [rightWidth, setRightWidth] = useState<number>(rightPaneInitialWidth);

  const middleR = useMemo(
    () => (rightPaneCollapsed ? 0 : rightWidth),
    [rightPaneCollapsed, rightWidth]
  );
  const rightR = useMemo(
    () => (rightPaneCollapsed ? -rightWidth : 0),
    [rightPaneCollapsed, rightWidth]
  );

  const middleStyle = useMemo<CSSProperties>(
    () => style(undefined, 0, middleR, false || rightDragging),
    [0, middleR, false, rightDragging]
  );

  const rightStyle = useMemo<CSSProperties>(
    () => style(rightWidth, undefined, rightR, rightDragging),
    [rightWidth, rightR, rightDragging]
  );

  const rightHandleStyle = useMemo<CSSProperties>(
    () => style(undefined, undefined, rightR + rightWidth, rightDragging),
    [rightR, rightWidth, rightDragging]
  );

  const onMouseDown = useCallback(
    (side, event) => {
      const rect = event.target.getBoundingClientRect();
      const offset = event.clientX - rect.left;
      switch (side) {
        case 'right':
          setRightClickOffset(offset);
          setRightDragging(true);
          break;
      }
    },
    [setRightDragging]
  );

  const onMouseMove = useCallback(
    throttle((event) => {
      if (rightDragging) {
        const current = ref.current;
        if (current) {
          window.getSelection()?.empty();
          const bbox = current.getBoundingClientRect();
          const w = bbox.width - event.clientX + rightClickOffset - HANDLE_PAD;
          setRightWidth(clamp(w, rightPaneMinWidth, rightPaneMaxWidth));
        }
      }
    }, 16),
    [
      rightClickOffset,
      rightDragging,
      rightPaneMinWidth,
      rightPaneMaxWidth
    ]
  );

  const onMouseUp = useCallback(() => {
    setRightDragging(false);
  }, [setRightDragging]);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const definedChildren = Children.toArray(children).filter((c) => c);

  return definedChildren.length === 2 ? ( //3
    <Box ref={ref} __css={styles}>
      <div style={middleStyle}>{definedChildren[0]}</div>
      <div style={rightStyle}>{definedChildren[1]}</div>
      
      <div
        style={rightHandleStyle}
        onMouseDown={(event) => onMouseDown('right', event)}
      >
        <DragHandle />
      </div>
    </Box>
  ) : null;
};

const DashboardTheme = {
  baseStyle: {
    position: 'fixed',
    top: `${sizes.navBarSize}px`,
    right: `${sizes.sideBarSize}px`,
    bottom: `${sizes.statusBarSize}px`,
    left: '0'
  }
};

function style(
  width?: number,
  left?: number,
  right?: number,
  noTransitions?: boolean
): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    transition: noTransitions
      ? undefined
      : 'all 200ms cubic-bezier(0.85, 0, 0.15, 1)'
  };
  if (width !== undefined) style.width = `${width}px`;
  if (left !== undefined) style.left = `${left}px`;
  if (right !== undefined) style.right = `${right}px`;
  return style;
}

export { Dashboard, DashboardTheme };
