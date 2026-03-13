import React from 'react';
import { Radar, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import './MotionAlertContent.css';

interface MotionAlertContentProps {
    state: string;
    lastChanged?: string;
}

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

export const MotionAlertContent: React.FC<MotionAlertContentProps> = ({
    state,
    lastChanged
}) => {
    const isDetected = state === 'on' || state === 'detected' || state === 'occupancy' || state === 'motion';
    
    return (
        <div className={`motion-alert-content ${isDetected ? 'is-active' : 'is-idle'}`}>
            <div className="motion-icon-container">
                {isDetected ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="motion-icon-wrapper"
                    >
                        <Waves className="motion-icon active-icon" />
                        <motion.div 
                            className="wave-pulse"
                            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                        />
                    </motion.div>
                ) : (
                    <Radar className="motion-icon idle-icon" />
                )}
            </div>
            
            <div className="motion-status-info">
                <span className="motion-time">{formatRelativeTime(lastChanged)}</span>
            </div>
        </div>
    );
};
