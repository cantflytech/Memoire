<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          {{ isLoginMode ? 'Connexion' : 'Inscription' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ isLoginMode ? 'Connectez-vous à votre compte Finko' : 'Créez votre compte Finko' }}
        </p>
      </div>

      <!-- Affichage des erreurs -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="text-red-700 text-sm">
          {{ getErrorMessage(error) }}
        </div>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- Nom (uniquement pour l'inscription) -->
          <div v-if="!isLoginMode">
            <label for="name" class="block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Votre nom complet"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="votre.email@exemple.com"
            />
          </div>

          <!-- Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
              :minlength="isLoginMode ? 1 : 6"
            />
          </div>

          <!-- Confirmation mot de passe (uniquement pour l'inscription) -->
          <div v-if="!isLoginMode">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
              minlength="6"
            />
          </div>
        </div>

        <!-- Bouton de soumission -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="mr-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Chargement...' : (isLoginMode ? 'Se connecter' : 'S\'inscrire') }}
          </button>
        </div>

        <!-- Lien pour basculer entre login/register -->
        <div class="text-center">
          <button
            type="button"
            @click="toggleMode"
            class="text-emerald-600 hover:text-emerald-500 text-sm font-medium"
          >
            {{ isLoginMode ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login, register, loading, error, clearError } = useAuth()

// État du mode (login ou register)
const isLoginMode = ref(true)

// Formulaire
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Basculer entre login et register
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  clearError()
  // Réinitialiser le formulaire
  Object.assign(form, {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
}

// Validation du formulaire
const validateForm = () => {
  if (!isLoginMode.value) {
    if (form.password !== form.confirmPassword) {
      throw new Error('Les mots de passe ne correspondent pas')
    }
    if (form.password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères')
    }
    if (!form.name.trim()) {
      throw new Error('Le nom est requis')
    }
  }
  
  if (!form.email.trim()) {
    throw new Error('L\'email est requis')
  }
  
  if (!form.password.trim()) {
    throw new Error('Le mot de passe est requis')
  }
}

// Soumission du formulaire
const handleSubmit = async () => {
  try {
    clearError()
    validateForm()

    if (isLoginMode.value) {
      await login(form.email, form.password)
    } else {
      await register(form.email, form.password, form.name)
    }

    // Rediriger vers le dashboard après connexion/inscription réussie
    router.push('/dashboard-epargne')
  } catch (err) {
    console.error('Erreur d\'authentification:', err)
  }
}

// Messages d'erreur traduits
const getErrorMessage = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/weak-password': 'Le mot de passe est trop faible.',
    'auth/user-not-found': 'Aucun utilisateur trouvé avec cette adresse email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.'
  }

  // Si c'est une erreur Firebase
  if (error.includes('auth/')) {
    const errorCode = error.match(/auth\/[a-z-]+/)?.[0]
    return errorMessages[errorCode] || error
  }

  // Erreur de validation personnalisée
  return error
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>