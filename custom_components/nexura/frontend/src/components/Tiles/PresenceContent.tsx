import React from 'react';
import { motion } from 'framer-motion';
import './PresenceContent.css';

interface PresenceContentProps {
    /** Current state of the entity ('on'/'off', 'detected'/'clear', etc.) */
    state: string;
    /** Device class of the entity */
    deviceClass?: string;
    /** Last changed timestamp from Hass entity */
    lastChanged?: string;
    /** Current label (usually friendly name) */
    label?: string;
    /** The tile's overall title to avoid repetition */
    tileTitle?: string;
}

/**
 * Format relative time (e.g., "Il y a 5 min")
 */
const formatRelativeTime = (lastChanged?: string): string => {
    if (!lastChanged) return '';
    const now = new Date();
    const then = new Date(lastChanged);
    const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffSeconds < 60) return "À l'instant";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${Math.floor(hours / 24)} j`;
};

export const PresenceContent: React.FC<PresenceContentProps> = ({
    state,
    deviceClass,
    lastChanged,
    label,
    tileTitle
}) => {
    const isDetected = state === 'on' || state === 'detected' || state === 'occupancy' || state === 'motion';
    
    // Determine the status text
    const getStatusText = () => {
        if (isDetected) {
            return deviceClass === 'motion' ? 'Mouvement' : 'Présence';
        }
        return 'Calme';
    };

    // Only show label if it's different from the tile title
    const shouldShowLabel = label && tileTitle && label.toLowerCase() !== tileTitle.toLowerCase();

    return (
        <div className={`presence-content ${isDetected ? 'is-detected' : 'is-clear'}`}>
            <div className="presence-visual">
                {/* Background circles */}
                <div className="radar-circle circle-1" />
                <div className="radar-circle circle-2" />
                <div className="radar-circle circle-3" />
                
                {/* Ripple animation when detected */}
                {isDetected && (
                    <>
                        <motion.div 
                            className="radar-ripple"
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                        />
                        <motion.div 
                            className="radar-ripple"
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 1 }}
                        />
                    </>
                )}

                {/* Center dot */}
                <div className="radar-dot">
                    <motion.div 
                        className="dot-inner"
                        animate={isDetected ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                    />
                </div>
            </div>

            <div className="presence-info-container">
                <div className="presence-info">
                    <span className="presence-status">{getStatusText()}</span>
                    <span className="presence-separator">•</span>
                    <span className="presence-time">{formatRelativeTime(lastChanged)}</span>
                </div>

                {shouldShowLabel && <div className="presence-label">{label}</div>}
            </div>
        </div>
    );
};
