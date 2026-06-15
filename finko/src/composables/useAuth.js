import { ref, onMounted } from 'vue'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '../firebase/config'

// État global de l'utilisateur
const user = ref(null)
const loading = ref(true)
const error = ref(null)

export const useAuth = () => {
  // Fonction d'inscription
  const register = async (email, password, displayName = '') => {
    try {
      loading.value = true
      error.value = null
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Mettre à jour le profil avec le nom d'affichage
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      
      return userCredential.user
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      
      await signOut(auth)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction pour nettoyer les erreurs
  const clearError = () => {
    error.value = null
  }

  // Écouter les changements d'état de l'authentification
  onMounted(() => {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      loading.value = false
    })
  })

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    clearError
  }
}