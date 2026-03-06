import React from 'react';
import './BentoGrid.css';

interface BentoGridProps {
    children: React.ReactNode;
}

/**
 * BentoGrid component that organizes BentoTiles in a responsive grid.
 */
export const BentoGrid: React.FC<BentoGridProps> = ({ children }) => {
    return (
        <div className="bento-grid">
            {children}
        </div>
    );
};
