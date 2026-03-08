# Plan d'Implémentation UX Édition : Smart Glass Overlay

## Objectif Technique
Restructurer le code JSX/CSS de `BentoTile` pour séparer l'état "Edit Mode Actif (Grille)" de l'état "Overlay Contrôle Actif (Tuile sélectionnée)". Remplacer les Emojis par des SVG premium via `lucide-react`.

## Changements Proposés

### 1. Gestion de l'état `isOverlayActive` dans BentoTile
- #### [MODIFY] `BentoTile.tsx`
  - Ajouter un état React local : `const [isOverlayActive, setIsOverlayActive] = useState(false)`.
  - Quand `isEditMode` est `true`, écouter le `onClick` sur le container principal (la tuile entière) pour faire `setIsOverlayActive(true)`.
  - En mode édition, les évènements de tuile standarts (`onClick` d'action HA) doivent être neutralisés au profit de l'ouverture de l'Overlay.
  - Le `onClick` sur la tuile ne bloque pas le Drag (`pointer-events` gérés).

### 2. UI du Sur-Calque (Glass Overlay)
- #### [MODIFY] `BentoTile.tsx`
  - Inclure un block conditionnel rendu uniquement si `isEditMode && isOverlayActive`.
  - Ce block `<motion.div className="tile-glass-overlay">` contiendra :
    1. Un fond sombre flouté absolu, bloquant le clic en dessous.
    2. Une grille CSS ou Flexbox au centre pour les 4 gros boutons d'action.
    3. Un bouton "Fermer" discret sur la tuile (ou l'overlay se ferme si on clique hors de l'overlay, à voir via un évènement global simple : cliquer sur l'overlay lui-même s'il ne touche aucun bouton déclenche `setIsOverlayActive(false)`).

### 3. Nettoyage de l'UI Édition par défaut
- #### [MODIFY] `BentoTile.tsx`
  - Quand `isEditMode` mais **sans** `isOverlayActive` :
    - On affiche uniquement une légère indication de Drag (Pulse, ou bordure).
    - Plus de `<div className="edit-actions">` flottantes au chargement.

### 4. Remplacement des Emojis et Gestion du Drag (Le défi du Scroll Mobile)
- #### [MODIFY] `BentoTile.tsx`
  - Importer `Maximize2`, `Pencil`, `Star`, et `Trash2` depuis `lucide-react`.
  - Supprimer la poignée `⠿`.
  - Assigner les `...listeners` générés par `useSortable` à la tuile entière (le parent `motion.div`), ou au calque d'overlay lui-même s'il est actif.
- #### [MODIFY] `App.tsx`
  - **Pour résoudre le problème du défilement mobile** : Nous allons modifier la configuration du `PointerSensor` de Dnd-kit. Actuellement, il s'active instantanément (`distance: 1`). Nous allons le paramétrer pour simuler un "Appui long" (Long Press) typique d'iOS :
  ```typescript
  useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250, // Il faut maintenir le doigt 250ms pour démarrer le drag
      tolerance: 5, // Permet au doigt de bouger légèrement sans annuler le drag
    },
  })
  ```
  - Grâce à cela, si l'utilisateur balaie l'écran (swipe classique), le navigateur fait défiler la page normalement. S'il maintient son doigt sur une tuile, le drag s'enclenche !

### 5. Styles CSS Modernes
- #### [MODIFY] `BentoTile.css`
  - Supprimer les styles `.edit-actions` compacts.
  - Ajouter les classes :
    - `.tile-glass-overlay` : `position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; z-index: 20; border-radius: inherit;`
    - `.glass-action-btn` : Gros bouton carré/rond `44x44px` ou `48x48px` avec fond Translucide + icône Blanche, effet Hover néon.
    - Animation d'entrée Framer Motion (`initial={{ opacity: 0 }}` -> `animate={{ opacity: 1 }}`).

## Vérification

### Tests Manuels (Desktop & Mobile Preview)
1. Activation : Cliquer sur "Modifier le Dashboard" (App.tsx). Les tuiles sont bordées de tirets, mais vides d'icônes.
2. Interaction Clic : Cliquer sur la tuile "Météo" affiche en grand les 4 boutons en plein milieu. Les tuiles derrière deviennent grisées/floues.
3. Interaction Action : Cliquer sur l'icône `Pencil` (Modifier) ferme l'overlay (optionnel) et ouvre la modale Native existante.
4. Drag & Drop : Vérifier qu'on peut toujours glisser la tuile. Un délai de maintien (Long-press) peut être nécessaire ou alors l'absence d'Overlay actif empêche le pointer-events de bloquer. (Sensor Pointer dans `App.tsx`)
