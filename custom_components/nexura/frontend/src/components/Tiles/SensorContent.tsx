import React from 'react';
import './SensorContent.css';

interface SensorContentProps {
    value: string | number;
    unit?: string;
    label?: string;
    variant?: 'none' | 'danger' | 'info';
}

export const SensorContent: React.FC<SensorContentProps> = ({ value, unit, label, variant = 'none' }) => {
    return (
        <div className={`sensor-content variant-${variant}`}>
            <div className="sensor-value-container">
                <span className="sensor-value">{value}</span>
                {unit && <span className="sensor-unit">{unit}</span>}
            </div>
            {label && <div className="sensor-label">{label}</div>}
        </div>
    );
};
