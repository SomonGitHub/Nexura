import React from 'react';
import { animate } from 'animejs';
import './AnimatedHalo.css';
import type { HaloType } from '../../hooks/useTileStatus';

interface AnimatedHaloProps {
    type: HaloType;
}

/**
 * AnimatedHalo displays a rotating gradient border effect around tiles.
 * Memoized because the halo type rarely changes and re-rendering the
 * motion.div unnecessarily is wasteful during drag operations.
 */
export const AnimatedHalo: React.FC<AnimatedHaloProps> = React.memo(({ type }) => {
    const haloRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (haloRef.current && type !== 'none') {
            animate(haloRef.current, {
                opacity: [0, 0.9],
                scale: [0.95, 1],
                duration: 600,
                easing: 'easeOutCubic'
            });
        }
    }, [type]);

    if (type === 'none') return null;

    return (
        <div
            ref={haloRef}
            className={`tile-animated-halo halo-${type}`}
            style={{ opacity: 0 }} /* Initial state for anime.js */
        >
            <div className="halo-gradient"></div>
        </div>
    );
});
