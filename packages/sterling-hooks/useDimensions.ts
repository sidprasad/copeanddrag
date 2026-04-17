import { MutableRefObject, RefObject, useLayoutEffect, useState } from 'react';

const useDimensions = (
  target: RefObject<HTMLElement> | MutableRefObject<HTMLElement>,
  callback?: (rect: DOMRect) => void
) => {
  const [size, setSize] = useState<DOMRect>();
  useLayoutEffect(() => {
    const current = target.current;
    if (current) {
      setSize(current.getBoundingClientRect());
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === current) {
            if (callback) {
              callback(entry.contentRect);
            } else {
              setSize(entry.contentRect);
            }
          }
        });
      });
      resizeObserver.observe(current);
      return () => {
        resizeObserver.unobserve(current);
      };
    }
  }, [target.current]);
  return size;
};

export { useDimensions };
