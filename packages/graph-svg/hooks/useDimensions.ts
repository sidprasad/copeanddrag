import { useLayoutEffect, useState } from 'react';

const useDimensions = (target: React.RefObject<HTMLDivElement>) => {
    const [size, setSize] = useState<DOMRect>();
    useLayoutEffect(() => {
        const current = target.current;
        if (current) {
            setSize(current.getBoundingClientRect());
            const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
                entries.forEach(entry => {
                    if (entry.target === target.current) {
                        setSize(entry.contentRect);
                    }
                });
            });
            resizeObserver.observe(current);
            return () => {
                resizeObserver.unobserve(current);
            }
        }
    }, [target]);
    return size;
};

export default useDimensions;