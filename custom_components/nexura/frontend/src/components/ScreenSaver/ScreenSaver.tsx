import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicIcon } from '../DynamicIcon/DynamicIcon';
import type { HassEntities } from 'home-assistant-js-websocket';
import './ScreenSaver.css';

interface ScreenSaverProps {
    entities: HassEntities;
}

export const ScreenSaver: React.FC<ScreenSaverProps> = ({ entities }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Extract urgent alerts (smoke, gas, moisture, opening)
    const activeAlerts = Object.values(entities).filter(entity => {
        const dc = entity.attributes.device_class;
        const state = entity.state;
        const isDanger = state === 'on' || state === 'open' || state === 'tripped' || state === 'problem';

        return isDanger && ['smoke', 'gas', 'moisture', 'safety', 'window', 'door', 'garage_door'].includes(dc || '');
    });

    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <motion.div
            className="screensaver-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
        >
            <div className="screensaver-content">
                <motion.div
                    className="screensaver-clock"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="time">{formattedTime}</span>
                    <span className="date">{formattedDate}</span>
                </motion.div>

                <AnimatePresence>
                    {activeAlerts.length > 0 && (
                        <motion.div
                            className="screensaver-alerts"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                        >
                            <h3 className="alert-title">Alertes Actives</h3>
                            <div className="alert-list">
                                {activeAlerts.slice(0, 3).map(alert => (
                                    <div key={alert.entity_id} className="screensaver-alert-item danger">
                                        <DynamicIcon name="AlertTriangle" size={16} />
                                        <span>{alert.attributes.friendly_name || alert.entity_id}</span>
                                    </div>
                                ))}
                                {activeAlerts.length > 3 && (
                                    <div className="alert-more">+{activeAlerts.length - 3} autres...</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="screensaver-hint">Toucher pour déverrouiller</div>
        </motion.div>
    );
};
