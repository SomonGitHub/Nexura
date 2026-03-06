import {
    createConnection,
    subscribeEntities,
    type Connection,
    type HassEntities,
    type Auth,
} from 'home-assistant-js-websocket';
import { callService } from 'home-assistant-js-websocket';

export type HassConnectionState = 'connecting' | 'connected' | 'error';

// Mock states for development mode
const MOCK_ENTITIES: HassEntities = {
    'light.salon': {
        entity_id: 'light.salon',
        state: 'on',
        attributes: { friendly_name: 'Salon (Démo)', brightness: 200 },
        last_changed: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        context: { id: '1', parent_id: null, user_id: null },
    },
};

interface ParentWindow extends Window {
    hass?: { auth: Auth };
}

/**
 * Tries to find HA Auth from the parent window safely
 */
async function findHAAuth(): Promise<Auth | null> {
    try {
        const parent = window.parent as unknown as ParentWindow;

        // Strategy A: Directly from parent.hass
        if (parent && parent.hass && parent.hass.auth) {
            console.log('[Nexura Debug] Parent HA Auth found!');
            return parent.hass.auth;
        }

        // Strategy B: From HA element in parent document (same-origin only)
        if (parent && parent.document) {
            const haElement = parent.document.querySelector('home-assistant') ||
                parent.document.querySelector('home-assistant-main');

            const elementWithHass = haElement as unknown as { hass?: { auth: Auth } };
            if (elementWithHass && elementWithHass.hass && elementWithHass.hass.auth) {
                console.log('[Nexura Debug] HA Element Auth found in parent!');
                return elementWithHass.hass.auth;
            }
        }
    } catch {
        console.log('[Nexura Debug] Parent window access is restricted (Cross-origin or Iframe security).');
    }

    return null;
}

/**
 * Custom hook or service to manage HA connection.
 */
export async function connectHass(
    onEntitiesUpdate: (entities: HassEntities) => void,
    onStateChange: (state: HassConnectionState) => void
): Promise<Connection | null> {
    const isStandalone = window.location.hostname === 'localhost';

    if (isStandalone) {
        onStateChange('connected');
        onEntitiesUpdate(MOCK_ENTITIES);
        return null;
    }

    try {
        onStateChange('connecting');

        const auth = await findHAAuth();

        if (!auth) {
            // If no parent auth, we can't do redirect easily in iframe 
            // without causing "Invalid Redirect URI".
            console.warn('[Nexura Debug] No HA Auth found in parent. Using Mock.');
            onStateChange('connected'); // Still show something
            onEntitiesUpdate(MOCK_ENTITIES);
            return null;
        }

        console.log('[Nexura Debug] Creating connection with Parent Auth...');
        const connection = await createConnection({ auth });

        subscribeEntities(connection, (entities) => {
            onEntitiesUpdate(entities);
        });

        onStateChange('connected');
        console.log('[Nexura Debug] LIVE CONNECTION ESTABLISHED VIA PARENT AUTH');

        return connection;
    } catch (err: unknown) {
        console.error('[Nexura Debug] CRITICAL CONNECTION ERROR:', err);
        onStateChange('error');
        return null;
    }
}

export const executeService = async (
    connection: Connection | null,
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>
) => {
    if (!connection) {
        console.warn(`[Nexura Debug] Cannot execute ${domain}.${service} (No connection)`);
        return;
    }
    await callService(connection, domain, service, serviceData);
};
