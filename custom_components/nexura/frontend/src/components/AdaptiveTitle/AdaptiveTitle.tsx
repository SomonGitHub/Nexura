import React, { useState, useLayoutEffect, useRef } from 'react';

interface AdaptiveTitleProps {
    text: string;
    className?: string;
    maxFontSize?: string; // e.g., '1.1rem'
}

/**
 * AdaptiveTitle component that uses SVG to ensure text fits on a single line.
 * It measures the actual text length to set a precise viewBox for high-quality auto-scaling.
 */
export const AdaptiveTitle: React.FC<AdaptiveTitleProps> = ({
    text,
    className = "",
    maxFontSize = "1.1rem"
}) => {
    const textRef = useRef<SVGTextElement>(null);
    const [viewBoxWidth, setViewBoxWidth] = useState(200);

    // Dynamic measurement after initial render/text change
    useLayoutEffect(() => {
        if (textRef.current) {
            // Precise measurement from the browser's SVG engine
            const length = textRef.current.getComputedTextLength();
            // We set the viewBox width precisely to the text length + a tiny safety margin
            setViewBoxWidth(Math.max(10, length + 2));
        }
    }, [text]);

    return (
        <div
            className={`adaptive-title-container ${className}`}
            style={{
                width: '100%',
                maxHeight: maxFontSize,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }}
        >
            <svg
                viewBox={`0 0 ${viewBoxWidth} 24`}
                width="100%"
                height="100%"
                preserveAspectRatio="xMinYMid meet"
                style={{ display: 'block' }}
            >
                <text
                    ref={textRef}
                    x="0"
                    y="18"
                    style={{
                        fill: 'currentColor',
                        fontSize: '18px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        whiteSpace: 'pre'
                    }}
                >
                    {text}
                </text>
            </svg>
        </div>
    );
};
