import React from 'react';
import { motion } from 'framer-motion';
import './Tiles.css';

interface ToggleContentProps {
    isOn: boolean;
    onToggle: (newState: boolean) => void;
    label?: string;
    isEditMode?: boolean;
}

export const ToggleContent: React.FC<ToggleContentProps> = ({ isOn, onToggle, label, isEditMode = false }) => {
    const toggleSwitch = (e: React.MouseEvent) => {
        // Prevent dragging when clicking the toggle
        e.stopPropagation();
        if (!isEditMode) {
            onToggle(!isOn);
        }
    };

    return (
        <div className={`tile-content-container tile-toggle ${isEditMode ? 'readonly' : ''}`}>
            {label && <span className="tile-label">{label}</span>}
            <div
                className={`switch-track ${isOn ? 'switch-on' : 'switch-off'}`}
                onClick={toggleSwitch}
            >
                <motion.div
                    className="switch-handle"
                    layout
                    transition={{
                        type: "spring",
                        stiffness: 700,
                        damping: 30
                    }}
                />
            </div>
        </div>
    );
};
