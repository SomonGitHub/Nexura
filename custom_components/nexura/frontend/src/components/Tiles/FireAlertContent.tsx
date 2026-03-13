import React from 'react';
import { Flame, ShieldAlert } from 'lucide-react';
import './FireAlertContent.css';

interface FireAlertContentProps {
    isOn: boolean;
    isEditMode?: boolean;
}

export const FireAlertContent: React.FC<FireAlertContentProps> = ({ isOn, isEditMode }) => {
    return (
        <div className={`fire-alert-content ${isOn ? 'is-active' : 'is-idle'}`}>
            <div className="fire-alert-icon-container">
                {isOn ? (
                    <Flame className="fire-alert-icon flame-icon" />
                ) : (
                    <ShieldAlert className="fire-alert-icon shield-icon" />
                )}
            </div>
            {isOn && (
                <div className="fire-alert-label">
                    FUMÉE DÉTECTÉE
                </div>
            )}
            {isEditMode && !isOn && (
                <div className="fire-alert-status-hint">
                    Veille Sécurité
                </div>
            )}
        </div>
    );
};
