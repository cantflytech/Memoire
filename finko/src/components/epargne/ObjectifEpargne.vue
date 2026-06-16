<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// États réactifs
const lifeProjects = ref([]);
const userAssets = ref([]);
const allProducts = ref([]);
const loading = ref(true);

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      // 1. Récupérer le profil financier de l'utilisateur (assets, life_projects)
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = profileData.assets || [];
        lifeProjects.value = profileData.life_projects || [];
      }

      // 2. Récupérer le catalogue des produits pour valider les plafonds réels si nécessaire
      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (e) {
      console.error("Erreur chargement données dashboard:", e);
    } finally {
      loading.value = false;
    }
  });
});

// --- CALCULS DU PATRIMOINE ---
const totalWealth = computed(() => {
  return userAssets.value.reduce((sum, asset) => sum + (asset.amount || 0), 0);
});

// Formate le texte central du Donut (ex: 130 K ou 22.2 K)
const formattedTotalWealth = computed(() => {
  if (totalWealth.value >= 1000) {
    return `${Math.round(totalWealth.value / 1000)} K`;
  }
  return `${totalWealth.value} €`;
});

// --- LOGIQUE DU DONUT CHART (DYNAMIQUE EN CSS) ---
const donutGradient = computed(() => {
  if (userAssets.value.length === 0) return 'linear-gradient(90deg,rgba(13, 148, 136, 1) 0%, rgba(99, 102, 241, 1) 29%, rgba(244, 63, 94, 1) 69%, rgba(245, 158, 11, 1) 100%);';
  
  // Couleurs de ta maquette assignées aux livrets principaux
  const colorPalette = ['#0D9488', '#6366F1', '#F43F5E', '#F59E0B', '#8B5CF6'];
  let currentPercentage = 0;
  
  const segments = userAssets.value.map((asset, index) => {
    const assetPercentage = (asset.amount / totalWealth.value) * 100;
    const color = colorPalette[index % colorPalette.length];
    const start = currentPercentage;
    currentPercentage += assetPercentage;
    return `${color} ${start}% ${currentPercentage}%`;
  });
  
  return `conic-gradient(${segments.join(', ')})`;
});

// Récupère l'année depuis la deadline (ex: "2026-05" -> "2026")
const getYear = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('-')[0];
};

// Vérification de plafond pour les badges
const isAssetFull = (asset) => {
  const productInfo = allProducts.value.find(p => p.id === asset.product_id);
  return productInfo && productInfo.max_amount && asset.amount >= productInfo.max_amount;
};

// Fonction de rafraîchissement manuel
const refreshData = () => {
  window.location.reload();
};
</script>

<template>
  <div class=" bg-[#F8FAFB] flex justify-center">
    
    <div v-if="loading" class="text-center text-gray-400 font-bold py-12">
      Chargement de tes widgets...
    </div>

    <div v-else class="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
      
      <div class="bg-white p-6 rounded-[28px] shadow-xs border border-gray-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 mb-6">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
                <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            <h3 class="heading text-xl green">Objectif vie</h3>
          </div>

          <div class="space-y-5">
            <div 
              v-for="(project, index) in lifeProjects" 
              :key="index"
              class="flex items-start gap-4"
            >
              <div class="w-11 h-11 bg-orange-100/70 rounded-xl flex items-center justify-center text-xl shrink-0">
                {{ project.icon || '🎯' }}
              </div>

              <div class="flex-grow space-y-1.5">
                <div class="flex justify-between items-baseline">
                  <h4 class="text-sm font-black text-gray-900">{{ project.name }}</h4>
                  <span class="text-[10px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-md">
                    Projet {{ getYear(project.deadline) }}
                  </span>
                </div>
                
                <p class="text-xs font-black text-gray-900">
                  {{ project.target_amount?.toLocaleString() }} €
                </p>

                <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-orange-400 h-full rounded-full transition-all duration-500 shadow-xs"
                    :style="{ width: totalWealth >= project.amount ? '100%' : '45%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div v-if="lifeProjects.length === 0" class="text-center py-6 text-xs text-gray-400 font-medium">
              Aucun projet de vie configuré.
            </div>
          </div>
        </div>

        <button class="button">
          <span>↗</span> Voir en détails
        </button>
      </div>

      <div class="bg-white p-6 rounded-[28px] shadow-xs border border-gray-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 mb-6">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
                <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            <h3 class="heading text-xl green">Mes livrets</h3>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-8 my-2">
            
            <div 
              class="w-36 h-36 rounded-full flex items-center justify-center relative shrink-0 shadow-inner"
              :style="{ background: donutGradient }"
            >
              <div class="w-[72%] h-[72%] bg-white rounded-full flex items-center justify-center shadow-xs">
                <span class="text-xl font-black text-gray-900 tracking-tight">
                  {{ formattedTotalWealth }}
                </span>
              </div>
            </div>

            <div class="flex-grow w-full space-y-4">
              <div 
                v-for="(asset, index) in userAssets" 
                :key="index"
                class="space-y-1"
              >
                <div class="flex justify-between items-center text-xs font-black">
                  <span class="text-gray-900 uppercase tracking-wide">{{ asset.name }}</span>
                  <span class="text-gray-900">{{ asset.amount?.toLocaleString() }} €</span>
                </div>
                
                <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full"
                    :style="{ 
                      width: `${(asset.amount / totalWealth) * 100}%`,
                      backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'][index % 5]
                    }"
                  ></div>
                </div>

                <div class="flex gap-1.5 pt-0.5">
                  <span class="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                    RETRAIT INSTANTANÉ
                  </span>
                  <span v-if="isAssetFull(asset)" class="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">
                    PLEIN
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button class="button">
            <span>↗</span> Voir en détails
          </button>
          
          <button 
            @click="refreshData"
            class="px-4 bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-xs"
          >
            <span>↗</span> Actualiser
          </button>
        </div>

      </div>

    </div>
  </div>
</template>