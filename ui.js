

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
            case 'temperature': return 'thermometer';
            case 'humidity': return 'droplet';
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
                const size = entity.size || 'standard';
                htmlBuffer += this.createDeviceCard(entity, stateData, { ...options, size });
            });
            container.innerHTML = htmlBuffer || `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem; border: 1px dashed var(--glass-border); border-radius: 12px;">${options.emptyMessage || 'Aucun élément.'}</p>`;
            this.refreshIcons(container);
            return;
        }


        entities.forEach((entity, index) => {
            const card = container.children[index];
            if (!card || card.getAttribute('data-ha-id') !== entity.haId) {
                // Mismatch, fallback to rebuild (should be rare with stable sort)
                container.innerHTML = entities.map(e => this.createDeviceCard(e, allStates.find(s => s.entity_id === e.haId) || { state: 'unavailable' }, { ...options, size: e.size || 'standard' })).join('');
                this.refreshIcons(container);
                return;
            }

            const stateData = allStates.find(s => s.entity_id === entity.haId) || (entity.type === 'empty' ? { state: 'Spacer' } : { state: 'unavailable' });
            const isActive = ['on', 'open', 'playing'].includes(stateData.state);
            const cardSize = entity.size || 'standard';
            const sizeClass = cardSize !== 'standard' ? `card-${cardSize}` : '';

            // 1. Update card classes
            if (entity.type === 'empty') {
                card.className = `card empty-block clickable ${sizeClass}`;
                return;
            }
            const isControl = ['light', 'switch', 'shutter'].includes(entity.type);
            const alertClasses = this.getAlertClasses(entity, stateData);
            const canBeInactive = ['binary_sensor', 'sensor', 'temperature', 'humidity'].includes(entity.type) || entity.haId.startsWith('sensor.');
            const frostEnabled = localStorage.getItem('ef_frost_enabled') !== 'false';
            const isInactiveClass = (frostEnabled && canBeInactive && !isActive) ? 'is-inactive' : '';

            card.className = `card ${isActive ? 'device-on' : ''} ${entity.type} ${isControl ? 'clickable' : ''} ${alertClasses.join(' ')} ${isInactiveClass} ${sizeClass}`;

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

            if (slider && stateData.attributes && stateData.attributes.brightness !== undefined) {
                const brightnessPct = Math.round((stateData.attributes.brightness / 255) * 100);
                if (parseInt(slider.value) !== brightnessPct) {
                    slider.value = brightnessPct;
                }
            }

            // 4. Update Alert Pulsations & Frost Mode
            card.classList.toggle('alert-pulse', alertClasses.includes('alert-pulse'));
            card.classList.toggle('warning-pulse', alertClasses.includes('warning-pulse'));

            // Frost & Focus: Blur if not active
            const isInactive = !isActive && stateData.state !== 'unavailable';
            card.classList.toggle('is-inactive', frostEnabled && canBeInactive && !isActive);
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
        const { showRemove = false, onRemove = '', onClick = '', onAction = 'callHAService', size = 'standard' } = options;

        if (entity.type === 'empty') {
            const onRemoveFinal = onRemove ? onRemove.replace(/\${haId}/g, entity.haId) : '';
            const sizeClass = size !== 'standard' ? `card-${size}` : '';
            return `
                <div class="card empty-block clickable ${sizeClass}" data-ha-id="${entity.haId}" style="position: relative; border: 1px dashed var(--glass-border); background: rgba(255,255,255,0.01); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;">
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
        const isTemperature = (entity.type === 'temperature') || (entity.type === 'sensor' && (stateData.attributes?.unit_of_measurement === '°C' || stateData.attributes?.unit_of_measurement === '°F' || stateData.attributes?.device_class === 'temperature'));
        const isHumidity = (entity.type === 'humidity') || (entity.type === 'sensor' && (stateData.attributes?.unit_of_measurement === '%' || stateData.attributes?.device_class === 'humidity'));

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

        const alertClasses = this.getAlertClasses(entity, stateData);
        // Actions (lights, switches, shutters) should NOT be frosted
        const canBeInactive = ['binary_sensor', 'sensor', 'temperature', 'humidity'].includes(entity.type) || entity.haId.startsWith('sensor.');
        const frostEnabled = localStorage.getItem('ef_frost_enabled') !== 'false';
        const isInactiveClass = (frostEnabled && canBeInactive && !isActive) ? 'is-inactive' : '';
        const sizeClass = size !== 'standard' ? `card-${size}` : '';

        const cardClass = `card ${isActive ? 'device-on' : ''} ${entity.type} ${isControl ? 'clickable' : ''} ${isDimmer ? 'variant-dimmer' : ''} ${alertClasses.join(' ')} ${isInactiveClass} ${sizeClass}`;
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
            
            ${(entity.type === 'sensor' || entity.type === 'binary_sensor' || entity.type === 'temperature' || entity.type === 'humidity') ? `
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

        // Frost & Focus: Click to reveal
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card.is-inactive');
            if (card) {
                card.classList.remove('is-inactive');
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    },

    initAmbiance() {
        const layer = document.getElementById('ambiance-layer');
        if (!layer) return;

        this.updateSky();
        setInterval(() => {
            const enabled = localStorage.getItem('ef_ambiance_enabled') !== 'false';
            layer.style.opacity = enabled ? '1' : '0';
            if (enabled) {
                this.updateSky();
            }
        }, 60000); // Every minute

        // Immediate opacity check
        const enabled = localStorage.getItem('ef_ambiance_enabled') !== 'false';
        layer.style.opacity = enabled ? '1' : '0';
    },

    updateSky() {
        const layer = document.getElementById('ambiance-layer');
        if (!layer) return;

        const hour = new Date().getHours();
        const skyClasses = ['sky-dawn', 'sky-day', 'sky-dusk', 'sky-night'];
        let skyClass = 'sky-night';

        if (hour >= 6 && hour < 9) skyClass = 'sky-dawn';
        else if (hour >= 9 && hour < 17) skyClass = 'sky-day';
        else if (hour >= 17 && hour < 21) skyClass = 'sky-dusk';

        // Remove old sky classes and add the new one (preserves ID)
        layer.classList.remove(...skyClasses);
        layer.classList.add(skyClass);
    },

    updateAmbiance(allStates) {
        this.updateWeather(allStates);
        this.updateOracle(allStates);
        this.updateSoundscape(allStates);
        this.updateEnergyFlow(allStates);
    },

    updateWeather(allStates) {
        const layer = document.getElementById('ambiance-layer');
        if (!layer) return;

        const weatherEntity = allStates.find(s => s.entity_id.startsWith('weather.'));
        const isRainy = weatherEntity && (weatherEntity.state === 'rainy' || weatherEntity.state === 'pouring');

        let rainContainer = layer.querySelector('.rain-container');

        if (isRainy) {
            if (!rainContainer) {
                rainContainer = document.createElement('div');
                rainContainer.className = 'rain-container';
                layer.appendChild(rainContainer);

                // Create drops
                for (let i = 0; i < 50; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'rain-drop';
                    drop.style.left = Math.random() * 100 + '%';
                    drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
                    drop.style.animationDelay = Math.random() * 2 + 's';
                    rainContainer.appendChild(drop);
                }
            }
        } else if (rainContainer) {
            rainContainer.remove();
        }
    },

    getAlertClasses(entity, stateData) {
        const classes = [];
        const isActive = stateData.state === 'on' || stateData.state === 'open';

        // Critical: Leak or Humidity > 70%
        const isLeak = stateData.attributes?.device_class === 'moisture' && stateData.state === 'on';
        const isHighHumidity = (entity.type === 'humidity' || (entity.type === 'sensor' && stateData.attributes?.unit_of_measurement === '%')) &&
            parseFloat(stateData.state) > 70;

        if (isLeak || isHighHumidity) classes.push('alert-pulse');

        // Warning: Door or Window Open
        const isEntryOpen = (entity.type === 'binary_sensor' || entity.variant === 'door' || entity.variant === 'window') &&
            (stateData.attributes?.device_class === 'door' || stateData.attributes?.device_class === 'window') &&
            isActive;

        if (isEntryOpen) classes.push('warning-pulse');

        return classes;
    },

    updateOracle(allStates) {
        const oracle = document.getElementById('nexura-oracle');
        const textEl = document.getElementById('oracle-text');
        if (!oracle || !textEl) return;

        const managedEntities = JSON.parse(localStorage.getItem('domotique_entities')) || [];
        const hour = new Date().getHours();

        let message = "";
        let type = "info"; // info, eco, alert

        // 1. Critical Alerts Priority
        const moistureLeak = allStates.find(s => s.attributes?.device_class === 'moisture' && s.state === 'on');
        if (moistureLeak) {
            message = "Alerte de fuite détectée ! Vérifiez vos capteurs immédiatement.";
            type = "alert";
        }

        // 2. Weather Context
        if (!message) {
            const weather = allStates.find(s => s.entity_id.startsWith('weather.'));
            if (weather && (weather.state === 'rainy' || weather.state === 'pouring')) {
                message = "Il pleut dehors. Pensez à fermer les fenêtres et velux.";
                type = "info";
            }
        }

        // 3. Energy Rules (Window Open + Climate/Heater)
        if (!message) {
            const openWindows = allStates.filter(s => s.attributes?.device_class === 'window' && s.state === 'on');
            const activeHeaters = allStates.filter(s => (s.entity_id.startsWith('climate.') || s.entity_id.startsWith('switch.')) && s.state === 'on');

            if (openWindows.length > 0 && activeHeaters.length > 0) {
                message = "Alerte Éco : Des fenêtres sont ouvertes alors que le chauffage est actif.";
                type = "eco";
            }
        }

        // 4. Energy Rules (Lights on in empty rooms - if presence sensors exist)
        if (!message) {
            const lightsOn = allStates.filter(s => s.entity_id.startsWith('light.') && s.state === 'on');
            if (lightsOn.length > 5) {
                message = `${lightsOn.length} lumières sont allumées. Est-ce vraiment nécessaire ?`;
                type = "eco";
            }
        }

        // 5. Comfort (Humidity)
        if (!message) {
            const highHumidity = allStates.find(s => (s.attributes?.device_class === 'humidity' || s.attributes?.unit_of_measurement === '%') && parseFloat(s.state) > 75);
            if (highHumidity) {
                message = "L'air est très humide à l'intérieur. Une aération serait bénéfique.";
                type = "info";
            }
        }

        // 6. Default Biorythmic Greeting
        if (!message) {
            if (hour >= 5 && hour < 9) message = "Bon réveil ! Vos systèmes sont prêts pour la journée.";
            else if (hour >= 22 || hour < 5) message = "La maison passe en mode veille. Bonne nuit.";
            else message = "Tout est calme. Nexura veille sur votre confort.";
        }

        // Apply
        if (textEl.textContent !== message) {
            oracle.classList.remove('visible');
            setTimeout(() => {
                textEl.textContent = message;
                oracle.className = `oracle-banner visible oracle-${type}`;
            }, 500);
        } else if (!oracle.classList.contains('visible')) {
            oracle.classList.add('visible');
        }
    },

    // Audio Engine for Biorythmic Soundscape
    _audio: {
        enabled: false,
        ambientTrack: null, // Dawn, Day, Dusk, Night
        weatherTrack: null, // Rain
        currentAmbientUrl: '',
        sources: {
            dawn: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_24ef6e8850.mp3?filename=forest-birds-6617.mp3',
            day: 'https://cdn.pixabay.com/download/audio/2022/11/04/audio_92425026ff.mp3?filename=forest-ambient-sounds-124619.mp3',
            dusk: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_651f8939c0.mp3?filename=crickets-chirping-at-night-7813.mp3',
            night: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_51795c6436.mp3?filename=light-wind-blowing-125032.mp3',
            rain: 'https://cdn.pixabay.com/download/audio/2022/03/04/audio_9c08d98d83.mp3?filename=soft-rain-ambient-7143.mp3'
        }
    },

    toggleAudio() {
        this._audio.enabled = !this._audio.enabled;
        const btn = document.getElementById('toggleAudio');
        const icon = document.getElementById('audioIcon');
        const text = document.getElementById('audioText');

        if (this._audio.enabled) {
            btn.classList.add('active');
            icon.setAttribute('data-lucide', 'volume-2');
            text.textContent = "Son Activé";
            this.updateSoundscape(); // Start immediately
        } else {
            btn.classList.remove('active');
            icon.setAttribute('data-lucide', 'volume-x');
            text.textContent = "Activer le son";
            this._stopAllAudio();
        }
        lucide.createIcons();
    },

    _stopAllAudio() {
        if (this._audio.ambientTrack) this._fadeAndStop(this._audio.ambientTrack);
        if (this._audio.weatherTrack) this._fadeAndStop(this._audio.weatherTrack);
        this._audio.currentAmbientUrl = '';
    },

    _fadeAndStop(audio) {
        let vol = audio.volume;
        const interval = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                audio.volume = vol;
            } else {
                audio.pause();
                audio.volume = 0;
                clearInterval(interval);
            }
        }, 100);
    },

    updateSoundscape(allStates) {
        if (!this._audio.enabled) return;

        const hour = new Date().getHours();
        let targetAmbient = '';

        if (hour >= 5 && hour < 9) targetAmbient = 'dawn';
        else if (hour >= 9 && hour < 18) targetAmbient = 'day';
        else if (hour >= 18 && hour < 22) targetAmbient = 'dusk';
        else targetAmbient = 'night';

        const url = this._audio.sources[targetAmbient];

        // 1. Handle Ambient Track
        if (this._audio.currentAmbientUrl !== url) {
            if (this._audio.ambientTrack) this._fadeAndStop(this._audio.ambientTrack);

            this._audio.ambientTrack = new Audio(url);
            this._audio.ambientTrack.loop = true;
            this._audio.ambientTrack.volume = 0;
            this._audio.ambientTrack.play().catch(e => console.log("Audio play blocked", e));
            this._fadeIn(this._audio.ambientTrack, targetAmbient === 'night' ? 0.05 : 0.1);
            this._audio.currentAmbientUrl = url;
        }

        // 2. Handle Weather Track (Rain)
        const weather = allStates?.find(s => s.entity_id.startsWith('weather.'));
        const isRainy = weather && (weather.state === 'rainy' || weather.state === 'pouring');

        if (isRainy && !this._audio.weatherTrack) {
            this._audio.weatherTrack = new Audio(this._audio.sources.rain);
            this._audio.weatherTrack.loop = true;
            this._audio.weatherTrack.volume = 0;
            this._audio.weatherTrack.play().catch(e => { });
            this._fadeIn(this._audio.weatherTrack, 0.1);
        } else if (!isRainy && this._audio.weatherTrack) {
            this._fadeAndStop(this._audio.weatherTrack);
            this._audio.weatherTrack = null;
        }
    },

    _fadeIn(audio, targetVol) {
        let vol = 0;
        const interval = setInterval(() => {
            if (vol < targetVol) {
                vol += 0.01;
                audio.volume = Math.min(vol, targetVol);
            } else {
                clearInterval(interval);
            }
        }, 200);
    },

    // Energy Flow Particle Engine
    _ef: {
        canvas: null,
        ctx: null,
        particles: [],
        lastTime: 0,
        energySourceRect: null,
        targets: [],
        speedMultiplier: 1
    },

    initEnergyFlow() {
        if (localStorage.getItem('ef_energy_enabled') === 'false') return;
        this._ef.canvas = document.getElementById('energy-flow-canvas');
        if (!this._ef.canvas) return;
        this._ef.ctx = this._ef.canvas.getContext('2d');

        window.addEventListener('resize', () => this._resizeEnergyCanvas());
        this._resizeEnergyCanvas();

        this._animateEnergyFlow();
    },

    _resizeEnergyCanvas() {
        if (!this._ef.canvas) return;
        this._ef.canvas.width = window.innerWidth;
        this._ef.canvas.height = window.innerHeight;
    },

    updateEnergyFlow(allStates) {
        if (!this._ef.canvas) return;

        // 1. Find Energy Source Position (Fallback to Logo if card is hidden)
        const energyCard = document.getElementById('kpiEnergy');
        if (energyCard && energyCard.style.display !== 'none' && energyCard.offsetHeight > 0) {
            this._ef.energySourceRect = energyCard.getBoundingClientRect();
        } else {
            const logo = document.querySelector('.logo-container');
            if (logo) this._ef.energySourceRect = logo.getBoundingClientRect();
        }

        // 2. Find active target cards (on devices)
        let activeCards = document.querySelectorAll('.card.device-on:not(.kpi-card)');
        if (activeCards.length === 0) {
            activeCards = document.querySelectorAll('.card.clickable'); // Target any clickable card as second fallback
        }
        if (activeCards.length === 0) {
            activeCards = document.querySelectorAll('#roomCardsGrid .card');
        }

        this._ef.targets = Array.from(activeCards).map(c => c.getBoundingClientRect());

        // 3. Update speed based on energy value
        const energyState = allStates?.find(s => s.entity_id === 'sensor.energy_consumption' || s.attributes?.device_class === 'energy');
        if (energyState) {
            const val = parseFloat(energyState.state) || 0;
            this._ef.speedMultiplier = Math.min(Math.max(val / 500, 0.5), 5);
        } else {
            this._ef.speedMultiplier = 1;
        }
    },

    _animateEnergyFlow(timestamp) {
        if (!this._ef.ctx) return;

        const ctx = this._ef.ctx;
        ctx.clearRect(0, 0, this._ef.canvas.width, this._ef.canvas.height);

        // 1. Spawn particles (Frame-based spawning for continuous flow)
        if (this._ef.energySourceRect && this._ef.targets.length > 0 && this._ef.particles.length < 100) {
            // Adjust spawn probability based on speed multiplier
            const spawnProb = 0.05 * this._ef.speedMultiplier;
            if (Math.random() < spawnProb) {
                const target = this._ef.targets[Math.floor(Math.random() * this._ef.targets.length)];
                this._ef.particles.push({
                    x: this._ef.energySourceRect.left + this._ef.energySourceRect.width / 2,
                    y: this._ef.energySourceRect.top + this._ef.energySourceRect.height / 2,
                    targetX: target.left + target.width / 2,
                    targetY: target.top + target.height / 2,
                    progress: 0,
                    speed: 0.004 * (0.8 + Math.random() * 0.4) * this._ef.speedMultiplier,
                    size: 1.5 + Math.random() * 2,
                    wave: Math.random() * Math.PI * 2
                });
            }
        }

        // 2. Update and Draw
        this._ef.particles = this._ef.particles.filter(p => {
            p.progress += p.speed;
            if (p.progress >= 1) return false;

            const x = p.x + (p.targetX - p.x) * p.progress;
            const y = p.y + (p.targetY - p.y) * p.progress;

            // Wave effect calculation
            const waveAmplitude = 15;
            const waveFreq = 2;
            const curve = Math.sin(p.progress * Math.PI * waveFreq + p.wave) * waveAmplitude * (1 - p.progress);

            // Perpendicular offset for organic movement
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const finalX = x + (curve * -dy / len);
            const finalY = y + (curve * dx / len);

            // Draw Glow
            const gradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, p.size * 3);
            gradient.addColorStop(0, 'rgba(108, 193, 189, 0.9)');
            gradient.addColorStop(0.4, 'rgba(108, 193, 189, 0.3)');
            gradient.addColorStop(1, 'rgba(108, 193, 189, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(finalX, finalY, p.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(finalX, finalY, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        requestAnimationFrame((t) => this._animateEnergyFlow(t));
    }
};


document.addEventListener('DOMContentLoaded', () => {
    UI.initPageTransitions();
    UI.initAmbiance();
    UI.initEnergyFlow();
});


window.UI = UI;
