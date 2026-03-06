import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
    name: string;
    size?: number;
    color?: string;
    className?: string;
}

/**
 * Renders a Lucide icon by its name.
 * Handles cases where the icon might not exist.
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 24, color, className }) => {
    // @ts-ignore - Accessing LucideIcons object by string key
    const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;

    return <IconComponent size={size} color={color} className={className} />;
};
