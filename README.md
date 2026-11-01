# Expense Tracker

Application web de gestion des dépenses personnelles : ajoutez vos dépenses, suivez votre budget mensuel et visualisez où va votre argent. L'application fonctionne **entièrement dans le navigateur**, sans backend, sans base de données et sans authentification.

**Démo :** à renseigner après publication (par exemple via GitHub Pages).

## Fonctionnalités

- **Tableau de bord** : total des dépenses, nombre de transactions, dépenses du mois, budget mensuel et montant restant.
- **Dépenses** : ajout, modification et suppression (avec confirmation) ; description, montant, catégorie, date, moyen de paiement et note facultative.
- **Recherche et filtres** : par description, catégorie, moyen de paiement et période ; tri par date ou montant ; réinitialisation en un clic.
- **Budget** : budget mensuel modifiable, barre de progression, avertissement à partir de 80 % et état explicite en cas de dépassement.
- **Statistiques** : répartition par catégorie, évolution sur 6 mois et catégorie la plus coûteuse, mises à jour après chaque modification.
- **Données** : données de démonstration au premier lancement, export CSV, import CSV, suppression de toutes les données.
- **Interface** : responsive (mobile, tablette, ordinateur), mode clair/sombre mémorisé, modales et notifications toast.

## Technologies

HTML5, CSS3 et JavaScript vanilla (aucun framework, aucune dépendance, aucun outil de build).

## Fonctionnement de `localStorage`

Les données sont enregistrées dans le navigateur sous les clés suivantes :

| Clé | Contenu |
|---|---|
| `expense-tracker:expenses` | Liste des dépenses (JSON) |
| `expense-tracker:budget` | Budget mensuel |
| `expense-tracker:theme` | Thème choisi (`light` ou `dark`) |

Les données restent sur l'appareil et le navigateur utilisés. Vider les données du site ou changer de navigateur les efface : pensez à l'export CSV pour sauvegarder.

## Lancer le projet

Le projet utilise des modules ES (`type="module"`) : les navigateurs les bloquent lorsqu'on ouvre `index.html` directement depuis le disque (`file://`). Il faut donc le servir avec un petit serveur local (Python ou Node.js suffisent, aucune dépendance à installer) :

```bash
git clone https://github.com/noor-digital/expense-tracker.git
cd expense-tracker
python3 -m http.server 8000     # ou : npx serve .
```

Ouvrir ensuite <http://localhost:8000>.

## Structure

```
expense-tracker/
├── index.html
├── css/style.css
└── js/
    ├── storage.js   # données, localStorage, données de démonstration
    ├── charts.js    # graphiques HTML/CSS
    ├── ui.js        # rendu du DOM, modales, toasts
    └── app.js       # état, événements, filtres, import/export CSV
```

Les fichiers JavaScript sont des modules ES : `app.js` importe `storage.js` et `ui.js`, et `ui.js` importe `storage.js` et `charts.js`.

## Format CSV

En-tête : `description,montant,categorie,date,paiement,note` (le séparateur, virgule ou point-virgule, est détecté sur la ligne d'en-tête ; avec `;`, la virgule décimale est acceptée ; dates au format `AAAA-MM-JJ`). Les catégories ou moyens de paiement inconnus sont remplacés par « Autre » et « Espèces ». Les lignes invalides sont ignorées.

## Limites

- Données stockées localement : pas de synchronisation entre appareils.
- Montants en FCFA, sans gestion multi-devises.
- Import CSV simple : pas de détection d'encodage ni de doublons.


## À propos de NOOR DIGITAL

Expense Tracker fait partie du portfolio **NOOR DIGITAL** — *La lumière qui structure*.

- **GitHub :** https://github.com/noor-digital
- **Portfolio :** https://noor-digital.github.io/noor-digital-portfolio/
