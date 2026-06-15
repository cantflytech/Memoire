# Configuration de l'authentification Firebase

## Fonctionnalités implémentées

✅ **Inscription utilisateur** avec email/mot de passe
✅ **Connexion utilisateur** avec email/mot de passe  
✅ **Déconnexion utilisateur**
✅ **Protection des routes** (Dashboard nécessite une authentification)
✅ **Gestion des erreurs** avec messages traduits en français
✅ **Interface utilisateur** moderne avec Tailwind CSS

## Pages disponibles

- `/login` - Page de connexion/inscription
- `/dashboard-epargne` - Page protégée (nécessite une authentification)

## Comment utiliser

1. **Créer un compte** : Allez sur `/login` et utilisez le mode "Inscription"
2. **Se connecter** : Utilisez vos identifiants pour vous connecter
3. **Accéder au dashboard** : Une fois connecté, vous pouvez accéder au dashboard d'épargne
4. **Se déconnecter** : Cliquez sur le bouton "Déconnexion" dans la navigation

## Architecture

- `src/firebase/config.js` - Configuration Firebase
- `src/composables/useAuth.js` - Logique d'authentification réutilisable
- `src/views/LoginView.vue` - Page de connexion/inscription
- `src/router/index.js` - Protection des routes

## Navigation

- **Utilisateur non connecté** : Voit "Connexion" dans la navigation
- **Utilisateur connecté** : Voit son nom/email et le bouton "Déconnexion"
- **Protection automatique** : Redirection vers `/login` si tentative d'accès à une page protégée

## Firebase Console

Votre projet Firebase est configuré et prêt à utiliser :
- Projet ID: `finko-e8e37`
- Auth Domain: `finko-e8e37.firebaseapp.com`

## Prochaines étapes possibles

- Ajouter la réinitialisation de mot de passe
- Implémenter l'authentification Google/Facebook
- Ajouter la vérification d'email
- Persister les données d'épargne par utilisateur dans Firestore