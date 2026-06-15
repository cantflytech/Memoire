<script setup>
import { ref } from 'vue'
import EpargneParametre from '../components/EpargneParametre.vue'
import RecapCardEpargne from '../components/RecapCardEpargne.vue'
const donnees = ref({
  total: 0,
  epargne: 0,
  investissement: 0,
  pourcentageEpargne: 50,
  pourcentageInvestissement: 50,
  produitsEpargne: []
})

// État pour contrôler l'affichage de la modal
const showModal = ref(false)

// État pour la notification de sauvegarde
const showNotification = ref(false)

// Fonction pour ouvrir la modal
const ouvrirModal = () => {
  showModal.value = true
}

// Fonction pour fermer la modal
const fermerModal = () => {
  showModal.value = false
}

// Fonction pour gérer la sauvegarde des paramètres
const onParametresSauvegardes = (nouveauxParametres) => {
  donnees.value = nouveauxParametres
  console.log('Paramètres mis à jour:', nouveauxParametres)
  
  // Mettre à jour les graphiques avec les nouvelles données
  updateGraphiques()
  
  // Fermer la modal après sauvegarde
  fermerModal()
  // Afficher la notification
  afficherNotification()
}

// Fonction pour afficher la notification de succès
const afficherNotification = () => {
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

// Fonction pour formater les montants
const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant || 0)
}

// Données pour les livrets (graphique donut) - calculées dynamiquement
const livrets = ref([])

// Couleurs pour les différents produits d'épargne
const couleursLivrets = {
  'livret-a': '#22d3ee',       // Cyan clair
  'ldds': '#3b82f6',           // Blue
  'pel': '#fbbf24',            // Amber
  'lep': '#34d399',            // Emerald
  'cel': '#f59e0b',            // Orange
  'assurance-vie': '#ec4899',  // Pink
  'livret-jeune': '#8b5cf6',   // Purple
  'csl': '#84cc16'             // Lime
}

// Taux de rendement actuels par produit (selon le tableau fourni)
const tauxRendement = {
  'livret-a': 0.017,        // 1,70% à partir du 1er août
  'ldds': 0.017,            // 1,70% (aligné sur Livret A)
  'pel': 0.0175,            // 1,75% brut
  'lep': 0.027,             // 2,70% à partir du 1er août
  'cel': 0.0125,            // 1,25% brut à partir du 1er août
  'assurance-vie': 0.025,   // 2,50% brut (≈ 2,07% net) - estimation moyenne
  'livret-jeune': 0.017,    // 1,7% (2% ici) - selon banques
  'csl': 0.001              // 0,10% brut - taux très faible
}

// Fonction pour mettre à jour les graphiques
const updateGraphiques = () => {
  if (donnees.value.produitsEpargne && donnees.value.produitsEpargne.length > 0) {
    // Filtrer les produits qui ont un montant > 0
    livrets.value = donnees.value.produitsEpargne
      .filter(produit => (produit.montant || 0) > 0)
      .map(produit => ({
        nom: produit.nom,
        montant: produit.montant || 0,
        couleur: couleursLivrets[produit.id] || '#64748b',
        statut: getStatutProduit(produit.id),
        pourcentage: 0 // Calculé plus tard
      }))
    
    // Calculer les pourcentages pour le graphique donut
    const totalLivrets = livrets.value.reduce((sum, livret) => sum + livret.montant, 0)
    livrets.value.forEach(livret => {
      livret.pourcentage = totalLivrets > 0 ? (livret.montant / totalLivrets) * 100 : 0
    })
    
    // Mettre à jour la projection basée sur l'épargne actuelle
    updateProjection()
  }
}

// Fonction pour obtenir le statut d'un produit
const getStatutProduit = (produitId) => {
  const statuts = {
    'livret-a': 'Retrait Instantané',
    'ldds': 'Retrait Instantané',
    'pel': '4 ans avant fiscalité',
    'lep': 'Retrait Instantané',
    'cel': 'Retrait différé',
    'assurance-vie': '8 ans optimum fiscal',
    'livret-jeune': 'Retrait Instantané',
    'csl': 'Retrait Instantané'
  }
  return statuts[produitId] || 'Non défini'
}

// Fonction pour générer le style du graphique donut
const getDonutStyle = () => {
  if (livrets.value.length === 0) {
    return { background: '#e5e7eb' }
  }
  
  let cumulativePercentage = 0
  const gradientStops = []
  
  livrets.value.forEach((livret, index) => {
    const startAngle = (cumulativePercentage / 100) * 360
    const endAngle = ((cumulativePercentage + livret.pourcentage) / 100) * 360
    
    gradientStops.push(`${livret.couleur} ${startAngle}deg ${endAngle}deg`)
    cumulativePercentage += livret.pourcentage
  })
  
  return {
    background: `conic-gradient(${gradientStops.join(', ')})`
  }
}

// Fonction pour calculer la projection détaillée
const updateProjection = () => {
  if (!donnees.value.produitsEpargne || donnees.value.produitsEpargne.length === 0) {
    // Projection par défaut si pas de données
    projectionData.value = Array.from({ length: 7 }, (_, index) => ({
      annee: (2024 + index).toString(),
      montant: 0,
      details: []
    }))
    return
  }

  // Calculer la projection pour chaque année
  projectionData.value = Array.from({ length: 7 }, (_, annee) => {
    const anneeActuelle = 2024 + annee
    let totalAnnee = 0
    const detailsAnnee = []

    // Pour chaque produit d'épargne, calculer la valeur projetée
    donnees.value.produitsEpargne.forEach(produit => {
      const montantInitial = produit.montant || 0
      if (montantInitial > 0) {
        const taux = tauxRendement[produit.id] || 0.01 // taux par défaut 1%
        
        // Calcul avec intérêts composés sur la période
        const montantProjete = montantInitial * Math.pow(1 + taux, annee)
        
        totalAnnee += montantProjete
        
        detailsAnnee.push({
          nom: produit.nom,
          montantInitial: montantInitial,
          montantProjete: montantProjete,
          gainAnnee: montantProjete - montantInitial,
          taux: taux,
          couleur: couleursLivrets[produit.id] || '#64748b'
        })
      }
    })

    // Ajouter l'investissement (supposons 5% de rendement annuel)
    const montantInvestissement = donnees.value.investissement || 0
    if (montantInvestissement > 0) {
      const tauxInvestissement = 0.05
      const investissementProjete = montantInvestissement * Math.pow(1 + tauxInvestissement, annee)
      totalAnnee += investissementProjete
      
      detailsAnnee.push({
        nom: 'Investissements',
        montantInitial: montantInvestissement,
        montantProjete: investissementProjete,
        gainAnnee: investissementProjete - montantInvestissement,
        taux: tauxInvestissement,
        couleur: '#6b7280'
      })
    }

    return {
      annee: anneeActuelle.toString(),
      montant: Math.round(totalAnnee),
      details: detailsAnnee,
      gainTotal: Math.round(totalAnnee - (donnees.value.total || 0))
    }
  })
}

// Fonction pour obtenir les détails de projection pour une année
const getProjectionDetails = (anneeIndex) => {
  if (projectionData.value[anneeIndex]) {
    return projectionData.value[anneeIndex].details
  }
  return []
}

// Données pour la projection (graphique en barres) - calculées dynamiquement
const projectionData = ref([
  { annee: '2024', montant: 22000 },
  { annee: '2025', montant: 28000 },
  { annee: '2026', montant: 30000 },
  { annee: '2027', montant: 33000 },
  { annee: '2028', montant: 36000 },
  { annee: '2029', montant: 39000 },
  { annee: '2030', montant: 42000 }
])
</script>
<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <!-- Notification de succès -->
    <div 
      v-if="showNotification"
      class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300"
    >
      Paramètres sauvegardés avec succès !
    </div>

    <!-- Container principal -->
    <div class=" mx-auto">
      <RecapCardEpargne></RecapCardEpargne>
     
      </div>
    

      <!-- Bouton d'action -->
      <div class="flex justify-end mt-8">
        <button 
          @click="ouvrirModal"
          class="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg transition-colors"
        >
          Mettre à jour mon épargne
        </button>
      </div>

      <!-- Nouvelles cartes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <!-- Card Mes livrets -->
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <h3 class="text-xl font-semibold text-teal-600 mb-6">Mes livrets</h3>
          
          <!-- Graphique Donut simulé -->
          <div class="flex flex-col md:flex-row items-center gap-6">
            <!-- Graphique circulaire -->
            <div class="md:basis-2/3 flex justify-center md:justify-start">
            <div class="relative w-40 h-40 shrink-0">
              <div class="w-full h-full rounded-full border-[20px] border-gray-100 relative overflow-hidden">
                <!-- Segments du donut -->
                <div 
                  class="absolute inset-0 rounded-full"
                  :style="getDonutStyle()"
                ></div>
                <!-- Trou central -->
                <div class="absolute inset-4 bg-white rounded-full"></div>
              </div>
            </div>
            </div>
            <!-- Légende -->
            <div class="flex-1 md:basis-1/3 space-y-3">
              <div v-if="livrets.length === 0" class="text-center text-gray-500 py-4">
                <p>Aucune donnée d'épargne disponible</p>
                <p class="text-sm">Configurez vos paramètres d'épargne pour voir le détail de vos livrets</p>
              </div>
              <div v-else v-for="livret in livrets" :key="livret.nom" class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: livret.couleur }"
                  ></div>
                  <div>
                    <div class="font-medium text-gray-900">{{ livret.nom }}</div>
                    <div class="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full inline-block">
                      {{ livret.statut }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-semibold text-gray-900">
                    {{ formatMontant(livret.montant) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ Math.round(livret.pourcentage) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-gray-200">
            <button class="text-red-400 hover:text-red-500 text-sm font-medium">
              Les détails de mes livrets
            </button>
          </div>
        </div>

        <!-- Card Projection -->
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-teal-600">Projection de mon épargne</h3>
            <p class="text-sm text-gray-500">Projection 2024-2030 avec taux réels par produit</p>
          </div>
          
          <!-- Résumé des taux appliqués -->
          <div v-if="donnees.produitsEpargne && donnees.produitsEpargne.length > 0" class="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Taux appliqués :</h4>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <div v-for="produit in donnees.produitsEpargne.filter(p => (p.montant || 0) > 0)" :key="produit.id" class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: couleursLivrets[produit.id] }"></div>
                <span class="truncate">{{ produit.nom.split(' ')[0] }}:</span>
                <span class="font-medium">{{ ((tauxRendement[produit.id] || 0) * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- Graphique en barres amélioré -->
          <div class="space-y-2">
            <!-- Axe Y avec tooltip au survol -->
            <div class="flex items-end justify-between h-48 mb-4">
              <div v-for="(data, index) in projectionData" :key="data.annee" class="flex flex-col items-center group relative">
                <!-- Tooltip détaillé -->
                <div class="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white p-3 rounded-lg shadow-lg z-10 min-w-48">
                  <div class="text-sm font-medium mb-2">{{ data.annee }}</div>
                  <div class="text-xs space-y-1">
                    <div class="flex justify-between">
                      <span>Total:</span>
                      <span class="font-medium">{{ formatMontant(data.montant) }}</span>
                    </div>
                    <div v-if="data.gainTotal > 0" class="flex justify-between text-green-300">
                      <span>Gain vs initial:</span>
                      <span>+{{ formatMontant(data.gainTotal) }}</span>
                    </div>
                    <div v-if="data.details && data.details.length > 0" class="border-t border-gray-600 pt-1 mt-1">
                      <div v-for="detail in data.details" :key="detail.nom" class="flex justify-between">
                        <span class="truncate">{{ detail.nom.split(' ')[0] }}:</span>
                        <span>{{ formatMontant(detail.montantProjete) }}</span>
                      </div>
                    </div>
                  </div>
                  <!-- Petit triangle pointant vers le bas -->
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>

                <!-- Barre empilée par produit -->
                <div class="relative mb-2 w-8">
                  <div v-if="data.details && data.details.length > 0" 
                       class="w-full rounded-t-md transition-all duration-500 flex flex-col"
                       :style="{ 
                         height: Math.max((data.montant / Math.max(...projectionData.map(d => d.montant))) * 180, 10) + 'px'
                       }">
                    <!-- Segment pour chaque produit -->
                    <div v-for="(detail, detailIndex) in data.details" :key="detail.nom"
                         class="flex-1 transition-all duration-300"
                         :class="detailIndex === 0 ? 'rounded-t-md' : ''"
                         :style="{ 
                           backgroundColor: detail.couleur,
                           height: ((detail.montantProjete / data.montant) * 100) + '%'
                         }">
                    </div>
                  </div>
                  <!-- Fallback si pas de détails -->
                  <div v-else
                    class="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md transition-all duration-500"
                    :style="{ 
                      height: Math.max((data.montant / Math.max(...projectionData.map(d => d.montant))) * 180, 10) + 'px'
                    }">
                  </div>
                </div>

                <!-- Label année avec gain -->
                <div class="text-center">
                  <div class="text-xs text-gray-500 font-medium">{{ data.annee }}</div>
                  <div v-if="data.gainTotal > 0" class="text-xs text-green-600 font-medium">
                    +{{ Math.round(data.gainTotal / 1000) }}k
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Échelle Y dynamique -->
            <div class="flex justify-between text-xs text-gray-400 border-t pt-2">
              <span>{{ Math.round(Math.max(...projectionData.map(d => d.montant)) * 0.25 / 1000) }}k</span>
              <span>{{ Math.round(Math.max(...projectionData.map(d => d.montant)) * 0.5 / 1000) }}k</span>
              <span>{{ Math.round(Math.max(...projectionData.map(d => d.montant)) * 0.75 / 1000) }}k</span>
              <span>{{ Math.round(Math.max(...projectionData.map(d => d.montant)) / 1000) }}k</span>
            </div>
            
            <!-- Période et gain total -->
            <div class="flex justify-between items-center text-xs text-gray-500 mt-2">
              <span>{{ projectionData[0]?.annee || '2024' }}</span>
              <div v-if="projectionData[projectionData.length - 1]?.gainTotal > 0" class="text-green-600 font-medium">
                Gain projeté: {{ formatMontant(projectionData[projectionData.length - 1]?.gainTotal || 0) }}
              </div>
              <span>{{ projectionData[projectionData.length - 1]?.annee || '2030' }}</span>
            </div>

            <!-- Légende des couleurs -->
            <div v-if="donnees.produitsEpargne && donnees.produitsEpargne.length > 0" class="mt-4 pt-3 border-t border-gray-200">
              <div class="text-xs text-gray-500 mb-2">Répartition par produit :</div>
              <div class="flex flex-wrap gap-3">
                <div v-for="produit in donnees.produitsEpargne.filter(p => (p.montant || 0) > 0)" :key="produit.id" 
                     class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded" :style="{ backgroundColor: couleursLivrets[produit.id] }"></div>
                  <span class="text-xs text-gray-600">{{ produit.nom }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal pour les paramètres d'épargne -->
      <div 
        v-if="showModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="fermerModal"
      >
        <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          <!-- Bouton de fermeture -->
          <button 
            @click="fermerModal"
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
          >
            ✕
          </button>
          
          <!-- Contenu de la modal -->
          <div class="p-2">
            <EpargneParametre @parametres-sauvegardes="onParametresSauvegardes" />
          </div>
        </div>
      </div>
    </div>
 
</template>
