import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect user inactivity
 * @param timeout Delay in milliseconds before stating inactivity
 * @returns boolean true if user is inactive
 */
export const useInactivity = (timeout: number = 300000) => {
    const [isInactive, setIsInactive] = useState(false);

    const resetInactivity = useCallback(() => {
        setIsInactive(false);
    }, []);

    useEffect(() => {
        let timer: number;

        const handleActivity = () => {
            resetInactivity();
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setIsInactive(true), timeout);
        };

        // Events to monitor for activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial timer
        timer = window.setTimeout(() => setIsInactive(true), timeout);

        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        return () => {
            window.clearTimeout(timer);
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [timeout, resetInactivity]);

    return isInactive;
};
