# Plan d'Implémentation de l'Intégration HA Storage pour le Drag-and-Drop

**But :** Sauvegarder et restaurer l'ordre des tuiles du Bento Grid directement dans Home Assistant (HA Storage) via WebSocket, pour garantir que l'agencement est synchronisé entre tous les appareils, tout en maintenant les standards stricts de linting.

**Architecture :** Le backend Python exposera deux commandes WebSocket (`nexura/board/get` et `nexura/board/save`) utilisant `homeassistant.helpers.storage`. Le frontend React modifiera son initialisation pour appeler `nexura/board/get` (avec fallback sur `localStorage` ou constantes) et mettra à jour HA Storage lors du `handleDragEnd`.

**Stack Technique :** Python (HA Core, `homeassistant.components.websocket_api`, `homeassistant.helpers.storage`), React (Vite, TS), `@dnd-kit`.

---

### Tâche 1 : Backend Python - Définition du Stockage et des WebSockets

**Fichiers :**
- Modifier : `c:/Users/simon.vernusse/Documents/hacs-nexura/custom_components/nexura/__init__.py` (ou créer `websocket_api.py` si nécessaire pour la propreté, mais nous commencerons par `__init__.py` pour un composant simple).
- Créer : `c:/Users/simon.vernusse/Documents/hacs-nexura/custom_components/nexura/const.py` (pour les clés de stockage).

**Étape 1 : Définir les clés de stockage**
Dans `const.py` :
```python
DOMAIN = "nexura"
STORAGE_KEY = f"{DOMAIN}.board_layout"
STORAGE_VERSION = 1
```

**Étape 2 : Implémenter les handlers WebSocket dans `__init__.py`**
Ajouter l'enregistrement des routes WebSocket dans `async_setup_entry` :
```python
from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import websocket_api
from homeassistant.helpers.storage import Store
import voluptuous as vol

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Nexura from a config entry."""
    websocket_api.async_register_command(hass, ws_get_board)
    websocket_api.async_register_command(hass, ws_save_board)
    return True

@websocket_api.websocket_command({"type": "nexura/board/get"})
@websocket_api.async_response
async def ws_get_board(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict):
    """Handle get board layout command."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    data = await store.async_load()
    connection.send_result(msg["id"], data or [])

@websocket_api.websocket_command({
    "type": "nexura/board/save",
    vol.Required("layout"): list
})
@websocket_api.async_response
async def ws_save_board(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict):
    """Handle save board layout command."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    await store.async_save(msg["layout"])
    connection.send_result(msg["id"], {"success": True})
```

**Étape 3 : Exécuter le Linter Python**
Commande : `ruff check "c:/Users/simon.vernusse/Documents/hacs-nexura/custom_components/nexura/" --fix`
Attendu : Aucun avertissement ni erreur de linting. Corriger si nécessaire.

---

### Tâche 2 : Frontend React - Connexion WebSocket

**Fichiers :**
- Modifier : `c:/Users/simon.vernusse/Documents/hacs-nexura/custom_components/nexura/frontend/src/App.tsx`

**Étape 1 : Ajouter la logique de connexion HA (Mock ou Réelle)**
Actuellement, le frontend fonctionne en mode standalone (Vite). L'intégration HA nécessite généralement d'utiliser `home-assistant-js-websocket` si on est en standalone, ou l'objet `hass` injecté si c'est un panel custom HA réel. 
*Hypothèse de conception : S'il s'agit d'un custom panel, l'objet `hass` doit être passé en prop. Si nous sommes en developpement local pur, nous devons mocker cet appel.*

Pour cette tâche, nous allons créer une fonction utilitaire asynchrone pour abstraire HA, avec un fallback complet.

Ajouter dans `App.tsx` (ou dans un nouveau `haService.ts`) :
```typescript
// Interface pour typer l'appel HA
interface HAConnection {
    callWS: (msg: any) => Promise<any>;
}
// Pour l'instant, simuler l'appel ou utiliser le vrai s'il est injecté plus tard.
```

**Étape 2 : Mettre à jour `App.tsx` pour charger depuis le Backend**
Modifier l'initialisation de `tiles` pour utiliser un `useEffect` asynchrone plutôt qu'un state initial synchrone (afin de permettre la requête réseau).

```typescript
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTiles = async () => {
        try {
            // TODO: Remplacer par vrai appel HA WebSocket: await hass.connection.sendMessagePromise({type: 'nexura/board/get'})
            // Simulation Backend:
            const saved = localStorage.getItem(STORAGE_KEY);
            if(saved) {
                setTiles(JSON.parse(saved));
            } else {
                setTiles(INITIAL_TILES);
            }
        } catch (e) {
            setTiles(INITIAL_TILES);
        } finally {
            setLoading(false);
        }
    };
    loadTiles();
  }, []);
```

**Étape 3 : Mettre à jour `handleDragEnd` pour envoyer au Backend**
```typescript
  const handleDragEnd = () => {
    // Optimistic UI update already handled by handleDragOver
    const currentTiles = [...tiles]; 
    
    // Fallback local
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTiles));
    
    // TODO: Vrai appel HA WebSocket
    // hass.connection.sendMessagePromise({ type: 'nexura/board/save', layout: currentTiles })
    //     .catch(err => console.error("Failed to save to HA", err));

    setActiveId(null);
  };
```

**Étape 4 : Exécuter Linter et Vérification Types**
Commande : `npm run lint` puis `npx tsc --noEmit`
Attendu : 0 erreurs.

---

### Tâche 3 : Intégration Finale et Tests
*Vérifier si le custom_panel de Nexura injecte bien `hass`. Si oui, adapter les appels mockés pour utiliser `props.hass.callWS()`.*
