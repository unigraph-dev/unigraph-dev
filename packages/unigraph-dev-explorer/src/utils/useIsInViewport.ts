import { useState, useMemo, useEffect, RefObject, useRef } from 'react';

export function useIsInViewport(ref: RefObject<HTMLElement>, parRef: RefObject<{ el: HTMLElement }> | undefined) {
    const [isIntersecting, setIsIntersecting] = useState<any>(false);
    const shown = useRef(false);

    const observer = useMemo(
        () =>
            new IntersectionObserver(
                ([entry]) => {
                    shown.current =
                        shown.current ||
                        !!(
                            entry.rootBounds &&
                            entry.rootBounds.y > 0 &&
                            entry.boundingClientRect.y - entry.rootBounds.y >= 0
                        );
                    setIsIntersecting(
                        shown.current &&
                            entry.rootBounds &&
                            entry.rootBounds.y > 0 &&
                            entry.boundingClientRect.y - entry.rootBounds.y < 0,
                    );
                },
                {
                    root: parRef?.current?.el,
                },
            ),
        [parRef],
    );

    useEffect(() => {
        if (ref.current === null) return () => false;

        setTimeout(() => {
            if (ref.current === null) return;
            observer.observe(ref.current);
        }, 1000);

        return () => {
            observer.disconnect();
        };
    }, [ref, observer]);

    return isIntersecting;
}
