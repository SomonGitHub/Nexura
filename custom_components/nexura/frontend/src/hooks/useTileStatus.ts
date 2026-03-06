import type { HassEntities } from 'home-assistant-js-websocket';

export type HaloType = 'none' | 'gold' | 'fire' | 'ice' | 'water' | 'danger' | 'electric';

const SECURITY_CLASSES = ['window', 'door', 'garage_door', 'opening', 'safety', 'smoke', 'gas', 'moisture'];

/**
 * Custom hook to determine the halo status of a tile based on HA entity state.
 */
export function getHaloType(entityId: string | undefined, hassEntities: HassEntities): HaloType {
    if (!entityId || !hassEntities[entityId]) return 'none';

    const entity = hassEntities[entityId];
    const state = entity.state;
    const attrs = entity.attributes;

    // 1. Safety/Danger (Priority #1)
    const deviceClass = attrs.device_class;
    const isSecurityClass = SECURITY_CLASSES.includes(deviceClass || '');
    const domain = entityId?.split('.')[0];

    if (
        state === 'open' ||
        state === 'tripped' ||
        (state === 'on' && (isSecurityClass || entityId?.startsWith('binary_sensor.smoke')))
    ) {
        // Exclude covers from danger (user request)
        if (domain === 'cover') return 'none';
        return 'danger';
    }

    // 2. Lights (Gold)
    if (entityId.startsWith('light.') && state === 'on') {
        return 'gold';
    }

    // 3. Climate (Temperature/Humidity)
    if (attrs.unit_of_measurement === '°C' || attrs.unit_of_measurement === '°F') {
        const temp = parseFloat(state);
        if (temp > 25) return 'fire';
        if (temp < 15) return 'ice';
    }

    if (attrs.unit_of_measurement === '%' && (entityId.includes('humidity') || attrs.device_class === 'humidity')) {
        const humidity = parseFloat(state);
        if (humidity > 70) return 'water';
    }

    // 4. Power Consumption
    if (attrs.unit_of_measurement === 'W' || attrs.unit_of_measurement === 'kW') {
        const power = parseFloat(state);
        const threshold = attrs.unit_of_measurement === 'kW' ? 0.5 : 500;
        if (power > threshold) return 'electric';
    }

    return 'none';
}
