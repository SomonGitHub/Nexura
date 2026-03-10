# Design des Badges d'État Flottants ("Dynamic Island")

## Date : 10 Mars 2026

## Vue d'ensemble
L'objectif est d'ajouter une barre de badges d'état (ou des pilules individuelles) sur le tableau de bord de Nexura. Pour cette première itération, nous nous concentrons sur un badge "lumière" qui indique le nombre de lumières actuellement allumées.

## Approche de Design

### Emplacement et Apparence
* **Dynamic Island** : Une petite interface en forme de pilule élégante apparaissant discrètement juste sous l'en-tête (Header) de l'interface existante.
* **Comportement dynamique** :
  * Si aucune lumière n'est allumée : Le badge n'apparaît pas ou reste particulièrement discret.
  * Si une ou plusieurs lumières sont allumées : Le badge s'anime en douceur pour apparaître, et affiche une icône 💡 accompagnée d'un compteur du nombre de lumières allumées.

### Comptabilisation et Périmètre
* Le comptage se base **exclusivement** sur les lumières qui ont été préalablement ajoutées comme tuiles dans le tableau de bord Nexura de l'utilisateur.
* Il ne tient pas compte des lumières "techniques" ou celles non gérées sur l'interface Nexura actuelle.

### Interaction
* Le badge est interactif et visuellement cliquable (effet de survol).
* **Panneau de Détails (Modal / Pop-up)** : Un clic sur le badge révèle un panneau additionnel listant la totalité des lumières (gérées dans l'interface et allumées).
* **Actions** : Sur ce panneau, chaque élément de la liste peut être allumé/éteint individuellement, offrant un contrôle fin depuis n'importe où sur l'application. On prévoira également un contrôle global ("Tout éteindre").
