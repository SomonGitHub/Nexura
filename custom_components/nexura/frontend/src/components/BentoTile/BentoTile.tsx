import React from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { DynamicIcon } from '../DynamicIcon/DynamicIcon';
import { AnimatedHalo } from '../AnimatedHalo/AnimatedHalo';
import { getHaloType } from '../../hooks/useTileStatus';
import { AdaptiveTitle } from '../AdaptiveTitle/AdaptiveTitle';
import type { HassEntities } from 'home-assistant-js-websocket';
import './BentoTile.css';

export type TileSize = 'small' | 'square' | 'rect' | 'large-square' | 'large-rect' | 'mini';

interface BentoTileProps {
    id: string;
    size?: TileSize;
    children?: React.ReactNode;
    title?: string;
    type?: string;
    onClick?: () => void;
    isOverlay?: boolean;
    isEditMode?: boolean;
    onDelete?: () => void;
    onResize?: () => void;
    onEdit?: () => void;
    onToggleFavorite?: () => void;
    icon?: string;
    color?: string;
    entityId?: string;
    hassEntities?: HassEntities;
    isFavorite?: boolean;
    className?: string;
    forcedHaloType?: import('../../hooks/useTileStatus').HaloType;
    noPadding?: boolean;
    hideHeader?: boolean;
}

/**
 * BentoTile component representing an individual tile in the grid.
 * Uses framer-motion for smooth interactions and @dnd-kit for sorting.
 */
export const BentoTile: React.FC<BentoTileProps> = ({
    id,
    size = 'small',
    children,
    title,
    type,
    onClick,
    isOverlay = false,
    isEditMode = false,
    onDelete,
    onResize,
    onEdit,
    onToggleFavorite,
    icon,
    color,
    entityId,
    hassEntities = {},
    isFavorite = false,
    className = '',
    forcedHaloType,
    noPadding = false,
    hideHeader = false
}) => {
    // Determine halo type based on entity status or forced override
    const haloType = forcedHaloType || getHaloType(entityId, hassEntities);
    const isSpacer = type === 'spacer';

    // IMPORTANT: The DragOverlay component should not use useSortable 
    // to avoid duplicate registration of the same ID in dnd-kit's internal state.
    const sortable = useSortable({ id, disabled: isOverlay });
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging,
    } = sortable;

    const style = {
        zIndex: isDragging ? 5 : 1,
        '--tile-accent-color': color || 'var(--accent-glow)',
        // No global touchAction: none here to allow scrolling the dashboard
        userSelect: 'none',
        WebkitUserSelect: 'none',
    } as React.CSSProperties;

    const sizeClass = `tile-${size}`;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            // listeners are removed from here and moved to the handle
            layout
            initial={false}
            animate={{}}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
            className={`bento-tile ${sizeClass} ${isSpacer ? 'tile-spacer' : ''} ${isDragging ? 'dragging' : ''} ${isDragging && !isOverlay ? 'is-dragging-original' : ''} ${isOverlay ? 'overlay' : ''} ${isEditMode ? 'edit-mode' : ''} ${noPadding ? 'no-padding' : ''} ${className}`}
            whileHover={!isOverlay && !isDragging ? { scale: 1.02 } : undefined}
            whileTap={!isOverlay && !isDragging && !isEditMode ? { scale: 0.98 } : undefined}
            onClick={!isEditMode ? onClick : undefined}
            onContextMenu={(e) => isEditMode ? e.preventDefault() : undefined}
        >
            {!isSpacer && <AnimatedHalo type={haloType} />}

            {isEditMode && !isOverlay && (
                <div className="edit-actions">
                    <button
                        className="btn-tile-action btn-drag-handle"
                        {...listeners}
                        title="Déplacer"
                        style={{ touchAction: 'none' }} // Crucial: only the handle blocks touch default
                    >
                        ⠿
                    </button>
                    <button
                        className={`btn-tile-action btn-favorite ${isFavorite ? 'is-favorite' : ''}`}
                        onPointerDown={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                        {isFavorite ? '⭐' : '☆'}
                    </button>
                    <button
                        className="btn-tile-action btn-edit"
                        onPointerDown={(e) => { e.stopPropagation(); onEdit?.(); }}
                        title="Modifier"
                    >
                        ✏️
                    </button>
                    <button
                        className="btn-tile-action btn-resize"
                        onPointerDown={(e) => { e.stopPropagation(); onResize?.(); }}
                        title="Redimensionner"
                    >
                        📐
                    </button>
                    <button
                        className="btn-tile-action btn-delete"
                        onPointerDown={(e) => { e.stopPropagation(); onDelete?.(); }}
                        title="Supprimer"
                    >
                        ❌
                    </button>
                </div>
            )}

            {!isSpacer && !hideHeader && (
                <div className="tile-header">
                    {icon && (
                        <div className="tile-icon-container" style={{ color: color }}>
                            <DynamicIcon name={icon} size={20} />
                        </div>
                    )}
                    {title && (
                        <AdaptiveTitle
                            text={title}
                            className="tile-title"
                            maxFontSize="1.1rem"
                        />
                    )}
                </div>
            )}

            <div className="tile-content" style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}>
                {children}
            </div>
        </motion.div>
    );
};
