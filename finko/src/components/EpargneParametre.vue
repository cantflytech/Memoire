<template>
      <
    <div class="bg-white rounded-2xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Paramètres d'Épargne</h2>
        
        <!-- Notification -->
        <div v-if="notification" class="mb-4 p-3 rounded-lg text-sm text-center" :class="{
            'bg-green-100 text-green-800': notification.includes('succès') || notification.includes('chargées'),
            'bg-red-100 text-red-800': notification.includes('Erreur'),
            'bg-blue-100 text-blue-800': !notification.includes('succès') && !notification.includes('Erreur')
        }">
            {{ notification }}
        </div>

        <!-- Indicateur de chargement -->
        <div v-if="isLoading" class="mb-4 text-center">
            <div class="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-gray-600">Chargement des données...</span>
            </div>
        </div>
        
        <div class="space-y-6">
            <!-- Section Produits d'épargne -->
            <div>
                <h3 class="text-lg font-semibold text-emerald-600 mb-4">Mes produits d'épargne</h3>
                
                <div class="space-y-4">
                    <div v-for="produit in produitsEpargne" :key="produit.id" class="border border-gray-200 rounded-lg p-4">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <!-- Informations du produit -->
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">{{ produit.nom }}</h4>
                                <p class="text-sm text-gray-500 mt-1">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Plafond : {{ formatMontant(produit.plafond) }}
                                    </span>
                                </p>
                                <p v-if="produit.description" class="text-xs text-gray-400 mt-1">
                                    {{ produit.description }}
                                </p>
                            </div>
                            
                            <!-- Saisie du montant -->
                            <div class="flex items-center min-w-0 lg:min-w-48">
                                <input 
                                    v-model.number="produit.montant"
                                    type="number" 
                                    :max="produit.plafond"
                                    min="0"
                                    step="0.01"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    :placeholder="formatMontant(produit.plafond)"
                                />
                                <span class="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700">€</span>
                            </div>
                        </div>
                        
                        <!-- Barre de progression du plafond -->
                        <div class="mt-3">
                            <div class="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Utilisé : {{ formatMontant(produit.montant || 0) }}</span>
                                <span>{{ Math.round(((produit.montant || 0) / produit.plafond) * 100) }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    class="h-2 rounded-full transition-all duration-300"
                                    :class="getProgressBarColor(produit)"
                                    :style="{ width: Math.min(((produit.montant || 0) / produit.plafond) * 100, 100) + '%' }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Montant investissement -->
            <div>
                <label for="investissement" class="block text-sm font-medium text-gray-700 mb-2">
                    Montant investissement :
                </label>
                <div class="flex items-center">
                    <input 
                        type="number" 
                        id="investissement"
                        v-model.number="montantInvestissement" 
                        class="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        step="0.01"
                        min="0"
                        placeholder="5000"
                    />
                    <span class="bg-gray-100 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg text-lg font-medium text-gray-700">€</span>
                </div>
            </div>
            
          

            <!-- Bouton de sauvegarde -->
            <button 
                @click="sauvegarder"
                :disabled="isSaving || !user"
                class="w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                :class="{
                    'bg-emerald-500 hover:bg-emerald-600 text-white': !isSaving && user,
                    'bg-gray-400 text-gray-200 cursor-not-allowed': isSaving || !user
                }"
            >
                <svg v-if="isSaving" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSaving ? 'Sauvegarde en cours...' : (!user ? 'Connexion requise' : 'Sauvegarder les modifications') }}
            </button>

            <!-- Message d'info pour utilisateurs non connectés -->
            <div v-if="!user" class="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm text-center">
                <p class="font-medium">Connectez-vous pour sauvegarder vos paramètres</p>
                <p class="text-xs mt-1">Vos données seront synchronisées entre tous vos appareils</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEpargneFirestore } from '../composables/useEpargneFirestore'
import { useAuth } from '../composables/useAuth'

// Émissions d'événements
const emit = defineEmits(['parametres-sauvegardes'])

// Composables
const { user, loading: authLoading } = useAuth()
const { 
  loading: firestoreLoading, 
  error: firestoreError, 
  sauvegarderParametres, 
  chargerParametres,
  clearError 
} = useEpargneFirestore()

// États réactifs
const montantInvestissement = ref(5000)
const isSaving = ref(false)
const isLoading = ref(false)
const notification = ref('')

// Produits d'épargne avec valeurs par défaut
const produitsEpargne = ref([
  {
    id: 'livret-a',
    nom: 'Livret A',
    plafond: 22950,
    montant: 15000,
    description: 'Épargne réglementée, exonérée d\'impôts'
  },
  {
    id: 'ldds',
    nom: 'LDDS (ex-LDD)',
    plafond: 12000,
    montant: 8000,
    description: 'Livret de développement durable et solidaire'
  },
  {
    id: 'pel',
    nom: 'PEL (ouvert depuis 2025)',
    plafond: 61200,
    montant: 0,
    description: 'Plan épargne logement, taux 2,20%'
  },
  {
    id: 'lep',
    nom: 'LEP',
    plafond: 10000,
    montant: 7500,
    description: 'Livret d\'épargne populaire'
  },
  {
    id: 'cel',
    nom: 'CEL',
    plafond: 15300,
    montant: 0,
    description: 'Compte épargne logement'
  },
  {
    id: 'assurance-vie',
    nom: 'Assurance vie (fonds en euros)',
    plafond: 999999,
    montant: 25000,
    description: 'Pas de plafond légal'
  },
  {
    id: 'livret-jeune',
    nom: 'Livret Jeune',
    plafond: 1600,
    montant: 0,
    description: 'Pour les 12-25 ans'
  },
  {
    id: 'csl',
    nom: 'Compte sur Livret (CSL)',
    plafond: 999999,
    montant: 12000,
    description: 'Livret bancaire sans plafond'
  }
])

// Calculs computés
const totalEpargne = computed(() => {
  return produitsEpargne.value.reduce((total, produit) => {
    return total + (produit.montant || 0)
  }, 0)
})

const totalGeneral = computed(() => {
  return totalEpargne.value + (montantInvestissement.value || 0)
})

const pourcentageEpargne = computed(() => {
  if (totalGeneral.value === 0) return 0
  return Math.round((totalEpargne.value / totalGeneral.value) * 100)
})

const pourcentageInvestissement = computed(() => {
  if (totalGeneral.value === 0) return 0
  return Math.round(((montantInvestissement.value || 0) / totalGeneral.value) * 100)
})

// Fonctions utilitaires
const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant || 0)
}

const getProgressBarColor = (produit) => {
  const pourcentage = ((produit.montant || 0) / produit.plafond) * 100
  if (pourcentage >= 90) return 'bg-red-500'
  if (pourcentage >= 70) return 'bg-orange-500'
  if (pourcentage >= 50) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

// Fonction pour charger les données depuis Firestore
const chargerDonnees = async () => {
  if (!user.value) {
    console.log('Utilisateur non connecté, utilisation des valeurs par défaut')
    return
  }

  try {
    isLoading.value = true
    clearError()

    const parametresSauvegardes = await chargerParametres()
    
    if (parametresSauvegardes) {
      // Restaurer les données depuis Firestore
      if (parametresSauvegardes.montantInvestissement !== undefined) {
        montantInvestissement.value = parametresSauvegardes.montantInvestissement
      }
      
      if (parametresSauvegardes.produitsEpargne && Array.isArray(parametresSauvegardes.produitsEpargne)) {
        // Mettre à jour les montants des produits existants
        parametresSauvegardes.produitsEpargne.forEach(produitSauvegarde => {
          const produitLocal = produitsEpargne.value.find(p => p.id === produitSauvegarde.id)
          if (produitLocal) {
            produitLocal.montant = produitSauvegarde.montant || 0
          }
        })
      }

      notification.value = 'Données chargées depuis votre profil'
      setTimeout(() => notification.value = '', 3000)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notification.value = 'Erreur lors du chargement des données'
    setTimeout(() => notification.value = '', 3000)
  } finally {
    isLoading.value = false
  }
}

// Fonction pour sauvegarder dans Firestore
const sauvegarder = async () => {
  if (!user.value) {
    notification.value = 'Vous devez être connecté pour sauvegarder'
    setTimeout(() => notification.value = '', 3000)
    return
  }

  try {
    isSaving.value = true
    clearError()

    const parametres = {
      total: totalGeneral.value,
      epargne: totalEpargne.value,
      investissement: montantInvestissement.value || 0,
      pourcentageEpargne: pourcentageEpargne.value,
      pourcentageInvestissement: pourcentageInvestissement.value,
      produitsEpargne: produitsEpargne.value,
      montantInvestissement: montantInvestissement.value
    }

    // Sauvegarder dans Firestore
    await sauvegarderParametres(parametres)

    // Émettre l'événement pour le parent
    emit('parametres-sauvegardes', parametres)

    notification.value = 'Paramètres sauvegardés avec succès !'
    setTimeout(() => notification.value = '', 3000)

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    notification.value = 'Erreur lors de la sauvegarde'
    setTimeout(() => notification.value = '', 3000)
  } finally {
    isSaving.value = false
  }
}

// Surveiller les changements d'utilisateur pour charger les données
watch(user, async (newUser) => {
  if (newUser && !authLoading.value) {
    await chargerDonnees()
  }
}, { immediate: false })

// Charger les données au montage du composant
onMounted(async () => {
  if (user.value && !authLoading.value) {
    await chargerDonnees()
  }
})
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
}

/* Animation pour les barres de progression */
.bg-emerald-500,
.bg-yellow-500,
.bg-orange-500,
.bg-red-500 {
    transition: all 0.3s ease;
}
</style>