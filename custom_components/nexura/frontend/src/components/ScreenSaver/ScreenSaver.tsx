import React, { useState, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
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
    const overlayRef = useRef<HTMLDivElement>(null);
    const clockRef = useRef<HTMLDivElement>(null);
    const alertsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Entrance animation
        if (overlayRef.current) {
            animate(overlayRef.current, {
                opacity: [0, 1],
                duration: 1000,
                easing: 'easeOutCubic'
            });
        }

        // Clock floating animation
        if (clockRef.current) {
            animate(clockRef.current, {
                translateY: [-10, 10],
                duration: 6000,
                direction: 'alternate',
                loop: true,
                easing: 'easeInOutQuad'
            });
        }
    }, []);

    useEffect(() => {
        // Active Alerts staggered reveal
        if (alertsRef.current && activeAlerts.length > 0) {
            const items = alertsRef.current.querySelectorAll('.screensaver-alert-item');
            if (items.length > 0) {
                animate(items, {
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: stagger(100),
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        }
    }, [activeAlerts.length]);

    return (
        <div
            className="screensaver-overlay"
            ref={overlayRef}
            style={{ opacity: 0 }}
        >
            <div className="screensaver-content">
                <div 
                    ref={clockRef}
                    className="screensaver-clock"
                >
                    <span className="time">{formattedTime}</span>
                    <span className="date">{formattedDate}</span>
                </div>

                {activeAlerts.length > 0 && (
                    <div
                        ref={alertsRef}
                        className="screensaver-alerts"
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
                    </div>
                )}
            </div>

            <div className="screensaver-hint">Toucher pour déverrouiller</div>
        </div>
    );
};
