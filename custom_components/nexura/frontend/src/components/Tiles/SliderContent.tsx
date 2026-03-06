import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './Tiles.css';

interface SliderContentProps {
    value: number;
    onChange: (newValue: number) => void;
    isOn?: boolean;
    onToggle?: (newState: boolean) => void;
    label?: string;
    unit?: string;
    isEditMode?: boolean;
}

export const SliderContent: React.FC<SliderContentProps> = ({
    value,
    onChange,
    isOn = true,
    onToggle,
    label,
    unit = '%',
    isEditMode = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);

    // Sync motion value with prop value initially
    useEffect(() => {
        if (containerRef.current) {
            const width = containerRef.current.offsetWidth;
            dragX.set((value / 100) * width);
        }
    }, [value, dragX]);

    const fillWidth = useTransform(dragX, (x) => {
        if (!containerRef.current) return '0%';
        const percentage = (x / containerRef.current.offsetWidth) * 100;
        return `${Math.max(0, Math.min(100, percentage))}%`;
    });

    const handleDragEnd = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.offsetWidth;
        const percentage = (dragX.get() / width) * 100;
        const finalValue = Math.round(Math.max(0, Math.min(100, percentage)));
        onChange(finalValue);
    };

    // Prevent event propagation so DND-kit doesn't pick up the slider drag
    const stopPropagation = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="tile-content-container tile-slider">
            {label && (
                <div className="slider-header">
                    <div className="slider-header-left">
                        <span className="tile-label">{label}</span>
                        {onToggle && (
                            <div
                                className={`slider-toggle-mini ${isOn ? 'on' : 'off'}`}
                                onClick={(e) => { e.stopPropagation(); !isEditMode && onToggle(!isOn); }}
                            >
                                <motion.div
                                    className="mini-handle"
                                    layout
                                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                />
                            </div>
                        )}
                    </div>
                    <span className="slider-value">{value}{unit}</span>
                </div>
            )}
            <div
                className="slider-track-container"
                ref={containerRef}
                onPointerDown={stopPropagation}
            >
                <div className="slider-track-bg" />
                <motion.div
                    className="slider-track-fill"
                    style={{ width: fillWidth }}
                />
                <motion.div
                    className="slider-thumb"
                    style={{ x: dragX }}
                    drag={!isEditMode ? "x" : false}
                    dragMomentum={false}
                    dragConstraints={containerRef}
                    dragElastic={0}
                    onDragEnd={handleDragEnd}
                    onPointerDown={!isEditMode ? stopPropagation : undefined}
                />
            </div>
        </div>
    );
};
