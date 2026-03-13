# Design des Badges d'État Flottants ("Dynamic Island")

## Date : 10 Mars 2026

## Vue d'ensemble
L'objectif est d'ajouter un système de badges d'état ("Dynamic Island") sur le tableau de bord de Nexura. Après une première version pour les lumières, nous étendons le système pour supporter plusieurs catégories d'alertes simultanées sous forme de pilules séparées.

## Badges Supportés
1. **Lumières** : Nombre de lumières allumées.
2. **Volets** : Nombre de volets actuellement ouverts.

## Approche de Design

### Emplacement et Apparence
* **Dynamic Island Multi-pilules** : Les badges apparaissent sous forme de pilules individuelles, alignées horizontalement et centrées sous l'en-tête (Header).
* **Comportement dynamique** :
  * Chaque badge n'apparaît que si son compteur est supérieur à 0 (ex: au moins une lumière allumée ou un volet ouvert).
  * Les pilules s'animent indépendamment pour apparaître/disparaître.

### Comptabilisation et Périmètre
* Le comptage se base **exclusivement** sur les entités qui ont été préalablement ajoutées comme tuiles dans le tableau de bord Nexura.
* **Lumières** : Domaine `light.*`, état `on`.
* **Volets** : Domaine `cover.*`, état différent de `closed` (soit `open`, `opening` ou `closing`).

### Interaction
* Chaque pilule ouvre son propre **Panneau de Détails** spécifique.
* **Badge Volets** : 
  * Affiche la liste des volets ouverts.
  * Permet de fermer chaque volet individuellement.
  * Bouton global "Tout fermer".

### Interaction
* Le badge est interactif et visuellement cliquable (effet de survol).
* **Panneau de Détails (Modal / Pop-up)** : Un clic sur le badge révèle un panneau additionnel listant la totalité des lumières (gérées dans l'interface et allumées).
* **Actions** : Sur ce panneau, chaque élément de la liste peut être allumé/éteint individuellement, offrant un contrôle fin depuis n'importe où sur l'application. On prévoira également un contrôle global ("Tout éteindre").
