import React from 'react';
import type { HassEntities } from 'home-assistant-js-websocket';
import type { TileData, TileType, TileTheme, VisibilityOperator, VisibilityRule, VisibilityRuleType } from '../../App';
import type { TileSize } from '../BentoTile/BentoTile';
import { useTranslation } from 'react-i18next';
import { animate } from 'animejs';
import './AddTileModal.css';

interface AddTileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (tile: TileData) => void;
    hassEntities: HassEntities;
    defaultRoom?: string;
    tileToEdit?: TileData;
}

export const AddTileModal: React.FC<AddTileModalProps> = ({ isOpen, onClose, onAdd, hassEntities, defaultRoom, tileToEdit }) => {
    const { t } = useTranslation();
    const [title, setTitle] = React.useState('');
    const [type, setType] = React.useState<TileType>('info');
    const [size, setSize] = React.useState<TileSize>('small');
    const [entityId, setEntityId] = React.useState('');
    const [room, setRoom] = React.useState(defaultRoom || '');
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [tileTheme, setTileTheme] = React.useState<TileTheme | ''>('');

    // Predictive Tile Visibility Rule States
    const [useVisibilityRule, setUseVisibilityRule] = React.useState(false);
    const [visibilityRules, setVisibilityRules] = React.useState<VisibilityRule[]>([]);
    const [scanningRuleIndex, setScanningRuleIndex] = React.useState<number | null>(null);
    const [ruleSearchTerm, setRuleSearchTerm] = React.useState('');
    const modalRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            // Premium entrance with Anime.js
            if (modalRef.current) {
                animate(modalRef.current, {
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutCubic'
                });
            }

            if (contentRef.current) {
                animate(contentRef.current, {
                    scale: [0.85, 1],
                    opacity: [0, 1],
                    translateY: [40, 0],
                    duration: 600,
                    easing: 'easeOutElastic(1, .8)',
                    delay: 100
                });
            }
        }
    }, [isOpen]);


    React.useEffect(() => {
        if (tileToEdit && isOpen) {
            setTitle(tileToEdit.title || '');
            setType(tileToEdit.type || 'info');
            setSize(tileToEdit.size || 'small');
            setEntityId(tileToEdit.entityId || '');
            setRoom(tileToEdit.room || '');
            setTileTheme(tileToEdit.tileTheme || '');
            
            if (tileToEdit.visibilityRules || tileToEdit.visibilityRule) {
                setUseVisibilityRule(true);
                const rules: VisibilityRule[] = tileToEdit.visibilityRules ? [...tileToEdit.visibilityRules] : [];
                // Migrate single rule if exists
                if (tileToEdit.visibilityRule) {
                    rules.push({ ...tileToEdit.visibilityRule, type: 'entity' });
                }
                setVisibilityRules(rules);
            } else {
                setUseVisibilityRule(false);
                setVisibilityRules([{ type: 'entity', entityId: '', operator: '=', value: '' }]);
            }

        } else if (isOpen) {
            // Reset for new tile
            setTitle('');
            setType('info');
            setSize('small');
            setEntityId('');
            setRoom(defaultRoom === 'Inconnue' ? '' : (defaultRoom || ''));
            setTileTheme('');
            setUseVisibilityRule(false);
            setVisibilityRules([{ type: 'entity', entityId: '', operator: '=', value: '' }]);
        }
    }, [tileToEdit, isOpen, defaultRoom]);

    React.useEffect(() => {
        if ((type === 'cover' || type === 'slider') && size === 'small') {
            setSize('rect');
        }
        if (type === 'scene') {
            setSize('small');
        }
        if (type === 'energy-flow' && (size === 'small' || size === 'rect' || size === 'square')) {
            setSize('large-square');
        }
    }, [type, size]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        // Extract current state for the selected entity if available
        const entity = entityId ? hassEntities[entityId] : null;



        const newTile: TileData = {
            id: Date.now().toString(),
            title,
            room: room || undefined,
            type,
            size,
            entityId: entityId || undefined,
            // Default contents based on type and current entity state
            isOn: type === 'toggle' ? (entity ? entity.state === 'on' : false) : undefined,
            value: type === 'slider' ? (entity?.attributes?.brightness ? Math.round((entity.attributes.brightness / 255) * 100) : 0) : undefined,
            graphData: type === 'graph' ? [] : undefined,
            tileTheme: tileTheme || undefined,
            isFavorite: tileToEdit?.isFavorite,
            visibilityRules: useVisibilityRule ? visibilityRules.filter(r => {
                if (r.type === 'entity') return r.entityId && r.value !== undefined;
                if (r.type === 'time') return r.startTime && r.endTime;
                return false;
            }) : undefined,
        };

        // Set default icon based on type
        if (type === 'media') newTile.icon = 'Music';
        if (type === 'scene') newTile.icon = 'Play';
        if (type === 'camera') newTile.icon = 'Camera';
        if (type === 'fire-alert') newTile.icon = 'Flame';
        
        onAdd(newTile);
        onClose();
        // Reset form
        setTitle('');
        setType('info');
        setSize('small');
        setEntityId('');
        setRoom(defaultRoom || '');
        setTileTheme('');
        setUseVisibilityRule(false);
        setVisibilityRules([]);

        setIsScannerOpen(false);
        setSearchTerm('');
        setScanningRuleIndex(null);
        setRuleSearchTerm('');
    };

    const handleSelectEntity = (id: string) => {
        setEntityId(id);
        const entity = hassEntities[id];
        if (entity) {
            if (!title) setTitle(entity.attributes.friendly_name || id);
            // Auto-detect type
            if (id.startsWith('cover.')) {
                setType('cover');
                setSize('rect'); // Enforce min size for covers
            } else if (id.startsWith('media_player.')) {
                setType('media');
                setSize('large-rect');
            } else if (id.startsWith('light.') || id.startsWith('switch.')) {
                setType('toggle');
            } else if (id.startsWith('scene.')) {
                setType('scene');
                setSize('small');
            } else if (id.startsWith('camera.')) {
                setType('camera');
                setSize('large-rect');
            }

            // If room is empty or matches Inconnue, try to pre-fill
            if ((!room || room === 'Inconnue') && entity.attributes.area_id) {
                setRoom(entity.attributes.area_id);
            } else if (!room || room === 'Inconnue') {
                setRoom(defaultRoom || '');
            }
        }
        setIsScannerOpen(false);
    };

    const filteredEntities = Object.keys(hassEntities).filter(id => {
        const entity = hassEntities[id];
        const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        // Match ID or Friendly Name
        return id.toLowerCase().includes(searchLower) || friendlyName.includes(searchLower);
    }).slice(0, 50); // Increased limit to 50 for better usability without too much lag

    return (
        <div className="modal-overlay" ref={modalRef}>
            <div className="modal-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
                <h2>{tileToEdit ? t('add_tile_modal.edit_title') : t('add_tile_modal.add_title')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-body">
                        <div className="form-group entity-scanner-group">
                        <label>{t('add_tile_modal.form.entity')} (optionnel)</label>
                        <div className="input-with-action">
                            <input
                                type="text"
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                                placeholder={t('add_tile_modal.form.entity_placeholder')}
                            />
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={() => setIsScannerOpen(!isScannerOpen)}
                                title="Scanner les entités"
                            >
                                🔍
                            </button>
                        </div>

                        {isScannerOpen && (
                            <div className="entity-scanner-dropdown">
                                <input
                                    type="text"
                                    className="scanner-search"
                                    placeholder={t('add_tile_modal.form.entity_placeholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <div className="entity-list">
                                    {filteredEntities.map(id => (
                                        <div
                                            key={id}
                                            className="entity-item"
                                            onClick={() => handleSelectEntity(id)}
                                        >
                                            <span className="entity-name">{hassEntities[id].attributes.friendly_name || id}</span>
                                            <span className="entity-id">{id}</span>
                                        </div>
                                    ))}
                                    {filteredEntities.length === 0 && <div className="no-result">Aucune entité trouvée</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>{t('add_tile_modal.form.title')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('add_tile_modal.form.title_placeholder')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('add_tile_modal.form.room')} (optionnel)</label>
                        <input
                            type="text"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder={t('add_tile_modal.form.room_placeholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('add_tile_modal.form.type')}</label>
                        <select value={type} onChange={(e) => setType(e.target.value as TileType)}>
                            <option value="info">{t('add_tile_modal.form.types.info')}</option>
                            <option value="toggle">{t('add_tile_modal.form.types.toggle')}</option>
                            <option value="slider">{t('add_tile_modal.form.types.slider')}</option>
                            <option value="graph">{t('add_tile_modal.form.types.graph')}</option>
                            <option value="cover">{t('add_tile_modal.form.types.cover')}</option>
                            <option value="media">{t('add_tile_modal.form.types.media')}</option>
                            <option value="energy-gauge">{t('add_tile_modal.form.types.energy-gauge')}</option>
                            <option value="energy-flow">{t('add_tile_modal.form.types.energy-flow')}</option>
                            <option value="scene">{t('add_tile_modal.form.types.scene')}</option>
                            <option value="camera">{t('add_tile_modal.form.types.camera', 'Caméra')}</option>
                            <option value="fire-alert">{t('add_tile_modal.form.types.fire-alert', 'Alerte Incendie')}</option>

                            <option value="spacer">{t('add_tile_modal.form.types.spacer')}</option>
                        </select>
                    </div>



                    <div className="form-group">
                        <label>{t('add_tile_modal.form.theme')} (Optionnel)</label>
                        <select value={tileTheme} onChange={(e) => setTileTheme(e.target.value as TileTheme | '')}>
                            <option value="">Par défaut ({t('add_tile_modal.form.themes.glass')})</option>
                            {(document.body.classList.contains('theme-light') || document.body.classList.contains('theme-nature') || tileTheme === 'ocean') && (
                                <option value="ocean">{t('add_tile_modal.form.themes.ocean', 'Océan')}</option>
                            )}
                            {(document.body.classList.contains('theme-light') || document.body.classList.contains('theme-nature') || tileTheme === 'forest') && (
                                <option value="forest">{t('add_tile_modal.form.themes.forest', 'Forêt')}</option>
                            )}
                            <option value="gradient">{t('add_tile_modal.form.themes.gradient')}</option>
                            <option value="minimal">{t('add_tile_modal.form.themes.minimal')}</option>
                            <option value="neon">{t('add_tile_modal.form.themes.neon')}</option>
                            <option value="frosted">{t('add_tile_modal.form.themes.frosted')}</option>
                        </select>
                    </div>

                    <div className="form-group visibility-rule-group">
                        <label className="toggle-label">
                            <input 
                                type="checkbox" 
                                checked={useVisibilityRule} 
                                onChange={(e) => setUseVisibilityRule(e.target.checked)} 
                            />
                            <span>Visibilité Intelligente (Apparition Conditionnelle)</span>
                        </label>
                        
                        {useVisibilityRule && (
                            <p className="visibility-hint">
                                Cette tuile ne s'affichera dans vos <b>Favoris</b> que si les conditions ci-dessous sont remplies. 
                                Dans les pièces, elle restera toujours visible.
                            </p>
                        )}
                        
                        {useVisibilityRule && (
                            <div className="rules-container">
                                {visibilityRules.map((rule, index) => (
                                    <div key={index} className="rule-config-box">
                                        <div className="rule-header">
                                            <select 
                                                value={rule.type} 
                                                onChange={(e) => {
                                                    const newType = e.target.value as VisibilityRuleType;
                                                    const newRules = [...visibilityRules];
                                                    if (newType === 'entity') {
                                                        newRules[index] = { type: 'entity', entityId: '', operator: '=', value: '' };
                                                    } else {
                                                        newRules[index] = { type: 'time', startTime: '08:00', endTime: '22:00' };
                                                    }
                                                    setVisibilityRules(newRules);
                                                }}
                                                className="rule-type-select"
                                            >
                                                <option value="entity">Entité</option>
                                                <option value="time">Heure</option>
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn-remove-rule"
                                                onClick={() => setVisibilityRules(visibilityRules.filter((_, i) => i !== index))}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {rule.type === 'entity' ? (
                                            <>
                                                <div className="entity-scanner-group">
                                                    <div className="input-with-action">
                                                        <input
                                                            type="text"
                                                            value={rule.entityId}
                                                            onChange={(e) => {
                                                                const newRules = [...visibilityRules];
                                                                (newRules[index] as any).entityId = e.target.value;
                                                                setVisibilityRules(newRules);
                                                            }}
                                                            placeholder="sensor.temperature (ID Entité)"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-icon"
                                                            onClick={() => setScanningRuleIndex(scanningRuleIndex === index ? null : index)}
                                                            title="Scanner les entités"
                                                        >
                                                            🔍
                                                        </button>
                                                    </div>
                                                    
                                                    {scanningRuleIndex === index && (
                                                        <div className="entity-scanner-dropdown up">
                                                            <input
                                                                type="text"
                                                                className="scanner-search"
                                                                placeholder="Rechercher une entité..."
                                                                value={ruleSearchTerm}
                                                                onChange={(e) => setRuleSearchTerm(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="entity-list">
                                                                {Object.keys(hassEntities)
                                                                    .filter(id => {
                                                                        const entity = hassEntities[id];
                                                                        const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
                                                                        const searchLower = ruleSearchTerm.toLowerCase();
                                                                        return id.toLowerCase().includes(searchLower) || friendlyName.includes(searchLower);
                                                                    })
                                                                    .slice(0, 50)
                                                                    .map(id => (
                                                                        <div
                                                                            key={id}
                                                                            className="entity-item"
                                                                            onClick={() => { 
                                                                                const newRules = [...visibilityRules];
                                                                                (newRules[index] as any).entityId = id;
                                                                                setVisibilityRules(newRules);
                                                                                setScanningRuleIndex(null); 
                                                                            }}
                                                                        >
                                                                            <span className="entity-name">{hassEntities[id].attributes?.friendly_name || id}</span>
                                                                            <span className="entity-id">{id}</span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rule-condition-row">
                                                    <select 
                                                        value={rule.operator} 
                                                        onChange={(e) => {
                                                            const newRules = [...visibilityRules];
                                                            (newRules[index] as any).operator = e.target.value as VisibilityOperator;
                                                            setVisibilityRules(newRules);
                                                        }}
                                                    >
                                                        <option value="=">Est égal à (=)</option>
                                                        <option value="!=">Est différent de (!=)</option>
                                                        <option value=">">Supérieur à (&gt;)</option>
                                                        <option value="<">Inférieur à (&lt;)</option>
                                                    </select>
                                                    
                                                    <input 
                                                        type="text" 
                                                        value={rule.value} 
                                                        onChange={(e) => {
                                                            const newRules = [...visibilityRules];
                                                            (newRules[index] as any).value = e.target.value;
                                                            setVisibilityRules(newRules);
                                                        }} 
                                                        placeholder="Valeur (ex: on, off, 22)" 
                                                        required
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="rule-time-row">
                                                <div className="time-input-group">
                                                    <label>De</label>
                                                    <input 
                                                        type="time" 
                                                        value={rule.startTime}
                                                        onChange={(e) => {
                                                            const newRules = [...visibilityRules];
                                                            (newRules[index] as any).startTime = e.target.value;
                                                            setVisibilityRules(newRules);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                                <div className="time-input-group">
                                                    <label>À</label>
                                                    <input 
                                                        type="time" 
                                                        value={rule.endTime}
                                                        onChange={(e) => {
                                                            const newRules = [...visibilityRules];
                                                            (newRules[index] as any).endTime = e.target.value;
                                                            setVisibilityRules(newRules);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    className="btn-add-condition"
                                    onClick={() => setVisibilityRules([...visibilityRules, { type: 'entity', entityId: '', operator: '=', value: '' }])}
                                >
                                    + Ajouter une condition
                                </button>
                            </div>
                        )}
                    </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>{t('add_tile_modal.cancel')}</button>
                        <div className="modal-actions-right">
                            <button type="submit" className="btn-primary">{tileToEdit ? t('add_tile_modal.save') : t('add_tile_modal.add')}</button>
                            <a 
                                href="https://www.buymeacoffee.com/simonv" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="bmc-button"
                            >
                                <img
                                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                                    alt="Buy Me A Coffee"
                                    style={{ height: '36px', width: '130px' }}
                                />
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
