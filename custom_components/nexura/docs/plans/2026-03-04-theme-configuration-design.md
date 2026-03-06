# Design Document: Configuration du Thème Visuel via HA Options Flow

**Date:** 2026-03-04
**Auteur:** Antigravity (Assistant) / Simon Vernusse

## 1. Objectif du Projet
Permettre aux utilisateurs de Nexura de configurer de manière centralisée et globale le thème visuel de leur dashboard (Clair, Sombre ou Auto) directement depuis l'interface standard des paramètres d'intégration de Home Assistant.

## 2. Exigences
- L'utilisateur doit pouvoir ouvrir l'interface « Paramètres > Intégrations > Nexura > Configurer ».
- Le formulaire doit proposer un choix (`select`) avec les options suivantes :
  - **Auto** (Défaut, s'adapte à la préférence système ou au thème HA courant)
  - **Dark** (Thème Sombre forcé)
  - **Light** (Thème Clair forcé)
- La configuration sélectionnée doit être modifiable à chaud, sauvegardée de manière persistante dans la base de données Home Assistant.
- Le frontend React doit être capable de récupérer dynamiquement cette configuration via une requête WebSocket sans exposer toute la logique dans le frontend.
- Le frontend doit s'adapter visuellement à la volée ou a minima lors du prochain rechargement.

## 3. Architecture Proposée

### Composant Backend (Python / Home Assistant)
- **`config_flow.py` :** Implémenter le `OptionsFlow` natif à Home Assistant. Cela nécessite l'ajout du gestionnaire `async_get_options_flow` dans la classe principale du flux de configuration (`NexuraConfigFlow` ou similaire). Il affichera un schéma de données volant (`vol.Schema`) contenant l'option du thème.
- **Récupération des Options :** Au chargement de l'intégration (`__init__.py` ou `websocket_api.py`), l'architecture lira les valeurs contenues dans `entry.options` et les injectera dans le scope de la fonction de la websocket.
- **`websocket_api.py` :** Création d'un nouveau canal de commande WebSocket propre au dashboard (par exemple : `nexura/config/get`) qui, lorsqu'il est appelé par le frontend, retournera l'objet contenant les options définies par l'utilisateur.

### Composant Frontend (React / TypeScript)
- **Service API (`hass.ts`) :** Extension des requêtes supportées par `callHAWebSocket` pour inclure la commande `nexura/config/get`.
- **Composant Principal (`App.tsx` ou gestionnaire de layout) :** Insertion d'un appel API asynchrone pour requérir la configuration globale lors de son point de montage (dans un `useEffect`).
- **Gestion du Thème (CSS/Layout) :** Le résultat (`theme` paramétré) est déposé dans l'état local ou transmis à un ThemeContext. En cas de variante forcée, il modifie les classes du `<body>` ou du wrapper de l'application (en injectant `<div className={\`app-layout theme-\${theme}\`}>`). Si "auto" (la valeur par défaut), l'interface compte sur les variables CSS `(prefers-color-scheme)` existantes.

## 4. Plan de Tests (Vérifications d'acceptation)
1. L'installation/mise à jour du composant Python n'entraîne aucune erreur dans les journaux HA.
2. Le bouton "Configurer" est visible et cliquable au niveau de l'intégration dans HA.
3. La valeur sauvegardée est correctement retournée lors de l'appel manuel de la trace WebSocket en frontend.
4. L'apparence de la page Nexura change selon la valeur paramétrée.

---

> Ce document valide la section _Brainstorming_. L'équipe s'accorde pour lancer la tâche d'implémentation associée.
