<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// États réactifs
const userAssets = ref([]);
const lifeProjects = ref([]);
const allProducts = ref([]);
const initialWealth = ref(0);
const loading = ref(true);

// Configuration de la projection (Basée sur l'année actuelle)
const startYear = new Date().getFullYear();
const projectionYears = 13; // De l'année actuelle à 13 ans plus tard

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      // 1. Charger le profil utilisateur (assets, life_projects)
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = data.assets || [];
        lifeProjects.value = data.life_projects || [];
        initialWealth.value = data.total_wealth || 0;
      }

      // 2. Charger le catalogue des produits pour avoir les interest_rate
      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (e) {
      console.error("Erreur de chargement des projections :", e);
    } finally {
      loading.value = false;
    }
  });
});

// Extraire l'année d'une deadline (ex: "2026-05" -> 2026)
const getProjectYear = (deadlineStr) => {
  if (!deadlineStr) return null;
  return parseInt(deadlineStr.split('-')[0]);
};

// --- LOGIQUE FINANCIÈRE SANS INJECTION D'ÉPARGNE AUTOMATIQUE ---
const chartData = computed(() => {
  const dataset = [];
  
  // On fait une copie des assets pour pouvoir simuler leurs intérêts sans modifier les vrais réactifs
  let simulatedAssets = userAssets.value.map(asset => ({ ...asset }));

  for (let i = 0; i < projectionYears; i++) {
    const currentYear = startYear + i;

    // Étape A : Si on a dépassé l'année de départ, chaque asset prend ses intérêts de l'année précédente
    if (i > 0) {
      simulatedAssets.forEach(asset => {
        const productInfo = allProducts.value.find(p => p.id === asset.product_id);
        const rate = productInfo ? (productInfo.interest_rate || 0) : 0;
        
        // Calcul des intérêts capitalisés : montant actuel * (1 + taux)
        asset.amount = asset.amount * (1 + (rate / 100));
      });
    }

    // Étape B : Calcul de la somme totale du patrimoine pour cette année-là
    const totalWealthThisYear = simulatedAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0);

    // Étape C : Vérifier si des projets de vie se terminent cette année-là
    const projectsThisYear = lifeProjects.value.filter(
      p => getProjectYear(p.deadline) === currentYear
    );

    dataset.push({
      year: currentYear,
      wealth: Math.round(totalWealthThisYear),
      hasProject: projectsThisYear.length > 0,
      projects: projectsThisYear
    });
  }
  return dataset;
});

// Trouver la valeur maximale pour calibrer la hauteur des barres à 95% max
const maxWealthInChart = computed(() => {
  if (chartData.value.length === 0) return 1;
  return Math.max(...chartData.value.map(d => d.wealth), 1);
});
</script>

<template>
  <main class="p-6 bg-[#F8FAFB] min-h-screen font-['Inter'] flex items-center justify-center">
    <div v-if="loading" class="text-center text-gray-400 font-bold py-12">
      Génération de ta projection patrimoniale...
    </div>

    <div v-else class="max-w-5xl w-full bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
      
      <header class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-2.5">
          <div class="bg-[#E6F6F4] p-2 rounded-xl text-[#00AA90] flex items-center justify-center">
            <span class="text-sm">📈</span>
          </div>
          <h3 class="text-base font-black text-gray-900">Projection Patrimoniale</h3>
        </div>
        
        <div class="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
          <span class="text-gray-500">Mes projets</span>
          <div class="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
        </div>
      </header>

      <div class="bg-[#F3FAF8]/60 border border-[#E6F6F4] rounded-2xl p-6 relative">
        
        <div class="flex h-64 items-end relative w-full pt-8">
          
          <div class="flex flex-col justify-between h-full text-[10px] font-bold text-teal-600/70 absolute left-0 bottom-0 pr-2 pointer-events-none select-none z-10">
            <span>{{ Math.round((maxWealthInChart * 0.9) / 1000) }}k</span>
            <span>{{ Math.round((maxWealthInChart * 0.6) / 1000) }}k</span>
            <span>{{ Math.round((maxWealthInChart * 0.3) / 1000) }}k</span>
            <span>0k</span>
          </div>

          <div class="flex items-end justify-between w-full h-full pl-8 gap-2">
            <div 
              v-for="data in chartData" 
              :key="data.year"
              class="flex-1 flex flex-col items-center relative group h-full justify-end"
            >
              <div class="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-md">
                {{ data.wealth.toLocaleString() }} €
                <div v-for="p in data.projects" :key="p.name" class="text-orange-300 text-[9px]">
                  {{ p.icon }} {{ p.name }}
                </div>
              </div>

              <div 
                v-if="data.hasProject" 
                class="w-2.5 h-2.5 bg-red-400 rounded-full absolute transition-transform hover:scale-125 cursor-pointer z-20"
                :style="{ bottom: `calc(${(data.wealth / maxWealthInChart) * 100}% + 6px)` }"
              ></div>

              <div 
                class="bg-[#00AA90] w-full rounded-t-md transition-all duration-500 origin-bottom group-hover:bg-[#008F7A] relative cursor-pointer"
                :style="{ height: `${(data.wealth / maxWealthInChart) * 95}%` }"
              ></div>
            </div>
          </div>

        </div>

        <div class="flex justify-between w-full pl-8 mt-3 text-[10px] font-black text-teal-600/80 border-t border-[#00AA90]/10 pt-2">
  <span>{{ startYear }}</span>
  <span>{{ startYear + Math.round(projectionYears / 2) - 1 }}</span>
  <span>{{ startYear + projectionYears - 1 }}</span>
</div>

      </div>

    </div>
  </main>
</template>