<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'
import router from './router'

const { user, logout } = useAuth()

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Erreur de déconnexion:', error)
  }
}
</script>

<template>
  <!-- Navigation horizontale en haut -->
  <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <span class="text-xl font-semibold text-gray-900">Finko</span>
        </div>

        <!-- Navigation links -->
        <div class="flex items-center space-x-8">
          <RouterLink 
            to="/" 
            class="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-emerald-600 bg-emerald-50"
          >
            Home
          </RouterLink>
          <!-- Liens pour utilisateurs connectés -->
          <template v-if="user">
            <RouterLink 
              to="/dashboard-epargne" 
              class="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-emerald-600 bg-emerald-50"
            >
              Dashboard Épargne
            </RouterLink>
          </template>
          <RouterLink
            to="/dashboard-placeholder" 
            class="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-emerald-600 bg-emerald-50"
          >
            Dashboard Placeholder
          </RouterLink>
          <RouterLink 
            to="/about" 
            class="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-emerald-600 bg-emerald-50"
          >
            About
          </RouterLink>

          <!-- Section authentification -->
          <div class="flex items-center space-x-4">
            <template v-if="user">
              <span class="text-sm text-gray-600">
                Bonjour, {{ user.displayName || user.email }}
              </span>
              <button 
                @click="handleLogout"
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Déconnexion
              </button>
            </template>
            <template v-else>
              <RouterLink 
                to="/login" 
                class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Connexion
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Contenu principal -->
  <main>
    <RouterView />
  </main>
</template>

<style scoped>


</style>
