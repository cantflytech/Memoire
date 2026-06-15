import { ref } from 'vue'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'

export const useEpargneFirestore = () => {
  const { user } = useAuth()
  const loading = ref(false)
  const error = ref(null)

  // Sauvegarder les paramètres d'épargne dans Firestore
  const sauvegarderParametres = async (parametres) => {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('Utilisateur non connecté')
      }

      // Créer un document avec l'UID de l'utilisateur
      const userDocRef = doc(db, 'epargne_parametres', user.value.uid)
      
      // Ajouter des métadonnées
      const parametresAvecMetadata = {
        ...parametres,
        userId: user.value.uid,
        lastUpdated: new Date().toISOString(),
        userEmail: user.value.email
      }

      await setDoc(userDocRef, parametresAvecMetadata, { merge: true })
      
      console.log('Paramètres sauvegardés dans Firestore:', parametresAvecMetadata)
      return parametresAvecMetadata

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de la sauvegarde:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Récupérer les paramètres d'épargne depuis Firestore
  const chargerParametres = async () => {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('Utilisateur non connecté')
      }

      const userDocRef = doc(db, 'epargne_parametres', user.value.uid)
      const docSnap = await getDoc(userDocRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('Paramètres chargés depuis Firestore:', data)
        return data
      } else {
        console.log('Aucuns paramètres trouvés pour cet utilisateur')
        return null
      }

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors du chargement:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Supprimer les paramètres (optionnel)
  const supprimerParametres = async () => {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('Utilisateur non connecté')
      }

      const userDocRef = doc(db, 'epargne_parametres', user.value.uid)
      await setDoc(userDocRef, {}, { merge: false }) // Vide le document
      
      console.log('Paramètres supprimés')

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de la suppression:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction pour nettoyer les erreurs
  const clearError = () => {
    error.value = null
  }

  return {
    loading,
    error,
    sauvegarderParametres,
    chargerParametres,
    supprimerParametres,
    clearError
  }
}