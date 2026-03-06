# Plan d'Implémentation de Configuration du Thème

**But :** Ajouter un flux d'options (OptionsFlow) à l'intégration Nexura pour permettre à l'utilisateur de choisir le thème de l'UI (Auto, Clair, Sombre).

**Architecture :** `config_flow.py` contiendra le formulaire d'options, `__init__.py` injectera ces options dans le contexte de l'API WebSocket. `App.tsx` interrogera l'API au démarrage pour appliquer la classe CSS correspondant au thème.

**Stack Technique :** Python (Home Assistant Component), React, TypeScript

---

### Tâche 1 : Ajout des Constantes de Configuration

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\const.py`

**Étape 1 : Implémenter le code**

Ajouter les clés de configuration pour les options :
```python
CONF_THEME = "theme"

THEME_AUTO = "auto"
THEME_DARK = "dark"
THEME_LIGHT = "light"

THEMES = [THEME_AUTO, THEME_DARK, THEME_LIGHT]
```

**Étape 2 : Commiter**
```bash
git add custom_components/nexura/const.py
git commit -m "feat(config): add theme configuration constants"
```

### Tâche 2 : Implémentation du Flux d'Options (OptionsFlow)

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\config_flow.py`

**Étape 1 : Implémenter le code**

Ajouter la classe `NexuraOptionsFlowHandler` et la lier à `NexuraConfigFlow`.

```python
import voluptuous as vol
from homeassistant.core import callback
from .const import DOMAIN, CONF_THEME, THEME_AUTO, THEMES

class NexuraConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    # ... code existant ...
    
    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return NexuraOptionsFlowHandler(config_entry)


class NexuraOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Nexura options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_THEME,
                        default=self.config_entry.options.get(CONF_THEME, THEME_AUTO),
                    ): vol.In(THEMES),
                }
            ),
        )
```

**Étape 2 : Commiter**
```bash
git add custom_components/nexura/config_flow.py
git commit -m "feat(config_flow): add OptionsFlow for theme selection"
```

### Tâche 3 : Exposition de la Configuration via WebSocket

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\__init__.py`

**Étape 1 : Implémenter le code**

Ajouter la commande WebSocket `nexura/config/get`.
```python
# Dans async_setup_entry
websocket_api.async_register_command(hass, ws_get_config)

# Nouvelle fonction
@websocket_api.websocket_command({"type": "nexura/config/get"})
@websocket_api.async_response
async def ws_get_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict):
    """Handle get config command."""
    # Retrieve the config entry to get options
    entries = hass.config_entries.async_entries(DOMAIN)
    if entries:
        entry = entries[0]
        theme = entry.options.get("theme", "auto")
        connection.send_result(msg["id"], {"theme": theme})
    else:
        connection.send_result(msg["id"], {"theme": "auto"})
```

**Étape 2 : Commiter**
```bash
git add custom_components/nexura/__init__.py
git commit -m "feat(websocket): expose config via nexura/config/get"
```

### Tâche 4 : Récupération du Thème côté React

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\App.tsx`
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\App.css`

**Étape 1 : Implémenter le code**

Dans `App.tsx`, ajouter la logique de récupération du thème au démarrage.

```typescript
  const [theme, setTheme] = useState<'auto' | 'dark' | 'light'>('auto');

  useEffect(() => {
    // Dans le loadTiles ou via un appel dédié dès que la connexion est prête:
    if (hassState === 'connected') {
       callHAWebSocket('nexura/config/get').then((res: any) => {
         if (res && res.theme) setTheme(res.theme);
       }).catch(() => {});
    }
  }, [hassConnection, hassState]);

  useEffect(() => {
    // Appliquer une classe au body pour le thème
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-auto');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);
```

Dans `App.css`, forcer les variables de thème si `.theme-light` :
```css
body.theme-light {
    --bg-color: #f0f0f5;
    --text-color: #111;
    --panel-bg: rgba(255, 255, 255, 0.8);
    /* etc */
}
```

**Étape 2 : Commiter**
```bash
git add custom_components/nexura/frontend/src/App.tsx custom_components/nexura/frontend/src/App.css
git commit -m "feat(ui): fetch and apply theme from HA config"
```

## Plan de Vérification

### Vérification Automatisée
1. Pas de tests automatisés backend dans ce repo actuellement.
2. Lancer `npm run lint` et `npx tsc --noEmit` sur le frontend après modifications.

### Vérification Manuelle
1. Redémarrer Home Assistant.
2. Aller dans **Paramètres > Appareils et services > Nexura > Configurer**.
3. Changer le "theme" pour "light" et soumettre.
4. Recharger le dashboard Nexura.
5. Vérifier que la classe `theme-light` s'applique bien dynamiquement sur le body du document.
