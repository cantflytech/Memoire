<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { AlertCircle, TrendingDown, Calendar, Sparkles } from 'lucide-vue-next';

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
      // 1. Charger le profil utilisateur (assets, life_projects)[cite: 4]
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = data.assets || [];
        lifeProjects.value = data.life_projects || [];
        initialWealth.value = data.total_wealth || 0;
      }

      // 2. Charger le catalogue des produits pour avoir les interest_rate[cite: 4]
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

// Extraire l'année d'une deadline (ex: "2026-05" -> 2026)[cite: 4]
const getProjectYear = (deadlineStr) => {
  if (!deadlineStr) return null;
  return parseInt(deadlineStr.split('-')[0]);
};

// --- LOGIQUE FINANCIÈRE AVEC IMPACT DES RETRAITS DE PROJETS ---
const chartData = computed(() => {
  const dataset = [];
  
  // Copie profonde des livrets de l'utilisateur pour simuler l'évolution[cite: 4]
  let simulatedAssets = userAssets.value.map(asset => ({ ...asset }));

  for (let i = 0; i < projectionYears; i++) {
    const currentYear = startYear + i; //[cite: 4]

    // Étape A : Calcul des intérêts capitalisés des livrets par rapport à l'année d'avant[cite: 4]
    if (i > 0) {
      simulatedAssets.forEach(asset => {
        const productInfo = allProducts.value.find(p => p.id === asset.product_id);
        const rate = productInfo ? (productInfo.interest_rate || 0) : 0; //[cite: 4]
        asset.amount = asset.amount * (1 + (rate / 100)); //[cite: 4]
      });
    }

    // Étape B : Identifier s'il y a des projets de vie programmés pour cette année[cite: 4]
    const projectsThisYear = lifeProjects.value.filter(
      p => getProjectYear(p.deadline) === currentYear //[cite: 4]
    );

    // Étape C : IMPACT DU RETRAIT -> On retire le coût cumulé des projets de l'année
    let totalCostToWithdraw = projectsThisYear.reduce((sum, p) => sum + (p.target_amount || 0), 0);
    const costDeducted = totalCostToWithdraw; // Garde en mémoire le coût pour le tooltip

    if (totalCostToWithdraw > 0) {
      // On pioche séquentiellement dans les livrets disponibles pour simuler la baisse réelle
      for (let asset of simulatedAssets) {
        if (totalCostToWithdraw <= 0) break;
        
        if (asset.amount >= totalCostToWithdraw) {
          asset.amount -= totalCostToWithdraw;
          totalCostToWithdraw = 0;
        } else {
          totalCostToWithdraw -= asset.amount;
          asset.amount = 0;
        }
      }
    }

    // Étape D : Calcul de la somme totale restante du patrimoine après impact du/des projets[cite: 4]
    let totalWealthThisYear = simulatedAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0);
    
    // Si l'épargne n'a pas suffi, le reste dû passe en patrimoine négatif (découvert de projet)
    if (totalCostToWithdraw > 0) {
      totalWealthThisYear -= totalCostToWithdraw;
    }

    dataset.push({
      year: currentYear, //[cite: 4]
      wealth: Math.round(totalWealthThisYear), //[cite: 4]
      hasProject: projectsThisYear.length > 0, //[cite: 4]
      projects: projectsThisYear, //[cite: 4]
      costDeducted: Math.round(costDeducted),
      isShortfunded: totalCostToWithdraw > 0 // Alerte si l'utilisateur manque d'argent
    });
  }
  return dataset;
});

// Éviter l'erreur de division par 0 si les valeurs de patrimoine sont très basses ou négatives
const maxWealthInChart = computed(() => {
  if (chartData.value.length === 0) return 1;
  const values = chartData.value.map(d => d.wealth);
  return Math.max(...values, 1000);
});

// Déterminer la valeur minimale (pour gérer l'affichage graphique en cas de valeurs négatives)
const minWealthInChart = computed(() => {
  const values = chartData.value.map(d => d.wealth);
  const min = Math.min(...values, 0);
  return min < 0 ? min : 0;
});
</script>

<template>
  <main class="bg-[#F8FAFC] font-['Inter'] flex items-center justify-center heading">
    <div v-if="loading" class="text-center text-gray-400 font-bold py-12">
      Génération de ta projection patrimoniale...
    </div>

    <div v-else class="max-w-7xl w-full bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 space-y-6">
      
      <!-- En-tête -->
      <header class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2.5">
          <div class="bg-[#E6F6F4] p-2 rounded-xl text-[#00AA90] flex items-center justify-center">
            <TrendingDown class="w-5 h-5" />
          </div>
          <div>
            <h3 class="heading text-xl text-gray-900 font-black tracking-tight">Impact & Projections de Vie</h3>
            <p class="text-xs text-gray-400 font-semibold">Visualise les chutes de patrimoine au moment de réaliser tes objectifs</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">Achat / Projet</span>
            <div class="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">Alerte Manque de fonds</span>
            <div class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
          </div>
        </div>
      </header>

      <!-- Graphique ProPro -->
      <div class="bg-[#F3FAF8]/60 border border-[#E6F6F4] rounded-2xl p-6 relative">
        <div class="flex h-64 items-end relative w-full pt-8">
          
          <!-- Échelle de gauche automatique (Kilos Euros) -->
          <div class="flex flex-col justify-between h-full text-[10px] font-bold text-teal-600/70 absolute left-0 bottom-0 pr-2 pointer-events-none select-none z-10">
            <span>{{ Math.round((maxWealthInChart * 0.9) / 1000) }}k</span>
            <span>{{ Math.round((maxWealthInChart * 0.5) / 1000) }}k</span>
            <span>0k</span>
          </div>

          <!-- Les barres d'années -->
          <div class="flex items-end justify-between w-full h-full pl-10 gap-2">
            <div 
              v-for="data in chartData" 
              :key="data.year"
              class="flex-1 flex flex-col items-center relative group h-full justify-end"
            >
              <!-- Tooltip au survol de la barre -->
              <div class="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] p-3 rounded-xl font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-xl space-y-1">
                <div class="font-black border-b border-white/10 pb-1 flex justify-between gap-4">
                  <span>Patrimoine {{ data.year }} :</span>
                  <span class="text-teal-400">{{ data.wealth.toLocaleString() }} €</span>
                </div>
                <div v-if="data.hasProject" class="pt-1">
                  <div class="font-bold text-orange-400">Retrait projet : -{{ data.costDeducted.toLocaleString() }} €</div>
                  <div v-for="p in data.projects" :key="p.name" class="text-gray-300 text-[9px] pl-1">
                    {{ p.icon }} {{ p.name }} (Cible : {{ p.target_amount?.toLocaleString() }} €)
                  </div>
                </div>
                <div v-if="data.isShortfunded" class="text-amber-400 font-black flex items-center gap-1 text-[9px] pt-1 border-t border-white/10">
                  <AlertCircle class="w-3 h-3" /> Épargne insuffisante pour ce projet !
                </div>
              </div>

              <!-- Puce rouge de projet de vie (Ajustée dynamiquement selon la hauteur de la barre)[cite: 4] -->
              <div 
                v-if="data.hasProject" 
                :class="data.isShortfunded ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-red-400'"
                class="w-2.5 h-2.5 rounded-full absolute transition-transform hover:scale-125 cursor-pointer z-20"
                :style="{ bottom: `calc(${Math.max((data.wealth / maxWealthInChart) * 100, 0)}% + 6px)` }"
              ></div>

              <!-- La barre verticale -->
              <div 
                :class="[
                  data.isShortfunded ? 'bg-amber-400/80 group-hover:bg-amber-500' : 'bg-[#00AA90] group-hover:bg-[#008F7A]',
                  data.wealth <= 0 ? 'bg-red-200 rounded-b-md' : 'rounded-t-md'
                ]"
                class="w-full transition-all duration-500 origin-bottom relative cursor-pointer"
                :style="{ height: `${Math.max((data.wealth / maxWealthInChart) * 95, 2)}%` }"
              ></div>
            </div>
          </div>

        </div>

        <!-- Axe des années[cite: 4] -->
        <div class="flex justify-between w-full pl-10 mt-3 text-[10px] font-black text-teal-600/80 border-t border-[#00AA90]/10 pt-2">
          <span>{{ startYear }}</span>
          <span>{{ startYear + Math.round(projectionYears / 2) - 1 }}</span>
          <span>{{ startYear + projectionYears - 1 }}</span>
        </div>
      </div>

      <!-- ================= ALERTES UX D'ANALYSE D'IMPACT (Nouveau) ================= -->
      <div v-if="chartData.some(d => d.isShortfunded)" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 class="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles class="w-4 h-4" /> Alerte capacité d'achat
          </h4>
          <p class="text-[11px] text-amber-700/90 font-medium leading-relaxed mt-1">
            Certains projets programmés provoquent des baisses trop importantes qui épuisent complètement votre réserve financière actuelle. Pour stabiliser votre courbe, pensez à lisser vos objectifs de vie ou à ajuster votre capacité d'épargne mensuelle sur votre profil.
          </p>
        </div>
      </div>

    </div>
  </main>
</template>