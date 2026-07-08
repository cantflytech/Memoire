<script setup>
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth' // Ajuste le chemin si besoin
import LegalFooter from './components/LegalFooter.vue'
import { Menu, X, Shield, TrendingUp, BookOpen, LogOut, LogIn } from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()

// État d'ouverture du menu mobile drawer
const isMobileMenuOpen = ref(false)

const handleLogout = async () => {
  try {
    await logout()
    isMobileMenuOpen.value = false
    window.location.href = '/'
  } catch (error) {
    console.error('Erreur de déconnexion:', error)
  }
}

// Calcul dynamique de la couleur du fond du header selon la route active
const navbarBgColor = computed(() => {
  if (route.path === '/dashboard-epargne') return 'bg-[#0D9488]'
  if (route.path === '/dashboard-Investissement') return 'bg-[#6366F1]'
  if (route.path === '/learning') return 'bg-[#F43F5E]'
  return 'bg-[#0D9488]'
})

// Calcul de la couleur de la bordure et fond de la capsule/menu mobile
const capsuleBorderColor = computed(() => {
  if (route.path === '/dashboard-epargne') return 'border-[#096d64] bg-[#0b7c72]'
  if (route.path === '/dashboard-Investissement') return 'border-[#4f46e5] bg-[#4f52e2]'
  if (route.path === '/learning') return 'border-[#e11d48] bg-[#e23250]'
  return 'border-[#096d64] bg-[#0b7c72]'
})
</script>

<template>
  <nav :class="[navbarBgColor, 'sticky top-0 z-50 heading shadow-sm transition-colors duration-300 font-[\'Inter\']']">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <div class="flex-shrink-0">
          <RouterLink to="/" class="text-xl text-white font-black tracking-wide uppercase">FINKO</RouterLink>
        </div>

        <div class="hidden md:flex justify-center">
          <div :class="[capsuleBorderColor, 'flex items-center p-1 rounded-2xl border transition-colors duration-300']">
            <RouterLink 
              to="/dashboard-epargne" 
              class="text-white/90 hover:text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-black"
              active-class="bg-white !text-[#0D9488] shadow-xs"
            >
              <Shield class="w-3.5 h-3.5" />
              Epargne
            </RouterLink>

            <RouterLink 
              to="/dashboard-Investissement" 
              class="text-white/90 hover:text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-black"
              active-class="bg-white !text-[#6366F1] shadow-xs"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              Investir
            </RouterLink>

            <RouterLink 
              to="/learning" 
              class="text-white/90 hover:text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-black"
              active-class="bg-white !text-[#F43F5E] shadow-xs"
            >
              <BookOpen class="w-3.5 h-3.5" />
              Apprendre
            </RouterLink>
          </div>
        </div>

        <div class="hidden md:flex items-center justify-end">
          <template v-if="user">
            <button 
              @click="handleLogout"
              class="bg-[#F43F5E] hover:bg-rose-600 text-white py-2.5 px-5 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut class="w-3.5 h-3.5" /> Déconnexion
            </button>
          </template>
          <template v-else>
            <RouterLink 
              to="/login" 
              class="bg-white text-[#0D9488] py-2.5 px-5 rounded-xl text-xs font-black transition-colors hover:bg-gray-50 shadow-xs"
            >
              Connexion
            </RouterLink>
          </template>
        </div>

        <div class="flex md:hidden">
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen" 
            class="text-white hover:bg-white/10 p-2 rounded-xl transition-all outline-none cursor-pointer"
          >
            <component :is="isMobileMenuOpen ? X : Menu" class="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>

    <div 
      v-if="isMobileMenuOpen" 
      class="md:hidden border-t border-white/10 px-4 pt-3 pb-5 space-y-3 shadow-inner animate-slide-down"
      :class="navbarBgColor"
    >
      <div :class="[capsuleBorderColor, 'p-2 rounded-2xl border flex flex-col space-y-1.5']">
        <RouterLink 
          to="/dashboard-epargne" 
          @click="isMobileMenuOpen = false"
          class="text-white/90 px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all font-black"
          active-class="bg-white !text-[#0D9488] shadow-xs"
        >
          <Shield class="w-4 h-4" /> Epargne
        </RouterLink>

        <RouterLink 
          to="/dashboard-Investissement" 
          @click="isMobileMenuOpen = false"
          class="text-white/90 px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all font-black"
          active-class="bg-white !text-[#6366F1] shadow-xs"
        >
          <TrendingUp class="w-4 h-4" /> Investir
        </RouterLink>

        <RouterLink 
          to="/learning" 
          @click="isMobileMenuOpen = false"
          class="text-white/90 px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all font-black"
          active-class="bg-white !text-[#F43F5E] shadow-xs"
        >
          <BookOpen class="w-4 h-4" /> Apprendre
        </RouterLink>
      </div>

      <div class="pt-2">
        <template v-if="user">
          <button 
            @click="handleLogout"
            class="w-full bg-[#F43F5E] border border-rose-600/30 text-white py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <LogOut class="w-4 h-4" /> Me déconnecter de Finko
          </button>
        </template>
        <template v-else>
          <RouterLink 
            to="/login" 
            @click="isMobileMenuOpen = false"
            class="w-full bg-white text-[#0D9488] py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 text-center shadow-md"
          >
            <LogIn class="w-4 h-4" /> Se connecter à mon espace
          </RouterLink>
        </template>
      </div>
    </div>
  </nav>

  <main class="bg-[#F8FAFC] min-h-[calc(100vh-4rem)]">
    <RouterView />
  </main>

  <LegalFooter />
</template>

<style scoped>
/* Petite animation d'ouverture fluide sur mobile */
.animate-slide-down {
  animation: slideDown 0.2s ease-out forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>