# 🚀 Finko - Plateforme de Gestion de Finances Personnelles & d'Éducation Financière

Finko est une application web moderne (Single Page Application) conçue pour aider les utilisateurs à piloter leur santé financière, suivre leurs investissements en temps réel, et développer leurs compétences économiques via un parcours d'apprentissage ludique et gamifié.

---

## 🌟 Fonctionnalités Principales

### 📈 1. Suivi d'Investissement & Analyse Globale
*   **Valorisation en temps réel** : Intégration en direct avec l'API Binance pour récupérer le cours exact du Bitcoin ($BTC$) et de l'Ethereum ($ETH$).
*   **Registre des positions** : Gestion dynamique (Achat/Vente/Ajout) des actifs segmentés par catégories (Crypto-actifs, Obligations & Livrets, Immobilier).
*   **Historique d'activité automatique** : Journalisation automatique des 5 dernières transactions de l'utilisateur avec horodatage serveur et reçus d'ordres.
*   **Score de diversification intelligent** : Algorithme basé sur l'indice de concentration Herfindahl-Hirschman (HHI) normalisé, mesurant en temps réel la répartition du capital pour limiter les risques.
*   **Indicateurs financiers** : Calcul en direct de la volatilité pondérée du portefeuille et du rendement brut total sur capital injecté.

### 🛡️ 2. Gestion de l'Épargne & Flux Mensuels
*   **Bilan budgétaire** : Suivi global du reste à vivre et de la capacité d'épargne mensuelle.
*   **Modales contextuelles** : Interface immersive en mode pop-up flouté (`backdrop-blur`) permettant d'ajouter des historiques financiers mensuels sans quitter l'écran principal.

### 📖 3. Parcours Éducatif Gamifié (Style Duolingo)
*   **Cours interactifs** : Chapitres complets structurés en leçons (Budget, Fonds de sécurité, Intérêts composés, Enveloppes fiscales PEA/AV).
*   **Simulations embarquées** : Outils de calcul intégrés directement au sein des leçons pour tester des formules budgétaires de manière pratique.
*   **Système de Progression d'XP** : Gain d'XP (+50 XP par cours validé), gestion des paliers de niveau (3 000 XP par niveau) avec stockage persistant et jauge de progression animée dans le tableau de bord.

### 📱 4. Expérience Utilisateur & Design Réactif
*   **Interface Responsive** : Barre de navigation adaptative intégrant un menu "hamburger/drawer" et des boutons d'accès rapide conçus spécifiquement pour les écrans mobiles et tactiles.
*   **Capsule dynamique** : Changement automatique de la charte graphique globale de l'en-tête (couleurs thématiques Épargne, Investissement, Apprentissage) selon la page visitée pour une navigation intuitive.

---

## 🛠️ Stack Technique

*   **Frontend** : [Vue.js 3](https://vuejs.org/) (Composition API avec `<script setup>`)
*   **Routage** : [Vue Router](https://router.vuejs.org/)
*   **Styles & UI** : [Tailwind CSS](https://tailwindcss.com/) & [Lucide Vue Next](https://lucide.dev/) (Icônes)
*   **Backend & Base de données** : [Firebase](https://firebase.google.com/) (Cloud Firestore pour le stockage et l'historique des profils utilisateur)
*   **Authentification** : Firebase Authentication (Gestion des états de connexion persistants via `onAuthStateChanged`)
*   **API Données** : API Binance REST
*   **Outils de build** : [Vite](https://vite.dev/)

---

## ⚙️ Installation & Lancement en Local

### Prérequis
Avoir [Node.js](https://nodejs.org/) installé sur votre machine.

### 1. Cloner le dépôt
```bash
git clone [https://github.com/votre-username/finko.git](https://github.com/votre-username/finko.git)
cd finko

```

### 2. Installer les dépendances

```bash
npm install

```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine du projet et ajoutez-y vos clés de configuration Firebase :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id

```

### 4. Lancer le serveur de développement

```bash
npm run dev

```

L'application sera accessible en local à l'adresse : `http://localhost:5173`

---

## 🚀 Déploiement sur Firebase Hosting

Pour compiler l'application et la pousser en production sur l'hébergement Firebase :

```bash
# 1. Générer les fichiers de production optimisés dans le dossier /dist
npm run build

# 2. Déployer sur Firebase Hosting
firebase deploy --only hosting

```

---

## 📁 Architecture du Projet (Dossier `/src`)

```text
src/
├── assets/          # Fichiers multimédias et styles globaux
├── components/      # Composants d'interface partagés (PortefeuilleGlobal, etc.)
├── composables/     # Logique métier réutilisable (useAuth pour Firebase)
├── firebase/        # Fichiers de configuration initiale de Firebase
├── router/          # Configuration des routes de l'application (vue-router)
├── views/           # Écrans principaux (Dashboards, Learning, Login, etc.)
├── App.vue          # Composant racine
└── main.js          # Point d'entrée JavaScript de l'application

```
