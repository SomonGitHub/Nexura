import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../DynamicIcon/DynamicIcon';
import type { HassEntity } from 'home-assistant-js-websocket';
import './CoverContent.css';

interface CoverContentProps {
    entity: HassEntity | null;
    onAction: (action: 'open' | 'close' | 'stop') => void;
    size?: string;
}

export const CoverContent: React.FC<CoverContentProps> = ({ entity, onAction, size }) => {
    const state = entity?.state || 'unknown';
    const isOpening = state === 'opening';
    const isClosing = state === 'closing';
    const isSmall = size === 'small';

    const iconSize = isSmall ? 24 : 34;

    const getStatusLabel = () => {
        if (isOpening) return 'Ouverture...';
        if (isClosing) return 'Fermeture...';
        return state === 'open' ? 'Ouvert' : 'Fermé';
    };

    return (
        <div className={`cover-content premium ${isSmall ? 'small-tile' : ''}`}>
            <div className={`cover-status ${isSmall ? 'status-small' : ''}`}>
                {getStatusLabel()}
            </div>
            <div className="cover-controls">
                <motion.button
                    className={`cover-btn open ${isOpening ? 'active' : ''}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onAction('open'); }}
                    title="Ouvrir"
                >
                    <DynamicIcon name="ChevronsUp" size={iconSize} />
                </motion.button>

                <div className="stop-container">
                    <motion.button
                        className="cover-btn stop"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onAction('stop'); }}
                        title="Arrêter"
                    >
                        <DynamicIcon name="Octagon" size={isSmall ? 16 : 26} />
                    </motion.button>
                    {(isOpening || isClosing) && (
                        <div className="movement-indicator">
                            <span className="dot"></span>
                        </div>
                    )}
                </div>

                <motion.button
                    className={`cover-btn close ${isClosing ? 'active' : ''}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onAction('close'); }}
                    title="Fermer"
                >
                    <DynamicIcon name="ChevronsDown" size={iconSize} />
                </motion.button>
            </div>
        </div>
    );
};
