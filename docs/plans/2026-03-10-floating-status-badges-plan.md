# Plan d'Implémentation de la Barre de Badges Flottante

**But :** Ajouter une petite pilule flottante ("Dynamic Island") sous l'en-tête du tableau de bord affichant le nombre de lumières allumées parmi celles configurées, avec un panneau de détails interactif au clic.

**Architecture :** Création d'un nouveau composant React `FloatingStatusBar` qui reçoit les tuiles (`tiles`) et entités (`hassEntities`) depuis `App.tsx`. Ce composant filtrera de lui-même les "lumières" allumées et s'occupera de l'animation, de la modal de détails et des actions individuelles (via un callback `onToggleLight` passé par le parent).

**Stack Technique :** React (hooks), Framer Motion (pour l'animation de la pilule et du menu déroulant), Lucide React (icônes), CSS Vanilla (glassmorphism).

---

## User Review Required
> [!NOTE]
> Merci de revoir le plan d'implémentation. Le composant s'intégrera juste en dessous du "header" existant pour rester visible et central. Le filtre ciblera uniquement les entités dont l'ID commence par `light.` qui sont présentes comme "tuiles" (tiles) actives sur le dashboard, conformément à nos discussions. L'interface "Dynamic Island" est gérée avec `framer-motion` de manière fluide.

## Proposed Changes

---

### Floating Status Bar Component

#### [NEW] FloatingStatusBar.css
`custom_components/nexura/frontend/src/components/FloatingStatusBar/FloatingStatusBar.css`
Style "glassmorphism" très épuré, centré absolument en haut de la page juste sous le header :
```css
.floating-status-bar {
  position: absolute;
  top: 80px; /* juste sous le header */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
}

... (refer to implementation plan artifact directly)

```

#### [NEW] FloatingStatusBar.tsx
`custom_components/nexura/frontend/src/components/FloatingStatusBar/FloatingStatusBar.tsx`
Intègre l'état interne (`isOpen`), mémorisation des lumières actives pour un rendu optimisé, et animations `framer-motion` :
```tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ...
```

---

### App Integration

#### [MODIFY] App.tsx
`custom_components/nexura/frontend/src/App.tsx`
- Importer `<FloatingStatusBar>`
- Insérer le composant au sommet du `main` ou sous `<header className="app-header">` à l'intérieur de `.app-container`.

```diff
+ import { FloatingStatusBar } from './components/FloatingStatusBar/FloatingStatusBar'

  // ... (juste en dessous de <header className="app-header">)
  <header className="app-header">
    // ...
  </header>
+ <FloatingStatusBar 
+   tiles={tiles} 
+   hassEntities={hassEntities} 
+   onToggleLight={handleToggle} 
+ />
```

---

## Verification Plan

### Manual Verification
1. Lancer l'environnement de développement : `cd custom_components/nexura/frontend && npm run dev`
2. Ouvrir le dashboard dans le navigateur et y placer au moins une tuile lumière (si ce n'est pas déjà fait).
3. Allumer cette tuile. 
4. **Validation** : Vérifier que la pilule "Dynamic Island" s'affiche avec la mention "1 lumière allumée" et l'icône appropriée en haut.
5. **Action** : Cliquer sur la pilule, valider que la modal déroulante liste bien la lumière.
6. **Interaction** : Éteindre la lumière depuis la modal, et valider que la tuile correspondante s'éteigne bien en arrière plan, entrainant par conséquent la disparition de la Dynamic Island.
