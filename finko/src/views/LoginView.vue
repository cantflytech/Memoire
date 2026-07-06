<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { ArrowRight, Mail, Lock, User, AlertCircle, UserPlus, LogIn } from 'lucide-vue-next'

const router = useRouter()
const { login, register, loading, error, clearError } = useAuth()

// false = Inscription (mis en avant), true = Connexion
const isLoginMode = ref(false)

// Formulaire
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Basculer via le bouton switch du haut
const setMode = (loginMode) => {
  isLoginMode.value = loginMode
  clearError()
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
      router.push('/dashboard-epargne')
    } else {
      await register(form.email, form.password, form.name)
      router.push('/register-2')
    }

  } catch (err) {
    console.error('Erreur d\'authentification:', err)
  }
}

// Messages d'erreur traduits
const getErrorMessage = (errorStr) => {
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

  if (typeof errorStr === 'string' && errorStr.includes('auth/')) {
    const errorCode = errorStr.match(/auth\/[a-z-]+/)?.[0]
    return errorMessages[errorCode] || errorStr
  }

  return errorStr?.message || errorStr
}
</script>

<template>
  <div class="relative min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
    
    <!-- Éléments de fond -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-[#0D9488]/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0a7a70]/50 rounded-full blur-3xl opacity-20" />
    </div>

    <!-- Conteneur principal -->
    <div class="relative z-10 max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 transition-all duration-300">
      
      <!-- Bouton Switch d'onglets (Inspiré de image_ce9c6a.png) -->
      <div class="flex justify-center mb-8">
        <div class="relative w-full max-w-[320px] bg-[#0D9488]/10 p-1.5 rounded-2xl flex items-center">
          <!-- Pilule blanche coulissante -->
          <div 
            class="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 ease-out"
            :class="isLoginMode ? 'translate-x-full' : 'translate-x-0'"
          />
          
          <!-- Onglet Inscription -->
          <button 
            type="button" 
            @click="setMode(false)"
            class="relative z-10 w-1/2 py-2.5 flex items-center justify-center gap-2 text-sm font-black transition-colors duration-200"
            :class="!isLoginMode ? 'text-[#0D9488]' : 'text-gray-500 hover:text-gray-700'"
          >
            <UserPlus class="w-4 h-4" />
            <span>Inscription</span>
          </button>

          <!-- Onglet Connexion -->
          <button 
            type="button" 
            @click="setMode(true)"
            class="relative z-10 w-1/2 py-2.5 flex items-center justify-center gap-2 text-sm font-black transition-colors duration-200"
            :class="isLoginMode ? 'text-[#0D9488]' : 'text-gray-500 hover:text-gray-700'"
          >
            <LogIn class="w-4 h-4" />
            <span>Connexion</span>
          </button>
        </div>
      </div>

      <!-- Header adaptatif -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-black text-gray-900 tracking-tight">
          {{ isLoginMode ? 'Bon retour !' : 'Rejoindre Finko' }}
        </h2>
        <p class="mt-2 text-sm font-semibold text-gray-400">
          {{ isLoginMode ? 'Connectez-vous à votre espace Finko' : 'Pilotez votre épargne et vos investissements' }}
        </p>
      </div>

      <!-- Alertes erreurs -->
      <div 
        v-if="error" 
        class="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-shake"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
        <div class="text-sm font-bold">
          {{ getErrorMessage(error) }}
        </div>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        
        <!-- Nom complet (Inscription uniquement) -->
        <div v-if="!isLoginMode" class="space-y-1">
          <label for="name" class="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Nom complet
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <User class="w-5 h-5" />
            </span>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
              placeholder="Votre nom complet"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-1">
          <label for="email" class="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Adresse email
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Mail class="w-5 h-5" />
            </span>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
              placeholder="votre.email@exemple.com"
            />
          </div>
        </div>

        <!-- Mot de passe -->
        <div class="space-y-1">
          <label for="password" class="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Mot de passe
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Lock class="w-5 h-5" />
            </span>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
              placeholder="••••••••"
              :minlength="isLoginMode ? 1 : 6"
            />
          </div>
        </div>

        <!-- Confirmer le mot de passe (Inscription uniquement) -->
        <div v-if="!isLoginMode" class="space-y-1">
          <label for="confirmPassword" class="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Confirmer le mot de passe
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Lock class="w-5 h-5" />
            </span>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
              placeholder="••••••••"
              minlength="6"
            />
          </div>
        </div>

        <!-- Bouton principal -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#0D9488] hover:bg-[#0a7a70] text-white font-black text-lg shadow-lg shadow-[#0D9488]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Chargement...</span>
            </span>
            <span v-else class="flex items-center gap-2">
              <span>{{ isLoginMode ? 'Se connecter' : 'Commencer gratuitement' }}</span>
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        <!-- Mentions légales -->
        <p class="text-center text-[11px] leading-relaxed text-gray-400 px-2 pt-2">
          En continuant, vous acceptez nos 
          <a href="#" class="text-[#0D9488] font-bold hover:underline">Conditions d'utilisation</a> 
          et notre 
          <a href="#" class="text-[#0D9488] font-bold hover:underline">Politique de confidentialité</a>.
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>