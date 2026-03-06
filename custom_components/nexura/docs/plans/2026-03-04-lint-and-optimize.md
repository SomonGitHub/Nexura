# Plan d'Implémentation de Optimisation Frontend

**But :** Optimiser les composants React et les styles CSS ciblés sans introduire de régressions (refactoring de performance et nettoyage de code).

**Architecture :** Extraire les composants imbriqués pour éviter les re-rendus inutiles de React, mémoriser les fonctions de rappel (callbacks) et les constantes, et supprimer le CSS redondant.

**Stack Technique :** React, TypeScript, CSS

---

### Tâche 1 : Optimisation de Sidebar.tsx

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\components\Sidebar\Sidebar.tsx`

**Étape 1 : Extraire NavItem**
Déplacer les types et le composant `NavItem` en dehors de la définition de `Sidebar` pour éviter qu'il ne soit recréé à chaque rendu de la barre latérale.

**Étape 2 : Commiter**
```bash
git add src/components/Sidebar/Sidebar.tsx
git commit -m "perf(sidebar): extract NavItem outside Sidebar to prevent re-renders"
```

### Tâche 2 : Nettoyage de Sidebar.css

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\components\Sidebar\Sidebar.css`

**Étape 1 : Retirer le CSS dupliqué**
Supprimer les règles CSS redondantes (`.nav-item:hover .nav-label` définies deux fois).

**Étape 2 : Commiter**
```bash
git add src/components/Sidebar/Sidebar.css
git commit -m "style(sidebar): remove duplicate css rules"
```

### Tâche 3 : Optimisation de GraphContent.tsx

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\components\Tiles\GraphContent.tsx`

**Étape 1 : Mémoriser stopPropagation**
Utiliser `useCallback` sur `stopPropagation`.

**Étape 2 : Commiter**
```bash
git add src/components/Tiles/GraphContent.tsx
git commit -m "perf(tiles): memoize stopPropagation callback in GraphContent"
```

### Tâche 4 : Optimisation de useTileStatus.ts

**Fichiers :**
- Modifier : `c:\Users\simon.vernusse\Documents\hacs-nexura\custom_components\nexura\frontend\src\hooks\useTileStatus.ts`

**Étape 1 : Extraire la constante isSecurityClass**
Déplacer le tableau des classes de sécurité en dehors du hook pour qu'il ne soit pas recréé à chaque appel.

**Étape 2 : Commiter**
```bash
git add src/hooks/useTileStatus.ts
git commit -m "perf(hooks): extract security classes array outside hook"
```

## Plan de Vérification

### Vérification Automatisée
Puisque NPM/NPX ne sont pas reconnus dans l'environnement actuel, le code linter ne peut être exécuté par script via la console standard de l'Agent. TypeScript effectue sa validation à la compilation dans l'IDE.

### Vérification Manuelle
1. Ouvrir l'application dans le navigateur.
2. Vérifier que la Sidebar (barre latérale) s'affiche et réagit bien au survol et au défilement (Marquee).
3. Vérifier l'affichage correct des tuiles de type graphe et s'assurer que le glisser-déposer (DND) sur l'écran fonctionne toujours.
4. Vérifier que les halos de priorité/sécurité s'affichent correctement (ex. Danger, Gold, etc.) sans régression visuelle.
