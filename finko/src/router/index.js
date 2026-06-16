import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/dashboard-epargne',
      name: 'dashboard-epargne',
      component: () => import('../views/DashboardEpargne.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard-placeholder',
      name: 'dashboard-placeholder',
      component: () => import('../views/DashboardPlaceholder.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/register-2',
      name: 'register-2',
      component: () => import('../views/register/RegiterDepense.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/register-3',
      name: 'register-3',
      component: () => import('../views/register/RegisterEnvelope.vue'),
      meta: { requiresAuth: true }
    },
     {
      path: '/register-4',
      name: 'register-4',
      component: () => import('../views/register/RegisterProjet.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/learning',
      name: 'learning',
      component: () => import('../views/EducationCours.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guard pour protéger les routes qui nécessitent une authentification
router.beforeEach((to, from, next) => {
  const { user } = useAuth()
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user.value) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
