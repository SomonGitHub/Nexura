

const UI = {

    _lastHeap: 0,
    logMemory(tag) {
        if (window.performance && performance.memory) {
            const current = performance.memory.usedJSHeapSize;
            const diff = this._lastHeap ? (current - this._lastHeap) : 0;
            const trend = diff > 0 ? '📈' : (diff < 0 ? '📉' : '≡');
            console.log(`[MEM][${tag}] ${trend} ${(current / 1024 / 1024).toFixed(2)}MB (${diff > 0 ? '+' : ''}${(diff / 1024).toFixed(1)}KB)`);
            this._lastHeap = current;
        }
    },


    _intervals: new Map(),
    setInterval(name, fn, ms) {
        if (this._intervals.has(name)) clearInterval(this._intervals.get(name));
        const id = setInterval(fn, ms);
        this._intervals.set(name, id);
        return id;
    },
    clearInterval(name) {
        if (this._intervals.has(name)) {
            clearInterval(this._intervals.get(name));
            this._intervals.delete(name);
        }
    },


    getIconForType(type) {
        switch (type) {
            case 'light': return 'lightbulb';
            case 'shutter': return 'blinds';
            case 'switch': return 'plug';
            case 'climate': return 'thermometer';
            case 'sensor': return 'gauge';
            case 'energy': return 'zap';
            case 'binary_sensor': return 'circle-dot'; // Default for generic
            case 'camera': return 'video';
            case 'battery': return 'battery';
            case 'empty': return 'square-dashed';
            default: return 'help-circle';
        }
    },
    /**
     * Get CSS color based on temperature value (Blue -> Green -> Red)
     */
    getTemperatureColor(temp) {
        if (temp === null || temp === undefined || isNaN(temp)) return 'var(--text-secondary)';
        const t = parseFloat(temp);

        // Smooth HSL Gradient: Blue (240deg) at 10°C -> Red (0deg) at 30°C
        // Range 10-30 = 20 degrees. 240 / 20 = 12 deg per °C
        let hue = 240 - (t - 10) * 12;
        hue = Math.max(0, Math.min(240, hue)); // Clamp between 0 and 240

        return `hsl(${hue}, 70%, 50%)`;
    },

    /**
     * Get CSS color based on humidity value (Light Blue -> Deep Cyan)
     */
    getHumidityColor(humidity) {
        if (humidity === null || humidity === undefined || isNaN(humidity)) return 'var(--text-secondary)';
        const h = parseFloat(humidity);

        // Gradient: Light Blue (200deg) at 20% -> Red (0deg) at 80%
        let hue = 200 - (h - 20) * (200 / 60);
        hue = Math.max(0, Math.min(200, hue));

        return `hsl(${hue}, 80%, 60%)`;
    },

    refreshIcons(selectorOrElement) {
        if (window.lucide) {
            const options = {};
            if (selectorOrElement) {
                const el = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement;
                if (el) {
                    lucide.createIcons({
                        attrs: { class: 'lucide-icon' },
                        nameAttr: 'data-lucide',
                        // Unfortunately lucide.createIcons doesn't take a root element in some versions
                        // but we can pass a selection if it supports it. 
                        // If not, we still call it but less frequently.
                    });
                }
            } else {
                lucide.createIcons();
            }
        }
    },


    smartUpdateGrid(containerId, entities, allStates, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;


        if (container.children.length !== entities.length || container.querySelector('p')) {
            let htmlBuffer = '';
            entities.forEach(entity => {
                const stateData = allStates.find(s => s.entity_id === entity.haId) || { state: 'unavailable' };
                htmlBuffer += this.createDeviceCard(entity, stateData, options);
            });
            container.innerHTML = htmlBuffer || `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem; border: 1px dashed var(--glass-border); border-radius: 12px;">${options.emptyMessage || 'Aucun élément.'}</p>`;
            this.refreshIcons(container);
            return;
        }


        entities.forEach((entity, index) => {
            const card = container.children[index];
            if (!card || card.getAttribute('data-ha-id') !== entity.haId) {
                // Mismatch, fallback to rebuild (should be rare with stable sort)
                container.innerHTML = entities.map(e => this.createDeviceCard(e, allStates.find(s => s.entity_id === e.haId) || { state: 'unavailable' }, options)).join('');
                this.refreshIcons(container);
                return;
            }

            const stateData = allStates.find(s => s.entity_id === entity.haId) || (entity.type === 'empty' ? { state: 'Spacer' } : { state: 'unavailable' });
            const isActive = ['on', 'open', 'playing'].includes(stateData.state);

            // 1. Update card classes
            if (entity.type === 'empty') {
                card.className = `card empty-block clickable`;
                return;
            }
            const isControl = ['light', 'switch', 'shutter'].includes(entity.type);
            card.className = `card ${isActive ? 'device-on' : ''} ${entity.type} ${isControl ? 'clickable' : ''}`;

            // 2. Update Icon color
            const iconContainer = card.querySelector('.device-icon');
            if (iconContainer) {
                iconContainer.style.color = isActive ? 'var(--accent-color)' : 'var(--text-secondary)';
            }

            // 3. Update State Text
            const stateText = card.querySelector('.state-text');
            const newStateDisplay = `${stateData.state}${stateData.attributes?.unit_of_measurement ? ' ' + stateData.attributes.unit_of_measurement : ''}`;
            if (stateText && stateText.textContent.trim() !== newStateDisplay) {
                stateText.textContent = newStateDisplay;
            }


            const toggle = card.querySelector('.toggle-switch');
            if (toggle) {
                if (isActive) toggle.classList.add('active');
                else toggle.classList.remove('active');

                const domain = entity.haId.split('.')[0];
                const onAction = options.onAction || 'callHAService';
                toggle.setAttribute('onclick', `event.stopPropagation(); ${onAction}('${domain}', '${isActive ? 'turn_off' : 'turn_on'}', '${entity.haId}')`);
            }

            const slider = card.querySelector('input[type="range"]');
            if (slider && stateData.attributes && stateData.attributes.brightness !== undefined) {
                const brightnessPct = Math.round((stateData.attributes.brightness / 255) * 100);
                if (parseInt(slider.value) !== brightnessPct) {
                    slider.value = brightnessPct;
                }
            }
        });

        this.logMemory(`Update ${containerId}`);
    },


    getControlUI(entity, stateData, onAction) {
        const isActive = ['on', 'open'].includes(stateData.state);
        const domain = entity.haId.split('.')[0];

        if (entity.type === 'light' || entity.type === 'switch') {
            const toggleHtml = `<div class="toggle-switch ${isActive ? 'active' : ''}" onclick="event.stopPropagation(); ${onAction}('${domain}', '${isActive ? 'turn_off' : 'turn_on'}', '${entity.haId}')"></div>`;

            if (entity.variant === 'dimmer' && domain === 'light') {
                const brightness = stateData.attributes?.brightness || 0;
                const pct = Math.round((brightness / 255) * 100);
                return `
                    <div class="dimmer-controls" onclick="event.stopPropagation();" style="display: flex; align-items: center; gap: 0.75rem; margin-top: auto; width: 100%;">
                        ${toggleHtml}
                        <div class="slider-container" style="flex: 1; min-width: 0;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: var(--text-secondary); margin-bottom: 2px;">
                                <span style="text-transform: uppercase;">Luminosité</span>
                                <span style="font-weight: 700;">${pct}%</span>
                            </div>
                            <input type="range" min="0" max="100" value="${pct}" 
                                oninput="UI.handleBrightnessChange('${entity.haId}', this.value, '${onAction}', this)"
                                style="cursor: pointer; width: 100%;">
                        </div>
                    </div>
                `;
            }
            return `<div style="margin-top: auto;">${toggleHtml}</div>`;
        }

        if (entity.type === 'shutter') {
            return `
                <div style="display: flex; gap: 0.4rem; width: 100%; margin-top: auto;" onclick="event.stopPropagation();">
                    <button class="filter-btn" style="flex: 1; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="${onAction}('cover', 'open_cover', '${entity.haId}')">
                        <i data-lucide="chevron-up" style="width: 16px;"></i>
                    </button>
                    <button class="filter-btn" style="flex: 1; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="${onAction}('cover', 'stop_cover', '${entity.haId}')">
                        <i data-lucide="square" style="width: 14px;"></i>
                    </button>
                    <button class="filter-btn" style="flex: 1; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="${onAction}('cover', 'close_cover', '${entity.haId}')">
                        <i data-lucide="chevron-down" style="width: 16px;"></i>
                    </button>
                </div>
            `;
        }

        return ''; // No control for sensors, etc.
    },

    /**
     * Create a standardized device card HTML
     */
    createDeviceCard(entity, stateData, options = {}) {
        const { showRemove = false, onRemove = '', onClick = '', onAction = 'callHAService' } = options;

        if (entity.type === 'empty') {
            const onRemoveFinal = onRemove ? onRemove.replace(/\${haId}/g, entity.haId) : '';
            return `
                <div class="card empty-block clickable" data-ha-id="${entity.haId}" style="position: relative; border: 1px dashed var(--glass-border); background: rgba(255,255,255,0.01); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;">
                    ${showRemove ? `
                        <button onclick="${onRemoveFinal}; event.stopPropagation();" style="position: absolute; top: 6px; right: 6px; background: none; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0.5; z-index: 2;">
                            <i data-lucide="x" style="width: 12px;"></i>
                        </button>
                    ` : ''}
                    <div style="color: var(--text-secondary); opacity: 0.3; margin-bottom: 0.5rem;">
                        <i data-lucide="square-dashed" style="width: 24px; height: 24px;"></i>
                    </div>
                    <span style="font-size: 0.65rem; color: var(--text-secondary); opacity: 0.4; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Bloc vide</span>
                </div>
            `;
        }

        const isActive = ['on', 'open', 'playing'].includes(stateData.state);
        const isControl = ['light', 'switch', 'shutter'].includes(entity.type);
        const isDimmer = entity.variant === 'dimmer' && entity.type === 'light';

        let stateDisplay = `${stateData.state}${stateData.attributes?.unit_of_measurement ? ' ' + stateData.attributes.unit_of_measurement : ''}`;
        let icon = this.getIconForType(entity.type);

        // Specific logic for Sensors (Temperature & Humidity)
        const isTemperature = entity.type === 'sensor' && (stateData.attributes?.unit_of_measurement === '°C' || stateData.attributes?.unit_of_measurement === '°F' || stateData.attributes?.device_class === 'temperature');
        const isHumidity = entity.type === 'sensor' && (stateData.attributes?.unit_of_measurement === '%' || stateData.attributes?.device_class === 'humidity');

        if (isTemperature) {
            icon = 'thermometer';
        } else if (isHumidity) {
            icon = 'droplet';
        }


        if (entity.type === 'binary_sensor') {
            const devClass = stateData?.attributes?.device_class;
            const variant = entity.variant;
            let labels = { on: 'Activé', off: 'Repos' };


            if (variant === 'presence' || devClass === 'motion' || devClass === 'occupancy') {
                labels = { on: 'Mouvement', off: 'Calme' };
                icon = 'unfold-more';
            } else if (variant === 'door' || devClass === 'door') {
                labels = { on: 'Ouverte', off: 'Fermée' };
                icon = isActive ? 'door-open' : 'door-closed';
            } else if (variant === 'window' || devClass === 'window') {
                labels = { on: 'Ouverte', off: 'Fermée' };
                icon = isActive ? 'layout' : 'square';
            } else if (devClass === 'connectivity') {
                labels = { on: 'Connecté', off: 'Déconnecté' };
                icon = 'wifi';
            } else if (devClass === 'moisture') {
                labels = { on: 'Fuite !', off: 'Sec' };
                icon = 'droplet';
            }
            stateDisplay = stateData.state === 'on' ? labels.on : labels.off;
            if (stateData.state === 'unavailable') stateDisplay = 'Inconnu';
        } else if (entity.type === 'camera') {
            icon = 'video';
            statusText = 'En direct';
        }

        const cardClass = `card ${isActive ? 'device-on' : ''} ${entity.type} ${isControl ? 'clickable' : ''} ${isDimmer ? 'variant-dimmer' : ''}`;
        const iconColor = isActive ? 'var(--accent-color)' : 'var(--text-secondary)';


        let onClickFinal = onClick;
        if (onClick) {
            onClickFinal = onClick.replace(/\${haId}/g, entity.haId).replace(/\${isActive}/g, isActive).replace(/\${isActive_bool}/g, isActive);
        }

        let onRemoveFinal = onRemove;
        if (onRemove) {
            onRemoveFinal = onRemove.replace(/\${haId}/g, entity.haId).replace(/\${isActive}/g, isActive).replace(/\${isActive_bool}/g, isActive);
        }

        return `
            <div class="${cardClass}" data-ha-id="${entity.haId}" style="position: relative;" ${isControl && onClickFinal ? `onclick="${onClickFinal}"` : ''}>
                ${showRemove ? `
                    <button onclick="${onRemoveFinal}; event.stopPropagation();" style="position: absolute; top: 6px; right: 6px; background: none; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0.5; z-index: 2;">
                        <i data-lucide="x" style="width: 12px;"></i>
                    </button>
                ` : ''}
                <div style="margin-bottom: 0.4rem; color: ${iconColor};" class="device-icon">
                <i data-lucide="${icon}"></i>
            </div>
            <h3 style="font-size: 0.80rem; margin-bottom: 0.2rem;">${entity.name}</h3>
            
            ${(entity.type === 'sensor' || entity.type === 'binary_sensor') ? `
                <div class="state-display" style="font-size: 1.1rem; font-weight: 700; color: ${isTemperature ? this.getTemperatureColor(stateData.state) : (isHumidity ? this.getHumidityColor(stateData.state) : 'inherit')};">
                    ${stateDisplay}
                </div>
            ` : ''}

            ${entity.type === 'camera' ? `
                <div class="camera-preview-mini" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer;" onclick="window.location.href='cameras.html'">
                    <img src="${localStorage.getItem('haUrl')}/api/camera_proxy/${entity.haId}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" onerror="this.src='https://via.placeholder.com/320x180?text=Flux+Camera+Indisponible'">
                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem;">Direct</div>
                </div>
            ` : ''}
            
            ${this.getControlUI(entity, stateData, onAction)}
        </div>
    `;
    },


    _brightnessTimeouts: new Map(),
    handleBrightnessChange(haId, value, onAction, inputEl) {

        if (inputEl && inputEl.parentElement) {
            const label = inputEl.parentElement.querySelector('span:last-child');
            if (label) label.textContent = `${value}%`;
        }


        if (this._brightnessTimeouts.has(haId)) return; // Wait for the current call window

        const timeout = setTimeout(async () => {
            if (typeof window[onAction] === 'function') {
                await window[onAction]('light', 'turn_on', haId, { brightness_pct: parseInt(value) });
            }
            this._brightnessTimeouts.delete(haId);
        }, 150);

        this._brightnessTimeouts.set(haId, timeout);
    },


    scrambleText(element, targetValue) {
        if (!element) return;
        const chars = '0123456789%°CABCDEF';
        const duration = 800;
        const iterations = 8;
        const originalText = element.textContent;
        let iteration = 0;

        element.classList.add('scrambling');

        const interval = setInterval(() => {
            element.textContent = targetValue.split('')
                .map((char, index) => {
                    if (index < iteration) return targetValue[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');

            if (iteration >= targetValue.length) {
                clearInterval(interval);
                element.textContent = targetValue;
                element.classList.remove('scrambling');
            }

            iteration += targetValue.length / iterations;
        }, duration / iterations);
    },


    transitionTo(url) {
        document.body.classList.add('navigating-out');

        setTimeout(() => {
            window.location.href = url;
        }, 400);
    },

    initPageTransitions() {

        if (localStorage.getItem('sv_navigating') === 'true') {
            document.body.classList.add('navigating-in');
            localStorage.removeItem('sv_navigating');
            setTimeout(() => {
                document.body.classList.remove('navigating-in');
            }, 600);
        }


        document.querySelectorAll('a.nav-item').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && link.hostname === window.location.hostname) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.setItem('sv_navigating', 'true');
                    this.transitionTo(href);
                });
            }
        });
    }
};


document.addEventListener('DOMContentLoaded', () => UI.initPageTransitions());


window.UI = UI;
